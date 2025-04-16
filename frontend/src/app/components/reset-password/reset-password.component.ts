import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  errorMessage: string | null = null;
  isLoading = false;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.resetPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.resetPasswordForm.valid) {
      this.isLoading = true;
      this.errorMessage = null;
      const email = this.resetPasswordForm.get('email')?.value;

      this.authService.resetPassword(email).subscribe({
        next: () => {
          this.isLoading = false;
          // Add any success handling logic here
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.message || 'Failed to send reset link. Please try again later.';
        },
      });
    }
  }
}
