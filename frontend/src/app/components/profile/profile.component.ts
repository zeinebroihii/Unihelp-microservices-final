import { Component, OnInit } from '@angular/core';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import {AuthService, User} from "../../services/auth.service";
import {Router} from "@angular/router";

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
          this.user = user;
          this.profileForm.patchValue({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            bio: user.bio || '',
            skills: user.skills ? user.skills.join(', ') : '',
          });
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
      const updatedUser: User = {
        ...this.user,
        firstName: this.profileForm.get('firstName')?.value,
        lastName: this.profileForm.get('lastName')?.value,
        bio: this.profileForm.get('bio')?.value,
        skills: this.profileForm.get('skills')?.value.split(',').map((s: string) => s.trim()),
      };

      this.authService.updateUser(this.user.id, updatedUser).subscribe({
        next: () => {
          this.successMessage = 'Profile updated successfully!';
          this.isEditing = false;
          this.user = { ...this.user, ...updatedUser };
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage = error.message;
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
        // Navigate to login even on error, since localStorage is cleared
        this.router.navigate(['/login']);
      },
    });
  }
}
