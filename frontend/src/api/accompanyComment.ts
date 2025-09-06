import axios from './axios';

export interface AccompanyComment {
  id: number;
  postId: number;
  authorId: number;
  authorName: string;
  authorNickname: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  profileImage?: string;
  isDeleted: boolean;
}

export interface CommentListResponse {
  comments: AccompanyComment[];
  totalCount: number;
}

export interface CreateCommentRequest {
  content: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export const accompanyCommentApi = {
  // 댓글 목록 조회
  getComments: async (postId: number): Promise<CommentListResponse> => {
    const { data } = await axios.get(`/accompany-comments/post/${postId}`);
    return data as CommentListResponse;
  },

  // 댓글 작성
  createComment: async (postId: number, request: CreateCommentRequest): Promise<AccompanyComment> => {
    const { data } = await axios.post(`/accompany-comments/post/${postId}`, request);
    return data as AccompanyComment;
  },

  // 댓글 수정
  updateComment: async (commentId: number, request: UpdateCommentRequest): Promise<AccompanyComment> => {
    const { data } = await axios.put(`/accompany-comments/${commentId}`, request);
    return data as AccompanyComment;
  },

  // 댓글 삭제
  deleteComment: async (commentId: number): Promise<void> => {
    await axios.delete(`/accompany-comments/${commentId}`);
  },
};
