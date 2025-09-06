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
        <textarea 
          rows={6} 
          value={message} 
          onChange={e=>setMessage(e.target.value)} 
          placeholder="간단한 소개 및 참여 의사를 적어주세요.&#10;예: 안녕하세요! 같은 관심사를 가진 분들과 함께 여행하고 싶습니다."
        />
        <div className="modal-actions">
          <button className="tm-btn" onClick={onClose}>취소</button>
          <button className="tm-btn tm-btn--primary" onClick={()=>onSubmit(message)}>
            ✉️ 신청하기
          </button>
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
    <>
      <Header />
      <div className="tm-container">
        <div className="tm-board">
          <div className="tm-board__header">
            <h2 className="tm-board__title">동행 상세</h2>
            <div className="tm-board__actions">
              <button 
                className="tm-btn tm-btn--secondary" 
                onClick={() => navigate('/accompany')}
              >
                ← 목록으로
              </button>
            </div>
          </div>

          <div className="tm-card">
            <div className="post-header">
              <h1 className="post-title">{post.title}</h1>
              <div className="post-meta">
                <div className="meta-item">
                  <span className="meta-label">👤 작성자</span>
                  <span className="meta-value">{post.authorName ?? post.authorId}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">📅 작성일</span>
                  <span className="meta-value">
                    {new Date(post.createdAt).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">📋 상태</span>
                  <span className={`tm-badge ${post.status === 'OPEN' ? 'is-open' : 'is-closed'}`}>
                    {post.status === 'OPEN' ? '모집중' : '마감'}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">🗺️ 여행 ID</span>
                  <span className="meta-value">#{post.tripId}</span>
                </div>
              </div>
            </div>

            <div className="post-content">
              <h3>📝 상세 내용</h3>
              <div className="content-text">
                {post.content.split('\n').map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
            </div>

            <div className="post-actions">
              {post.status === 'OPEN' && (
                <button 
                  className="tm-btn tm-btn--primary" 
                  onClick={() => setApplyOpen(true)}
                >
                  ✉️ 참여 신청
                </button>
              )}
              <button 
                className="tm-btn tm-btn--secondary" 
                onClick={() => navigate(`/accompany/${postId}/edit`)}
              >
                ✏️ 수정
              </button>
              <button 
                className="tm-btn" 
                onClick={doDelete}
                style={{ color: '#dc2626', borderColor: '#dc2626' }}
              >
                🗑️ 삭제
              </button>
              {post.status === 'OPEN' && (
                <button 
                  className="tm-btn" 
                  onClick={doClose}
                  style={{ color: '#ea580c', borderColor: '#ea580c' }}
                >
                  🔒 모집 마감
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <ApplyModal open={applyOpen} onClose={()=>setApplyOpen(false)} onSubmit={doApply} />
    </>
  );
}
