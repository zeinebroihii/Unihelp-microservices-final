import { Component, OnInit } from '@angular/core';
import { GroupService } from 'src/app/services/group.service';
import { Groupe } from '../models/groupe';
import { AuthService, User } from 'src/app/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-group-add',
  templateUrl: './group-add.component.html',
  styleUrls: ['./group-add.component.css']
})
export class GroupAddComponent implements OnInit {
  groupName: string = '';
  description: string = '';
  showSuccess: boolean = false; // 👉 Pour afficher l'alerte animée
  isSubmitting = false;

  selectedUserIds: number[] = [];
  users: User[] = [];
  groups: Groupe[] = [];
  groupImageBase64: string = '';


  constructor(
    private groupService: GroupService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.authService.getAllUsers().subscribe({
      next: (data: User[]) => {
        this.users = data;
      },
      error: (error: any) => {
        console.error('Erreur chargement utilisateurs :', error);
      }
    });
  }

  onUserSelect(event: any): void {
    const userId = +event.target.value;
    if (event.target.checked) {
      this.selectedUserIds.push(userId);
    } else {
      this.selectedUserIds = this.selectedUserIds.filter(id => id !== userId);
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.groupImageBase64 = reader.result as string;
      };
      reader.readAsDataURL(file); // 👈 convertit en base64
    }
  }


  createGroup(): void {
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    const userStr = localStorage.getItem("user");
    if (!userStr) {
      alert("User not logged in!");
      this.isSubmitting = false;
      return;
    }

    let currentUserId: number;
    try {
      const user = JSON.parse(userStr);
      currentUserId = +user.id;
    } catch (e) {
      alert("Invalid user data!");
      this.isSubmitting = false;
      return;
    }


    if (!this.selectedUserIds.includes(currentUserId)) {
      this.selectedUserIds.push(currentUserId);
    }

    const request = {
      groupName: this.groupName,
      userIds: [...new Set(this.selectedUserIds)],
      description: this.description,
      groupImage: this.groupImageBase64,
      createdBy: currentUserId
    };

    this.groupService.createGroup(request).subscribe({
      next: () => {
        this.showSuccess = true;

        setTimeout(() => {
          this.showSuccess = false;
          this.isSubmitting = false;
          this.router.navigate(['/groups']);
        }, 2000);
      },
      error: (error) => {
        console.error('❌ Failed to create group:', error);
        this.isSubmitting = false;
      }
    });
  }

}
