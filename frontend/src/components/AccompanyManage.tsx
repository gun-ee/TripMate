import React, { useEffect, useState } from 'react';
import { accompanyApi } from '../api/accompany';
import './accompany/Accompany.css';

type AppItem = { id:number; postId:number; applicantId:number; applicantName:string; message:string; status:string; createdAt:string };

export default function AccompanyManage() {
  const [byPost, setByPost] = useState<Record<number, AppItem[]>>({});

  const load = async () => {
    const list = await accompanyApi.listApplicationsForOwner();
    const grouped: Record<number, AppItem[]> = {};
    for (const a of list) (grouped[a.postId] ||= []).push(a);
    setByPost(grouped);
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="container">
      <h3>동행 신청 관리</h3>
      {Object.keys(byPost).length === 0 && <p>신청 내역이 없습니다.</p>}
      {Object.entries(byPost).map(([postId, list]) => (
        <div key={postId} className="card" style={{ marginBottom: 12 }}>
          <h4>게시글 #{postId}</h4>
          <ul>
            {list.map(a => (
              <li key={a.id} style={{ borderBottom:'1px solid #eee', padding:'8px 0' }}>
                <div>신청자: {a.applicantName ?? a.applicantId} • 상태: {a.status}</div>
                <div style={{ whiteSpace:'pre-wrap' }}>{a.message}</div>
                {a.status === 'PENDING' && (
                  <div style={{ display:'flex', gap:8, marginTop:6 }}>
                    <button onClick={() => accompanyApi.accept(a.id).then(load)}>수락</button>
                    <button onClick={() => accompanyApi.reject(a.id).then(load)}>거부</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
