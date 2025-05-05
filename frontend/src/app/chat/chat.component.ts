import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatService } from 'src/app/services/chat.service';
import { Message } from '../models/Message';
import { GroupMemberDTO } from '../models/GroupeMemberDTO';
import { ChatWebSocketService } from 'src/app/services/chat-web-socket.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { AuthService, User } from 'src/app/services/auth.service';
import {Subscription} from "rxjs";
import { skip, filter } from 'rxjs/operators';
import { OpenrouterService } from '../services/openrouter.service';


declare var bootstrap: any;

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  groupId!: number;
  newMessage: string = '';
  messages: Message[] = [];
  groupMembers: GroupMemberDTO[] = [];
  currentUserId: number = 0;
  currentFullName: string = ''; // Prénom Nom
  newGroupName: string = '';
  newMemberUsername: string = ''; // ✅ Ajouté
  isVideoCallActive: boolean = false;
  typingUser: string | null = null;
  typingTimeout: any;
  selectedFile: File | null = null;
  pendingFile: File | null = null; // <- pour le message "à envoyer"
  searchQuery: string = '';
  searchResults: User[] = [];
  selectedUser: User | null = null;
  userBlocked: boolean = false;
  blockMessage: string = '';
  alertMessage: string | null = null;
  messageToDelete: Message | null = null;
  deleteMode: 'everyone' | 'me' = 'everyone';
  activeMenuMessageId: number | null = null;
  editedContent: string = '';
  editingMessageId: number | null = null;
  replyTo: Message | null = null;
  selectedReactions: { emoji: string, userId: number, userName: string, userProfileImage: string }[] = [];
  mediaRecorder!: MediaRecorder;
  audioChunks: Blob[] = [];
  isRecording: boolean = false;
  recordStartTime!: number;
  summaryText: string = '';       // ← texte du résumé
  isSummarizing = false;          // ← pour loading spinner éventuel
  private subBlocked!: Subscription;
  currentUserRole = '';   // ← on ajoute ça
  private subMessages!: Subscription;

  @ViewChild('scrollMe') private chatContainer!: ElementRef;
  @ViewChild('summaryModal', { static: false }) summaryModal!: ElementRef;
  constructor(
    private route: ActivatedRoute,
    private chatService: ChatService,
    private router: Router,
    private chatWebSocket: ChatWebSocketService,
    private openRouterService: OpenrouterService,
    private authService: AuthService ,  // 👈 AJOUTE ÇA !
    private sanitizer: DomSanitizer // ← ici


  ) {}

  confirmDelete(message: Message): void {
    this.messageToDelete = message;
    this.deleteMode = 'everyone';

    const modal = new bootstrap.Modal(document.getElementById('deleteMessageModal')!);
    modal.show();
  }


  deleteConfirmed(): void {
    if (!this.messageToDelete) return;

    const message = this.messageToDelete; // ✅ TypeScript comprend que c'est non null ici

    this.chatService.deleteMessage(message.id!, this.currentUserId, this.deleteMode)
      .subscribe({
        next: () => {
          if (this.deleteMode === 'everyone') {
            this.messages = this.messages.filter(m => m.id !== message.id);
          } else {
            message.hiddenFor = message.hiddenFor || [];
            message.hiddenFor.push(this.currentUserId);
          }

          this.messageToDelete = null;
          this.closeModal('deleteMessageModal');
        },
        error: (err) => {
          alert("Erreur lors de la suppression !");
          console.error(err);
        }
      });
  }
  startEditing(msg: Message): void {
    this.editingMessageId = msg.id!;
    this.editedContent = msg.content;
    this.activeMenuMessageId = null;
  }

  addReaction(msg: Message, emoji: string): void {
    if (!msg.reactions) msg.reactions = [];

    // Supprimer ancienne réaction de l'utilisateur
    msg.reactions = msg.reactions.filter(r => r.userId !== this.currentUserId);

    // Ajouter la nouvelle
    msg.reactions.push({
      emoji,
      userId: this.currentUserId,
      userName: this.currentFullName  // 👈 requis
    });

    // Appeler backend
    this.chatService.reactToMessage(this.groupId, msg.id!, this.currentUserId, emoji).subscribe({
      next: () => {
        // Rien à faire ici, le WebSocket mettra à jour
      },
      error: err => console.error("Erreur réaction :", err)
    });
    this.activeMenuMessageId = null;

  }

  getGroupedEmojisSummary(msg: Message): string {
    const grouped: { [emoji: string]: number } = {};
    msg.reactions?.forEach(r => {
      grouped[r.emoji] = (grouped[r.emoji] || 0) + 1;
    });

    const emojis = Object.keys(grouped).join('');
    const total = Object.values(grouped).reduce((sum, val) => sum + val, 0);
    return `${emojis} ${total}`;
  }


  openReactionDetails(msg: Message, emoji: string): void {
    this.selectedReactions = (msg.reactions || [])
      .filter(r => !emoji || r.emoji === emoji)
      .map(r => {
        const member = this.groupMembers.find(m => m.userId === r.userId);
        return {
          emoji: r.emoji,
          userId: r.userId,
          userName: member ? `${member.firstName} ${member.lastName}` : 'Inconnu',
          userProfileImage: member?.profileImage || 'assets/default-avatar.png'
        };
      });
    const modal = new bootstrap.Modal(document.getElementById('reactionModal')!);
    modal.show();
  }

  startReply(msg: Message): void {
    this.replyTo = msg;
    this.activeMenuMessageId = null;
  }
  handleEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // empêche retour à la ligne
      this.sendMessage();
    }
  }

  cancelEditing(): void {
    this.editingMessageId = null;
    this.editedContent = '';
  }
  isAudioFile(fileUrl: string): boolean {
    return fileUrl?.endsWith('.webm') || fileUrl?.endsWith('.mp3') || fileUrl?.includes('audio_message');
  }


  confirmEdit(): void {
    if (this.editingMessageId === null || !this.editedContent.trim()) return;

    this.chatService.editMessage(this.editingMessageId, this.editedContent.trim())
      .subscribe({
        next: () => {
          const msg = this.messages.find(m => m.id === this.editingMessageId);
          if (msg) {
            msg.content = this.editedContent;
          }

          this.editingMessageId = null;
          this.editedContent = '';
        },
        error: err => {
          console.error("Erreur édition :", err);
          alert("Impossible de modifier le message.");
        }
      });
  }
  canEditMessage(msg: Message): boolean {
    const now = new Date().getTime();
    const messageTime = new Date(msg.time).getTime();
    const diffInMs = now - messageTime;

    const oneHour = 60 * 60 * 1000; // 1h en millisecondes
    return msg.senderId === this.currentUserId && diffInMs <= oneHour;
  }


  closeModal(id: string) {
    const modal = document.getElementById(id);
    if (modal) {
      const bsModal = bootstrap.Modal.getInstance(modal);
      bsModal?.hide();
    }
  }

  onSearchChange(): void {
    if (this.searchQuery.length < 2) {
      this.searchResults = [];
      return;
    }

    this.chatService.searchUsersInGroupService(this.searchQuery).subscribe({
      next: (results) => {
        this.searchResults = results;
      },
      error: (err) => {
        console.error("Erreur recherche:", err);
      }
    });
  }

  selectUser(user: User): void {
    this.selectedUser = user;
    this.searchQuery = `${user.firstName} ${user.lastName}`;
    this.searchResults = [];
  }


  ngOnInit(): void {
    this.groupId = +this.route.snapshot.paramMap.get('groupId')!;

    const userStr = localStorage.getItem('user');
    if (!userStr) {
      alert('Utilisateur non connecté');
      this.router.navigate(['/login']);
      return;
    }

    try {
      const user = JSON.parse(userStr);
      this.currentUserId = +user.id;
      this.currentFullName = user.fullName || `${user.firstName} ${user.lastName}`;
      this.currentUserRole = user.role || '';
    } catch (e) {
      alert("Erreur lors de la récupération de l'utilisateur");
      this.router.navigate(['/login']);
      return;
    }


    // 1️⃣ Charger les membres du groupe
    this.chatService.getGroupMembers(this.groupId).subscribe({
      next: members => {
        this.groupMembers = members;

        // 2️⃣ Si l’utilisateur n’est plus membre, on le redirige tout de suite
        const stillMember = members.some(m => m.userId === this.currentUserId);
        if (!stillMember) {
          alert("🚫 Vous avez été bloqué·e et retiré·e de ce groupe.");
          this.router.navigate(['/groups']);
          return;
        }

        // 3️⃣ Charge l’historique des messages
        this.loadMessages();

        // 4️⃣ Ouvre la socket WebSocket
        this.chatWebSocket.connect(this.groupId);
        this.subBlocked = this.chatWebSocket.blocked$
          .pipe(
            filter((blockedGroupId: number | null) => blockedGroupId !== null && blockedGroupId === this.groupId)
          )
          .subscribe(() => {
            console.warn('🚫 Blocage détecté');

            this.userBlocked = true;

            if (this.subMessages) {
              this.subMessages.unsubscribe();
              this.subMessages = null!;
            }
            if (this.subBlocked) {
              this.subBlocked.unsubscribe();
              this.subBlocked = null!;
            }

            this.chatWebSocket.disconnect()
              .then(() => {
                console.warn('✅ Déconnecté, redirection immédiate !');
                window.location.href = '/groups'; // << ici changement !
              })
              .catch((err) => {
                console.error('Erreur déconnexion:', err);
                window.location.href = '/groups'; // même en cas d'erreur
              });
          });


        // 6️⃣ Écoute des nouveaux messages et événements
        this.subMessages = this.chatWebSocket.messages$.subscribe((payload: any) => {
          if (this.userBlocked) return;  // ⬅️ Bloque le traitement des nouveaux messages

          // Suppression
          if (payload.type === 'MESSAGE_DELETED') {
            const { messageId, mode, userId } = payload;
            if (mode === 'everyone' || (mode === 'me' && userId === this.currentUserId)) {
              this.messages = this.messages.filter(m => m.id !== messageId);
            }
            return;
          }

          // Mise à jour de contenu
          if (payload.type === 'MESSAGE_UPDATED') {
            const msg = this.messages.find(m => m.id === payload.messageId);
            if (msg) msg.content = payload.newContent;
            return;
          }

          // Réaction
          if (payload.type === 'REACTION_UPDATED') {
            const msg = this.messages.find(m => m.id === payload.id);
            if (msg) msg.reactions = payload.reactions;
            return;
          }

          // Message normal
          const newMsg = payload as Message;

          // Reconstituer replyToMessage si besoin
          if (newMsg.replyToId && !newMsg.replyToMessage) {
            const original = this.messages.find(m => m.id === newMsg.replyToId);
            if (original) {
              newMsg.replyToMessage = {
                id: original.id!,
                content: original.content,
                senderName: original.senderName,
                fileUrl: original.fileUrl
              };
              newMsg.replyToSenderId = original.senderId;
            }
          }

          // Retirer un éventuel message temporaire (optimiste)
          this.messages = this.messages.filter(m =>
            !(m.id && m.id < 0 && m.content === newMsg.content && m.senderId === newMsg.senderId)
          );

          // Éviter les doublons
          const isDuplicate = this.messages.some(m =>
            m.content === newMsg.content &&
            m.senderId === newMsg.senderId &&
            Math.abs(new Date(m.time).getTime() - new Date(newMsg.time).getTime()) < 3000
          );

          if (!isDuplicate) {
            this.messages.push(newMsg);
            this.scrollToBottom();
          }
        });
      },
      error: err => console.error("Erreur chargement membres :", err)
    });
  }
  ngOnDestroy(): void {
    this.chatWebSocket.disconnect();
    if (this.subMessages) {
      this.subMessages.unsubscribe();
    }
    if (this.subBlocked) {
      this.subBlocked.unsubscribe();
    }
  }

  getUserById(userId: number): GroupMemberDTO | null {
    return this.groupMembers.find(m => m.userId === userId) || null;
  }

  sanitizeImage(base64Image: string | null | undefined): SafeUrl {
    const isValidImage = base64Image && base64Image.startsWith('data:image');
    const url = isValidImage ? base64Image : 'assets/default-avatar.png';
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }
  onImageError(event: any): void {
    event.target.src = 'assets/default-avatar.png';
  }

  loadGroupMembers(): void {
    this.chatService.getGroupMembers(this.groupId).subscribe({
      next: (res) => this.groupMembers = res,
      error: err => console.error("Erreur chargement membres:", err)
    });
  }

  toggleMenu(messageId: number): void {
    if (this.activeMenuMessageId === messageId) {
      this.activeMenuMessageId = null;
    } else {
      this.activeMenuMessageId = messageId;
    }
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    this.pendingFile = file;     // ✅ pour affichage
    this.selectedFile = file;    // ✅ si tu veux afficher ailleurs aussi
  }


  getUserNameById(id: number): string {
    const user = this.groupMembers.find(m => m.userId === id);
    return user ? `${user.firstName} ${user.lastName}` : 'Inconnu';
  }

  extractFileName(fileUrl: string): string {
    if (!fileUrl) return '';
    const parts = fileUrl.split('/');
    return parts[parts.length - 1]; // nom du fichier
  }

  isCurrentUserAdmin(): boolean {
    const user = this.groupMembers.find(m => m.userId === this.currentUserId);
    // on teste si le tableau contient "ADMIN"
    return user?.roles?.includes('ADMIN') ?? false;
  }
  openAddMemberModal(): void {
    const modal = new bootstrap.Modal(document.getElementById('addMemberModal')!);
    modal.show();
  }
  // your-component.ts
// src/app/chat/chat.component.ts (ou group-chat.component.ts)
  addUser(): void {
    if (!this.selectedUser) {
      return alert("Sélectionnez un membre.");
    }
    const userId = this.selectedUser.id!;

    this.chatService
      .addUserToGroup(this.groupId, userId)    // ← ici : plus que 2 arguments
      .subscribe({
        next: () => {
          this.loadGroupMembers();
          bootstrap.Modal.getInstance(
            document.getElementById('addMemberModal')!
          )?.hide();
          this.searchQuery = '';
          this.selectedUser = null;
        },
        error: err => alert("Erreur ajout membre : " + err.message)
      });
  }

  leaveGroup(): void {
    if (!confirm("Quitter le groupe ?")) return;

    this.chatService.leaveGroup(this.groupId, this.currentUserId).subscribe({
      next: () => {
        alert("🚪 Tu as quitté le groupe !");
        this.router.navigate(['/groups']);
      },
      error: err => alert("Erreur lors du quit: " + (err?.error?.message || err.message))
    });
  }

  loadMessages(): void {
    this.chatService.getMessages(this.groupId).subscribe({
      next: (res) => {
        this.messages = res;
        this.scrollToBottom();
      },
      error: (err) => console.error("Erreur chargement messages:", err)
    });
  }
  sendMessage(): void {
    const trimmedMsg = this.newMessage.trim();
    if (!trimmedMsg && !this.pendingFile) return;

    const inappropriateWords = [
      "violence", "haine", "suicide", "terrorisme", "menace", "insulte", "injure", "tuer", "battre",
      "sale", "idiot", "con", "merde", "connard", "pute", "salope",
      "kill", "hate", "suicide", "terrorist", "violence", "stupid", "idiot", "dumb", "fool", "bitch",
      "fuck", "shit", "asshole", "bastard", "jerk", "moron", "whore"
    ];

    const containsBadWord = inappropriateWords.some(word =>
      trimmedMsg.toLowerCase().includes(word)
    );

    // 1. Créer un message temporaire (optimiste uniquement si contenu correct)
    const tempMessage: Message = {
      id: -Date.now(),
      content: trimmedMsg,
      senderId: this.currentUserId,
      senderName: this.currentFullName,
      time: new Date().toISOString(),
      fileUrl: this.pendingFile ? 'uploading...' : undefined,
      reactions: [],
      chat: {} as any,
      replyToId: this.replyTo?.id,
      replyToMessage: this.replyTo
        ? {
          id: this.replyTo.id!,
          content: this.replyTo.content,
          senderName: this.replyTo.senderName,
          fileUrl: this.replyTo.fileUrl
        }
        : undefined
    };

    if (!containsBadWord) {
      this.messages.push(tempMessage);
      this.scrollToBottom();
    }

    this.newMessage = '';
    this.selectedFile = null;
    const fileToSend = this.pendingFile;
    this.pendingFile = null;

    // 2. 🔁 Envoie au backend avec replyToId (à ajuster dans ton service aussi)
    this.chatService.sendTextAndFileWithReply(
      this.groupId,
      this.currentUserId,
      trimmedMsg,
      fileToSend,
      this.replyTo?.id
    ).subscribe({
      next: () => {},
      error: err => {
        console.error("Erreur lors de l'envoi :", err);
        this.messages = this.messages.filter(m => m.id !== tempMessage.id);
      }
    });

    // 3. Nettoie la réponse
    this.replyTo = null;
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
    this.pendingFile = null;
  }
  isSystemMessageMine(msg: Message): boolean {
    return msg.senderId === -1 &&
      !!msg.fileUrl?.startsWith("user:") &&
      +msg.fileUrl.split(":")[1] === this.currentUserId;
  }
  getSenderFromSystemMsg(fileUrl?: string): GroupMemberDTO | null {
    if (!fileUrl || !fileUrl.startsWith("user:")) return null;
    const userId = +fileUrl.split(":")[1];
    return this.groupMembers.find(u => u.userId === userId) || null;
  }



  scrollToBottom(): void {
    setTimeout(() => {
      if (this.chatContainer?.nativeElement) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  openGroupOptions(): void {
    const modal = new bootstrap.Modal(document.getElementById('groupOptionsModal')!);
    modal.show();
  }


  toggleRecording(): void {
    if (this.isRecording) {
      this.stopRecording(); // ← déjà existant
    } else {
      this.startRecording(); // ← déjà existant
    }
  }

  renameGroup(): void {
    const trimmed = this.newGroupName.trim();
    if (!trimmed) return alert('Nom invalide');

    this.chatService.renameGroup(this.groupId, trimmed).subscribe({
      next: () => {
        alert("✅ Groupe renommé !");
        this.newGroupName = '';
        bootstrap.Modal.getInstance(document.getElementById('renameGroupModal')!)?.hide();
      },
      error: err => alert("Erreur renommage: " + (err?.error?.message || err.message))
    });
  }

  openRenameModal(): void {
    const modal = new bootstrap.Modal(document.getElementById('renameGroupModal')!);
    modal.show();
  }

  goToMembers(): void {
    bootstrap.Modal.getInstance(document.getElementById('groupOptionsModal')!)?.hide();
    this.router.navigate([`/group/${this.groupId}/members`]);
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return isToday ? time : isYesterday ? `Hier à ${time}` : `${date.toLocaleDateString('fr-FR')} à ${time}`;
  }

  getDateOnly(dateStr: string): string {
    return new Date(dateStr).toDateString();
  }

  isNewDate(index: number): boolean {
    if (index === 0) return true;
    const current = this.getDateOnly(this.messages[index].time);
    const previous = this.getDateOnly(this.messages[index - 1].time);
    return current !== previous;
  }

  formatDateHeader(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "yesterday";
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  }


  startRecording(): void {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('🎤 Micro non supporté dans ce navigateur.');
      return;
    }

    this.isRecording = true;
    this.audioChunks = [];
    this.recordStartTime = Date.now(); // ← enregistre le début

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        this.mediaRecorder = new MediaRecorder(stream);

        this.mediaRecorder.ondataavailable = event => {
          if (event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        };

        this.mediaRecorder.onstop = () => {
          const duration = Date.now() - this.recordStartTime;

          if (duration < 800) { // 🛑 Si enregistrement trop court (< 0.8s)
            alert("⏱️ Enregistrement trop court !");
            return;
          }

          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          const audioFile = new File([audioBlob], `${Date.now()}_audio_message.webm`, {
            type: 'audio/webm'
          });

          this.pendingFile = audioFile;
          this.selectedFile = audioFile;

          this.sendMessage(); // 📨 Envoie seulement si valide
        };

        this.mediaRecorder.start();
      })
      .catch(err => {
        console.error('Erreur micro :', err);
        alert('Erreur lors de l’accès au micro.');
        this.isRecording = false;
      });
  }


  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.isRecording = false;
  }


  onSummarizeDiscussion(): void {
    const fullDiscussion = this.messages
      .map(m => `${m.senderName}: ${m.content}`)
      .join('\n\n');
    if (!fullDiscussion) return;

    this.isSummarizing = true;
    this.openRouterService.summarizeDiscussion(fullDiscussion).subscribe({
      next: (text: string) => {
        this.summaryText = text;
        this.isSummarizing = false;
        this.openSummaryModal();
      },
      error: (err: any) => {
        console.error('Résumé failed', err);
        this.isSummarizing = false;
      }
    });
  }

  /** Ouvre la modale Bootstrap du résumé */
  private openSummaryModal(): void {
    const modal = new bootstrap.Modal(this.summaryModal.nativeElement);
    modal.show();
  }

  /** Ferme la modale et remet summaryText à vide */
  closeSummaryModal(): void {
    const modalInstance = bootstrap.Modal.getInstance(
      this.summaryModal.nativeElement
    );
    modalInstance?.hide();
    this.summaryText = '';
  }
  /** Ajuste la hauteur du textarea en fonction de son contenu */
  autoResize(textarea: HTMLTextAreaElement): void {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }


}
