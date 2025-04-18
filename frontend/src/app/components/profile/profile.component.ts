import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService, User } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  profileForm: FormGroup;
  isEditing = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  skillsDisplay: string = 'No skills listed';

  constructor(private authService: AuthService, private fb: FormBuilder, private router: Router) {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      bio: [''],
      skills: [''],
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      const { id } = JSON.parse(userData);
      this.authService.getUserById(id).subscribe({
        next: (user: User) => {
          console.log('user:', user); // Debug
          console.log('user.skills:', user.skills); // Debug
          this.user = user;
          this.profileForm.patchValue({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            bio: user.bio || '',
            skills: user.skills || '', // Treat as string
          });
          this.updateSkillsDisplay();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage = error.message;
        },
      });
    } else {
      this.errorMessage = 'User not logged in.';
    }
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    this.errorMessage = null;
    this.successMessage = null;
  }

  saveProfile(): void {
    if (this.profileForm.valid && this.user) {
      const updatedUser: any = {
        firstName: this.profileForm.get('firstName')?.value,
        lastName: this.profileForm.get('lastName')?.value,
        email: this.user.email, // Use the current email (or from form if editable)
        bio: this.profileForm.get('bio')?.value,
        skills: this.profileForm.get('skills')?.value?.trim() || ''
      };
      // Keep the existing profile image if present
      if (this.user.profileImage) {
        updatedUser.profileImage = this.user.profileImage;
      }
      // Keep the existing role if present
      if (this.user.role) {
        updatedUser.role = this.user.role;
      }
      console.log('Payload sent to backend:', updatedUser);

      this.authService.updateUser(this.user.id, updatedUser).subscribe({
        next: () => {
          this.isEditing = false;
          this.loadUserProfile(); // Reload the profile from backend
          Swal.fire({
            icon: 'success',
            title: 'Profile updated!',
            text: 'Your profile has been updated successfully.',
            timer: 1800,
            showConfirmButton: false
          });
          this.errorMessage = null; // Clear any previous error
        },
        error: (error: HttpErrorResponse) => {
          // Only show a user-friendly error if truly an error
          let msg = 'An error occurred while updating your profile.';
          if (error.error && typeof error.error === 'string') {
            msg = error.error;
          } else if (error.status && error.status !== 200) {
            msg = error.message;
          }
          Swal.fire({
            icon: 'error',
            title: 'Update Failed',
            text: msg
          });
          this.errorMessage = null; // Don't show the default error box
        },
      });
    }
  }

  getProfileImageUrl(): string {
    return this.user?.profileImage
      ? `data:image/jpeg;base64,${this.user.profileImage}`
      : 'assets/default-profile.png';
  }

  disconnect(): void {
    this.authService.logout().subscribe({
      next: () => {
        console.log('Logout successful, navigating to login');
        this.router.navigate(['/login']);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Logout failed:', error.message);
        this.errorMessage = error.message;
        this.router.navigate(['/login']);
      },
    });
  }

  updateSkillsDisplay(): void {
    if (this.user && this.user.skills) {
      this.skillsDisplay = this.user.skills.trim();
    } else {
      this.skillsDisplay = 'No skills listed';
    }
  }
}
