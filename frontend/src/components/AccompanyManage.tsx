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
    <>
      <Header />
      <div className="tm-container">
        <div className="tm-board">
          <div className="tm-board__header">
            <h2 className="tm-board__title">동행 신청 관리</h2>
            <div className="tm-board__actions">
              <button 
                className="tm-btn tm-btn--secondary" 
                onClick={() => window.history.back()}
              >
                ← 뒤로가기
              </button>
            </div>
          </div>

          {Object.keys(byPost).length === 0 ? (
            <div className="tm-table__empty">
              아직 신청 내역이 없습니다.<br />
              동행 글을 작성하고 신청을 받아보세요!
            </div>
          ) : (
            <div className="applications-list">
              {Object.entries(byPost).map(([postId, list]) => (
                <div key={postId} className="tm-card">
                  <h4>📋 게시글 #{postId}</h4>
                  <div className="applications-grid">
                    {list.map(a => (
                      <div key={a.id} className="application-item">
                        <div className="application-header">
                          <div className="applicant-info">
                            <span className="applicant-name">👤 {a.applicantName ?? a.applicantId}</span>
                            <span className={`status-badge status-${a.status.toLowerCase()}`}>
                              {a.status === 'PENDING' ? '대기중' : 
                               a.status === 'ACCEPTED' ? '수락됨' : '거부됨'}
                            </span>
                          </div>
                          <div className="application-date">
                            {new Date(a.createdAt).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        <div className="application-message">
                          {a.message}
                        </div>
                        {a.status === 'PENDING' && (
                          <div className="application-actions">
                            <button 
                              className="tm-btn tm-btn--primary"
                              onClick={() => accompanyApi.accept(a.id).then(load)}
                            >
                              ✅ 수락
                            </button>
                            <button 
                              className="tm-btn"
                              onClick={() => accompanyApi.reject(a.id).then(load)}
                              style={{ color: '#dc2626', borderColor: '#dc2626' }}
                            >
                              ❌ 거부
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
