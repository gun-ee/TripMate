import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { mypageApi } from '../api/mypage';
import { followApi } from '../api/follow';
import type { MyProfileResponse, MyTripCard } from '../api/mypage';
import Header from './Header';
import FollowModal from './FollowModal';
import './MyPage.css';

const MyPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<MyProfileResponse | null>(null);
  const [targetUserId, setTargetUserId] = useState<number | null>(null);
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

  // 쿼리 파라미터 확인
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userId = params.get('userId');
    if (userId) {
      setTargetUserId(parseInt(userId));
    }
  }, [location.search]);

  // 프로필 초기 로드
  useEffect(() => {
    (async () => {
      try {
        // targetUserId가 있으면 해당 유저의 프로필, 없으면 본인 프로필
        const profileData = targetUserId 
          ? await mypageApi.userProfile(targetUserId)
          : await mypageApi.profile();
        setProfile(profileData);
        
        // 팔로우 카운트 로드
        const userIdToCheck = targetUserId || profileData.memberId;
        const counts = await followApi.getFollowCounts(userIdToCheck);
        setFollowCounts(counts);
      } catch (error) {
        console.error('프로필 로드 실패:', error);
      }
    })();
  }, [targetUserId]);

  // 목록 로드
  const loadMore = useCallback(async (isInitial = false) => {
    if (loading || (!isInitial && !hasMore)) return;
    setLoading(true);
    try {
      // targetUserId가 있으면 해당 유저의 여행 목록, 없으면 본인 여행 목록
      const page = targetUserId 
        ? await mypageApi.userTrips(targetUserId, cursor ?? undefined, 12)
        : await mypageApi.myTrips(cursor ?? undefined, 12);
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
  }, [cursor, loading, hasMore, targetUserId]);

  // 첫 페이지 로드
  useEffect(() => { 
    loadMore(true); 
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // targetUserId가 변경될 때 여행 목록 초기화 및 다시 로드
  useEffect(() => {
    if (targetUserId !== null) {
      setTrips([]);
      setCursor(null);
      setHasMore(true);
      loadMore(true);
    }
  }, [targetUserId]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const userId = targetUserId || profile?.memberId;
    if (!userId) return;
    
    setModalState({
      isOpen: true,
      type: 'followers',
      title: '팔로워'
    });
  };

  const openFollowingModal = () => {
    const userId = targetUserId || profile?.memberId;
    if (!userId) return;
    
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
        </main>
      </div>

      {/* 팔로워/팔로잉 모달 */}
      {profile && (
        <FollowModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          userId={targetUserId || profile.memberId}
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
