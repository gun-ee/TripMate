import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';

interface WebSocketContextType {
  isConnected: boolean;
  client: Client | null;
  sendMessage: (destination: string, body: any) => void;
  subscribe: (destination: string, callback: (message: any) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [client, setClient] = useState<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isLoggedIn } = useAuth();
  const subscribeRef = useRef<((destination: string, callback: (message: any) => void) => () => void) | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      if (client) {
        client.deactivate();
        setClient(null);
        setIsConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const stompClient = new Client({
      webSocketFactory: () => new SockJS(`/ws/chat?token=${encodeURIComponent(token)}`),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('🔌 [WebSocket] 연결 성공');
        setIsConnected(true);
      },
      onStompError: (frame) => {
        console.error('🔌 [WebSocket] STOMP 오류:', frame);
        setIsConnected(false);
      },
      onWebSocketClose: () => {
        console.log('🔌 [WebSocket] 연결 종료');
        setIsConnected(false);
      },
      onWebSocketError: (error) => {
        console.error('🔌 [WebSocket] 연결 오류:', error);
        setIsConnected(false);
      }
    });

    stompClient.activate();
    setClient(stompClient);

    return () => {
      stompClient.deactivate();
      setClient(null);
      setIsConnected(false);
    };
  }, [isLoggedIn]);

  const sendMessage = useCallback((destination: string, body: any) => {
    if (client && isConnected) {
      client.publish({
        destination,
        body: JSON.stringify(body)
      });
    }
  }, [client, isConnected]);

  // subscribe 함수를 ref로 안정화
  subscribeRef.current = useCallback((destination: string, callback: (message: any) => void) => {
    if (!client || !isConnected) {
      return () => {};
    }

    const subscription = client.subscribe(destination, (message) => {
      try {
        const data = JSON.parse(message.body);
        callback(data);
      } catch (error) {
        console.error('🔌 [WebSocket] 메시지 파싱 오류:', error);
      }
    });

    return () => subscription.unsubscribe();
  }, [client, isConnected]);

  const subscribe = subscribeRef.current;

  const value: WebSocketContextType = {
    isConnected,
    client,
    sendMessage,
    subscribe
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
