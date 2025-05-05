import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
// src/app/services/notification-api.service.ts

export interface Notification {
  id: number;
  recipientUserId: number;
  title: string;
  message: string;
  link: string;
  groupId?: number;      // ← ajouté
  offenderId?: number;   // ← ajouté
  createdAt: string;
  joinRequestId?: number;  // ← présent si c’est une demande d’adhésion

  read: boolean;
}


@Injectable({ providedIn: 'root' })
export class NotificationApiService {
  // Remplace '/api/notifications' par l'URL complète de ton micro-service
  private base = 'http://localhost:8078/notifications';
  private groupBase = 'http://localhost:8078/api/groupes';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Notification[]> {
    const id = +sessionStorage.getItem('userId')!;
    return this.http.get<Notification[]>(`${this.base}/user/${id}`);
  }

  getUnread(): Observable<Notification[]> {
    const id = +sessionStorage.getItem('userId')!;
    return this.http.get<Notification[]>(`${this.base}/user/${id}/unread`);
  }

  markAsRead(id: number): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/read`, {});
  }


  markAllAsRead(): Observable<void> {
    const userId = +sessionStorage.getItem('userId')!;
    return this.http.patch<void>(
      `${this.base}/user/${userId}/read-all`,
      {}
    );
  }

  blockUserInGroup(groupId: number, userId: number): Observable<void> {
    return this.http.patch<void>(
      `${this.groupBase}/${groupId}/block-user/${userId}`,
      {}
    );
  }

  acceptRequest(requestId: number, acceptedById: number): Observable<void> {
    const params = new HttpParams().set('acceptedById', acceptedById.toString());
    return this.http.post<void>(
      `${this.groupBase}/join-request/${requestId}/accept`,
      null,
      { params }
    );
  }

  rejectRequest(requestId: number): Observable<void> {
    return this.http.post<void>(
      `${this.groupBase}/join-request/${requestId}/reject`,
      {}
    );
  }
}
