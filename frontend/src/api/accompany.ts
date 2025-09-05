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

export const accompanyApi = {
  list: async (page = 0, size = 12) => {
    const { data } = await axios.get(`/accompany/posts`, { params: { page, size } });
    return data as { content: PostSummary[]; totalPages: number; totalElements: number; number: number; size: number; };
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
  listApplicationsByPost: async (postId: number) => {
    const { data } = await axios.get(`/accompany/posts/${postId}/applications`);
    return data as Array<{ id:number; postId:number; applicantId:number; applicantName:string; message:string; status:string; createdAt:string }>;
  },
  listApplicationsForOwner: async () => {
    const { data } = await axios.get(`/accompany/applications/mine`);
    return data as Array<{ id:number; postId:number; applicantId:number; applicantName:string; message:string; status:string; createdAt:string }>;
  },
  accept: async (applicationId:number) => { await axios.post(`/accompany/applications/${applicationId}/accept`); },
  reject: async (applicationId:number) => { await axios.post(`/accompany/applications/${applicationId}/reject`); },
};
