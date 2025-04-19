import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { UserService, User } from '../../../services/user.service';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss'
})
export class UsersListComponent implements OnInit {
  users: User[] = [];
  loading = true;
  error: string = '';
  editUserId: number | null = null;
  editUserData: Partial<User> = {};
  expandedUserId: number | null = null;

  searchTerm: string = '';
  filterRole: string = '';
  filterBanned: string = '';

  get uniqueRoles(): string[] {
    // Get all unique roles from the users list
    return Array.from(new Set(this.users.map(u => u.role).filter(Boolean)));
  }

  get filteredUsers(): User[] {
    let filtered = this.users;
    const term = this.searchTerm.trim().toLowerCase();
    if (term) {
      filtered = filtered.filter(user =>
        (user.firstName + ' ' + user.lastName).toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        (user.skills || '').toLowerCase().includes(term)
      );
    }
    if (this.filterRole) {
      filtered = filtered.filter(user => user.role === this.filterRole);
    }
    if (this.filterBanned) {
      filtered = filtered.filter(user =>
        this.filterBanned === 'banned' ? user.banned : !user.banned
      );
    }
    return filtered;
  }

  toggleExpand(userId: number) {
    this.expandedUserId = this.expandedUserId === userId ? null : userId;
  }

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        console.log('Fetched users:', users); // DEBUG
        this.users = users;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load users.';
        this.loading = false;
      }
    });
  }

  onBan(user: User) {
    this.userService.banUser(user.id).subscribe({
      next: () => {
        window.alert('User banned successfully.');
        this.refreshUsers();
      },
      error: (err) => {
        window.alert(err.message || 'Failed to ban user.');
      }
    });
  }

  onUnban(user: User) {
    this.userService.unbanUser(user.id).subscribe({
      next: () => {
        window.alert('User unbanned successfully.');
        this.refreshUsers();
      },
      error: (err) => {
        window.alert(err.message || 'Failed to unban user.');
      }
    });
  }

  onDelete(user: User) {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        window.alert('User deleted successfully.');
        this.refreshUsers();
      },
      error: (err) => {
        window.alert(err.message || 'Failed to delete user.');
      }
    });
  }

  onModify(user: User) {
    // Fetch the full user details for safe editing
    this.userService.getUserById(user.id).subscribe({
      next: (fullUser) => {
        // Pre-fill the edit form with non-empty fields
        this.editUserId = user.id;
        this.editUserData = {
          firstName: fullUser.firstName || '',
          lastName: fullUser.lastName || '',
          email: fullUser.email || '',
          bio: fullUser.bio || '',
          skills: fullUser.skills || '',
          profileImage: fullUser.profileImage || '',
          role: fullUser.role || '',
        };
      },
      error: (err) => {
        window.alert(err.message || 'Failed to fetch user details.');
      }
    });
  }

  onSaveEdit(userId: number) {
    // Always keep the original role (do not allow changing it)
    const updatePayload: any = {
      firstName: this.editUserData.firstName,
      lastName: this.editUserData.lastName,
      email: this.editUserData.email,
      bio: this.editUserData.bio,
      skills: (this.editUserData.skills || '').trim(),
      role: this.editUserData.role // Always send the original role
    };
    // Keep the existing profile image if present
    if (this.editUserData.profileImage) {
      updatePayload.profileImage = this.editUserData.profileImage;
    }
    this.userService.modifyUser(userId, updatePayload).subscribe({
      next: () => {
        window.alert('User modified successfully.');
        this.editUserId = null;
        this.editUserData = {};
        this.refreshUsers();
      },
      error: (err) => {
        window.alert(err.message || 'Failed to modify user.');
      }
    });
  }

  onCancelEdit() {
    this.editUserId = null;
    this.editUserData = {};
  }

  private refreshUsers() {
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load users.';
        this.loading = false;
      }
    });
  }
}


