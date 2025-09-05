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
            <button className="tm-btn tm-btn--primary" onClick={() => setOpenWrite(true)}>글쓰기</button>
          </div>
        </div>

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
            {data.content.length === 0 && (
              <tr>
                <td colSpan={5} className="tm-table__empty">등록된 글이 없습니다.</td>
              </tr>
            )}
            {data.content.map((item, idx) => (
              <tr key={item.id}>
                <td className="tm-table__num">{data.totalElements - (page * size) - idx}</td>
                <td className="tm-table__title">
                  <Link to={`/accompany/${item.id}`} className="tm-link">{item.title}</Link>
                </td>
                <td className="tm-table__author">{item.authorName ?? item.authorId}</td>
                <td className="tm-table__date">{new Date(item.createdAt).toLocaleDateString()}</td>
                <td className="tm-table__status">
                  <span className={`tm-badge ${item.status === 'OPEN' ? 'is-open' : 'is-closed'}`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="tm-pagination">
          {Array.from({ length: data.totalPages }).map((_, i) => (
            <button
              key={i}
              className={`tm-page ${i === page ? 'is-active' : ''}`}
              onClick={() => load(i)}
              aria-current={i === page ? 'page' : undefined}
            >
              {i + 1}
            </button>
          ))}
        </div>
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
