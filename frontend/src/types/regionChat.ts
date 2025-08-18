export interface ChatMessage {
  id: number;
  content: string;
  authorId: string;
  authorName: string;
  authorProfileImg?: string;
  authorLocation: string;
  region: string;
  city: string;
  createdAt: string;
  isDeleted?: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  region: string;
  city: string;
  memberCount: number;
  lastMessage?: string;
  lastMessageTime?: Date;
}

export interface UserLocation {
  userId: string;
  city: string;
  region: string;
  canChat: boolean;
}

export interface Region {
  id: string;
  name: string;
  cities: City[];
}

export interface City {
  id: string;
  name: string;
  regionId: string;
  chatRoomId: string;
}

