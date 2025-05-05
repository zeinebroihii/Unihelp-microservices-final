export interface  UserInfraction {
  userId: number;
  infractionCount: number;
  blocked: boolean;
  blockedUntil?: string; // Date ISO ex: "2025-04-20T10:30:00"
}
