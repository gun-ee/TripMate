import axios from './axios';

export interface TripTalkPost {
  id: number;
  content: string;
  imageUrl?: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  type: 'TRIPTALK';
}

export interface AccompanyPostItem {
  id: number;
  title: string;
  content: string;
  status: 'OPEN' | 'CLOSED';
  applicationCount: number;
  createdAt: string;
  type: 'ACCOMPANY';
}

export interface AllPosts {
  tripTalkPosts: TripTalkPost[];
  accompanyPosts: AccompanyPostItem[];
}

export const myPostsApi = {
  // 내가 작성한 모든 게시글 조회
  getMyPosts: async (): Promise<AllPosts> => {
    const { data } = await axios.get('/my-posts');
    return data as AllPosts;
  },
};
