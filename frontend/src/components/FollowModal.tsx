import React, { useState, useEffect } from 'react';
import { FaTimes, FaUserPlus, FaUserCheck, FaUser } from 'react-icons/fa';
import { followApi, type FollowUser } from '../api/follow';
import './FollowModal.css';

interface FollowModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  type: 'followers' | 'following';
  title: string;
}

const FollowModal: React.FC<FollowModalProps> = ({ isOpen, onClose, userId, type, title }) => {
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [followStatus, setFollowStatus] = useState<Map<number, boolean>>(new Map());

  useEffect(() => {
    if (isOpen && userId) {
      loadUsers();
    }
  }, [isOpen, userId, type]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = type === 'followers' 
        ? await followApi.getFollowers(userId)
        : await followApi.getFollowing(userId);
      setUsers(data);
    } catch (error) {
      console.error('팔로워/팔로잉 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowClick = async (e: React.MouseEvent, targetUserId: number) => {
    e.stopPropagation();
    
    try {
      const isCurrentlyFollowing = followStatus.get(targetUserId);
      
      if (isCurrentlyFollowing) {
        await followApi.unfollow(targetUserId);
        setFollowStatus(prev => new Map(prev.set(targetUserId, false)));
      } else {
        await followApi.follow(targetUserId);
        setFollowStatus(prev => new Map(prev.set(targetUserId, true)));
      }
    } catch (error) {
      console.error('팔로우/언팔로우 실패:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1일 전';
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)}주 전`;
    return `${Math.ceil(diffDays / 30)}개월 전`;
  };

  if (!isOpen) return null;

  return (
    <div className="follow-modal-overlay" onClick={onClose}>
      <div className="follow-modal" onClick={(e) => e.stopPropagation()}>
        <div className="follow-modal-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="follow-modal-content">
          {loading ? (
            <div className="loading">로딩 중...</div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <FaUser className="empty-icon" />
              <p>아직 {type === 'followers' ? '팔로워' : '팔로잉'}가 없습니다.</p>
            </div>
          ) : (
            <div className="user-list">
              {users.map((user) => (
                <div key={user.id} className="user-item">
                  <div className="user-info">
                    <img
                      src={user.profileImg ? `http://localhost:80${user.profileImg}` : '/images/logo.png'}
                      alt="프로필"
                      className="user-avatar"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== '/images/logo.png') {
                          target.src = '/images/logo.png';
                        }
                      }}
                    />
                    <div className="user-details">
                      <div className="user-name">{user.nickname || user.username}</div>
                      <div className="user-username">@{user.username}</div>
                      <div className="follow-date">{formatDate(user.followedAt)}</div>
                    </div>
                  </div>
                  {type === 'followers' && (
                    <button 
                      className={`follow-btn ${followStatus.get(user.id) ? 'following' : 'follow'}`}
                      onClick={(e) => handleFollowClick(e, user.id)}
                    >
                      {followStatus.get(user.id) ? (
                        <>
                          <FaUserCheck />
                          <span>팔로잉</span>
                        </>
                      ) : (
                        <>
                          <FaUserPlus />
                          <span>팔로우</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowModal;
