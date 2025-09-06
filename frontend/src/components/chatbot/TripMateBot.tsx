    import React, { useState } from 'react';
    import axiosInstance from '../../api/axios';
    interface Item { role:'user'|'assistant'; content:string; }
    export default function TripMateBot() {
      const [list, setList] = useState<Item[]>([]);
      const [q, setQ] = useState('');
      const ask = async () => {
        if (!q.trim()) return;
        const userMsg: Item = { role: 'user', content: q.trim() };
        setList((arr) => [...arr, userMsg]); setQ('');
        try {
          const res = await axiosInstance.post('/chatbot/query', { prompt: userMsg.content });
          const a: Item = { role: 'assistant', content: res.data?.answer || '...' };
          setList((arr) => [...arr, a]);
        } catch { setList((arr) => [...arr, { role: 'assistant', content: '응답 실패' }]); }
      };
      return (
        <div className="max-w-3xl mx-auto border rounded p-3 space-y-3">
          <div className="font-bold">TripMate 챗봇(데모)</div>
          <div className="space-y-2 max-h-[60vh] overflow-auto">
            {list.map((m, i) => (
              <div key={i} className={m.role==='user' ? 'text-right' : ''}>
                <div className={`inline-block px-3 py-2 rounded ${m.role==='user'?'bg-black text-white':'bg-gray-100'}`}>{m.content}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={q} onChange={e=>setQ(e.target.value)} className="flex-1 border rounded px-2" placeholder="여행 질문을 입력..." />
            <button onClick={ask} className="px-3 py-1 rounded bg-black text-white">질문</button>
          </div>
        </div>
      );
    }
    