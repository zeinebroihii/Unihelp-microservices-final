import { Chat } from './chat';
import { User } from './user.model';
import { GroupMemberDTO } from './GroupeMemberDTO';

export interface Groupe {
  groupId: number;
  groupName: string;
  users?: User[];
  createdBy: string;
  createdById: number; // ✅ Identifiant du créateur

  chat?: Chat;
  groupImage?: string; // 👈 pour l'image base64
  messageCount?: number; // ✅
  members?: GroupMemberDTO[];
  createdAt?: string | Date | null;
  description?: string;
  // ✅ Ajout ici

}

