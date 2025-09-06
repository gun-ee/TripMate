import axios from './axios';

export interface PostSummary {
  id: number;
  title: string;
  authorId: number;
  authorName: string;
  tripId: number;
  status: 'OPEN'|'CLOSED';
  createdAt: string;
}

export interface PostDetail extends PostSummary { content: string; updatedAt: string; }

export interface ApplicationItem {
  id: number;
  applicantName: string;
  applicantNickname: string;
  message: string;
  status: 'PENDING'|'ACCEPTED'|'REJECTED';
  createdAt: string;
  profileImage?: string;
}

export interface PostWithApplications {
  postId: number;
  postTitle: string;
  postStatus: 'OPEN'|'CLOSED';
  applicationCount: number;
  createdAt: string;
}

export const accompanyApi = {
  list: async (page = 0, size = 12, keyword?: string, status?: string, sortBy?: string) => {
    const params: any = { page, size };
    if (keyword) params.keyword = keyword;
    if (status) params.status = status;
    if (sortBy) params.sortBy = sortBy;
    
    const { data } = await axios.get(`/accompany/posts`, { params });
    return data as { content: PostSummary[]; totalPages: number; totalElements: number; number: number; size: number; };
  },
  getTrip: async (tripId: number) => {
    const { data } = await axios.get(`/trips/${tripId}/edit-view`);
    return data;
  },
  get: async (id: number): Promise<PostDetail> => {
    const { data } = await axios.get(`/accompany/posts/${id}`);
    return data as PostDetail;
  },
  create: async (payload: { tripId: number; title: string; content: string }) => {
    const { data } = await axios.post(`/accompany/posts`, payload);
    return data as number;
  },
  update: async (id: number, payload: { title: string; content: string }) => {
    await axios.put(`/accompany/posts/${id}`, payload);
  },
  remove: async (id: number) => { await axios.delete(`/accompany/posts/${id}`); },
  close: async (id: number) => { await axios.post(`/accompany/posts/${id}/close`); },
  myPosts: async (page = 0, size = 20) => {
    const { data } = await axios.get(`/accompany/myposts`, { params: { page, size } });
    return data;
  },
  apply: async (postId: number, message: string) => {
    await axios.post(`/accompany/posts/${postId}/apply`, { message });
  },
  // 신청자 목록 조회
  getApplicationsByPostId: async (postId: number): Promise<ApplicationItem[]> => {
    const { data } = await axios.get(`/accompany-applications/post/${postId}`);
    return data as ApplicationItem[];
  },
  
  // 내가 작성한 게시글들의 신청자 수 조회
  getMyPostsWithApplications: async (): Promise<PostWithApplications[]> => {
    const { data } = await axios.get(`/accompany-applications/my-posts`);
    return data as PostWithApplications[];
  },
  
  // 신청 승인/거부
  updateApplicationStatus: async (applicationId: number, status: 'ACCEPTED'|'REJECTED') => {
    await axios.put(`/accompany-applications/${applicationId}/status?status=${status}`);
  },

  checkMyApplication: async (postId: number): Promise<boolean> => {
    const { data } = await axios.get(`/accompany-applications/check/${postId}`);
    return data as boolean;
  },
};
