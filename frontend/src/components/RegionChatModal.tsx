import React, { useState, useEffect, useRef } from 'react';
import { FaEllipsisH, FaArrowLeft, FaImage } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import type { ChatMessage, UserLocation } from '../types/regionChat';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axiosInstance from '../api/axios';
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

  // GPS 관련 상태 추가
  const [currentGPSLocation, setCurrentGPSLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [isGPSLoading, setIsGPSLoading] = useState(false);
  const [currentCity, setCurrentCity] = useState<string>('');

  // Nominatim API를 사용해서 GPS 좌표를 도시명으로 변환
  const getCityFromCoordinates = async (lat: number, lon: number): Promise<string> => {
    try {
      // 백엔드 프록시를 통해 Nominatim API 호출 (CORS 문제 해결)
      const response = await axiosInstance.get(`/geocoding/reverse?lat=${lat}&lon=${lon}`);
      
      if (response.data && response.data.address) {
        const data = response.data;
        console.log('📍 [Nominatim API] 응답 데이터:', data);
        
        // 백엔드에서 추출한 도시명이 있으면 사용
        if (data.extractedCity) {
          console.log('📍 [Nominatim API] 백엔드에서 추출한 도시명:', data.extractedCity);
          return data.extractedCity;
        }
        
        // 도시명 우선순위: city > town > village > county
        const cityName = data.address.city || 
                        data.address.town || 
                        data.address.village || 
                        data.address.county || 
                        '알 수 없는 도시';
        
        return cityName;
      } else {
        throw new Error('API 응답 데이터 형식이 올바르지 않습니다');
      }
      
    } catch (error) {
      console.error('📍 [Nominatim API] 도시명 변환 실패:', error);
      return '알 수 없는 도시';
    }
  };

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
      // GPS 기반 위치 확인으로 변경
      // getCurrentLocation() 함수에서 이미 canChat 상태를 설정하므로
      // 여기서는 사용자 위치 정보만 업데이트
      if (currentCity) {
        const userLocation: UserLocation = {
          userId: '1',
          city: currentCity,
          region: region,
          canChat: currentCity === city // GPS 도시명과 채팅방 도시명 비교
        };
        
        setUserLocation(userLocation);
        console.log('📍 [RegionChatModal] 사용자 위치 정보 업데이트:', userLocation);
      }
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

  // GPS 위치 가져오기 함수
  const getCurrentLocation = async () => {
    setIsGPSLoading(true);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation이 지원되지 않습니다'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => resolve(position),
          (error) => reject(error),
          {
            enableHighAccuracy: true,  // 높은 정확도
            timeout: 10000,           // 10초 타임아웃
            maximumAge: 60000         // 1분 캐시
          }
        );
      });

      const { latitude, longitude, accuracy } = position.coords;
      
      setCurrentGPSLocation({
        latitude,
        longitude,
        accuracy
      });

      // 브라우저 콘솔에 GPS 좌표 출력
      console.log('📍 [RegionChatModal] GPS 위치 감지 성공:');
      console.log('  - 위도:', latitude);
      console.log('  - 경도:', longitude);
      console.log('  - 정확도:', accuracy, 'm');
      console.log('  - 전체 좌표 객체:', position.coords);
      
      // GPS 좌표로 도시명 가져오기
      console.log('📍 [RegionChatModal] 도시명 변환 시작...');
      const cityName = await getCityFromCoordinates(latitude, longitude);
      setCurrentCity(cityName);
      
      console.log('📍 [RegionChatModal] 현재 위치한 도시:', cityName);
      
      // GPS로 받아온 도시명과 채팅방 도시명 비교하여 채팅 권한 설정
      console.log('📍 [RegionChatModal] 채팅 권한 확인 시작');
      console.log('  - GPS 도시명:', cityName);
      console.log('  - 채팅방 도시명:', city);
      
      const isLocationMatch = cityName === city;
      console.log('📍 [RegionChatModal] 위치 일치 여부:', isLocationMatch);
      
      if (isLocationMatch) {
        setCanChat(true);
        console.log('📍 [RegionChatModal] 채팅 권한 부여됨');
      } else {
        setCanChat(false);
        console.log('📍 [RegionChatModal] 채팅 권한 거부됨 - 위치 불일치');
      }
      
    } catch (error) {
      console.error('📍 [RegionChatModal] GPS 위치 가져오기 실패:', error);
      
      // 에러 상세 정보도 콘솔에 출력
      if (error instanceof GeolocationPositionError) {
        console.error('  - 에러 코드:', error.code);
        console.error('  - 에러 메시지:', error.message);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            console.error('  - 원인: 위치 접근 권한이 거부됨');
            break;
          case error.POSITION_UNAVAILABLE:
            console.error('  - 원인: 위치 정보를 사용할 수 없음');
            break;
          case error.TIMEOUT:
            console.error('  - 원인: 위치 정보 요청 시간 초과');
            break;
          default:
            console.error('  - 원인: 알 수 없는 오류');
        }
      }
    } finally {
      setIsGPSLoading(false);
    }
  };

  // 모달이 열릴 때 GPS 위치 자동 가져오기
  useEffect(() => {
    if (isOpen) {
      getCurrentLocation();
    }
  }, [isOpen]);

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
                      <span className="message-author">{message.memberName || message.authorName}</span>
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

