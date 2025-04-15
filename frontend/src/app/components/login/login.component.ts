import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string | null = null;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (userData && token && this.authService.isLoggedIn()) {
      // Check if token is expired
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      if (exp < Date.now()) {
        // Token is expired, clear localStorage and stay on login
        this.authService.logout().subscribe({
          next: () => {},
          error: () => {},
        });
        return;
      }

      const { id } = JSON.parse(userData);
      this.authService.getUserById(id).subscribe({
        next: () => {
          const role = this.authService.getUserRole();
          if (role === 'ADMIN') {
            this.router.navigate(['/admin-dashboard']);
          } else {
            this.router.navigate(['/profile']);
          }
        },
        error: () => {
          this.authService.logout().subscribe({
            next: () => {},
            error: () => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              localStorage.clear();
            },
          });
        },
      });
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = null;
      const loginRequest = {
        email: this.loginForm.get('email')?.value,
        password: this.loginForm.get('password')?.value,
      };

      this.authService.login(loginRequest).subscribe({
        next: () => {
          this.isLoading = false;
          const role = this.authService.getUserRole();
          if (role === 'ADMIN') {
            this.router.navigate(['/admin-dashboard']);
          } else {
            this.router.navigate(['/profile']);
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.message || 'Login failed. Please check your credentials.';
          // Clear localStorage on failed login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        },
      });
    }
  }

  goToSignUp(): void {
    this.router.navigate(['/signup']);
  }
}
