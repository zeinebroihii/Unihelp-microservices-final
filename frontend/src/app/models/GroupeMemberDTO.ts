export interface GroupMemberDTO {
  userId: number;
  firstName: string;
  lastName: string;
  roles:string[];    // ← un tableau de rôles maintenant
  profileImage?: string; // ✅ Ajouté ici (optionnel avec ?)
  // "ADMIN" ou "MEMBER"
  invitedBy:     string | null;  // nom complet de l’invitant·e
  invitedById:   number | null;  // id de l’invitant·e/ son userId (pour comparer plus fiablement)

}

