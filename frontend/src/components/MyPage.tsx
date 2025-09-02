import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mypageApi } from '../api/mypage';
import { followApi } from '../api/follow';
import type { MyProfileResponse, MyTripCard } from '../api/mypage';
import Header from './Header';
import FollowModal from './FollowModal';
import './MyPage.css';

const MyPage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<MyProfileResponse | null>(null);
  const [trips, setTrips] = useState<MyTripCard[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [followCounts, setFollowCounts] = useState<{ followerCount: number; followingCount: number }>({ followerCount: 0, followingCount: 0 });
  
  // 모달 상태
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'followers' | 'following';
    title: string;
  }>({
    isOpen: false,
    type: 'followers',
    title: ''
  });

  // 프로필 초기 로드
  useEffect(() => {
    (async () => {
      const profileData = await mypageApi.profile();
      setProfile(profileData);
      
      // 팔로우 카운트 로드
      try {
        const counts = await followApi.getFollowCounts(profileData.memberId);
        setFollowCounts(counts);
      } catch (error) {
        console.error('팔로우 카운트 로드 실패:', error);
      }
    })();
  }, []);

  // 목록 로드
  const loadMore = useCallback(async (isInitial = false) => {
    if (loading || (!isInitial && !hasMore)) return;
    setLoading(true);
    try {
      const page = await mypageApi.myTrips(cursor ?? undefined, 12);
      if (isInitial) {
        setTrips(page.items ?? []);
      } else {
        setTrips(prev => {
          const existingIds = new Set(prev.map(t => t.id));
          const newItems = (page.items ?? []).filter(item => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
      }
      setCursor(page.nextCursorId);
      setHasMore(page.nextCursorId != null);
    } finally {
      setLoading(false);
    }
  }, [cursor, loading, hasMore]);

  // 첫 페이지 로드
  useEffect(() => { 
    loadMore(true); 
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 무한스크롤
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && loadMore(false), { rootMargin: '800px 0px' });
    io.observe(node);
    return () => io.disconnect();
  }, [loadMore]);

  // 여행 카드 클릭 핸들러 - result 페이지로 이동
  const handleTripClick = (tripId: number) => {
    navigate(`/trip/result?id=${tripId}`);
  };

  // 모달 열기 함수들
  const openFollowersModal = () => {
    setModalState({
      isOpen: true,
      type: 'followers',
      title: '팔로워'
    });
  };

  const openFollowingModal = () => {
    setModalState({
      isOpen: true,
      type: 'following',
      title: '팔로잉'
    });
  };

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="mypage-wrapper">
      <Header />
      
      <div className="content-grid">
        {/* 좌측 프로필 카드 */}
        <aside className="profile-card">
          <div className="avatar">
            {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="avatar" /> : <div className="avatar-fallback" />}
          </div>
          <div className="profile-name">{profile?.displayName ?? '사용자'}</div>
          <div className="profile-username">@{profile?.username ?? 'user'}</div>

          <div className="follow-stats">
            <div className="follow-stat-item" onClick={openFollowersModal}>
              <b>{followCounts.followerCount}</b><span>팔로워</span>
            </div>
            <div className="follow-stat-item" onClick={openFollowingModal}>
              <b>{followCounts.followingCount}</b><span>팔로잉</span>
            </div>
          </div>

          <div className="profile-actions">
            <button className="btn-outline">수정</button>
            <button className="btn-solid">공유</button>
          </div>

          <div className="profile-meta">
            <div>여행 <b>{profile?.tripCount ?? 0}</b>회</div>
            <div>방문지 <b>{profile?.totalPlaceCount ?? 0}</b>곳</div>
            <div>다가오는 여행 <b>{profile?.upcomingTripCount ?? 0}</b></div>
          </div>
        </aside>

        {/* 우측 여행 카드 리스트 */}
        <main className="trip-listing">
          <div className="tab-bar">
            <button className="tab active">여행 계획</button>
          </div>

          <div className="trip-grid">
            {trips.map((t, index) => <TripCardView key={`${t.id}-${index}`} trip={t} onClick={() => handleTripClick(t.id)} />)}
          </div>

          {loading && <div className="loading">불러오는 중…</div>}
          <div ref={sentinelRef} style={{ height: 1 }} />
          {!hasMore && <div className="end">더 이상 항목이 없습니다.</div>}
        </main>
      </div>

      {/* 팔로워/팔로잉 모달 */}
      {profile && (
        <FollowModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          userId={profile.memberId}
          type={modalState.type}
          title={modalState.title}
        />
      )}
    </div>
  );
};

function TripCardView({ trip, onClick }: { trip: MyTripCard; onClick: () => void }) {
  const date = `${fmt(trip.startDate)} – ${fmt(trip.endDate)}`;
  return (
    <article className="trip-card" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="thumb">
        {trip.coverImageUrl ? <img src={trip.coverImageUrl} alt={trip.title} /> : <div className="thumb-fallback" />}
        <div className="thumb-badge">{trip.placeCount ?? 0}곳</div>
        {!trip.isPublic && <div className="thumb-lock">비공개</div>}
      </div>
      <div className="trip-info">
        <h3 className="trip-title">{trip.title}</h3>
        <div className="trip-sub">{date}</div>
      </div>
    </article>
  );
}

function fmt(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default MyPage;
