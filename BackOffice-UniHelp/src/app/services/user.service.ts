import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  bio?: string;
  skills?: string;
  profileImage?: string;
  role: string;
  banned: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = 'http://localhost:8888/USER/api/auth';

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<User[]> {
    return this.http
      .get<User[]>(`${this.apiUrl}/admin/users`)
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
