import { Component, OnInit } from '@angular/core';
import { BlogService, Blog } from '../../services/blog.service';
import Fuse from 'fuse.js';

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.css']
})
export class BlogComponent implements OnInit {
  blogs: Blog[] = [];
  filteredBlogs: Blog[] = [];
  errorMessage: string | null = null;
  staticUserId: number = 1;
  searchQuery: string = '';
  selectedCategory: string = '';
  private fuse: Fuse<Blog> | null = null;

  constructor(private blogService: BlogService) {}

  ngOnInit() {
    this.blogService.getAllBlogs().subscribe({
      next: (blogs) => {
        console.log('Raw blogs from API:', blogs); // Debug: Log raw response
        this.blogs = blogs.filter(blog => blog.isVerified === true);
        console.log('Filtered verified blogs:', this.blogs); // Debug: Log filtered blogs
        this.filteredBlogs = this.blogs;
        this.errorMessage = null;
        this.initializeFuse();
        this.onFilterChange();
      },
      error: (error) => {
        this.errorMessage = error.message;
      }
    });
  }

  onSearch() {
    if (!this.searchQuery.trim()) {
      this.filteredBlogs = this.blogs; // Reset to verified blogs
      return;
    }

    if (this.fuse) {
      const result = this.fuse.search(this.searchQuery);
      this.filteredBlogs = result.map((item) => item.item);
    }
  }

  private initializeFuse(blogs: Blog[] = this.blogs) {
    const options = {
      keys: ['title', 'content'],
      threshold: 0.4,
      includeScore: true
    };
    this.fuse = new Fuse(blogs, options);
  }

  onFilterChange() {
    let tempBlogs = this.blogs; // Already filtered for IsVerified: true

    if (this.selectedCategory) {
      tempBlogs = tempBlogs.filter(blog => blog.category === this.selectedCategory);
    }

    if (this.searchQuery.trim()) {
      this.initializeFuse(tempBlogs);
      if (this.fuse) {
        const result = this.fuse.search(this.searchQuery);
        tempBlogs = result.map((item) => item.item);
      }
    }

    this.filteredBlogs = tempBlogs;
  }

  DeleteBlog(id: number | null) {
    if (id != null) {
      this.blogService.deleteBlog(id).subscribe({
        next: () => {
          this.blogService.getAllBlogs().subscribe({
            next: (blogs) => {
              console.log('Blogs after deletion:', blogs); // Debug: Log after deletion
              this.blogs = blogs.filter(blog => blog.isVerified === true);
              this.filteredBlogs = this.blogs;
              this.errorMessage = null;
              this.initializeFuse();
              this.onFilterChange();
            },
            error: (error) => {
              this.errorMessage = error.message;
            }
          });
        },
        error: (error) => {
          this.errorMessage = error.message;
        }
      });
    }
  }

  getImageUrl(imageName: string | null): string {
    return imageName
      ? `http://localhost:8888/BLOG/api/blog/images/${imageName}`
      : 'https://www.bootdey.com/image/280x280/87CEFA/000000';
  }

  isBlogDeletable(userId: number): boolean {
    return this.staticUserId === userId;
  }
}