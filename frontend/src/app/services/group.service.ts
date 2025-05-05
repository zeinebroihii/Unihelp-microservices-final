import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Groupe } from '../models/groupe';
import { GroupMemberDTO } from '../models/GroupeMemberDTO';
import { JoinRequest } from '../models/JoinRequest';
import { UserInfraction } from '../models/ui';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private baseUrl = 'http://localhost:8078/api/groupes';

  constructor(private http: HttpClient) {}

  createGroup(request: {
    groupName: string;
    description: string;       // ✅ ajouté
    userIds: number[];
    createdBy: number;
    groupImage?: string; // 👈 ajouter ici aussi

  }): Observable<Groupe> {
    return this.http.post<Groupe>(`${this.baseUrl}/create`, request);
  }


  getGroupsForUser(userId: number): Observable<Groupe[]> {
    return this.http.get<Groupe[]>(`${this.baseUrl}/byUser`, {
      params: { userId: userId.toString() }
    });
  }

  requestJoinGroup(groupId: number, userId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${groupId}/join-request`, null, {
      params: { userId: userId.toString() }
    });
  }
  updateGroupImage(groupId: number, base64Image: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/${groupId}/image`, {
      image: base64Image
    });
  }
  rejectRequest(requestId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/join-request/${requestId}/reject`, {});
  }
  getUserInfraction(userId: number, groupId: number): Observable<UserInfraction> {
    return this.http.get<UserInfraction>(
      `http://localhost:8078/api/groupes/infractions/${userId}/${groupId}`
    );
  }



  getPendingRequests(groupId: number): Observable<JoinRequest[]> {
    return this.http.get<JoinRequest[]>(`${this.baseUrl}/${groupId}/pending-requests`);
  }

  acceptRequest(requestId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/join-request/${requestId}/accept`, {});
  }

  getAllGroups(): Observable<Groupe[]> {
    return this.http.get<Groupe[]>(`${this.baseUrl}/all`);
  }

  getGroupMembers(groupId: number): Observable<GroupMemberDTO[]> {
    return this.http.get<GroupMemberDTO[]>(`${this.baseUrl}/${groupId}/members`);
  }

  getAllGroupsWithMembers(): Observable<Groupe[]> {
    return this.http.get<Groupe[]>(`${this.baseUrl}/with-members`);
  }

  getGroupsCreatedBy(userId: number): Observable<Groupe[]> {
    return this.http.get<Groupe[]>(`${this.baseUrl}/created-by`, {
      params: { userId: userId.toString() }
    });
  }

  deleteGroup(groupId: number, userId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/group/${groupId}?userId=${userId}`);
  }


}
