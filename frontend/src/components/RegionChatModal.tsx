import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGPSLocation } from '../hooks/useGPSLocation';
import { useWebSocket } from '../hooks/useWebSocket';
import { useChat } from '../hooks/useChat';
import ChatHeader from './chat/ChatHeader';
import ChatMessages from './chat/ChatMessages';
import ChatInput from './chat/ChatInput';
import './RegionChatModal.css';

interface RegionChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  region: string;
  city: string;
}

const RegionChatModal: React.FC<RegionChatModalProps> = ({ isOpen, onClose, region, city }) => {
  const { isLoggedIn } = useAuth();
  
  // 커스텀 훅들을 사용하여 상태와 로직 분리
  const { currentCity, getCurrentLocation, isGPSLoading } = useGPSLocation();
  const { isConnected, sendMessage } = useWebSocket({ region, city, isOpen, isLoggedIn });
  const { messages, canChat } = useChat({ city, region, currentCity });

  // 모달이 열릴 때 GPS 위치 자동 가져오기 (한 번만)
  useEffect(() => {
    if (isOpen && !currentCity) {
      console.log('📍 [RegionChatModal] 모달 열림 - GPS 위치 요청 시작');
      getCurrentLocation();
    }
  }, [isOpen]); // getCurrentLocation 의존성 제거

  // 모달이 닫힐 때 GPS 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      console.log('📍 [RegionChatModal] 모달 닫힘 - GPS 상태 초기화');
      // useGPSLocation 훅에 reset 함수가 필요하다면 여기서 호출
    }
  }, [isOpen]);

  // 메시지 전송 핸들러
  const handleSendMessage = async (message: string) => {
    if (!canChat) return;
    
    const success = await sendMessage(message);
    if (success) {
      console.log('💬 [RegionChatModal] 메시지 전송 성공:', message);
    } else {
      console.error('💬 [RegionChatModal] 메시지 전송 실패');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="region-chat-modal-overlay" onClick={onClose}>
      <div className="region-chat-modal" onClick={(e) => e.stopPropagation()}>
        {/* 모달 헤더 */}
        <ChatHeader 
          city={city} 
          isConnected={isConnected} 
          onClose={onClose} 
        />

        {/* 연결 상태 안내 */}
        {!isConnected && isLoggedIn && (
          <div className="connection-notice">
            <p>연결 중... 잠시만 기다려주세요.</p>
          </div>
        )}

        {/* GPS 로딩 상태 */}
        {isGPSLoading && (
          <div className="gps-loading-notice">
            <p>📍 GPS 위치 확인 중...</p>
          </div>
        )}

        {/* 채팅 권한 안내 */}
        {!canChat && !isGPSLoading && (
          <div className="chat-permission-notice">
            <p>💬 이 채팅방에 메시지를 남기려면 현재 {city}에 위치해야 합니다.</p>
            <p>GPS 위치 확인 후 채팅이 가능합니다.</p>
            {currentCity && (
              <p>📍 현재 감지된 위치: {currentCity}</p>
            )}
          </div>
        )}

        {/* 메시지 목록 */}
        <ChatMessages messages={messages} />

        {/* 메시지 입력 */}
        {isLoggedIn && (
          <ChatInput 
            canChat={canChat} 
            onSendMessage={handleSendMessage} 
          />
        )}

        {/* 비로그인 사용자 안내 */}
        {!isLoggedIn && (
          <div className="login-notice">
            <p>로그인 후 채팅에 참여할 수 있습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegionChatModal;

