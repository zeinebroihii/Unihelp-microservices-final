import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { UserService, User } from '../../../services/user.service';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss'
})
export class UsersListComponent implements OnInit {
  users: User[] = [];
  loading = true;
  error: string = '';

  constructor(private userService: UserService) {}

  ngOnInit(): void {
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

  onBan(user: User) {
    // TODO: Implement ban logic
    console.log('Ban user', user);
  }

  onDelete(user: User) {
    // TODO: Implement delete logic
    console.log('Delete user', user);
  }

  onModify(user: User) {
    // TODO: Implement modify logic
    console.log('Modify user', user);
  }
}


