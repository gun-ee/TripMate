import { useState, useEffect, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { ChatMessage } from '../types/regionChat';

interface UseWebSocketProps {
  region: string;
  city: string;
  isOpen: boolean;
  isLoggedIn: boolean;
  onMessageReceived?: (message: any) => void;
}

export const useWebSocket = ({ region, city, isOpen, isLoggedIn }: UseWebSocketProps) => {
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessageId, setLastMessageId] = useState<number>(0);

  // WebSocket 연결
  const connectWebSocket = useCallback(async () => {
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
        console.log('🔌 [useWebSocket] WebSocket 연결 성공');
        
        // 해당 지역 채팅방 구독
        client.subscribe(`/topic/region-chat/${region}/${city}`, (message) => {
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
  }, [region, city]);

  // WebSocket 연결 해제
  const disconnectWebSocket = useCallback(() => {
    if (stompClient) {
      stompClient.deactivate();
      setStompClient(null);
      setIsConnected(false);
      console.log('🔌 [useWebSocket] WebSocket 연결 해제');
    }
  }, [stompClient]);

  // 메시지 전송
  const sendMessage = useCallback(async (content: string) => {
    if (!stompClient || !isConnected) {
      console.error('🔌 [useWebSocket] WebSocket이 연결되지 않았습니다');
      return false;
    }

    try {
      stompClient.publish({
        destination: `/app/region-chat/${region}/${city}`,
        body: JSON.stringify({
          content,
          region,
          city,
          authorLocation: city
        })
      });
      
      console.log('🔌 [useWebSocket] 메시지 전송 성공:', content);
      return true;
    } catch (error) {
      console.error('🔌 [useWebSocket] 메시지 전송 실패:', error);
      return false;
    }
  }, [stompClient, isConnected, region, city]);

  // WebSocket 연결 관리 - 임시로 비활성화
  useEffect(() => {
    // if (!isOpen || !isLoggedIn) return;
    // connectWebSocket();
    // return () => {
    //   disconnectWebSocket();
    // };
    
    // 임시로 연결 상태를 true로 설정 (테스트용)
    setIsConnected(true);
    console.log('🔌 [useWebSocket] WebSocket 연결 임시 비활성화 - 테스트 모드');
  }, []);

  return {
    stompClient,
    isConnected,
    lastMessageId,
    sendMessage,
    connectWebSocket,
    disconnectWebSocket
  };
};
