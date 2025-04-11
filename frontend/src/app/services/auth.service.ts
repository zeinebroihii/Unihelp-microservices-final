import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

// Define interfaces for request and response DTOs
interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  bio?: string;
  skills?: string[];
  profileImage?: string;
  role?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  type: string;
  id: number;
  email: string;
  role: string;
}

interface EmailRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth'; // Adjust to your backend URL

  constructor(private http: HttpClient) {}

  // Register a new user
  register(request: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, request, { responseType: 'json' })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Login a user
  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, request)
      .pipe(
        tap(response => {
          // Store the JWT token in localStorage
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify({
            id: response.id,
            email: response.email,
            role: response.role
          }));
        }),
        catchError(this.handleError)
      );
  }

  // Logout a user
  logout(): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/logout`, {})
      .pipe(
        tap(() => {
          // Clear the token and user data from localStorage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }),
        catchError(this.handleError)
      );
  }

  // Check if the user is logged in
  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  // Get the current user's role
  getUserRole(): string | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user).role : null;
  }

  // Get the current user's email
  getUserEmail(): string | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user).email : null;
  }

  // Forgot password
  forgotPassword(email: string): Observable<string> {
    const request: EmailRequest = { email };
    return this.http.post<string>(`${this.apiUrl}/forgot-password`, request)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Verify reset password token
  verifyResetToken(token: string): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/reset-password`, { params: { token } })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Reset password
  resetPassword(request: ResetPasswordRequest): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/reset-password`, request)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Handle HTTP errors
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = error.error || `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }
}
