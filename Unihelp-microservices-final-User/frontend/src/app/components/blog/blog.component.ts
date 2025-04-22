
  import { Component, OnInit } from '@angular/core';
  import { BlogService, Blog } from '../../services/blog.service';
  import Fuse from 'fuse.js';
  
  @Component({
    selector: 'app-blog',
    templateUrl: './blog.component.html',
    styleUrls: ['./blog.component.css']
  })
  export class BlogComponent implements OnInit {
    private id = 1;
    blogs: Blog[] = [];
    filteredBlogs: Blog[] = [];
    errorMessage: string | null = null;
    staticUserId: number = 1;
    searchQuery: string = '';
    selectedCategory: string = ''; // Bind to category dropdown
    private fuse: Fuse<Blog> | null = null;
  
    constructor(private blogService: BlogService) {}
  
    ngOnInit() {
      this.blogService.getAllBlogs().subscribe({
        next: (blogs) => {
          this.blogs = blogs;
          this.filteredBlogs = blogs;
          this.errorMessage = null;
          this.initializeFuse();
          this.onFilterChange(); // Apply initial filtering
        },
        error: (error) => {
          this.errorMessage = error.message;
        }
      });
    }

    
  // Handle search input changes
    onSearch() {
      if (!this.searchQuery.trim()) {
        this.filteredBlogs = this.blogs; // Reset to all blogs if query is empty
        return;
      }

      if (this.fuse) {
        const result = this.fuse.search(this.searchQuery);
        this.filteredBlogs = result.map((item) => item.item); // Extract matching blogs
      }
    }
  
    // Initialize Fuse.js with blog data
    private initializeFuse(blogs: Blog[] = this.blogs) {
      const options = {
        keys: ['title', 'content'],
        threshold: 0.4,
        includeScore: true
      };
      this.fuse = new Fuse(blogs, options);
    }
  
    // Handle category and search filtering
    onFilterChange() {
      let tempBlogs = this.blogs;
  
      // Step 1: Filter by category
      if (this.selectedCategory) {
        tempBlogs = this.blogs.filter(blog => blog.category === this.selectedCategory);
      }
  
      // Step 2: Apply fuzzy search on filtered blogs
      if (this.searchQuery.trim()) {
        this.initializeFuse(tempBlogs); // Re-initialize Fuse with filtered blogs
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
                this.blogs = blogs;
                this.errorMessage = null;
                this.initializeFuse();
                this.onFilterChange(); // Re-apply filters after deletion
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
  
    getImageUrl(imageName: string): string {
      return `http://localhost:8888/BLOG/api/blog/images/${imageName}`;
    }
  
    isBlogDeletable(userId: number): boolean {
      return this.staticUserId === userId;
    }
  }