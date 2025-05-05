import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit
} from '@angular/core';
import { NotificationApiService, Notification } from '../services/notification-api.service';
import { ChatWebSocketService } from '../services/chat-web-socket.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-bell',
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.css']
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount = 0;
  isOpen = false;

  private historySub!: Subscription;
  private liveSub!: Subscription;

  constructor(
    private api: NotificationApiService,
    private ws: ChatWebSocketService,
    public router: Router,
    private el: ElementRef
  ) {}

  ngOnInit() {
    // chargement historique
    this.historySub = this.api.getAll().subscribe(list => {
      this.notifications = list;
      this.updateUnreadCount();
    });
    // flux en temps-réel
    this.liveSub = this.ws.alerts$.subscribe(n => {
      this.notifications.unshift(n);
      this.updateUnreadCount();
    });
  }

  ngOnDestroy() {
    this.historySub.unsubscribe();
    this.liveSub.unsubscribe();
  }

  toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen && this.unreadCount > 0) {
      // on marque tout lu en local
      this.notifications.forEach(n => n.read = true);
      this.updateUnreadCount();
      // envoi serveur
      this.api.markAllAsRead().subscribe({
        error: () => {
          // rollback en cas d’erreur
          this.notifications.forEach(n => n.read = false);
          this.updateUnreadCount();
        }
      });
    }
  }

  private updateUnreadCount() {
    this.unreadCount = this.notifications.filter(n => !n.read).length;
  }

  @HostListener('document:click', ['$event.target'])
  onClickOutside(target: HTMLElement) {
    if (!this.el.nativeElement.contains(target)) {
      this.isOpen = false;
    }
  }

  blockUser(n: Notification) {
    if (!n.groupId || !n.offenderId) return;
    if (!confirm('Bloquer définitivement cet utilisateur ?')) return;
    this.api.blockUserInGroup(n.groupId, n.offenderId).subscribe({
      next: () => {
        n.read = true;
        this.updateUnreadCount();
        alert('Utilisateur bloqué et exclu du groupe.');
        this.isOpen = false;
      },
      error: err => {
        console.error('Erreur blocage', err);
        alert('Échec du blocage.');
      }
    });
  }

  /** Accepter une demande d’adhésion */
  acceptRequest(joinRequestId: number) {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      alert('Utilisateur non connecté !');
      return;
    }

    let acceptedById: number;
    try {
      const user = JSON.parse(userStr);
      acceptedById = +user.id;
    } catch (err) {
      console.error('Erreur lecture user ID:', err);
      alert('Impossible de récupérer l’ID utilisateur.');
      return;
    }
    this.api.acceptRequest(joinRequestId, acceptedById).subscribe({
      next: () => {
        this._removeNotif(joinRequestId);
        alert('✅ Demande acceptée.');
        this.isOpen = false;
      },
      error: err => {
        console.error('Erreur acceptation', err);
        alert('❌ Échec de l’acceptation.');
      }
    });
  }


  /** Refuse une demande d’adhésion */
  rejectRequest(joinRequestId: number) {
    if (!confirm('Refuser cette demande ?')) return;
    this.api.rejectRequest(joinRequestId).subscribe({
      next: () => {
        this._removeNotif(joinRequestId);
        alert('❌ Demande refusée.');
        this.isOpen = false;
      },
      error: err => {
        console.error('Erreur refus', err);
        alert('❌ Échec du refus.');
      }
    });
  }
  /** Retire la notification correspondante */
  private _removeNotif(requestId: number) {
    this.notifications = this.notifications.filter(
      n => n.joinRequestId !== requestId
    );
    this.updateUnreadCount();
  }

  goToAll() {
    this.isOpen = false;
    this.router.navigateByUrl('/Notifications');
  }
}

