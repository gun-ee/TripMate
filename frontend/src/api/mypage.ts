import axios from './axios';

export type MyProfileResponse = {
  memberId: number;
  displayName: string | null;
  username: string;
  avatarUrl: string | null;
  tripCount: number;
  totalPlaceCount: number;
  upcomingTripCount: number;
};

export type MyTripCard = {
  id: number;
  title: string;
  startDate: string; // ISO
  endDate: string;   // ISO
  placeCount: number;
  coverImageUrl?: string | null;
};

export type MyTripsPageResponse = {
  items: MyTripCard[];
  nextCursorId: number | null;
};

export const mypageApi = {
  profile: async (): Promise<MyProfileResponse> => {
    const { data } = await axios.get('/mypage/profile');
    return data;
  },
  myTrips: async (cursorId?: number, size = 12): Promise<MyTripsPageResponse> => {
    const { data } = await axios.get('/mypage/trips', { params: { cursorId, size } });
    return data;
  },
  // 특정 유저의 프로필 조회
  userProfile: async (userId: number): Promise<MyProfileResponse> => {
    const { data } = await axios.get(`/mypage/profile/${userId}`);
    return data;
  },
  // 특정 유저의 여행 목록 조회
  userTrips: async (userId: number, cursorId?: number, size = 12): Promise<MyTripsPageResponse> => {
    const { data } = await axios.get(`/mypage/trips/${userId}`, { params: { cursorId, size } });
    return data;
  },
};
