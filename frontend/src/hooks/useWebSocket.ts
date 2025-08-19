import { useState, useEffect, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface UseWebSocketProps {
  city: string;
  isOpen: boolean;
  isLoggedIn: boolean;
  onMessageReceived?: (message: unknown) => void;
}

export const useWebSocket = ({ city, isOpen, isLoggedIn }: UseWebSocketProps) => {
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // WebSocket 연결
  const connectWebSocket = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const client = new Client({
        webSocketFactory: () => new SockJS(`/ws/region-chat`),
        connectHeaders: {
          'Authorization': `Bearer ${token}`
        }
      });

      client.onConnect = () => {
        setIsConnected(true);
        console.log('🔌 [useWebSocket] WebSocket 연결 성공');
        
        // 해당 지역 채팅방 구독
        client.subscribe(`/topic/region-chat/${city}`, (message) => {
          try {
            const newMessage = JSON.parse(message.body);
            console.log('🔌 [useWebSocket] 새 메시지 수신:', newMessage);
            // 메시지 처리는 상위 컴포넌트에서 담당
          } catch (error) {
            console.error('🔌 [useWebSocket] 메시지 파싱 실패:', error);
          }
        });
      };

      client.onStompError = (frame) => {
        console.error('🔌 [useWebSocket] STOMP 에러:', frame);
        setIsConnected(false);
      };

      client.activate();
      setStompClient(client);
    } catch (error) {
      console.error('🔌 [useWebSocket] WebSocket 연결 실패:', error);
      setIsConnected(false);
    }
  }, []); // city 의존성 제거

  // WebSocket 연결 해제
  const disconnectWebSocket = useCallback(() => {
    if (stompClient) {
      stompClient.deactivate();
      setStompClient(null);
      setIsConnected(false);
      console.log('🔌 [useWebSocket] WebSocket 연결 해제');
    }
  }, []); // stompClient 의존성 제거

  // 메시지 전송
  const sendMessage = useCallback(async (content: string) => {
    if (!stompClient || !isConnected) {
      console.error('🔌 [useWebSocket] WebSocket이 연결되지 않았습니다');
      return false;
    }

    try {
      stompClient.publish({
        destination: `/app/region-chat/${city}`,
        body: JSON.stringify({
          content,
          city
        })
      });
      
      console.log('🔌 [useWebSocket] 메시지 전송 성공:', content);
      return true;
    } catch (error) {
      console.error('🔌 [useWebSocket] 메시지 전송 실패:', error);
      return false;
    }
  }, [stompClient, isConnected, city]);

  // WebSocket 연결 관리 - 모달 열 때 연결, 닫을 때 해제
  useEffect(() => {
    if (!isOpen || !isLoggedIn) return;
    
    console.log('🔌 [useWebSocket] 모달 열림 - WebSocket 연결 시작');
    connectWebSocket();
    
    return () => {
      console.log('🔌 [useWebSocket] 모달 닫힘 - WebSocket 연결 해제');
      disconnectWebSocket();
    };
  }, [isOpen, isLoggedIn]); // connectWebSocket, disconnectWebSocket 의존성 제거

  return {
    stompClient,
    isConnected,
    sendMessage,
    connectWebSocket,
    disconnectWebSocket
  };
};
