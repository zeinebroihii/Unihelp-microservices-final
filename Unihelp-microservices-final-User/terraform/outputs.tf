output "eks_cluster_endpoint" {
  value = aws_eks_cluster.unihelp_eks.endpoint
}

output "user_db_endpoint" {
  value = aws_db_instance.user_db.endpoint
}

output "course_db_endpoint" {
  value = aws_db_instance.course_db.endpoint
}