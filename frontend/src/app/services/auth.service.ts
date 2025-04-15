import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {Observable, of, throwError} from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

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

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  bio?: string;
  skills?: string[];
  profileImage?: string;
  role: string;
  banned: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8888/USER/api/auth';

  constructor(private http: HttpClient) {}

  register(formData: FormData): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/register`, formData, { responseType: 'json' })
      .pipe(catchError(this.handleError));
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, request).pipe(
      tap((response) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem(
          'user',
          JSON.stringify({
            id: response.id,
            email: response.email,
            role: response.role,
          })
        );
      }),
      catchError(this.handleError)
    );
  }

  logout(): Observable<string> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found in localStorage during logout');
      localStorage.clear();
      return of('Logout successful (no token present)');
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    };
    return this.http.post<string>(`${this.apiUrl}/logout`, {}, { headers }).pipe(
      tap(() => {
        console.log('Logout successful, clearing localStorage');
        localStorage.clear();
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Logout request failed:', error.message);
        localStorage.clear();
        return this.handleError(error);
      })
    );
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getUserRole(): string | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user).role : null;
  }

  getUserEmail(): string | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user).email : null;
  }

  forgotPassword(email: string): Observable<string> {
    const request: EmailRequest = { email };
    return this.http
      .post<string>(`${this.apiUrl}/forgot-password`, request)
      .pipe(catchError(this.handleError));
  }

  verifyResetToken(token: string): Observable<string> {
    return this.http
      .get<string>(`${this.apiUrl}/reset-password`, { params: { token } })
      .pipe(catchError(this.handleError));
  }

  resetPassword(request: ResetPasswordRequest): Observable<string> {
    return this.http
      .post<string>(`${this.apiUrl}/reset-password`, request)
      .pipe(catchError(this.handleError));
  }

  getAllUsers(): Observable<User[]> {
    return this.http
      .get<User[]>(`${this.apiUrl}/admin/users`)
      .pipe(catchError(this.handleError));
  }

  getUserById(id: number): Observable<User> {
    return this.http
      .get<User>(`${this.apiUrl}/admin/users/${id}`)
      .pipe(catchError(this.handleError));
  }

  banUser(id: number): Observable<string> {
    return this.http
      .post<string>(`${this.apiUrl}/admin/users/${id}/ban`, {})
      .pipe(catchError(this.handleError));
  }

  unbanUser(id: number): Observable<string> {
    return this.http
      .post<string>(`${this.apiUrl}/admin/users/${id}/unban`, {})
      .pipe(catchError(this.handleError));
  }

  updateUser(id: number, user: User): Observable<string> {
    return this.http
      .put<string>(`${this.apiUrl}/admin/users/${id}`, user)
      .pipe(catchError(this.handleError));
  }

  deleteUser(id: number): Observable<string> {
    return this.http
      .delete<string>(`${this.apiUrl}/admin/users/${id}`)
      .pipe(catchError(this.handleError));
  }
  getCurrentUserProfile(): Observable<User> {
    return this.http
      .get<User>(`${this.apiUrl}/profile`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
      if (error.status === 0) {
        errorMessage =
          'Network error: Could not connect to the server. Please check if the backend is running.';
      } else if (error.status === 413) {
        errorMessage =
          'Payload too large: The uploaded image is too big. Please upload a smaller image.';
      } else if (error.status === 500) {
        errorMessage = `Server error: ${
          error.error || 'Internal Server Error. Please check the backend logs.'
        }`;
      } else if (error.status === 400) {
        errorMessage = error.error || 'Invalid input. Please check your details.';
      } else {
        errorMessage = `Error Code: ${error.status}\nMessage: ${
          error.error || error.message
        }`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}
