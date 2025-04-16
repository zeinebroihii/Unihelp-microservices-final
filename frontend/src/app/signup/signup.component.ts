import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
})
export class SignupComponent implements OnInit {
  signupForm: FormGroup;
  errorMessage: string | null = null;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  showPassword = false;
  currentStep = 1;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/),
        ],
      ],
      bio: ['', [Validators.minLength(10)]],
      skills: [''], // Hidden control for backend
      skillsList: [[] as string[], Validators.required], // Require at least one skill
      role: [''],
      profileImage: [null],
    });

    // Sync skillsList to skills
    this.signupForm.get('skillsList')?.valueChanges.subscribe((skills: string[]) => {
      this.signupForm.get('skills')?.setValue(skills.join(','), { emitEvent: false });
    });
  }

  ngOnInit(): void {}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  nextStep(): void {
    if (this.currentStep === 1) {
      if (this.signupForm.get('firstName')?.valid && this.signupForm.get('lastName')?.valid) {
        this.currentStep++;
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Incomplete Fields',
          text: 'Please fill in all required fields to proceed.',
          confirmButtonText: 'OK'
        });
      }
    }
    if (this.currentStep === 2) {
      if (this.signupForm.get('email')?.valid && this.signupForm.get('password')?.valid) {
        this.currentStep++;
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Incomplete Fields',
          text: 'Please fill in all required fields to proceed.',
          confirmButtonText: 'OK'
        });
      }
    }
  }

  addSkill(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      const skills = this.signupForm.get('skillsList')?.value || [];
      if (!skills.includes(value)) {
        skills.push(value);
        this.signupForm.get('skillsList')?.setValue(skills);
      }
    }
    event.chipInput!.clear();
  }

  removeSkill(skill: string): void {
    const skills = this.signupForm.get('skillsList')?.value || [];
    const index = skills.indexOf(skill);
    if (index >= 0) {
      skills.splice(index, 1);
      this.signupForm.get('skillsList')?.setValue(skills);
    }
  }

  onFileChange(event: Event): void {
    console.log('File change triggered');
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'Image size must be less than 5MB';
        this.signupForm.get('profileImage')?.setErrors({ size: true });
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        this.errorMessage = 'Only JPEG or PNG images are allowed';
        this.signupForm.get('profileImage')?.setErrors({ type: true });
        return;
      }
      this.signupForm.patchValue({ profileImage: file });
      this.signupForm.get('profileImage')?.updateValueAndValidity();
    }
  }

  onSubmit(): void {
    console.log('Form submitted');
    console.log('Form valid:', this.signupForm.valid);
    console.log('Form value:', this.signupForm.value);
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      console.log('Form errors:', this.signupForm.errors);
      return;
    }

    const formData = new FormData();
    formData.append('firstName', this.signupForm.get('firstName')?.value);
    formData.append('lastName', this.signupForm.get('lastName')?.value);
    formData.append('email', this.signupForm.get('email')?.value);
    formData.append('password', this.signupForm.get('password')?.value);
    const bio = this.signupForm.get('bio')?.value;
    if (bio) formData.append('bio', bio);
    const skills = this.signupForm.get('skills')?.value;
    if (skills) formData.append('skills', skills);
    const role = this.signupForm.get('role')?.value;
    if (role) formData.append('role', role);
    const profileImage = this.signupForm.get('profileImage')?.value;
    if (profileImage) formData.append('profileImage', profileImage);

    console.log('Sending request to backend');
    this.authService.register(formData).subscribe({
      next: (response) => {
        console.log('Registration successful:', response);
        this.errorMessage = null;
        Swal.fire({
          icon: 'success',
          title: 'Sign Up Successful',
          text: 'You have signed up successfully!',
          showConfirmButton: false,
          timer: 1500
        }).then(() => {
          this.router.navigate(['/login']);
        });
      },
      error: (err) => {
        console.error('Registration error:', err);
        this.errorMessage =
          err.message || 'Registration failed. Please try again.';
      },
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
