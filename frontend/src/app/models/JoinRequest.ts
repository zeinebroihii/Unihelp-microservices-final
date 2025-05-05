import { Groupe } from './groupe';

export interface JoinRequest {
  id: number;
  firstName: string;
  lastName: string;
  userId: number;            // ✅ Ajouté ici
  accepted: boolean;
  requestedAt: string;
  profileImage?: string; // ✅ Add this
  groupName: string; // 👈 ajouté
}
