import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Post {
  id: number;
  title: string;
  content: string;
  imageUrl?: string;
  authorName: string;
  authorProfileImg: string;
  region?: string;
  createdAt: Date;
  likeCount: number;
  commentCount: number;
  isLikedByMe: boolean;
  isAuthor?: boolean;
}

interface PostContextType {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  updatePost: (postId: number, updates: Partial<Post>) => void;
  updatePostLike: (postId: number, isLiked: boolean) => void;
  updatePostLikeCount: (postId: number, likeCount: number, isLiked: boolean) => void;
  updatePostCommentCount: (postId: number, increment: number) => void;
  addPost: (post: Post) => void;
  removePost: (postId: number) => void;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

export const usePostContext = () => {
  const context = useContext(PostContext);
  if (context === undefined) {
    throw new Error('usePostContext must be used within a PostProvider');
  }
  return context;
};

interface PostProviderProps {
  children: ReactNode;
}

export const PostProvider: React.FC<PostProviderProps> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);

  // 게시글 업데이트 (createdAt 필드 보호)
  const updatePost = (postId: number, updates: Partial<Post>) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId 
          ? { 
              ...post, 
              ...updates,
              // createdAt 필드는 절대 덮어쓰지 않음
              createdAt: post.createdAt 
            } 
          : post
      )
    );
  };

  // 좋아요 상태 업데이트
  const updatePostLike = (postId: number, isLiked: boolean) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              isLikedByMe: isLiked,
              likeCount: isLiked ? post.likeCount + 1 : post.likeCount - 1
            }
          : post
      )
    );
  };
  
  // 좋아요 카운트만 업데이트 (모달용)
  const updatePostLikeCount = (postId: number, likeCount: number, isLiked: boolean) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              likeCount: likeCount,
              isLikedByMe: isLiked
            }
          : post
      )
    );
  };

  // 댓글 수 업데이트 (createdAt 필드 보호)
  const updatePostCommentCount = (postId: number, increment: number) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { 
              ...post, 
              commentCount: post.commentCount + increment,
              // createdAt 필드는 절대 덮어쓰지 않음
              createdAt: post.createdAt 
            }
          : post
      )
    );
  };

  // 새 게시글 추가
  const addPost = (post: Post) => {
    setPosts(prevPosts => [post, ...prevPosts]);
  };

  // 게시글 제거
  const removePost = (postId: number) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  };

  const value: PostContextType = {
    posts,
    setPosts,
    updatePost,
    updatePostLike,
    updatePostLikeCount,
    updatePostCommentCount,
    addPost,
    removePost
  };

  return (
    <PostContext.Provider value={value}>
      {children}
    </PostContext.Provider>
  );
};
