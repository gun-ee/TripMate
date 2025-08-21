import { useState, useEffect, useCallback } from 'react';
import type { ChatMessage, UserLocation } from '../types/regionChat';

interface UseChatProps {
  city: string;
  region: string;
  currentCity: string;
}

export const useChat = ({ city, region, currentCity }: UseChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [canChat, setCanChat] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);

  // 채팅 권한 확인
  const checkChatPermission = useCallback((userCity: string) => {
    console.log('💬 [useChat] 채팅 권한 확인 시작');
    console.log('  - GPS 도시명:', userCity);
    console.log('  - 채팅방 도시명:', city);
    
    const isLocationMatch = userCity === city;
    console.log('  - 위치 일치 여부:', isLocationMatch);
    
    if (isLocationMatch) {
      setCanChat(true);
      console.log('💬 [useChat] 채팅 권한 부여됨');
    } else {
      setCanChat(false);
      console.log('💬 [useChat] 채팅 권한 거부됨 - 위치 불일치');
    }
    
    return isLocationMatch;
  }, [city]);

  // 사용자 위치 정보 업데이트
  const updateUserLocation = useCallback((userCity: string) => {
    if (userCity) {
      const userLocation: UserLocation = {
        userId: '1',
        city: userCity,
        region: region,
        canChat: userCity === city
      };
      
      setUserLocation(userLocation);
      console.log('💬 [useChat] 사용자 위치 정보 업데이트:', userLocation);
    }
  }, [city, region]);

  // 새 메시지 추가
  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
    console.log('💬 [useChat] 새 메시지 추가:', message);
  }, []);

  // 메시지 목록 설정
  const setMessageList = useCallback((messageList: ChatMessage[]) => {
    setMessages(messageList);
    console.log('💬 [useChat] 메시지 목록 설정:', messageList.length, '개');
  }, []);

  // 기존 메시지 로드 (초기 로드)
  const loadMessages = useCallback(async () => {
    try {
      setCurrentPage(0);
      setHasMoreMessages(true);
      
      const response = await fetch(`/api/region-chat/${city}/messages?page=0&size=20`);
      if (!response.ok) {
        throw new Error('메시지 로드 실패');
      }
      const data = await response.json();
      
      // 백엔드에서 OrderByCreatedAtDesc로 가져온 메시지를 올바른 순서로 뒤집기
      // (오래된 메시지가 위에, 최신 메시지가 아래에 오도록)
      const reversedMessages = [...data.content].reverse().map(message => ({
        ...message,
        isMine: (message.memberId || 0) === (parseInt(localStorage.getItem('memberId') || '0') || 0) // 생성 시점에 스탬핑
      }));
      
      setMessageList(reversedMessages);
      setHasMoreMessages(data.content.length === 20); // 20개 미만이면 더 이상 메시지 없음
      console.log('💬 [useChat] 초기 메시지 로드 완료:', reversedMessages.length, '개 (순서 조정됨)');
    } catch (error) {
      console.error('💬 [useChat] 메시지 로드 실패:', error);
    }
  }, [city, setMessageList]);

  // 이전 메시지 로드 (무한 스크롤)
  const loadPreviousMessages = useCallback(async () => {
    if (isLoadingPrevious || !hasMoreMessages) return;
    
    try {
      setIsLoadingPrevious(true);
      const nextPage = currentPage + 1;
      
      const response = await fetch(`/api/region-chat/${city}/messages?page=${nextPage}&size=20`);
      if (!response.ok) {
        throw new Error('이전 메시지 로드 실패');
      }
      const data = await response.json();
      
      if (data.content.length === 0) {
        setHasMoreMessages(false);
        return;
      }
      
      // 새로 로드된 메시지를 기존 메시지 앞쪽에 추가
      const newMessages = [...data.content].reverse().map(message => ({
        ...message,
        isMine: (message.memberId || 0) === (parseInt(localStorage.getItem('memberId') || '0') || 0)
      }));
      
      // 스크롤 위치 보존을 위한 콜백 함수
      setMessages(prev => {
        const updatedMessages = [...newMessages, ...prev];
        
        // 다음 렌더링 사이클에서 스크롤 위치 조정
        setTimeout(() => {
          const messagesContainer = document.querySelector('.chat-messages');
          if (messagesContainer) {
            // 새로 추가된 메시지들의 높이만큼 스크롤 위치 조정
            const newMessagesHeight = newMessages.length * 80; // 대략적인 메시지 높이
            messagesContainer.scrollTop = newMessagesHeight;
            console.log('🔄 [useChat] 스크롤 위치 보존:', newMessagesHeight, 'px만큼 조정');
          }
        }, 0);
        
        return updatedMessages;
      });
      
      setCurrentPage(nextPage);
      setHasMoreMessages(data.content.length === 20);
      
      console.log('💬 [useChat] 이전 메시지 로드 완료:', newMessages.length, '개 (페이지:', nextPage, ')');
    } catch (error) {
      console.error('💬 [useChat] 이전 메시지 로드 실패:', error);
    } finally {
      setIsLoadingPrevious(false);
    }
  }, [city, currentPage, hasMoreMessages, isLoadingPrevious]);

  // 메시지 삭제
  const deleteMessage = useCallback((messageId: number) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, isDeleted: true }
        : msg
    ));
    console.log('💬 [useChat] 메시지 삭제:', messageId);
  }, []);

  // 채팅방 초기화
  const resetChat = useCallback(() => {
    setMessages([]);
    setUserLocation(null);
    setCanChat(false);
    console.log('💬 [useChat] 채팅방 초기화');
  }, []);

  // currentCity가 변경될 때마다 채팅 권한 재확인
  useEffect(() => {
    console.log('💬 [useChat] currentCity 변경 감지:', currentCity);
    
    if (currentCity && currentCity !== '알 수 없는 도시') {
      console.log('💬 [useChat] 유효한 도시명으로 채팅 권한 확인 시작');
      checkChatPermission(currentCity);
      updateUserLocation(currentCity);
    } else if (currentCity === '알 수 없는 도시') {
      console.log('💬 [useChat] 도시명을 알 수 없어 채팅 권한 거부');
      setCanChat(false);
    }
  }, [currentCity, checkChatPermission, updateUserLocation]);

  return {
    messages,
    userLocation,
    canChat,
    addMessage,
    setMessageList,
    deleteMessage,
    resetChat,
    loadMessages,
    loadPreviousMessages,
    hasMoreMessages,
    isLoadingPrevious,
    checkChatPermission,
    updateUserLocation
  };
};
