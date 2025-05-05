export interface Reaction {
  emoji: string;
  userId: number;
  userName: string;
  userProfileImage?: string; // ✅
}



export interface Message {
  id?: number;
  content: string;
  senderName: string;   // 👈 On remplace l'objet `sender` par un simple champ
  chat: {
    chatId: number;
  };
  time: string;
  roomId?: string;
  senderId: number; // 👈 n'oublie pas celui-ci
  senderProfileImage?: string; // 👈 Nouveau champ
  fileUrl?: string; // ✅ ne rien mettre d'autre ici
  stickerUrl?: string; // ✅ ajouté
  hiddenFor?: number[]; // ✅ AJOUT ICI
  reactions?: {
    emoji: string;
    userId: number;
    userName: string;
  }[];
  replyToId?: number; // ID du message auquel on répond
  replyToMessage?: {
    id: number;
    content: string;
    senderName: string;
    fileUrl?: string;
  };
  replyToSenderId?: number;

}
