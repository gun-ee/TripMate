import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { accompanyApi } from '../../api/accompany';
import type { PostSummary } from '../../api/accompany';
import './Accompany.css';

function ApplyModal({ open, onClose, onSubmit }:{ open:boolean; onClose:()=>void; onSubmit:(msg:string)=>void }) {
  const [message, setMessage] = useState('');
  if (!open) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>참여 신청</h3>
        <textarea rows={6} value={message} onChange={e=>setMessage(e.target.value)} placeholder="간단한 소개 및 참여 의사를 적어주세요."/>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose}>취소</button>
          <button onClick={()=>onSubmit(message)}>신청</button>
        </div>
      </div>
    </div>
  );
}

export default function AccompanyDetail() {
  const { id } = useParams();
  const postId = Number(id);
  const [post, setPost] = useState<PostDetail | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => { setPost(await accompanyApi.get(postId)); })();
  }, [postId]);

  if (!post) return <div className="container">로딩중…</div>;

  const doApply = async (msg:string) => {
    if (!msg.trim()) { alert('신청 내용을 입력하세요.'); return; }
    try { await accompanyApi.apply(postId, msg.trim()); alert('참여 신청이 전송되었습니다.'); setApplyOpen(false); }
    catch (e:any) { alert(e?.response?.data?.message || '신청 실패'); }
  };

  const doDelete = async () => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    try { await accompanyApi.remove(postId); navigate('/accompany'); }
    catch (e:any) { alert(e?.response?.data?.message || '삭제 실패'); }
  };

  const doClose = async () => {
    if (!window.confirm('모집을 마감하시겠습니까?')) return;
    try { await accompanyApi.close(postId); setPost(await accompanyApi.get(postId)); }
    catch (e:any) { alert(e?.response?.data?.message || '마감 실패'); }
  };

  return (
    <div className="container">
      <h2>{post.title}</h2>
      <div className="meta">
        <span>작성자: {post.authorName ?? post.authorId}</span> • <span>상태: {post.status}</span> • <span>Trip ID: {post.tripId}</span>
      </div>
      <hr/>
      <section>
        <h4>등록된 여행 내용</h4>
        <p>Trip #{post.tripId} 요약을 이 영역에 렌더링하세요. (기존 Trip 상세 API 붙이면 됨)</p>
      </section>
      <section>
        <h4>상세내용</h4>
        <pre style={{ whiteSpace:'pre-wrap' }}>{post.content}</pre>
      </section>
      <div style={{ display:'flex', gap:8, marginTop:12 }}>
        {post.status === 'OPEN' && <button onClick={() => setApplyOpen(true)}>참여 신청</button>}
        <button onClick={() => navigate(`/accompany/${postId}/edit`)}>수정</button>
        <button onClick={doDelete}>삭제</button>
        {post.status === 'OPEN' && <button onClick={doClose}>모집 마감</button>}
      </div>
      <ApplyModal open={applyOpen} onClose={()=>setApplyOpen(false)} onSubmit={doApply} />
    </div>
  );
}
