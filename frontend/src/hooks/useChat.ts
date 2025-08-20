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

  // 기존 메시지 로드
  const loadMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/region-chat/${city}/messages?page=0&size=50`);
      if (!response.ok) {
        throw new Error('메시지 로드 실패');
      }
      const data = await response.json();
      
      // 백엔드에서 OrderByCreatedAtDesc로 가져온 메시지를 올바른 순서로 뒤집기
      // (오래된 메시지가 위에, 최신 메시지가 아래에 오도록)
      const reversedMessages = [...data.content].reverse();
      setMessageList(reversedMessages);
      console.log('💬 [useChat] 기존 메시지 로드 완료:', reversedMessages.length, '개 (순서 조정됨)');
    } catch (error) {
      console.error('💬 [useChat] 메시지 로드 실패:', error);
    }
  }, [city, setMessageList]);

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
    checkChatPermission,
    updateUserLocation
  };
};
