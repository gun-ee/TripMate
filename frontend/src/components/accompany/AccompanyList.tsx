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

  const navigate = useNavigate();

  const load = async (p = 0) => {
    const res = await accompanyApi.list(p, size);
    setData({
      content: res.content,
      totalPages: res.totalPages,
      number: res.number,
      totalElements: res.totalElements,
    });
    setPage(res.number);
  };

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
                {data.content.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="tm-table__empty">
                      아직 등록된 동행 글이 없습니다.<br />
                      첫 번째 동행 글을 작성해보세요!
                    </td>
                  </tr>
                ) : (
                  data.content.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="tm-table__num">{data.totalElements - (page * size) - idx}</td>
                      <td className="tm-table__title">
                        <Link to={`/accompany/${item.id}`} className="tm-link">{item.title}</Link>
                      </td>
                      <td className="tm-table__author">{item.authorName ?? item.authorId}</td>
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
