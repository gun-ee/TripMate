import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { accompanyApi } from '../../api/accompany';
import type { PostSummary, PostDetail } from '../../api/accompany';
import Header from '../Header';
import Swal from 'sweetalert2';
import './Accompany.css';

export default function AccompanyEdit() {
  const { id } = useParams();
  const postId = Number(id);
  const [post, setPost] = useState<PostDetail | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const data = await accompanyApi.get(postId);
        setPost(data);
        setTitle(data.title);
        setContent(data.content);
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

  const save = async () => {
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
    
    setSaving(true);
    try { 
      await accompanyApi.update(postId, { title: title.trim(), content: content.trim() }); 
      Swal.fire({
        icon: 'success',
        title: '수정 완료',
        text: '게시글이 수정되었습니다.',
        confirmButtonText: '확인'
      });
      navigate(`/accompany/${postId}`); 
    } catch (e:any) { 
      Swal.fire({
        icon: 'error',
        title: '수정 실패',
        text: e?.response?.data?.message || '수정 실패',
        confirmButtonText: '확인'
      });
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <>
      <Header />
      <div className="tm-container">
        <div className="tm-board">
          <div className="tm-board__header">
            <h2 className="tm-board__title">동행 게시글 수정</h2>
            <div className="tm-board__actions">
              <button 
                className="tm-btn tm-btn--secondary" 
                onClick={() => navigate(`/accompany/${postId}`)}
              >
                ← 상세보기
              </button>
            </div>
          </div>

          <div className="tm-card">
            <div className="form-content">
              <div className="form-group">
                <label className="form-label">
                  📝 제목
                  <span className="required">*</span>
                </label>
                <input 
                  className="form-input"
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="동행 제목을 입력하세요"
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
                  onChange={e => setContent(e.target.value)} 
                  rows={10}
                  placeholder="동행에 대한 상세한 내용을 작성해주세요"
                />
                <div className="form-hint">
                  동행자들이 참여하기 쉽도록 구체적인 정보를 작성해주세요.
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="tm-btn" 
                onClick={() => navigate(`/accompany/${postId}`)}
                disabled={saving}
                type="button"
              >
                취소
              </button>
              <button 
                className="tm-btn tm-btn--primary" 
                onClick={save}
                disabled={saving || !title.trim() || !content.trim()}
                type="button"
              >
                {saving ? '저장 중...' : '💾 저장하기'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
