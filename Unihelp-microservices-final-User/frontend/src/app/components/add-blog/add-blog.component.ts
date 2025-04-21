import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BlogService, Blog } from '../../services/blog.service';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

// Define the expected Sightengine API response structure
interface SightengineResponse {
  status: 'success' | 'failure';
  summary?: {
    action: 'accept' | 'reject';
  };
  data?: {
    nudity?: { raw: number };
    violence?: { prob: number };
    [key: string]: any; // Allow additional fields
  };
  [key: string]: any; // Allow additional top-level fields
}

@Component({
  selector: 'app-add-blog',
  templateUrl: './add-blog.component.html',
  styleUrls: ['./add-blog.component.css']
})
export class AddBlogComponent implements OnInit {
  blogForm: FormGroup;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  blogId: number | null = null;
  isEditMode: boolean = false;
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  staticUserId: number = 1;
  isImageVerified: boolean = false; // Track image verification status

  // Sightengine API credentials (ideally from environment or config service)
  private sightengineApiUser = '128746998'; // Replace with your API user
  private sightengineApiSecret = 'ZJ5XbrmXWzdF99cinMPvoVuh3DuuXiYF'; // Replace with your API secret
  private sightengineWorkflow = 'wfl_ik8yknXAgINkfaVCalX4X'; // Replace with your workflow ID
  private sightengineApiUrl = 'https://api.sightengine.com/1.0/check-workflow.json';

  constructor(
    private fb: FormBuilder,
    private blogService: BlogService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {
    this.blogForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      category: ['IT', Validators.required],
      content: ['', [Validators.required, Validators.minLength(10)]],
      image: [null], // Image optional, validated manually
      imagepath: [''] // Store image path
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.blogId = +id;
        this.isEditMode = true;
        this.loadBlog(this.blogId);
      } else {
        // Require image in create mode
        this.blogForm.get('image')?.setValidators(Validators.required);
        this.blogForm.get('image')?.updateValueAndValidity();
      }
    });
  }

  loadBlog(id: number): void {
    this.blogService.getBlog(id).subscribe({
      next: (blog) => {
        this.blogForm.patchValue({
          title: blog.title,
          category: blog.category,
          content: blog.content,
          imagepath: blog.imagepath || ''
        });
        // Set image preview for existing image
        if (blog.imagepath) {
          this.imagePreview = this.getImageUrl(blog.imagepath);
          this.isImageVerified = true; // Assume existing image is verified
        }
        this.errorMessage = null;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.successMessage = null;
      }
    });
  }

  async onImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    this.selectedImage = null;
    this.imagePreview = null;
    this.isImageVerified = false;
    this.blogForm.get('image')?.setValue(null);

    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Verify image with Sightengine API
      try {
        const verificationResult = await this.verifyImage(file).toPromise();
        console.log('Sightengine API response:', verificationResult); // Log full response for debugging

        if (verificationResult?.status == 'success' && !this.isImageRejected(verificationResult)) {
          // Image is approved
          console.log('Image accepted');
          this.selectedImage = file;
          this.isImageVerified = true;
          this.blogForm.get('image')?.setValue(this.selectedImage);

          // Generate image preview
          const reader = new FileReader();
          reader.onload = () => {
            this.imagePreview = reader.result as string;
          };
          reader.readAsDataURL(this.selectedImage);
        } else {
          console.log('Image rejected, details:', verificationResult?.data);
          alert(`Image verification failed`);
          this.errorMessage = 'Image verification failed. Please select a different image.';
          this.selectedImage = null;
          this.imagePreview = null;
          this.isImageVerified = false;
          this.blogForm.get('image')?.setValue(null);
        }
      } catch (error) {
        console.error('Image verification error:', error);
        alert('Error verifying image. Please try again later.');
        this.errorMessage = 'Error verifying image. Please try again.';
        this.selectedImage = null;
        this.imagePreview = null;
        this.isImageVerified = false;
        this.blogForm.get('image')?.setValue(null);
      }
    } else {
      this.selectedImage = null;
      this.imagePreview = this.isEditMode ? this.getImageUrl(this.blogForm.value.imagepath || '') : null;
      this.isImageVerified = this.isEditMode; // Retain verification status in edit mode
      this.blogForm.get('image')?.setValue(null);
    }
  }

  private verifyImage(file: File) {
    const formData = new FormData();
    formData.append('media', file);
    formData.append('workflow', this.sightengineWorkflow);
    formData.append('api_user', this.sightengineApiUser);
    formData.append('api_secret', this.sightengineApiSecret);

    return this.http.post<SightengineResponse>(this.sightengineApiUrl, formData);
  }

  private isImageRejected(result: SightengineResponse): boolean {
    // Log the summary and action for debugging
    console.log('Summary:', result.summary);
    console.log('Action:', result.summary?.action);

    // Check if summary exists and action is explicitly 'reject'
    const action = result.summary?.action || 'accept'; // Default to 'accept' if action is missing
    return action === 'reject';
  }

  private getRejectionReason(result: SightengineResponse): string {
    // Extract specific rejection reasons from the response
    if (result.summary?.action === 'reject') {
      // Example: Check for specific flags like nudity or violence
      const reasons = [];
      if (result.data?.nudity?.raw && result.data.nudity.raw > 0.5) {
        reasons.push('inappropriate content (nudity)');
      }
      if (result.data?.violence?.prob && result.data.violence.prob > 0.5) {
        reasons.push('violent content');
      }
      // Add other checks based on your workflow
      return reasons.length > 0 ? `Rejected due to ${reasons.join(', ')}` : 'Image rejected by verification service';
    }
    return 'Unknown rejection reason';
  }

  getImageUrl(imageName: string): string {
    return `http://localhost:8888/BLOG/api/blog/images/${imageName}`;
  }

  get title() {
    return this.blogForm.get('title');
  }

  get category() {
    return this.blogForm.get('category');
  }

  get content() {
    return this.blogForm.get('content');
  }

  get image() {
    return this.blogForm.get('image');
  }

  onSubmit(): void {
    console.log('onSubmit called');
    console.log('Form valid:', this.blogForm.valid);
    console.log('Form value:', this.blogForm.value);

    if (this.blogForm.invalid) {
      this.blogForm.markAllAsTouched();
      this.errorMessage = 'Please fill out all required fields correctly.';
      console.log('Form errors:', this.blogForm.errors);
      return;
    }

    if (!this.isEditMode && !this.selectedImage) {
      this.errorMessage = 'Please select an image.';
      this.blogForm.get('index')?.markAsTouched();
      return;
    }

    if (!this.isEditMode && this.selectedImage && !this.isImageVerified) {
      this.errorMessage = 'Selected image has not been verified. Please select a valid image.';
      this.blogForm.get('image')?.markAsTouched();
      return;
    }

    const uploadImage = () => {
      if (!this.selectedImage) {
        return Promise.resolve(this.blogForm.value.imagepath || ''); // Use existing imagepath
      }
      const formData = new FormData();
      formData.append('image', this.selectedImage as Blob);
      return this.blogService.uploadImage(formData).toPromise();
    };

    uploadImage()
      .then(imageName => {
        const blog: Blog = {
          idBlog: this.isEditMode ? this.blogId : null,
          title: this.blogForm.value.title,
          category: this.blogForm.value.category,
          content: this.blogForm.value.content,
          imagepath: imageName || this.blogForm.value.imagepath || '',
          comments: null,
          user: null,
          userId: this.staticUserId
        };

        if (!this.isEditMode && !blog.imagepath) {
          this.errorMessage = 'Image upload failed or no image provided.';
          return;
        }

        console.log('Sending blog to backend:', blog);

        const observable = this.isEditMode && this.blogId
          ? this.blogService.updateBlog(this.blogId, blog)
          : this.blogService.createBlog(blog);

        observable.subscribe({
          next: () => {
            this.successMessage = this.isEditMode ? 'Blog updated successfully!' : 'Blog created successfully!';
            this.errorMessage = null;
            this.blogForm.reset({ category: 'IT', imagepath: '' });
            this.selectedImage = null;
            this.imagePreview = null;
            this.isImageVerified = false;
            this.router.navigate(['/blogs']);
          },
          error: (error) => {
            this.errorMessage = `Error saving blog: ${error.message}`;
            this.successMessage = null;
            console.error('Backend error response:', error);
          }
        });
      })
      .catch(error => {
        this.errorMessage = `Error uploading image: ${error}`;
        this.successMessage = null;
        console.error('Image upload error:', error);
      });
  }
}