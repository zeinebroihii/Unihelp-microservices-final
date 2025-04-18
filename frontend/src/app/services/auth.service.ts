import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private mockUser = {
    userId: 1,
    role: 'ADMIN'
  };

  getCurrentUser(): Observable<{ userId: number; role: string }> {
    return of(this.mockUser);
  }

  isAdmin(): Observable<boolean> {
    return of(this.mockUser.role === 'ADMIN');
  }
}
