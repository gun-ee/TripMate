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
  isMine: boolean; // 메시지 생성 시점에 스탬핑
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

