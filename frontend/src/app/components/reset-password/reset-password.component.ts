import { Component, OnInit, Input, OnChanges, SimpleChanges, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
})
export class ResetPasswordComponent implements OnInit, OnChanges {
  @Output() resetLinkSent = new EventEmitter<void>();
  @Input() token: string | null = null;
  resetPasswordForm: FormGroup;
  newPasswordForm: FormGroup;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading = false;
  showNewPassword = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private cdRef: ChangeDetectorRef) {
    this.resetPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
    this.newPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordsMatchValidator });
  }

  ngOnInit(): void {
    console.log('[ResetPasswordComponent.ngOnInit] token:', this.token);
    if (this.token) {
      this.showNewPassword = true;
      this.cdRef.detectChanges();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('[ResetPasswordComponent.ngOnChanges] token:', changes['token']?.currentValue);
    if (changes['token'] && changes['token'].currentValue) {
      this.showNewPassword = true;
      this.cdRef.detectChanges();
    }
  }

  passwordsMatchValidator(form: FormGroup) {
    return form.get('newPassword')?.value === form.get('confirmPassword')?.value ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (!this.showNewPassword) {
      // Request reset link
      if (this.resetPasswordForm.valid) {
        this.isLoading = true;
        this.errorMessage = null;
        const email = this.resetPasswordForm.get('email')?.value;
        this.authService.forgotPassword(email).subscribe({
          next: (response: any) => {
            this.isLoading = false;
            if (typeof response === 'string') {
              if (response.toLowerCase().includes('success')) {
                this.errorMessage = null;
                this.successMessage = null;
                this.emitSuccess();
              } else {
                this.errorMessage = response;
              }
            } else if (typeof response === 'object' && response !== null) {
              // Only show error if response.message is a non-empty string and not a generic object
              if (typeof response.message === 'string' && response.message.trim() !== '' && !response.message.toLowerCase().includes('success')) {
                this.errorMessage = response.message;
              } else if (
                response.success === true ||
                response.status === 'success' ||
                Object.keys(response).length === 0 ||
                (typeof response.message === 'string' && response.message.toLowerCase().includes('success'))
              ) {
                this.emitSuccess();
              } else {
                // If message is not a string or is empty, do not show error
                this.errorMessage = null;
                this.emitSuccess();
              }
            } else if (!response) {
              this.emitSuccess();
            } else {
              this.errorMessage = 'Unexpected response from server.';
            }
          },
          error: (err) => {
            this.isLoading = false;
            if (err.error && typeof err.error === 'object') {
              this.errorMessage = err.error.message || 'Failed to send reset link. Please try again later.';
            } else if (typeof err.error === 'string') {
              this.errorMessage = err.error;
            } else {
              this.errorMessage = err.message || 'Failed to send reset link. Please try again later.';
            }
          },
        });
      }
    } else {
      // Reset password with token
      if (this.newPasswordForm.valid) {
        this.isLoading = true;
        this.errorMessage = null;
        const newPassword = this.newPasswordForm.get('newPassword')?.value;
        this.authService.resetPasswordWithToken(this.token!, newPassword).subscribe({
          next: () => {
            this.isLoading = false;
            this.successMessage = 'Password successfully reset! You can now log in.';
          },
          error: (err) => {
            this.isLoading = false;
            this.errorMessage = err.error?.message || err.message || 'Failed to reset password. Please try again.';
          },
        });
      }
    }
  }

  private emitSuccess() {
    this.errorMessage = null;
    this.successMessage = null;
    console.log('[ResetPasswordComponent.emitSuccess] Emitting resetLinkSent event');
    this.resetLinkSent.emit();
  }
}
