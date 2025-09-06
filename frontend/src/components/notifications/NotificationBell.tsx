import React, { useEffect, useState, useRef } from 'react';
import { FaBell, FaTimes } from 'react-icons/fa';
import { notificationApi } from '../../api/notificationApi';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useAuth } from '../../contexts/AuthContext';
import './NotificationBell.css';

interface Notification {
  id: number;
  type: string;
  message: string;
  linkUrl?: string;
  read: boolean;
  createdAt: string;
}

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { isLoggedIn, currentUserId } = useAuth();
  const { isConnected, subscribe } = useWebSocket();

  // 알림 로드
  const loadNotifications = async () => {
    if (!isLoggedIn) return;
    
    setIsLoading(true);
    try {
      const [allNotifications, count] = await Promise.all([
        notificationApi.list(0, 50), // 모든 알림 가져오기 (최근 50개)
        notificationApi.unreadCount()
      ]);
      setNotifications(allNotifications.content);
      setUnreadCount(count);
    } catch (error) {
      console.error('🔔 [NotificationBell] 알림 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // WebSocket 구독
  useEffect(() => {
    if (!isLoggedIn || !isConnected || !currentUserId) return;

    const unsubscribe = subscribe(`/topic/notifications/${currentUserId}`, (notification: Notification) => {
      console.log('🔔 [NotificationBell] 새 알림 수신:', notification);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return unsubscribe;
  }, [isLoggedIn, isConnected, currentUserId, subscribe]);

  // 초기 로드
  useEffect(() => {
    loadNotifications();
  }, [isLoggedIn]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 알림 클릭 시 읽음 처리
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await notificationApi.markRead(notification.id);
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('🔔 [NotificationBell] 읽음 처리 실패:', error);
      }
    }

    if (notification.linkUrl && notification.linkUrl !== '#') {
      window.location.href = notification.linkUrl;
    }

    setIsOpen(false);
  };

  // 모든 알림 읽음 처리
  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAll();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('🔔 [NotificationBell] 모두 읽음 처리 실패:', error);
    }
  };

  // 토글 핸들러
  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      loadNotifications();
    }
  };

  if (!isLoggedIn) return null;

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        className="notification-bell"
        onClick={handleToggle}
        aria-label="알림"
      >
        <FaBell className="bell-icon" />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>알림</h3>
            <div className="notification-actions">
              {unreadCount > 0 && (
                <button
                  className="mark-all-read-btn"
                  onClick={handleMarkAllAsRead}
                >
                  모두 읽음
                </button>
              )}
              <button
                className="close-btn"
                onClick={() => setIsOpen(false)}
              >
                <FaTimes />
              </button>
            </div>
          </div>

          <div className="notification-list">
            {isLoading ? (
              <div className="notification-loading">
                <div className="loading-spinner"></div>
                <span>알림을 불러오는 중...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <FaBell className="empty-icon" />
                <p>새 알림이 없습니다</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-content">
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-time">
                      {new Date(notification.createdAt).toLocaleString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="unread-indicator"></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
    