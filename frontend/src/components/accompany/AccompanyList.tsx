import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { accompanyApi } from '../../api/accompany';
import type { PostSummary } from '../../api/accompany';
import AccompanyWriteModal from './AccompanyWriteModal';
import Header from '../Header';
import './Accompany.css';

export default function AccompanyList() {
  const [page, setPage] = useState(0);
  const [size] = useState(12);
  const [openWrite, setOpenWrite] = useState(false);
  const [data, setData] = useState<{
    content: PostSummary[];
    totalPages: number;
    number: number;
    totalElements: number;
  }>({ content: [], totalPages: 0, number: 0, totalElements: 0 });

  // 검색/필터링 상태
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');
  const [sortBy, setSortBy] = useState<'LATEST' | 'OLDEST' | 'TITLE'>('LATEST');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const load = async (p = 0) => {
    setLoading(true);
    try {
      // 백엔드 API에 검색/필터링 파라미터 전달
      const res = await accompanyApi.list(
        p, 
        size, 
        searchKeyword.trim() || undefined, 
        statusFilter !== 'ALL' ? statusFilter : undefined, 
        sortBy
      );
      
      setData({
        content: res.content,
        totalPages: res.totalPages,
        number: res.number,
        totalElements: res.totalElements,
      });
      setPage(res.number);
    } catch (error) {
      console.error('동행 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 검색/필터 변경 시 첫 페이지로 이동하여 다시 로드
  useEffect(() => { load(0); }, [searchKeyword, statusFilter, sortBy]);
  
  // 초기 로드
  useEffect(() => { load(0); }, []);

  return (
    <>
      <Header />
      <div className="tm-container">
        <div className="tm-board">
          <div className="tm-board__header">
            <h2 className="tm-board__title">동행구하기</h2>
            <div className="tm-board__actions">
              <button 
                className="tm-btn tm-btn--primary" 
                onClick={() => setOpenWrite(true)}
              >
                ✍️ 글쓰기
              </button>
            </div>
          </div>

          {/* 검색/필터링 섹션 */}
          <div className="tm-search-filter">
            <div className="tm-search-bar">
              <div className="tm-search-input">
                <input
                  type="text"
                  placeholder="제목 또는 작성자로 검색..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="tm-input"
                />
                <button className="tm-search-btn" type="button">
                  🔍
                </button>
              </div>
            </div>
            
            <div className="tm-filter-controls">
              <div className="tm-filter-group">
                <label className="tm-filter-label">상태</label>
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'OPEN' | 'CLOSED')}
                  className="tm-select"
                >
                  <option value="ALL">전체</option>
                  <option value="OPEN">모집중</option>
                  <option value="CLOSED">마감</option>
                </select>
              </div>
              
              <div className="tm-filter-group">
                <label className="tm-filter-label">정렬</label>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as 'LATEST' | 'OLDEST' | 'TITLE')}
                  className="tm-select"
                >
                  <option value="LATEST">최신순</option>
                  <option value="OLDEST">오래된순</option>
                  <option value="TITLE">제목순</option>
                </select>
              </div>
              
              <div className="tm-filter-results">
                총 {data.totalElements}개의 동행글
              </div>
            </div>
          </div>

          <div className="tm-table-wrapper">
            <table className="tm-table">
              <colgroup>
                <col className="col-num" />
                <col className="col-title" />
                <col className="col-author" />
                <col className="col-date" />
                <col className="col-status" />
              </colgroup>
              <thead>
                <tr>
                  <th>No</th>
                  <th>제목</th>
                  <th>작성자</th>
                  <th>작성일</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="tm-table__loading">
                      <div className="tm-loading-spinner">⏳</div>
                      검색 중...
                    </td>
                  </tr>
                ) : data.content.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="tm-table__empty">
                      {searchKeyword || statusFilter !== 'ALL' ? (
                        <>
                          검색 결과가 없습니다.<br />
                          다른 검색어나 필터를 시도해보세요.
                        </>
                      ) : (
                        <>
                          아직 등록된 동행 글이 없습니다.<br />
                          첫 번째 동행 글을 작성해보세요!
                        </>
                      )}
                    </td>
                  </tr>
                ) : (
                  data.content.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="tm-table__num">{data.totalElements - (page * size) - idx}</td>
                      <td className="tm-table__title">
                        <Link to={`/accompany/${item.id}`} className="tm-link">
                          {searchKeyword ? (
                            <span dangerouslySetInnerHTML={{
                              __html: item.title.replace(
                                new RegExp(`(${searchKeyword})`, 'gi'),
                                '<mark>$1</mark>'
                              )
                            }} />
                          ) : (
                            item.title
                          )}
                        </Link>
                      </td>
                      <td className="tm-table__author">
                        {searchKeyword ? (
                          <span dangerouslySetInnerHTML={{
                            __html: (item.authorName ?? item.authorId).replace(
                              new RegExp(`(${searchKeyword})`, 'gi'),
                              '<mark>$1</mark>'
                            )
                          }} />
                        ) : (
                          item.authorName ?? item.authorId
                        )}
                      </td>
                      <td className="tm-table__date">
                        {new Date(item.createdAt).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="tm-table__status">
                        <span className={`tm-badge ${item.status === 'OPEN' ? 'is-open' : 'is-closed'}`}>
                          {item.status === 'OPEN' ? '모집중' : '마감'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {data.totalPages > 1 && (
            <div className="tm-pagination">
              <button
                className="tm-page"
                disabled={page === 0}
                onClick={() => load(page - 1)}
              >
                ← 이전
              </button>
              {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                const pageNum = Math.max(0, Math.min(data.totalPages - 1, page - 2 + i));
                return (
                  <button
                    key={pageNum}
                    className={`tm-page ${pageNum === page ? 'is-active' : ''}`}
                    onClick={() => load(pageNum)}
                    aria-current={pageNum === page ? 'page' : undefined}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
              <button
                className="tm-page"
                disabled={page === data.totalPages - 1}
                onClick={() => load(page + 1)}
              >
                다음 →
              </button>
            </div>
          )}
        </div>

        {/* 글쓰기 모달 (TripMate 모달 톤에 맞춰 분리) */}
        <AccompanyWriteModal
          open={openWrite}
          onClose={() => setOpenWrite(false)}
          onCreated={(id) => { setOpenWrite(false); navigate(`/accompany/${id}`); }}
        />
      </div>
    </>
  );
}
