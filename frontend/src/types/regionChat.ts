export interface ChatMessage {
  id: number;
  content: string;
  memberId: number;
  memberName: string;
  memberProfileImg?: string;
  city: string;
  createdAt: string;
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
}

