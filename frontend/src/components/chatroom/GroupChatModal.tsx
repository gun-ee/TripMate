import React, { useEffect, useState, useRef } from 'react';
import { chatApi } from '../../api/chatApi';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { Client } from '@stomp/stompjs';
import type { IMessage, StompSubscription } from '@stomp/stompjs';
import './GroupChatModal.css';

interface Props { roomId: number | null; open: boolean; onClose: () => void; onLeft?: ()=>void; }

interface MessageView {
  id: number;
  roomId: number;
  senderId: number;
  content: string;
  sentAt: string;
  senderNickname: string;
  senderProfileImg: string;
}

interface RoomDetail {
  id: number;
  name: string;
  memberCount: number;
}
    export default function GroupChatModal({ roomId, open, onClose, onLeft }: Props) {
      const [messages, setMessages] = useState<MessageView[]>([]);
      const [input, setInput] = useState('');
      const [isLoadingMessages, setIsLoadingMessages] = useState(false);
      const [roomDetail, setRoomDetail] = useState<RoomDetail | null>(null);
      const { isConnected, sendMessage, client } = useWebSocket();
      
      const clientRef = useRef<Client | null>(null);
      const subRef = useRef<StompSubscription | null>(null);
      const seenIdsRef = useRef<Set<number>>(new Set());
      
      // 채팅방 정보 로드 함수
      const loadRoomDetail = async () => {
        if (!roomId) return;
        
        try {
          console.log('📥 [GroupChatModal] 채팅방 정보 로드 시작 - roomId:', roomId);
          const roomInfo = await chatApi.getRoomDetail(roomId);
          console.log('📥 [GroupChatModal] 채팅방 정보 로드 완료:', roomInfo);
          setRoomDetail(roomInfo);
        } catch (error) {
          console.error('❌ [GroupChatModal] 채팅방 정보 로드 실패:', error);
        }
      };

      // 기존 메시지 로드 함수
      const loadMessages = async () => {
        if (!roomId) return;
        
        try {
          setIsLoadingMessages(true);
          console.log('📥 [GroupChatModal] 기존 메시지 로드 시작 - roomId:', roomId);
          const loadedMessages = await chatApi.getMessages(roomId);
          console.log('📥 [GroupChatModal] 기존 메시지 로드 완료:', loadedMessages.length, '개');
          setMessages(loadedMessages);
        } catch (error) {
          console.error('❌ [GroupChatModal] 기존 메시지 로드 실패:', error);
        } finally {
          setIsLoadingMessages(false);
        }
      };
      
      // 구독 함수
      const subscribeRoom = (c: Client, id: number) => {
        try { subRef.current?.unsubscribe(); } catch {}
        const subId = `room-${id}`;
        subRef.current = c.subscribe(`/topic/chat/${id}`, (msg: IMessage) => {
          const data = JSON.parse(msg.body);
          if (typeof data?.id === 'number') {
            if (seenIdsRef.current.has(data.id)) return; // 중복제거
            seenIdsRef.current.add(data.id);
          }
          console.log('📥 [GroupChatModal] 메시지 수신:', data);
          setMessages(prev => [...prev, data]);
        }, { id: subId });
      };
      
      // 채팅방 열릴 때 채팅방 정보와 기존 메시지 로드
      useEffect(() => {
        if (open && roomId) {
          loadRoomDetail();
          loadMessages();
        } else {
          setMessages([]);
          setRoomDetail(null);
          seenIdsRef.current.clear();
        }
      }, [open, roomId]);

      // WebSocket 구독
      useEffect(() => {
        if (!open || !roomId || !isConnected || !client) {
          return;
        }
        
        console.log('🔌 [GroupChatModal] WebSocket 구독 시작 - roomId:', roomId);
        clientRef.current = client;
        subscribeRoom(client, roomId);
        
        return () => {
          console.log('🔌 [GroupChatModal] WebSocket 구독 해제 - roomId:', roomId);
          try { subRef.current?.unsubscribe(); } catch {}
          subRef.current = null;
        };
      }, [open, roomId, isConnected, client]);
      const send = () => {
        if (!isConnected || !roomId || !input.trim()) return;
        
        const message = {
          roomId: roomId,
          content: input.trim()
        };
        
        console.log('📤 [GroupChatModal] 메시지 전송:', message);
        sendMessage(`/app/chat/${roomId}`, message);
        setInput('');
      };
      const leave = async () => {
        if (!roomId) return;
        const r = await chatApi.leaveRoom(roomId);
        if (r.roomDeleted) {
          // 방이 삭제되었으면 알림 정도만
        }
        onClose();
        onLeft && onLeft();
      };
      if (!open) return null;
      return (
        <div className="group-chat-modal-overlay" onClick={onClose}>
          <div className="group-chat-modal" onClick={(e) => e.stopPropagation()}>
            {/* 모달 헤더 */}
            <div className="group-chat-modal-header">
              <div className="header-left">
                <button className="back-button" onClick={onClose}>
                  ←
                </button>
                <div className="chat-room-info">
                  <h2 className="chat-room-title">
                    {roomDetail ? `${roomDetail.name}단체채팅` : '여행 단체채팅방'}
                  </h2>
                  <div className="member-count">
                    <span>👥</span>
                    <span>{roomDetail ? `${roomDetail.memberCount}명` : '단체 채팅방'}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={leave} className="px-3 py-1 rounded bg-rose-500 text-white text-sm">방 나가기</button>
              </div>
            </div>

            {/* 메시지 목록 */}
            <div className="group-chat-messages">
              {isLoadingMessages ? (
                <div className="no-messages">
                  <p>메시지를 불러오는 중...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="no-messages">
                  <p>아직 메시지가 없습니다.</p>
                  <p>첫 번째 메시지를 보내보세요!</p>
                </div>
              ) : (
                messages.map((m, i) => {
                  const isMyMessage = m.senderId === parseInt(localStorage.getItem('memberId') || '0');
                  const messageTime = new Date(m.sentAt).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  
                  return (
                    <div key={m.id ?? `${m.sentAt}-${i}`} className={`message-item ${isMyMessage ? 'my-message' : 'other-message'}`}>
                      {!isMyMessage && (
                        <div className="message-profile">
                          <img 
                            src={m.senderProfileImg || '/images/default-profile.png'} 
                            alt={m.senderNickname}
                            className="chat-profile-image"
                            onError={(e) => {
                              e.currentTarget.src = '/images/default-profile.png';
                            }}
                          />
                        </div>
                      )}
                      <div className="message-content">
                        {!isMyMessage && (
                          <div className="message-header">
                            <span className="message-author">{m.senderNickname}</span>
                          </div>
                        )}
                        <div className="message-bubble">
                          {m.content}
                        </div>
                        <div className="message-time">
                          {messageTime}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 메시지 입력 */}
            <div className="group-chat-input-form">
              <div className="group-chat-input-container">
                <input 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  className="group-chat-input" 
                  placeholder="메시지를 입력하세요..." 
                  onKeyPress={(e) => e.key === 'Enter' && send()}
                />
                <button onClick={send} className="group-send-button" disabled={!input.trim()}>
                  전송
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    