import React, { useEffect, useState } from 'react';
import { accompanyApi } from '../../api/accompany';
import axios from '../../api/axios';
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
    if (!selectedTripId) { alert('여행계획을 선택하세요.'); return; }
    if (!title.trim()) { alert('제목을 입력하세요.'); return; }
    if (!content.trim()) { alert('상세내용을 입력하세요.'); return; }
    setLoading(true);
    try {
      const id = await accompanyApi.create({ tripId: selectedTripId, title: title.trim(), content: content.trim() });
      onCreated(id);
      onClose();
      setSelectedTripId(null); setTitle(''); setContent('');
    } catch (e:any) {
      alert(e?.response?.data?.message || '게시글 등록 실패');
    } finally { setLoading(false); }
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>동행 게시글 작성</h3>
        {loading && <p>로딩중…</p>}
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
        <div>
          <label>여행계획 선택</label>
          <select value={selectedTripId ?? ''} onChange={(e) => setSelectedTripId(Number(e.target.value) || null)} disabled={trips.length === 0}>
            <option value="">선택하세요</option>
            {trips.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
        <div>
          <label>제목</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목을 입력하세요" />
        </div>
        <div>
          <label>상세내용</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} placeholder="상세내용을 입력하세요" />
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose}>취소</button>
          <button onClick={createPost} disabled={trips.length === 0}>등록</button>
        </div>
      </div>
    </div>
  );
}
