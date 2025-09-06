    import React, { useEffect, useState, useRef } from 'react';
    import { chatApi } from '../../api/chatApi';
    import { useWebSocket } from '../../contexts/WebSocketContext';
    import { Client } from '@stomp/stompjs';
    import type { IMessage, StompSubscription } from '@stomp/stompjs';
    interface Props { roomId: number | null; open: boolean; onClose: () => void; onLeft?: ()=>void; }
    interface MessageView { id:number; roomId:number; senderId:number; content:string; sentAt:string; }
    export default function GroupChatModal({ roomId, open, onClose, onLeft }: Props) {
      const [messages, setMessages] = useState<MessageView[]>([]);
      const [input, setInput] = useState('');
      const { isConnected, sendMessage, client } = useWebSocket();
      
      const clientRef = useRef<Client | null>(null);
      const subRef = useRef<StompSubscription | null>(null);
      const seenIdsRef = useRef<Set<number>>(new Set());
      
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
      
      // WebSocket 구독
      useEffect(() => {
        if (!open || !roomId || !isConnected || !client) {
          setMessages([]);
          seenIdsRef.current.clear();
          return;
        }
        
        console.log('🔌 [GroupChatModal] WebSocket 구독 시작 - roomId:', roomId);
        clientRef.current = client;
        subscribeRoom(client, roomId);
        
        return () => {
          console.log('🔌 [GroupChatModal] WebSocket 구독 해제 - roomId:', roomId);
          try { subRef.current?.unsubscribe(); } catch {}
          subRef.current = null;
          setMessages([]);
          seenIdsRef.current.clear();
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
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="p-3 border-b flex items-center justify-between">
              <b>여행 단체채팅방</b>
              <div className="flex gap-2">
                <button onClick={leave} className="px-2 py-1 rounded bg-rose-500 text-white">방 나가기</button>
                <button onClick={onClose} className="px-2 py-1 rounded bg-gray-200">닫기</button>
              </div>
            </div>
            <div className="p-3 flex-1 overflow-auto space-y-2">
              {messages.map((m, i) => (
                <div key={m.id ?? `${m.sentAt}-${i}`} className="bg-gray-100 rounded px-3 py-2">{m.content}</div>
              ))}
            </div>
            <div className="p-3 border-t flex gap-2">
              <input value={input} onChange={e=>setInput(e.target.value)} className="flex-1 border rounded px-2" placeholder="메시지를 입력..." />
              <button onClick={send} className="px-3 py-1 rounded bg-black text-white">전송</button>
            </div>
          </div>
        </div>
      );
    }
    