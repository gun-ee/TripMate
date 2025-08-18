import React, { useState, useEffect, useRef } from 'react';
import { FaEllipsisH, FaArrowLeft, FaImage } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import type { ChatMessage, UserLocation } from '../types/regionChat';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import './RegionChatModal.css';

interface RegionChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  region: string;
  city: string;
}

const RegionChatModal: React.FC<RegionChatModalProps> = ({ isOpen, onClose, region, city }) => {
  const { isLoggedIn } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [canChat, setCanChat] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessageId, setLastMessageId] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 시간 포맷팅 함수 (yyyy-MM-DD 오전/오후 hh:mm 형식)
  const formatMessageTime = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    const ampm = hours < 12 ? '오전' : '오후';
    const displayHours = hours < 12 ? hours : hours === 12 ? 12 : hours - 12;
    const displayHoursStr = displayHours === 0 ? '12' : String(displayHours).padStart(2, '0');
    
    return `${year}-${month}-${day} ${ampm} ${displayHoursStr}:${minutes}`;
  };

  // 날짜 구분선 표시 함수
  const shouldShowDateSeparator = (currentIndex: number): boolean => {
    if (currentIndex === 0) return true;
    
    const currentMessage = messages[currentIndex];
    const previousMessage = messages[currentIndex - 1];
    
    if (!currentMessage || !previousMessage) return false;
    
    const currentDate = new Date(currentMessage.createdAt).toDateString();
    const previousDate = new Date(previousMessage.createdAt).toDateString();
    
    return currentDate !== previousDate;
  };

  // 날짜 구분선 텍스트 생성
  const getDateSeparatorText = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}년 ${month}월 ${day}일`;
  };

  // 사용자 위치 확인 및 채팅 권한 체크 (GPS 기반)
  useEffect(() => {
    if (isLoggedIn && isOpen) {
      checkUserLocation();
    }
  }, [isLoggedIn, isOpen, city]);

  // 웹소켓 연결 및 메시지 구독
  useEffect(() => {
    if (!isOpen || !isLoggedIn) return;

    const connectWebSocket = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        const client = new Client({
          webSocketFactory: () => new SockJS(`http://${window.location.host}/ws/region-chat`),
          connectHeaders: {
            'Authorization': `Bearer ${token}`
          }
        });

        client.onConnect = () => {
          setIsConnected(true);
          console.log('웹소켓 연결 성공');
          
          // 해당 지역 채팅방 구독
          client.subscribe(`/topic/region-chat/${region}/${city}`, (message) => {
            try {
              const newMessage = JSON.parse(message.body);
              setMessages(prev => [...prev, newMessage]);
              setLastMessageId(newMessage.id);
            } catch (error) {
              console.error('메시지 파싱 실패:', error);
            }
          });
        };

        client.onStompError = (frame) => {
          console.error('STOMP 에러:', frame);
          setIsConnected(false);
        };

        client.activate();
        setStompClient(client);
      } catch (error) {
        console.error('웹소켓 연결 실패:', error);
        setIsConnected(false);
      }
    };

    connectWebSocket();

    // 클린업 함수
    return () => {
      if (stompClient) {
        stompClient.deactivate();
        setStompClient(null);
        setIsConnected(false);
      }
    };
  }, [isOpen, canChat, isLoggedIn, region, city]);

  // 메시지 자동 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkUserLocation = async () => {
    try {
      // 실제 구현시에는 GPS 기반 위치 확인
      // 임시로 랜덤하게 위치 설정 (테스트용)
      const mockLocation: UserLocation = {
        userId: '1',
        city: city,
        region: region,
        canChat: Math.random() > 0.5 // 50% 확률로 채팅 가능
      };
      
      setUserLocation(mockLocation);
      setCanChat(mockLocation.canChat);
    } catch (error) {
      console.error('사용자 위치 확인 실패:', error);
      setCanChat(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !canChat || !stompClient || !isConnected) return;

    try {
      // 웹소켓을 통해 메시지 전송
      stompClient.publish({
        destination: `/app/region-chat/${region}/${city}`,
        body: JSON.stringify({
          content: newMessage,
          region: region,
          city: city,
          authorLocation: city
        })
      });
      
      setNewMessage('');
    } catch (error) {
      console.error('메시지 전송 실패:', error);
    }
  };

  const handleImageUpload = () => {
    // 이미지 업로드 기능 구현
    console.log('이미지 업로드');
  };

  if (!isOpen) return null;

  return (
    <div className="region-chat-modal-overlay" onClick={onClose}>
      <div className="region-chat-modal" onClick={(e) => e.stopPropagation()}>
        {/* 모달 헤더 */}
        <div className="chat-modal-header">
          <div className="header-left">
            <button className="back-button" onClick={onClose}>
              <FaArrowLeft />
            </button>
            <div className="chat-room-info">
              <h2 className="chat-room-title">{city}</h2>
              <div className="connection-status">
                {isConnected && <span>🟢</span>}
                {!isConnected && <span>🔴</span>}
              </div>
            </div>
          </div>
          <button className="menu-button">
            <FaEllipsisH />++
          </button>
        </div>

        {/* 연결 상태 안내 */}
        {!isConnected && isLoggedIn && (
          <div className="connection-notice">
            <p>연결 중... 잠시만 기다려주세요.</p>
          </div>
        )}

        {/* 채팅 권한 안내 */}
        {!canChat && (
          <div className="chat-permission-notice">
            <p>💬 이 채팅방에 메시지를 남기려면 현재 {city}에 위치해야 합니다.</p>
            <p>GPS 위치 확인 후 채팅이 가능합니다.</p>
          </div>
        )}

        {/* 메시지 목록 */}
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="no-messages">
              <p>아직 메시지가 없습니다.</p>
              <p>첫 번째 메시지를 남겨보세요!</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <React.Fragment key={message.id}>
                {/* 날짜 구분선 */}
                {shouldShowDateSeparator(index) && (
                  <div className="date-separator">
                    {getDateSeparatorText(message.createdAt)}
                  </div>
                )}
                
                {/* 메시지 아이템 */}
                <div className="message-item">
                  <div className="message-profile">
                    <img 
                      src={message.authorProfileImg || '/images/logo.png'} 
                      alt="프로필" 
                      className="profile-image"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/logo.png';
                      }}
                    />
                  </div>
                  <div className="message-content">
                    <div className="message-header">
                      <span className="message-author">{message.authorName}</span>
                      <span className="message-time">{formatMessageTime(message.createdAt)}</span>
                    </div>
                    <div className="message-bubble">
                      {message.isDeleted ? (
                        <span className="deleted-message">① 삭제된 메시지입니다.</span>
                      ) : (
                        message.content
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 메시지 입력 */}
        {isLoggedIn && (
          <form className="chat-input-form" onSubmit={handleSendMessage}>
            <div className="chat-input-container">
              <button 
                type="button" 
                className="image-upload-button"
                onClick={handleImageUpload}
              >
                <FaImage />
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="대화를 해보세요"
                disabled={!canChat}
                className="chat-input"
              />
              <button 
                type="submit" 
                disabled={!canChat || !newMessage.trim()}
                className="send-button"
              >
                보내기
              </button>
            </div>
          </form>
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

