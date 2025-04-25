import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private mockUser = {
    userId: 5,
    role: 'STUDENT'
  };

  getCurrentUser(): Observable<{ userId: number; role: string }> {
    return of(this.mockUser);
  }

  isStudent(): Observable<boolean> {
    return of(this.mockUser.role === 'STUDENT');
  }
}
