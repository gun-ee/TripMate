import React, { useState, useRef, useEffect } from 'react';
import { FaComments, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { chatApi } from '../../api/chatApi';
import type { RoomSummary } from '../../api/chatApi';
import GroupChatModal from '../chatroom/GroupChatModal';
import './ChatIcon.css';

const ChatIcon: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isLoggedIn } = useAuth();

  // 채팅방 목록 로드
  const loadRooms = async () => {
    if (!isLoggedIn) return;
    
    setIsLoading(true);
    try {
      const roomList = await chatApi.myRooms();
      setRooms(roomList);
    } catch (error) {
      console.error('💬 [ChatIcon] 채팅방 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 토글 핸들러
  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      loadRooms();
    }
  };

  // 채팅방 클릭 핸들러
  const handleRoomClick = (roomId: number) => {
    setSelectedRoomId(roomId);
    setIsModalOpen(true);
    setIsOpen(false);
  };

  // 모달 닫기 핸들러
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRoomId(null);
  };

  // 채팅방 나가기 핸들러
  const handleRoomLeft = () => {
    setIsModalOpen(false);
    setSelectedRoomId(null);
    loadRooms(); // 채팅방 목록 새로고침
  };

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

  if (!isLoggedIn) return null;

  return (
    <div className="chat-icon-container" ref={dropdownRef}>
      <button
        className="chat-icon"
        onClick={handleToggle}
        aria-label="채팅"
      >
        <FaComments className="chat-icon-svg" />
      </button>

      {isOpen && (
        <div className="chat-dropdown">
          <div className="chat-header">
            <h3>채팅방</h3>
            <button
              className="close-btn"
              onClick={() => setIsOpen(false)}
            >
              <FaTimes />
            </button>
          </div>

          <div className="chat-list">
            {isLoading ? (
              <div className="chat-loading">
                <div className="loading-spinner"></div>
                <span>채팅방을 불러오는 중...</span>
              </div>
            ) : rooms.length === 0 ? (
              <div className="chat-empty">
                <FaComments className="empty-icon" />
                <p>참여 중인 채팅방이 없습니다</p>
              </div>
            ) : (
              rooms.map((room) => (
                <div
                  key={room.id}
                  className="chat-item"
                  onClick={() => handleRoomClick(room.id)}
                >
                  <div className="chat-content">
                    <div className="chat-room-name">
                      {room.name}단체채팅
                    </div>
                    <div className="chat-room-info">
                      {room.memberCount}명 · {room.lastMessage || '메시지 없음'}
                    </div>
                  </div>
                  <div className="chat-arrow">→</div>
                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* 채팅방 모달 */}
      <GroupChatModal
        open={isModalOpen}
        roomId={selectedRoomId}
        onClose={handleModalClose}
        onLeft={handleRoomLeft}
      />
    </div>
  );
};

export default ChatIcon;
