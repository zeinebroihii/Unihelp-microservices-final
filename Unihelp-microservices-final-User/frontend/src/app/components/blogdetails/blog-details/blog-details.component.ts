import { Component, OnInit } from '@angular/core';
import { BlogService, Blog } from '../../../services/blog.service';
import { CommentService, Comment } from '../../../services/comment.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NgForm } from '@angular/forms';

interface PopularPost {
  title: string;
  date: string;
  imageUrl: string | null;
}

@Component({
  selector: 'app-blog-details',
  templateUrl: './blog-details.component.html',
  styleUrls: ['./blog-details.component.css']
})
export class BlogDetailsComponent implements OnInit {
  blog: Blog | null = null;
  comments: Comment[] = [];
  errorMessage: string | null = null;
  isEditing: boolean = false;
  editingCommentId: number | null = null;
  staticUserId: number = 1;
  categories: string[] = [
    'eCommerce', 'Microsoft Technologies', 'Creative UX', 'Wordpress',
    'Angular JS', 'Enterprise Mobility', 'Website Design', 'HTML5',
    'Infographics', 'Wordpress Development'
  ];
  popularPosts: PopularPost[] = [
    { title: 'Apple Introduces Search Ads Basic', date: 'Jun 22, 2018', imageUrl: 'https://www.bootdey.com/image/280x280/87CEFA/000000' },
    { title: 'New rules, more cars, more races', date: 'Jun 8, 2018', imageUrl: 'https://www.bootdey.com/image/280x280/87CEFA/000000' }
  ];
  instagramPosts: string[] = Array(9).fill('https://www.bootdey.com/image/100x100/87CEFA/000000');

  constructor(
    private blogService: BlogService,
    private commentService: CommentService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadBlog(+id);
        this.loadComments(+id);
      }
    });
  }

  loadBlog(id: number): void {
    this.blogService.getBlog(id).subscribe({
      next: (blog) => {
        this.blog = blog;
        this.errorMessage = null;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.blog = null;
      }
    });
  }

  loadComments(blogId: number): void {
    this.commentService.getAllComments().subscribe({
      next: (comments) => {
        this.comments = this.blog?.comments || [];
      },
      error: (error) => {
        this.errorMessage = error.message;
      }
    });
  }

  getImageUrl(imageName: string): string {
    return `http://localhost:8888/BLOG/api/blog/images/${imageName}`;
  }

  submitComment(form: NgForm): void {
    if (!this.blog || !this.blog.idBlog) {
      this.errorMessage = 'Blog not loaded. Please try again.';
      return;
    }
    const commentData: Comment = {
      idComment: this.isEditing ? this.editingCommentId : null,
      content: form.value.content.trim(),
      blog: this.blog,
      user: null,
      userId: this.staticUserId
    };

    if (!commentData.content) {
      this.errorMessage = 'Comment content cannot be empty.';
      return;
    }

    if (this.isEditing && this.editingCommentId) {
      this.commentService.updateComment(this.editingCommentId, commentData).subscribe({
        next: (updatedComment) => {
          const index = this.comments.findIndex(c => c.idComment === this.editingCommentId);
          if (index !== -1) {
            this.comments[index] = updatedComment;
          }
          this.resetForm(form);
          this.errorMessage = null;
        },
        error: (error) => {
          this.errorMessage = error.message;
        }
      });
    } else {
      this.commentService.createComment(commentData, this.blog.idBlog, this.staticUserId).subscribe({
        next: (newComment) => {
          this.comments.push(newComment);
          this.resetForm(form);
          this.errorMessage = null;
        },
        error: (error) => {
          this.errorMessage = error.message;
        }
      });
    }
  }

  editComment(comment: Comment): void {
    if (comment.userId !== this.staticUserId) {
      this.errorMessage = 'You can only edit your own comments.';
      return;
    }
    this.isEditing = true;
    this.editingCommentId = comment.idComment;
    const textarea = document.querySelector('textarea[name="content"]') as HTMLTextAreaElement;
    if (textarea) {
      textarea.value = comment.content;
    }
  }

  deleteComment(commentId: number): void {
    const comment = this.comments.find(c => c.idComment === commentId);
    if (comment && comment.userId !== this.staticUserId) {
      this.errorMessage = 'You can only delete your own comments.';
      return;
    }
    if (confirm('Are you sure you want to delete this comment?')) {
      this.commentService.deleteComment(commentId).subscribe({
        next: () => {
          this.comments = this.comments.filter(c => c.idComment !== commentId);
          this.errorMessage = null;
        },
        error: (error) => {
          this.errorMessage = error.message;
        }
      });
    }
  }

  resetForm(form: NgForm): void {
    form.resetForm();
    this.isEditing = false;
    this.editingCommentId = null;
  }

  isCommentEditable(comment: Comment): boolean {
    return comment.userId === this.staticUserId;
  }
}