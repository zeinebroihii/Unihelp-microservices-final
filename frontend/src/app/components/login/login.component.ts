import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

declare const google: any;

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
  resetToken: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    // Detect token in query params for password reset
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        this.resetToken = token;
        this.isModalOpen = true;
      }
    });

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
    
    // Initialize Google Sign-In after DOM is fully loaded
    setTimeout(() => {
      this.initializeGoogleSignIn();
    }, 1000);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  goToResetPassword(): void {
    this.isModalOpen = true;
    this.resetToken = null;
  }

  closeResetModal(): void {
    this.isModalOpen = false;
    this.resetToken = null;
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
          
          // Check if the error is about a banned account
          if (err.status === 403 && err.error === 'User account is banned.') {
            Swal.fire({
              icon: 'error',
              title: 'Account Banned',
              text: 'Your account has been banned. Please contact support.',
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Login Failed',
              text: 'Wrong credentials. Please try again.',
            });
          }
          
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
  
  // Note: signInWithGoogle method removed as we're now using FedCM with rendered buttons
  // and initializing Google Sign-In in ngOnInit
  
  private initializeGoogleSignIn(): void {
    try {
      // Use the actual Google Client ID
      const clientId = '464900684466-96jtnmiv303pv1tfgh9c4010cb0dobvq.apps.googleusercontent.com';
      
      google.accounts.id.initialize({
        client_id: clientId,
        callback: this.handleGoogleSignIn.bind(this),
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: true, // Enable FedCM
        itp_support: true // Add ITP support for Safari
      });
      
      // Instead of using prompt(), render a button
      // Make sure you have a div with id 'google-login-button' in your HTML template
      const buttonElement = document.getElementById('google-login-button');
      if (buttonElement) {
        google.accounts.id.renderButton(buttonElement, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: 250
        });
      } else {
        console.error('Google login button element not found');
      }
    } catch (error) {
      console.error('Error initializing Google Sign-In:', error);
    }
  }
  
  private handleGoogleSignIn(response: any): void {
    try {
      console.log('Google Sign-In response received:', response);
      const idToken = response.credential;
      
      if (!idToken) {
        console.error('No credential found in Google response');
        Swal.fire({
          icon: 'error',
          title: 'Sign In Failed',
          text: 'No credential received from Google. Please try again.',
          confirmButtonText: 'OK'
        });
        return;
      }
      
      this.isLoading = true;
      console.log('Sending Google token to backend...');
      
      this.authService.loginWithGoogle(idToken).subscribe({
        next: (response) => {
          console.log('Backend response:', response);
          this.isLoading = false;
          const role = response.role;
          
          if (role === 'ADMIN') {
            // Do NOT store session in localStorage for admin
            Swal.fire({
              icon: 'success',
              title: 'Login Successful',
              text: 'You have logged in with Google successfully!',
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
              role: response.role,
              profileCompleted: response.profileCompleted,
              newUser: response.newUser
            }));
            
            // Log profile completion status for debugging
            console.log('Profile completion status:', {
              newUser: response.newUser,
              profileCompleted: response.profileCompleted
            });
            
            Swal.fire({
              icon: 'success',
              title: 'Login Successful',
              text: 'You have logged in with Google successfully!',
              showConfirmButton: false,
              timer: 1500
            }).then(() => {
              // Check if profile needs to be completed
              if (response.newUser || !response.profileCompleted) {
                console.log('Redirecting to profile completion page');
                this.router.navigate(['/complete-profile']);
              } else {
                console.log('Redirecting to profile page');
                this.router.navigate(['/profile']);
              }
            });
          }
        },
        error: (err) => {
          console.error('Error from backend:', err);
          this.isLoading = false;
          let errorMessage = 'Google sign-in failed. Please try again.';
          
          if (err.error && typeof err.error === 'string') {
            errorMessage = err.error;
          } else if (err.message) {
            errorMessage = err.message;
          } else if (err.status === 0) {
            errorMessage = 'Cannot connect to the server. Please check if the backend is running.';
          }
          
          this.errorMessage = errorMessage;
          Swal.fire({
            icon: 'error',
            title: 'Sign In Failed',
            text: this.errorMessage,
            confirmButtonText: 'OK'
          });
        }
      });
    } catch (error) {
      console.error('Unexpected error in handleGoogleSignIn:', error);
      this.isLoading = false;
      Swal.fire({
        icon: 'error',
        title: 'Sign In Failed',
        text: 'An unexpected error occurred. Please try again later.',
        confirmButtonText: 'OK'
      });
    }
  }
}
