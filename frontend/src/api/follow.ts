import axios from './axios';

export type FollowStatus = {
  isFollowing: boolean;
};

export type FollowCounts = {
  followerCount: number;
  followingCount: number;
};

export type FollowUser = {
  id: number;
  username: string;
  nickname: string;
  profileImg: string;
  followedAt: string;
};

export type FollowResponse = {
  success: boolean;
  message: string;
  isFollowing?: boolean;
};

export const followApi = {
  // 팔로우하기
  follow: async (targetUserId: number): Promise<FollowResponse> => {
    const { data } = await axios.post(`/follow/${targetUserId}`);
    return data;
  },

  // 언팔로우하기
  unfollow: async (targetUserId: number): Promise<FollowResponse> => {
    const { data } = await axios.delete(`/follow/${targetUserId}`);
    return data;
  },

  // 팔로우 상태 확인
  getFollowStatus: async (targetUserId: number): Promise<FollowStatus> => {
    const { data } = await axios.get(`/follow/${targetUserId}/status`);
    return data;
  },

  // 팔로워/팔로잉 수 조회
  getFollowCounts: async (userId: number): Promise<FollowCounts> => {
    const { data } = await axios.get(`/follow/${userId}/counts`);
    return data;
  },

  // 팔로워 목록 조회
  getFollowers: async (userId: number): Promise<FollowUser[]> => {
    const { data } = await axios.get(`/follow/${userId}/followers`);
    return data.followers || [];
  },

  // 팔로잉 목록 조회
  getFollowing: async (userId: number): Promise<FollowUser[]> => {
    const { data } = await axios.get(`/follow/${userId}/following`);
    return data.following || [];
  },
};
