# Configuration du provider AWS
provider "aws" {
  region = "us-west-1"
}

# VPC et Sous-réseaux (deux pour haute disponibilité)
resource "aws_vpc" "unihelp_vpc" {
  cidr_block = var.vpc_cidr
}

resource "aws_subnet" "unihelp_subnet_a" {
  vpc_id            = aws_vpc.unihelp_vpc.id
  cidr_block        = var.subnet_cidr
  availability_zone = "us-west-1a"
}

resource "aws_subnet" "unihelp_subnet_b" {
  vpc_id            = aws_vpc.unihelp_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-west-1b"
}

resource "aws_internet_gateway" "unihelp_igw" {
  vpc_id = aws_vpc.unihelp_vpc.id
}

resource "aws_route_table" "unihelp_rt" {
  vpc_id = aws_vpc.unihelp_vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.unihelp_igw.id
  }
}

resource "aws_route_table_association" "unihelp_rta_a" {
  subnet_id      = aws_subnet.unihelp_subnet_a.id
  route_table_id = aws_route_table.unihelp_rt.id
}

resource "aws_route_table_association" "unihelp_rta_b" {
  subnet_id      = aws_subnet.unihelp_subnet_b.id
  route_table_id = aws_route_table.unihelp_rt.id
}

# Groupe de Sécurité
resource "aws_security_group" "unihelp_sg" {
  name        = "unihelp-sg"
  description = "Security group for UniHelp resources"
  vpc_id      = aws_vpc.unihelp_vpc.id

  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Rôles IAM pour EKS
resource "aws_iam_role" "eks_cluster_role" {
  name = "eks-cluster-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "eks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  role       = aws_iam_role.eks_cluster_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

resource "aws_eks_cluster" "unihelp_eks" {
  name     = var.cluster_name
  role_arn = aws_iam_role.eks_cluster_role.arn
  vpc_config {
    subnet_ids = [aws_subnet.unihelp_subnet_a.id, aws_subnet.unihelp_subnet_b.id]
  }
  depends_on = [aws_iam_role_policy_attachment.eks_cluster_policy]
}

resource "aws_iam_role" "eks_worker_role" {
  name = "eks-worker-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "eks_worker_policy" {
  role       = aws_iam_role.eks_worker_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  role       = aws_iam_role.eks_worker_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
}

resource "aws_launch_template" "unihelp_worker" {
  name_prefix   = "unihelp-worker"
  image_id      = var.ami_id
  instance_type = var.instance_type
  key_name      = var.key_name
}

resource "aws_eks_node_group" "unihelp_node_group" {
  cluster_name    = aws_eks_cluster.unihelp_eks.name
  node_group_name = "unihelp-nodes"
  node_role_arn   = aws_iam_role.eks_worker_role.arn
  subnet_ids      = [aws_subnet.unihelp_subnet_a.id, aws_subnet.unihelp_subnet_b.id]
  launch_template {
    id      = aws_launch_template.unihelp_worker.id
    version = "$Latest"
  }
  scaling_config {
    desired_size = 2
    max_size     = 3
    min_size     = 1
  }
  depends_on = [aws_eks_cluster.unihelp_eks]
}

# RDS pour le User Service avec Secrets Manager
resource "random_password" "user_db_password" {
  length           = 16
  special          = true
  override_special = "!@#$"
}

resource "aws_secretsmanager_secret" "user_db_secret" {
  name = "user-db-secret"
}

resource "aws_secretsmanager_secret_version" "user_db_secret_version" {
  secret_id     = aws_secretsmanager_secret.user_db_secret.id
  secret_string = jsonencode({
    username = "admin"
    password = random_password.user_db_password.result
  })
}

resource "aws_db_instance" "user_db" {
  identifier           = "user-db"
  engine               = "mysql"
  instance_class       = "db.t3.micro"
  allocated_storage    = 20
  username             = jsondecode(aws_secretsmanager_secret_version.user_db_secret_version.secret_string)["username"]
  password             = jsondecode(aws_secretsmanager_secret_version.user_db_secret_version.secret_string)["password"]
  parameter_group_name = "default.mysql8.0"
  skip_final_snapshot  = true
  publicly_accessible  = false
  vpc_security_group_ids = [aws_security_group.unihelp_sg.id]
  db_subnet_group_name = aws_db_subnet_group.unihelp_db_subnet.name
}

resource "aws_db_subnet_group" "unihelp_db_subnet" {
  name       = "unihelp-db-subnet"
  subnet_ids = [aws_subnet.unihelp_subnet_a.id, aws_subnet.unihelp_subnet_b.id]
}

# RDS pour le Course Service avec Secrets Manager
resource "random_password" "course_db_password" {
  length           = 16
  special          = true
  override_special = "!@#$"
}

resource "aws_secretsmanager_secret" "course_db_secret" {
  name = "course-db-secret"
}

resource "aws_secretsmanager_secret_version" "course_db_secret_version" {
  secret_id     = aws_secretsmanager_secret.course_db_secret.id
  secret_string = jsonencode({
    username = "admin"
    password = random_password.course_db_password.result
  })
}

resource "aws_db_instance" "course_db" {
  identifier           = "course-db"
  engine               = "mysql"
  instance_class       = "db.t3.micro"
  allocated_storage    = 20
  username             = jsondecode(aws_secretsmanager_secret_version.course_db_secret_version.secret_string)["username"]
  password             = jsondecode(aws_secretsmanager_secret_version.course_db_secret_version.secret_string)["password"]
  parameter_group_name = "default.mysql8.0"
  skip_final_snapshot  = true
  publicly_accessible  = false
  vpc_security_group_ids = [aws_security_group.unihelp_sg.id]
  db_subnet_group_name = aws_db_subnet_group.unihelp_db_subnet.name
}

# EC2 Optionnel
resource "aws_instance" "unihelp_ec2" {
  count         = 1
  ami           = var.ami_id
  instance_type = var.instance_type
  key_name      = var.key_name
  subnet_id     = aws_subnet.unihelp_subnet_a.id
  vpc_security_group_ids = [aws_security_group.unihelp_sg.id]
  tags = {
    Name = "UniHelp-Management-${count.index}"
  }
}