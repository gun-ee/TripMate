    import React, { useEffect, useState } from 'react';
    import { chatApi } from '../../api/chatApi';
    import type { RoomSummary } from '../../api/chatApi';
    import GroupChatModal from './GroupChatModal';
    export default function ChatRoomsPage() {
      const [rooms, setRooms] = useState<RoomSummary[]>([]);
      const [currentId, setCurrentId] = useState<number|null>(null);
      const [modalOpen, setModalOpen] = useState(false);
      useEffect(()=>{ chatApi.myRooms().then(setRooms); },[]);
      const openRoom = (id:number) => { setCurrentId(id); setModalOpen(true); };
      return (
        <div className="max-w-4xl mx-auto p-4">
          <h1 className="text-xl font-bold mb-3">내 채팅방</h1>
          <ul className="divide-y border rounded">
            {rooms.map(r => (
              <li key={r.id} className="p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-gray-500">{r.memberCount}명 · {r.lastMessage || '...'}</div>
                </div>
                <button onClick={()=>openRoom(r.id)} className="px-2 py-1 rounded bg-black text-white">열기</button>
              </li>
            ))}
            {rooms.length===0 && <li className="p-3 text-gray-500">참여 중인 채팅방이 없습니다.</li>}
          </ul>
          <GroupChatModal open={modalOpen} roomId={currentId} onClose={()=>setModalOpen(false)} onLeft={()=>{ setModalOpen(false); chatApi.myRooms().then(setRooms); }} />
        </div>
      );
    }
    