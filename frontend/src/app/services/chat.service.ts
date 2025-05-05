import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Message } from '../models/Message';
import { GroupMemberDTO } from '../models/GroupeMemberDTO';
import { AuthService, User } from 'src/app/services/auth.service';
import { UserInfraction } from '../models/ui';
import { Groupe } from '../models/groupe';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private baseUrl = 'http://localhost:8070/api/groupes';

  constructor(private http: HttpClient) { }


  getMessages(groupId: number): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.baseUrl}/${groupId}/messages`);
  }

  sendMessage(groupId: number, userId: number, message: string): Observable<any> {
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('message', message);
    return this.http.post(`${this.baseUrl}/${groupId}/sendMessage`, null, { params });
  }

  getGroupMembers(groupId: number): Observable<GroupMemberDTO[]> {
    return this.http.get<GroupMemberDTO[]>(`${this.baseUrl}/${groupId}/members`);
  }

  renameGroup(groupId: number, newName: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/${groupId}/rename`, { newName }, {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  // src/app/services/chat.service.ts
// group.service.ts
  addUserToGroup(groupId: number, userId: number): Observable<Groupe> {
    // récupère l'ID de l'utilisateur courant stocké en session
    const addedById = Number(sessionStorage.getItem('userId'));
    return this.http.post<Groupe>(
      `${this.baseUrl}/${groupId}/add-user`,
      { userId, addedById }
    );
  }

  searchUsersInGroupService(query: string): Observable<User[]> {
    return this.http.get<User[]>(`http://localhost:8078/api/groupes/search-users?query=${query}`);
  }


  leaveGroup(groupId: number, userId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${groupId}/leave`, {
      params: { userId: userId.toString() }
    });
  }
  sendAudioMessage(groupId: number, userId: number, audio: File, replyToId?: number) {
    const formData = new FormData();
    formData.append("userId", userId.toString());
    formData.append("audio", audio);
    if (replyToId) formData.append("replyToId", replyToId.toString());

    return this.http.post(`${this.baseUrl}/${groupId}/sendAudioMessage`, formData);
  }


  getUserInfraction(userId: number, groupId: number): Observable<UserInfraction> {
    return this.http.get<UserInfraction>(
      `http://localhost:8078/api/groupes/infractions/${userId}/${groupId}`
    );
  }

  notifyVideoCallStart(groupId: number, userId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${groupId}/video-call-start`, null, {
      params: { userId: userId.toString() }
    });
  }
  sendTextAndFileWithReply(groupId: number, userId: number, message: string, file: File | null, replyToId?: number): Observable<any> {
    const formData = new FormData();
    formData.append('userId', userId.toString());
    if (message) formData.append('messageText', message);
    if (file) formData.append('file', file);
    if (replyToId !== undefined) formData.append('replyToId', replyToId.toString());

    return this.http.post(`${this.baseUrl}/${groupId}/sendTextAndFile`, formData);
  }


  deleteMessage(id: number, userId: number, mode: 'everyone' | 'me'): Observable<any> {
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('mode', mode);

    return this.http.delete(`${this.baseUrl}/messages/${id}`, { params });
  }

  editMessage(messageId: number, newContent: string): Observable<Message> {
    return this.http.put<Message>(`${this.baseUrl}/messages/${messageId}`, {
      content: newContent
    });
  }

  reactToMessage(groupId: number, messageId: number, userId: number, emoji: string): Observable<any> {
    const params = new HttpParams()
      .set('messageId', messageId.toString())
      .set('userId', userId.toString())
      .set('emoji', emoji);

    return this.http.post(`${this.baseUrl}/${groupId}/react`, null, { params });
  }


}
