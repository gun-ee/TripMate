import axiosInstance from './axios';

export interface RoomSummary {
  id: number;
  name: string;
  memberCount: number;
  lastMessage?: string;
  lastMessageTime?: string;
}

export interface RoomDetail {
  id: number;
  name: string;
  memberCount: number;
}

export const chatApi = {
  myRooms: () => axiosInstance.get('/chat/rooms').then(r => r.data as RoomSummary[]),
  createRoom: (name: string, memberIds: number[]) => axiosInstance.post('/chat/rooms', { name, memberIds }).then(r => r.data),
  leaveRoom: (roomId: number) => axiosInstance.delete(`/chat/rooms/${roomId}/leave`).then(r => r.data as { roomDeleted: boolean }),
  getRoomDetail: (roomId: number) => axiosInstance.get(`/chat/rooms/${roomId}`).then(r => r.data as RoomDetail),
  getMessages: (roomId: number) => axiosInstance.get(`/chat/rooms/${roomId}/messages`).then(r => r.data as any[]),
};