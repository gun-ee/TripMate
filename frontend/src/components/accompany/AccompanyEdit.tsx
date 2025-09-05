import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { accompanyApi } from '../../api/accompany';
import type { PostSummary } from '../../api/accompany';
import './Accompany.css';

export default function AccompanyEdit() {
  const { id } = useParams();
  const postId = Number(id);
  const [post, setPost] = useState<PostDetail | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const data = await accompanyApi.get(postId);
      setPost(data); setTitle(data.title); setContent(data.content);
    })();
  }, [postId]);

  const save = async () => {
    if (!title.trim()) { alert('제목을 입력하세요.'); return; }
    if (!content.trim()) { alert('상세내용을 입력하세요.'); return; }
    try { await accompanyApi.update(postId, { title: title.trim(), content: content.trim() }); navigate(`/accompany/${postId}`); }
    catch (e:any) { alert(e?.response?.data?.message || '수정 실패'); }
  };

  if (!post) return <div className="container">로딩중…</div>;

  return (
    <div className="container">
      <h2>게시글 수정</h2>
      <div><label>제목</label><input value={title} onChange={e=>setTitle(e.target.value)} /></div>
      <div><label>상세내용</label><textarea value={content} onChange={e=>setContent(e.target.value)} rows={10} /></div>
      <div style={{ display:'flex', gap:8, marginTop:12 }}>
        <button onClick={() => navigate(-1)}>취소</button>
        <button onClick={save}>저장</button>
      </div>
    </div>
  );
}
