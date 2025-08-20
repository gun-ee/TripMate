export interface ChatMessage {
  id: number;
  content: string;
  memberId: number;
  memberName: string;
  authorName: string;
  authorProfileImg?: string;
  memberProfileImg?: string;
  city: string;
  createdAt: string;
  isDeleted?: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  city: string;
  memberCount: number;
  lastMessage?: string;
}

export interface UserLocation {
  userId: string;
  city: string;
  region: string;
  canChat: boolean;
}

