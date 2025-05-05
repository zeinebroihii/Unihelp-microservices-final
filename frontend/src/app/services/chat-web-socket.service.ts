import { Injectable } from '@angular/core';
import * as SockJS from 'sockjs-client';
import { Client, Message } from '@stomp/stompjs';
import { BehaviorSubject, Subject } from 'rxjs'; // 🔥
import { Notification } from './notification-api.service';  // importe ton interface

@Injectable({ providedIn: 'root' })
export class ChatWebSocketService {
  private stompClient!: Client;
  private messageSubject = new Subject<any>();
  private typingSubject = new Subject<string>();
  private alertSubject   = new Subject<Notification>();  // now Subject<Notification>

  public messages$ = this.messageSubject.asObservable();
  public typing$ = this.typingSubject.asObservable();
  public alerts$ = this.alertSubject.asObservable(); // 🔥
  private blockedSubject = new BehaviorSubject<number | null>(null); // 🔥 ici
  public  blocked$       = this.blockedSubject.asObservable();
  connect(groupId: number): void {
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8078/ws'),
      reconnectDelay: 5000,
      debug: (str) => console.log('[STOMP]', str)
    });

    this.stompClient.onConnect = () => {
      // 1) flux de chat
      this.stompClient.subscribe(`/topic/chat/${groupId}`, (m: Message) => {
        this.messageSubject.next(JSON.parse(m.body));
      });

      // 2) notifications classiques
      this.stompClient.subscribe('/user/queue/notifications', (m: Message) => {
        this.alertSubject.next(JSON.parse(m.body));
      });

      // 3) **nouveau** : canal privé pour être notifié de ton blocage
      this.stompClient.subscribe('/user/queue/blocked', (m: Message) => {
        const blockedGroupId = JSON.parse(m.body) as number;
        this.blockedSubject.next(blockedGroupId); // ✅ ici
      });
    };
    this.stompClient.activate();
  }
  disconnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.stompClient) {
        if (this.stompClient.active) {
          // Déconnecter le WebSocket proprement
          this.stompClient.deactivate().then(() => {
            console.log('🛑 WebSocket déconnecté proprement');
            resolve();
          }).catch(err => {
            console.error('Erreur déconnexion WebSocket', err);
            reject(err);
          });
        } else {
          // Même inactif, force déconnexion
          this.stompClient.forceDisconnect?.();
          resolve();
        }
        this.stompClient = null!;
      } else {
        resolve();
      }
    });
  }








}
