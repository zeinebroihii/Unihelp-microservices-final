import { Component, OnInit } from '@angular/core';
import { BlogService } from '../../services/blog.service';
import { Blog } from '../../services/blog.service';
@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.css']
})
export class BlogComponent implements OnInit {
  private id = 1;
  blogs: Blog[] = [];
  errorMessage: string | null = null;
  staticUserId: number = 1;
  constructor(private blogService: BlogService) {}
  ngOnInit() {
    this.blogService.getAllBlogs().subscribe({
      next: (blogs) => {
        this.blogs = blogs;
        this.errorMessage = null;
      },
      error: (error) => {
        this.errorMessage = error.message;
      }
    });
  };

  DeleteBlog(id : number | null) {
    if (id != null){
      this.blogService.deleteBlog(id).subscribe({
        next: () => {
          this.blogService.getAllBlogs().subscribe({
            next: (blogs) => {
              this.blogs = blogs;
              this.errorMessage = null;
            },
            error: (error) => {
              this.errorMessage = error.message;
            }
          });

        },
        error: (error) => {
          this.errorMessage = error.message;
        }
      })
    }
  }

  getImageUrl(imageName: string): string {
    return `http://localhost:8888/BLOG/api/blog/images/${imageName}`;
  }

  isBlogDeletable(userId : number): boolean {
    return this.staticUserId === userId;
  }
}


