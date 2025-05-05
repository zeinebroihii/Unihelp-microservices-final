import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GroupService } from '../services/group.service';
import { GroupMemberDTO } from '../models/GroupeMemberDTO';

@Component({
  selector: 'app-group-members',
  templateUrl: './group-members.component.html',
  styleUrls: ['./group-members.component.css']
})
export class GroupMembersComponent implements OnInit {
  groupId!:       number;
  admins:         GroupMemberDTO[] = [];
  members:        GroupMemberDTO[] = [];
  currentUserId = 0;

  private roleOrder = ['MENTOR','STUDENT'];

  constructor(
    private route: ActivatedRoute,
    private groupService: GroupService
  ) {
  }

  ngOnInit(): void {
    // 1) Récupérer l’ID courant depuis sessionStorage
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      alert('Utilisateur non connecté !');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      this.currentUserId = +user.id;
    } catch (err) {
      console.error('Erreur parsing user:', err);
      alert('Impossible de récupérer les infos utilisateur.');
    }

    // 2) Charger les membres
    this.groupId = Number(this.route.snapshot.paramMap.get('groupId'));
    this.groupService.getGroupMembers(this.groupId).subscribe(res => {
      this.admins = res.filter(m => m.roles.includes('ADMIN'));
      this.members = res
        .filter(m => !m.roles.includes('ADMIN'))
        .sort((a, b) => {
          const ai = this.roleOrder.indexOf(a.roles[0] || '');
          const bi = this.roleOrder.indexOf(b.roles[0] || '');
          return (ai === -1 ? this.roleOrder.length : ai)
            - (bi === -1 ? this.roleOrder.length : bi);
        });
    });
  }
}
