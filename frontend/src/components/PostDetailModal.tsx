import React, { useState, useEffect } from 'react';
import { FaHeart, FaComment, FaTimes, FaEdit, FaTrash } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { usePostContext, type Post } from '../contexts/PostContext';
import axiosInstance from '../api/axios';
import { showDeleteConfirm } from '../utils/sweetAlert';
import './PostDetailModal.css';

interface PostDetailModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
}

interface Comment {
  id: number;
  content: string;
  authorName: string;
  authorProfileImg: string;
  createdAt: Date;
}

const PostDetailModal: React.FC<PostDetailModalProps> = ({ post, isOpen, onClose }) => {
  const { isLoggedIn, nickname } = useAuth();
  const { posts, updatePostLikeCount, updatePostCommentCount, updatePost, removePost } = usePostContext();
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasEdited, setHasEdited] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(0);
  
  // PostContext에서 최신 게시글 정보 가져오기
  const currentPost = posts.find(p => p.id === post?.id) || post;
  
  // 현재 사용자가 게시글 작성자인지 확인
  const isAuthor = isLoggedIn && currentPost && nickname === currentPost.authorName;
  
  // 수정 가능 여부 확인 (작성자이고 아직 수정하지 않은 경우)
  const canEdit = isAuthor && !hasEdited;

  useEffect(() => {
    if (currentPost && isOpen) {
      fetchComments();
      setEditTitle(currentPost.title);
      setEditContent(currentPost.content);
      setLocalCommentCount(currentPost.commentCount);
    }
  }, [currentPost, isOpen]);

  const fetchComments = async () => {
    if (!currentPost) return;
    
    try {
      const response = await axiosInstance.get(`/posts/${currentPost.id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('댓글 로드 실패:', error);
    }
  };

  const handleLike = async () => {
    if (!currentPost) return;
    
    try {
      const response = await axiosInstance.post(`/posts/${currentPost.id}/like`);
      const { isLiked, likeCount } = response.data;
      
      // PostContext를 통해 TripTalk 페이지와 모달 모두 업데이트
      updatePostLikeCount(currentPost.id, likeCount, isLiked);
      
    } catch (error) {
      console.error('좋아요 처리 실패:', error);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPost || !newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await axiosInstance.post(`/posts/${currentPost.id}/comments`, {
        content: newComment
      });
      
      console.log('댓글 작성 성공:', response.data);
      
      // 댓글 목록 새로고침
      await fetchComments();
      
      // 댓글 목록 새로고침으로 댓글 수 반영
      await fetchComments();
      
      // 로컬 댓글 수 업데이트
      setLocalCommentCount(prev => prev + 1);
      
      // PostContext 댓글 수 업데이트 (createdAt 보호됨)
      updatePostCommentCount(currentPost.id, 1);
      console.log('댓글 작성 완료 - PostContext 댓글 수 업데이트');
      
      setNewComment('');
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      // 에러 상세 정보 출력
      if (error instanceof Error) {
        console.error('에러 메시지:', error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPost) return;
    
    setIsSubmitting(true);
    try {
              await axiosInstance.put(`/posts/${currentPost.id}`, {
        title: editTitle,
        content: editContent
      });
      
      // PostContext를 통해 TripTalk 페이지 상태 업데이트
      updatePost(currentPost.id, { title: editTitle, content: editContent });
      
      // 수정 완료 상태로 변경
      setHasEdited(true);
      setIsEditing(false);
    } catch (error) {
      console.error('게시글 수정 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentPost) return;
    const result = await showDeleteConfirm('게시글 삭제', '정말로 이 게시글을 삭제하시겠습니까?');
    if (!result.isConfirmed) return;
    
    try {
              await axiosInstance.delete(`/posts/${currentPost.id}`);
      
      // PostContext를 통해 TripTalk 페이지에서 게시글 제거
      removePost(currentPost.id);
      
      onClose();
    } catch (error) {
      console.error('게시글 삭제 실패:', error);
    }
  };

  if (!isOpen || !currentPost) return null;

  return (
    <div className="post-detail-modal">
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{currentPost.title}</h2>
            <button className="close-btn" onClick={onClose}>
              <FaTimes />
            </button>
          </div>

          <div className="modal-body">
            {/* 게시글 내용 */}
            <div className="post-detail">
              <div className="post-header">
                <img 
                  src={currentPost.authorProfileImg ? `http://localhost:80${currentPost.authorProfileImg}` : '/images/logo.png'} 
                  alt="프로필" 
                  className="author-avatar"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== '/images/logo.png') {
                      target.src = '/images/logo.png';
                    }
                  }}
                />
                <div className="author-info">
                  <span className="author-name">{currentPost.authorName}</span>
                  <span className="post-date">
                    {new Date(currentPost.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                
                {isAuthor && (
                  <div className="action-buttons">
                    <button 
                      className={`action-btn edit-btn ${!canEdit ? 'disabled' : ''}`}
                      onClick={canEdit ? () => setIsEditing(!isEditing) : undefined}
                      title={canEdit ? "수정" : "이미 수정됨"}
                      disabled={!canEdit}
                    >
                      <FaEdit style={{ width: '12px', height: '12px', display: 'block' }} />
                    </button>
                    <button 
                      className="action-btn delete-btn"
                      onClick={handleDelete}
                      title="삭제"
                    >
                      <FaTrash style={{ width: '12px', height: '12px', display: 'block' }} />
                    </button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleEditSubmit} className="edit-form">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="edit-title-input"
                    placeholder="제목을 입력하세요"
                  />
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="edit-content-input"
                    placeholder="내용을 입력하세요"
                  />
                  <div className="edit-actions">
                    <button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? '수정 중...' : '수정 완료'}
                    </button>
                    <button type="button" onClick={() => setIsEditing(false)}>
                      취소
                    </button>
                  </div>
                </form>
              ) : (
                <div className="post-content">
                  <p className="post-text">{currentPost.content}</p>
                  {currentPost.imageUrl && (
                    <img 
                      src={currentPost.imageUrl.startsWith('http') ? currentPost.imageUrl : `http://localhost:80${currentPost.imageUrl}`} 
                      alt="게시글 이미지" 
                      className="post-image"
                      onError={(e) => {
                        console.error('게시글 이미지 로드 실패:', currentPost.imageUrl);
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  )}
                </div>
              )}

              <div className="post-footer">
                <button 
                  className={`like-btn ${currentPost.isLikedByMe ? 'liked' : ''}`}
                  onClick={handleLike}
                >
                  <FaHeart /> {currentPost.likeCount}
                </button>
                <span className="comment-count">
                  <FaComment /> {currentPost.commentCount}
                </span>
              </div>
            </div>

            {/* 댓글 섹션 */}
            <div className="comments-section">
              <h3>댓글 ({localCommentCount})</h3>
              
              {isLoggedIn && (
                <form onSubmit={handleCommentSubmit} className="comment-form">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="댓글을 입력하세요..."
                    className="comment-input"
                  />
                  <button 
                    type="submit" 
                    disabled={isSubmitting || !newComment.trim()}
                    className="comment-submit-btn"
                  >
                    {isSubmitting ? '작성 중...' : '댓글 작성'}
                  </button>
                </form>
              )}

              <div className="comments-list">
                {comments.map(comment => (
                  <div key={comment.id} className="comment-item">
                    <div className="comment-header">
                      <img 
                        src={comment.authorProfileImg ? `http://localhost:80${comment.authorProfileImg}` : '/images/logo.png'} 
                        alt="프로필" 
                        className="comment-avatar"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src !== '/images/logo.png') {
                            target.src = '/images/logo.png';
                          }
                        }}
                      />
                      <span className="comment-author">{comment.authorName}</span>
                      <span className="comment-date">
                        {new Date(comment.createdAt).toLocaleDateString('ko-KR')}
                      </span>
                      {/* 댓글 작성자만 삭제 가능 */}
                      {isLoggedIn && nickname === comment.authorName && (
                        <button 
                          className="comment-delete-btn"
                          onClick={async () => {
                            const result = await showDeleteConfirm('댓글 삭제', '댓글을 삭제하시겠습니까?');
                            if (result.isConfirmed) {
                              try {
                                await axiosInstance.delete(`/posts/${currentPost.id}/comments/${comment.id}`);
                                await fetchComments();
                                
                                // 댓글 목록 새로고침으로 댓글 수 반영
                                await fetchComments();
                                
                                // 로컬 댓글 수 업데이트
                                setLocalCommentCount(prev => prev - 1);
                                
                                // PostContext 댓글 수 업데이트 (createdAt 보호됨)
                                updatePostCommentCount(currentPost.id, -1);
                                console.log('댓글 삭제 완료 - PostContext 댓글 수 업데이트');
                              } catch (error) {
                                console.error('댓글 삭제 실패:', error);
                              }
                            }
                          }}
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: '#ff6b6b', 
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            marginLeft: 'auto'
                          }}
                        >
                          삭제
                        </button>
                      )}
                    </div>
                    <p className="comment-content">{comment.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailModal;
