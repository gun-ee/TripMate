import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { accompanyApi } from '../../api/accompany';
import type { PostSummary, PostDetail } from '../../api/accompany';
import Header from '../Header';
import axios from '../../api/axios';
import Swal from 'sweetalert2';
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
  const [trip, setTrip] = useState<any>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 현재 사용자 정보 가져오기
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data } = await axios.get('/members/me');
        setCurrentUserId(data.id);
      } catch (error) {
        console.error('현재 사용자 정보 가져오기 실패:', error);
        setCurrentUserId(null);
      }
    };
    
    fetchCurrentUser();
  }, []);

  // 게시글 정보 가져오기
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const postData = await accompanyApi.get(postId);
        setPost(postData);
        
        // 여행계획 정보도 함께 가져오기
        try {
          const tripData = await accompanyApi.getTrip(postData.tripId);
          setTrip(tripData);
        } catch (tripError) {
          console.error('여행계획 로드 실패:', tripError);
          // 여행계획 로드 실패해도 게시글은 표시
        }
      } catch (error) {
        console.error('게시글 로드 실패:', error);
        Swal.fire({
          icon: 'error',
          title: '로드 실패',
          text: '게시글을 불러올 수 없습니다.',
          confirmButtonText: '확인'
        });
        navigate('/accompany');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPost();
  }, [postId, navigate]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="tm-container">
          <div className="tm-board">
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>게시글을 불러오는 중...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <Header />
        <div className="tm-container">
          <div className="tm-board">
            <div className="error-state">
              <p>게시글을 찾을 수 없습니다.</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  const doApply = async (msg:string) => {
    if (!msg.trim()) { 
      Swal.fire({
        icon: 'warning',
        title: '입력 필요',
        text: '신청 내용을 입력하세요.',
        confirmButtonText: '확인'
      });
      return; 
    }
    try { 
      await accompanyApi.apply(postId, msg.trim()); 
      Swal.fire({
        icon: 'success',
        title: '신청 완료',
        text: '참여 신청이 전송되었습니다.',
        confirmButtonText: '확인'
      });
      setApplyOpen(false); 
    }
    catch (e:any) { 
      Swal.fire({
        icon: 'error',
        title: '신청 실패',
        text: e?.response?.data?.message || '신청 실패',
        confirmButtonText: '확인'
      });
    }
  };

  const doDelete = async () => {
    const result = await Swal.fire({
      title: '삭제 확인',
      text: '삭제하시겠습니까?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: '삭제',
      cancelButtonText: '취소'
    });
    
    if (result.isConfirmed) {
      try { 
        await accompanyApi.remove(postId); 
        Swal.fire({
          icon: 'success',
          title: '삭제 완료',
          text: '게시글이 삭제되었습니다.',
          confirmButtonText: '확인'
        });
        navigate('/accompany'); 
      }
      catch (e:any) { 
        Swal.fire({
          icon: 'error',
          title: '삭제 실패',
          text: e?.response?.data?.message || '삭제 실패',
          confirmButtonText: '확인'
        });
      }
    }
  };

  const doClose = async () => {
    const result = await Swal.fire({
      title: '모집 마감',
      text: '모집을 마감하시겠습니까?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#3085d6',
      confirmButtonText: '마감',
      cancelButtonText: '취소'
    });
    
    if (result.isConfirmed) {
      try { 
        await accompanyApi.close(postId); 
        Swal.fire({
          icon: 'success',
          title: '마감 완료',
          text: '모집이 마감되었습니다.',
          confirmButtonText: '확인'
        });
        setPost(await accompanyApi.get(postId)); 
      }
      catch (e:any) { 
        Swal.fire({
          icon: 'error',
          title: '마감 실패',
          text: e?.response?.data?.message || '마감 실패',
          confirmButtonText: '확인'
        });
      }
    }
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
            {/* 제목을 위로 따로 빼기 */}
            <h1 className="post-title">{post.title}</h1>
            
            <div className="post-header-content">
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
              </div>
              
              {/* 상세 내용 카드 */}
              <div className="post-content-card">
                <h3>📝 상세 내용</h3>
                <div className="content-text">
                  {post.content.split('\n').map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
              </div>
            </div>

            {/* 여행계획 섹션 */}
            {trip && (
              <div className="trip-section">
                <h3>🗺️ 첨부된 여행계획</h3>
                <div className="trip-card">
                  <div className="trip-header">
                    <h4 className="trip-title">{trip.title}</h4>
                    <div className="trip-meta">
                      <span className="trip-location">📍 {trip.city}</span>
                      <span className="trip-dates">
                        {new Date(trip.startDate).toLocaleDateString('ko-KR')} ~ {new Date(trip.endDate).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="trip-days">
                    {trip.days && trip.days.map((day: any, dayIndex: number) => (
                      <div key={day.id} className="trip-day">
                        <div className="day-header">
                          <span className="day-number">일정 (Day {day.dayIndex})</span>
                        </div>
                        <div className="timeline">
                          {(() => {
                            // TripResultPage와 동일한 시간 계산 로직
                            const start = (day.startTime as unknown as string)?.slice(0,5) || '09:00';
                            const end = (day.endTime as unknown as string)?.slice(0,5) || '18:00';
                            const toMinutes = (s: string) => { const [h,m]=s.split(':').map(x=>parseInt(x,10)); return h*60+(m||0); };
                            const toHHMM = (m: number) => { const h=Math.floor(m/60), mm=m%60; return `${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}`; };
                            
                            const legs = day.legs ?? [];
                            const legMap = new Map<string, number>();
                            legs.forEach((l: any) => { 
                              if (l.fromItemId && l.toItemId) 
                                legMap.set(`${l.fromItemId}->${l.toItemId}`, Math.max(0, Math.round((l.durationSec||0)/60))); 
                            });
                            
                            let currentTime = toMinutes(start);
                            const endMin = toMinutes(end);
                            
                            return day.items.map((item: any, itemIndex: number) => {
                              // 이동시간 계산
                              let travelTime = 0;
                              if (itemIndex > 0) {
                                const prev = day.items[itemIndex-1];
                                travelTime = legMap.get(`${prev.id}->${item.id}`) ?? 0;
                                currentTime += travelTime;
                              }
                              
                              // 도착시간
                              const arriveTime = currentTime;
                              const stay = Math.max(0, item.stayMin ?? 60);
                              let departTime = arriveTime + stay;
                              if (departTime > endMin) departTime = endMin;
                              
                              // 다음 장소를 위해 출발시간으로 업데이트
                              currentTime = departTime;
                              
                              return (
                                <div key={item.id} className="timeline-item">
                                  <div className="timeline-marker">
                                    <div className="timeline-number">{itemIndex + 1}</div>
                                  </div>
                                  <div className="timeline-content">
                                    <div className="timeline-time">
                                      <span className="arrival-time">{toHHMM(arriveTime)}</span>
                                      <span className="departure-time">{toHHMM(departTime)}</span>
                                    </div>
                                    <div className="timeline-card">
                                      <div className="card-title">{item.nameSnapshot}</div>
                                      <div className="card-details">
                                        {travelTime > 0 && (
                                          <div className="travel-info">
                                            <span className="travel-icon">🚗</span>
                                            <span className="travel-text">이동 {travelTime}분</span>
                                          </div>
                                        )}
                                        {item.stayMin && (
                                          <div className="stay-info">
                                            체류 {item.stayMin}분
                                          </div>
                                        )}
                                      </div>
                                      <div className="card-times">
                                        도착 {toHHMM(arriveTime)} • 출발 {toHHMM(departTime)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="trip-actions">
                    <button 
                      className="tm-btn tm-btn--secondary"
                      onClick={() => navigate(`/trip/result?id=${trip.id}`)}
                    >
                      📋 여행계획 상세보기
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="post-actions">
            {/* 참여 신청 버튼 - 작성자가 아니고 모집중일 때만 표시 */}
            {post.status === 'OPEN' && currentUserId !== post.authorId && (
              <button 
                className="tm-btn tm-btn--primary" 
                onClick={() => setApplyOpen(true)}
              >
                ✉️ 참여 신청
              </button>
            )}
            
            {/* 작성자 전용 버튼들 */}
            {currentUserId === post.authorId && (
              <>
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
              </>
            )}
          </div>
      </div>
      </div>
      <ApplyModal open={applyOpen} onClose={()=>setApplyOpen(false)} onSubmit={doApply} />
    </>
  );
}
