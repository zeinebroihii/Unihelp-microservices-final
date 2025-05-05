import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GroupService } from 'src/app/services/group.service';
import { Groupe } from '../models/groupe';

@Component({
  selector: 'app-group-managment',
  templateUrl: './group-managment.component.html',
  styleUrls: ['./group-managment.component.css']
})
export class GroupManagmentComponent implements OnInit {
  groupes: Groupe[] = [];
  currentUserId: number = 0;
  currentUserFullName: string = '';
  defaultGroupImage = 'assets/default-group.png';
  searchText: string = '';
  allGroups: Groupe[] = [];
  filteredGroups: Groupe[] = [];
  currentUserRole: string = '';

  constructor(private groupService: GroupService, private router: Router) {}

  ngOnInit(): void {
    // Nouveau code :
    const userStr = localStorage.getItem("user");

    if (!userStr) {
      alert("Utilisateur non connecté !");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      this.currentUserId = +user.id;
      this.currentUserFullName = user.fullName || user.email || 'Utilisateur';
      this.currentUserRole = (user.role || '').toUpperCase();
    } catch (e) {
      console.error("Erreur parsing user localStorage:", e);
      alert("Données utilisateur invalides !");
      return;
    }


    this.groupService.getAllGroupsWithMembers().subscribe({
      next: (groups) => {
        this.allGroups = groups.map(group => ({
          ...group,
          createdAt: Array.isArray(group.createdAt)
            ? new Date(
              group.createdAt[0],
              group.createdAt[1] - 1,
              group.createdAt[2],
              group.createdAt[3],
              group.createdAt[4],
              group.createdAt[5],
              Math.floor(group.createdAt[6] / 1000000)
            )
            : group.createdAt ? new Date(group.createdAt) : undefined
        }));
        this.filteredGroups = [...this.allGroups];
      },
      error: (err) => {
        console.error("❌ Erreur lors du chargement des groupes avec membres :", err);
      }
    });
  }

  filterGroups(): void {
    const text = this.searchText.trim().toLowerCase();
    if (!text) {
      this.filteredGroups = [...this.allGroups];
      return;
    }

    this.filteredGroups = this.allGroups.filter(group =>
      group.groupName?.toLowerCase().includes(text) ||
      group.description?.toLowerCase().includes(text)
    );
  }

  onGroupImageSelected(event: Event, groupId: number): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const base64Image = reader.result as string;
      this.groupService.updateGroupImage(groupId, base64Image).subscribe({
        next: () => {
          const group = this.groupes.find(g => g.groupId === groupId);
          if (group) {
            group.groupImage = base64Image;
          }
          alert("📷 Image mise à jour !");
        },
        error: (err) => {
          console.error("❌ Erreur MAJ image", err);
          alert("⚠️ Échec de la mise à jour de l’image.");
        }
      });
    };

    reader.readAsDataURL(file);
  }

  triggerFileInput(groupId: number): void {
    const input = document.getElementById(`fileInput-${groupId}`) as HTMLInputElement;
    if (input) {
      input.click();
    } else {
      console.warn(`❌ Input introuvable pour le groupe ID ${groupId}`);
    }
  }

  requestJoin(groupId: number): void {
    this.groupService.requestJoinGroup(groupId, this.currentUserId).subscribe({
      next: () => {
        alert("📨 Demande envoyée !");
      },
      error: (err) => {
        console.error("Erreur envoi demande :", err);
        alert("⚠️ Une erreur est survenue.");
      }
    });
  }

  isMember(group: Groupe): boolean {
    return group.members?.some(m => m.userId === this.currentUserId) ?? false;
  }

  isAdmin(group: Groupe): boolean {
    return group.createdById === this.currentUserId;
  }
  isAdminUser(): boolean {
    return this.currentUserRole === 'ADMIN';
  }

  /** Retourne vrai si MENTOR */
  isMentorUser(): boolean {
    return this.currentUserRole === 'MENTOR';
  }

  get canCreateGroup(): boolean {
    return this.isAdminUser() || this.isMentorUser();
  }

  canJoin(group: Groupe): boolean {
    return !this.isAdmin(group) && !this.isMember(group);
  }

  openChat(groupId: number): void {
    this.router.navigate(['/chat', groupId]);
  }

  deleteGroup(groupId: number): void {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce groupe ?")) return;

    this.groupService.deleteGroup(groupId, this.currentUserId).subscribe({
      next: () => {
        this.groupes = this.groupes.filter(g => g.groupId !== groupId);
        this.allGroups = this.allGroups.filter(g => g.groupId !== groupId);
        this.filteredGroups = this.filteredGroups.filter(g => g.groupId !== groupId);
        alert("🗑️ Groupe supprimé avec succès.");
      },
      error: (err) => {
        console.error("Erreur suppression :", err);
        alert("⚠️ Échec de la suppression du groupe.");
      }
    });
  }
}
