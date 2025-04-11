import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const loginRequest = {
        email: this.loginForm.get('email')?.value,
        password: this.loginForm.get('password')?.value
      };

      this.authService.login(loginRequest).subscribe({
        next: (response) => {
          // Successful login
          this.errorMessage = null;
          const role = this.authService.getUserRole();
          if (role === 'ADMIN') {
            this.router.navigate(['/admin-dashboard']); // Redirect to admin dashboard
          } else {
            this.router.navigate(['/dashboard']); // Redirect to user dashboard
          }
        },
        error: (err) => {
          // Handle login error
          this.errorMessage = err.message || 'Login failed. Please check your credentials.';
        }
      });
    }
  }

  goToSignUp() {
    this.router.navigate(['/signup']); // Adjust the route as needed
  }
}
