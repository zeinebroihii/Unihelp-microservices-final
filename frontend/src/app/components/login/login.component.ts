import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string | null = null;
  isLoading = false;
  isModalOpen = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
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
            this.router.navigate(['/dashboard']);
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

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
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
        next: (response) => {
          this.isLoading = false;
          const role = response.role;
          if (role === 'ADMIN') {
            // Do NOT store session in localStorage for admin
            Swal.fire({
              icon: 'success',
              title: 'Login Successful',
              text: 'You have logged in successfully!',
              showConfirmButton: false,
              timer: 1500
            }).then(() => {
              // Pass token and user as query params for handoff
              const token = response.token;
              const user = JSON.stringify({
                id: response.id,
                email: response.email,
                role: response.role
              });
              window.location.href = `http://localhost:4201/session-handoff?token=${encodeURIComponent(token)}&user=${encodeURIComponent(user)}`;
            });
          } else {
            // Non-admin: store session in localStorage
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify({
              id: response.id,
              email: response.email,
              role: response.role
            }));
            Swal.fire({
              icon: 'success',
              title: 'Login Successful',
              text: 'You have logged in successfully!',
              showConfirmButton: false,
              timer: 1500
            }).then(() => {
              this.router.navigate(['/profile']);
            });
          }
        },
        error: (err) => {
          this.isLoading = false;
          Swal.fire({
            icon: 'error',
            title: 'Login Failed',
            text: 'Wrong credentials. Please try again.',
          });
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

  goToResetPassword(): void {
    this.isModalOpen = true;
  }
}
