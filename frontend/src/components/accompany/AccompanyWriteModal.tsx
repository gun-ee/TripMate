import React, { useEffect, useState } from 'react';
import { accompanyApi } from '../../api/accompany';
import axios from '../../api/axios';
import Swal from 'sweetalert2';
import './Accompany.css';

type Props = { open: boolean; onClose: () => void; onCreated: (postId: number) => void; };
type TripSummary = { id: number; title: string };

export default function AccompanyWriteModal({ open, onClose, onCreated }: Props) {
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        setLoading(true); setError('');
        // 마이페이지용 DTO 엔드포인트: GET /api/mypage/trips
        const { data } = await axios.get('/mypage/trips', { params: { size: 50 } });
        const items = Array.isArray(data) ? data : (data.items ?? []); // 페이지 응답 대응
        const list = items.map((t:any) => ({ id: t.id, title: t.title ?? `Trip #${t.id}` }));
        setTrips(list);
        if (list.length === 0) setError('등록된 여행계획이 없습니다. 먼저 여행계획을 생성하세요.');
      } catch (e:any) {
        setError('여행계획 목록을 가져오지 못했습니다.');
      } finally { setLoading(false); }
    })();
  }, [open]);

  const createPost = async () => {
    if (!selectedTripId) { 
      Swal.fire({
        icon: 'warning',
        title: '선택 필요',
        text: '여행계획을 선택하세요.',
        confirmButtonText: '확인'
      });
      return; 
    }
    if (!title.trim()) { 
      Swal.fire({
        icon: 'warning',
        title: '입력 필요',
        text: '제목을 입력하세요.',
        confirmButtonText: '확인'
      });
      return; 
    }
    if (!content.trim()) { 
      Swal.fire({
        icon: 'warning',
        title: '입력 필요',
        text: '상세내용을 입력하세요.',
        confirmButtonText: '확인'
      });
      return; 
    }
    setLoading(true);
    try {
      const id = await accompanyApi.create({ tripId: selectedTripId, title: title.trim(), content: content.trim() });
      Swal.fire({
        icon: 'success',
        title: '등록 완료',
        text: '게시글이 등록되었습니다.',
        confirmButtonText: '확인'
      });
      onCreated(id);
      onClose();
      setSelectedTripId(null); setTitle(''); setContent('');
    } catch (e:any) {
      Swal.fire({
        icon: 'error',
        title: '등록 실패',
        text: e?.response?.data?.message || '게시글 등록 실패',
        confirmButtonText: '확인'
      });
    } finally { setLoading(false); }
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>동행 게시글 작성</h3>
          <button className="modal-close" onClick={onClose} type="button">
            ✕
          </button>
        </div>
        
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>여행계획을 불러오는 중...</p>
          </div>
        )}
        
        {error && (
          <div className="error-state">
            <p>⚠️ {error}</p>
          </div>
        )}
        
        {!loading && !error && (
          <div className="modal-content">
            <div className="form-content">
              <div className="form-group">
                <label className="form-label">
                  📖 여행계획 선택
                  <span className="required">*</span>
                </label>
                <select 
                  className="form-select"
                  value={selectedTripId ?? ''} 
                  onChange={(e) => setSelectedTripId(Number(e.target.value) || null)} 
                  disabled={trips.length === 0}
                >
                  <option value="">여행계획을 선택하세요</option>
                  {trips.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
                {trips.length === 0 && (
                  <p className="form-hint">
                    먼저 여행계획을 생성해주세요.
                  </p>
                )}
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  📝 제목
                  <span className="required">*</span>
                </label>
                <input 
                  className="form-input"
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="동행 제목을 입력하세요 (예: 제주도 2박3일 동행구해요!)"
                  maxLength={200}
                />
                <div className="form-counter">
                  {title.length}/200
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  📄 상세내용
                  <span className="required">*</span>
                </label>
                <textarea 
                  className="form-textarea"
                  value={content} 
                  onChange={(e) => setContent(e.target.value)} 
                  rows={8} 
                  placeholder="동행에 대한 상세한 내용을 작성해주세요.&#10;&#10;예시:&#10;- 여행 일정: 2024년 3월 15일~17일&#10;- 인원: 2-3명&#10;- 예상 비용: 1인당 30만원&#10;- 연락처: 카카오톡 ID 공유 예정"
                />
                <div className="form-hint">
                  동행자들이 참여하기 쉽도록 구체적인 정보를 작성해주세요.
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="modal-actions">
          <button 
            className="tm-btn" 
            onClick={onClose}
            disabled={loading}
            type="button"
          >
            취소
          </button>
          <button 
            className="tm-btn tm-btn--primary" 
            onClick={createPost} 
            disabled={trips.length === 0 || loading || !selectedTripId || !title.trim() || !content.trim()}
            type="button"
          >
            {loading ? '등록 중...' : '✍️ 작성하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
