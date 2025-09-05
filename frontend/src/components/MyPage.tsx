import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// 기존 API/타입
import { mypageApi } from '../api/mypage';
import { followApi } from '../api/follow';
import type { MyProfileResponse, MyTripCard } from '../api/mypage';

// 추가: 동행 신청 관리 API (경로는 프로젝트에 맞게 조정)
import { accompanyApi } from '../api/accompany';

import Header from './Header';
import FollowModal from './FollowModal';
import './MyPage.css';

type AppItem = {
  id: number;
  postId: number;
  applicantId: number;
  applicantName: string;
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
};

const MyPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 프로필 & 팔로우 카운트
  const [profile, setProfile] = useState<MyProfileResponse | null>(null);
  const [targetUserId, setTargetUserId] = useState<number | null>(null);
  const [followCounts, setFollowCounts] = useState<{ followerCount: number; followingCount: number }>({ followerCount: 0, followingCount: 0 });

  // 탭 상태: trips | accompany
  const [activeTab, setActiveTab] = useState<'trips' | 'accompany'>('trips');

  // 여행 목록 (무한스크롤)
  const [trips, setTrips] = useState<MyTripCard[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // 동행 신청 목록 (내가 작성한 동행 글에 대한 신청자들)
  const [appsByPost, setAppsByPost] = useState<Record<number, AppItem[]>>({});
  const [appsLoading, setAppsLoading] = useState(false);

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

  // 쿼리 파라미터로 타겟 유저 지정 가능 (다른 유저의 마이페이지 보기)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userId = params.get('userId');
    if (userId) setTargetUserId(parseInt(userId, 10));
  }, [location.search]);

  // 프로필 + 팔로우 카운트 로드
  useEffect(() => {
    (async () => {
      try {
        const profileData = targetUserId
          ? await mypageApi.userProfile(targetUserId)
          : await mypageApi.profile();
        setProfile(profileData);

        const userIdToCheck = targetUserId || profileData.memberId;
        const counts = await followApi.getFollowCounts(userIdToCheck);
        setFollowCounts(counts);
      } catch (error) {
        console.error('프로필 로드 실패:', error);
      }
    })();
  }, [targetUserId]);

  // 여행 목록 로더 (무한스크롤)
  const loadMore = useCallback(async (isInitial = false) => {
    if (loading || (!isInitial && !hasMore)) return;
    setLoading(true);
    try {
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
      setCursor(page.nextCursorId ?? null);
      setHasMore(page.nextCursorId != null);
    } catch (e) {
      console.error('여행 목록 로드 실패:', e);
    } finally {
      setLoading(false);
    }
  }, [cursor, loading, hasMore, targetUserId]);

  // 첫 페이지 로드
  useEffect(() => {
    if (activeTab !== 'trips') return;
    // trips 탭 진입 시 초기화 후 로드
    setTrips([]);
    setCursor(null);
    setHasMore(true);
    loadMore(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, targetUserId]);

  // targetUserId 변경 시 trips 상태 초기화 및 첫 로드
  useEffect(() => {
    if (activeTab !== 'trips') return;
    if (targetUserId !== null) {
      setTrips([]);
      setCursor(null);
      setHasMore(true);
      loadMore(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId]);

  // 무한스크롤
  useEffect(() => {
    if (activeTab !== 'trips') return;
    const node = sentinelRef.current;
    if (!node) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && loadMore(false), { rootMargin: '800px 0px' });
    io.observe(node);
    return () => io.disconnect();
  }, [loadMore, activeTab]);

  // 여행 카드 클릭 → result 페이지
  const handleTripClick = (tripId: number) => {
    navigate(`/trip/result?id=${tripId}`);
  };

  // 팔로워/팔로잉 모달 열기/닫기
  const openFollowersModal = () => {
    const userId = targetUserId || profile?.memberId;
    if (!userId) return;
    setModalState({ isOpen: true, type: 'followers', title: '팔로워' });
  };
  const openFollowingModal = () => {
    const userId = targetUserId || profile?.memberId;
    if (!userId) return;
    setModalState({ isOpen: true, type: 'following', title: '팔로잉' });
  };
  const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false }));

  // 동행 신청 목록 로드 (내가 작성한 동행글 기준)
  const loadApplications = useCallback(async () => {
    setAppsLoading(true);
    try {
      const list = await accompanyApi.listApplicationsForOwner();
      const grouped: Record<number, AppItem[]> = {};
      for (const a of list) (grouped[a.postId] ||= []).push(a as AppItem);
      setAppsByPost(grouped);
    } catch (e) {
      console.error('동행 신청 목록 로드 실패:', e);
    } finally {
      setAppsLoading(false);
    }
  }, []);

  // 동행 탭 진입 시 목록 로드
  useEffect(() => {
    if (activeTab === 'accompany') loadApplications();
  }, [activeTab, loadApplications]);

  // 수락/거부
  const acceptApp = async (id: number) => {
    await accompanyApi.accept(id);
    await loadApplications();
  };
  const rejectApp = async (id: number) => {
    await accompanyApi.reject(id);
    await loadApplications();
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

        {/* 우측 메인 */}
        <main className="trip-listing">
          <div className="tab-bar">
            <button
              className={`tab ${activeTab === 'trips' ? 'active' : ''}`}
              onClick={() => setActiveTab('trips')}
            >
              여행 계획
            </button>
            <button
              className={`tab ${activeTab === 'accompany' ? 'active' : ''}`}
              onClick={() => setActiveTab('accompany')}
            >
              동행 신청
            </button>
          </div>

          {/* 여행 계획 탭 */}
          {activeTab === 'trips' && (
            <>
              <div className="trip-grid">
                {trips.map((t, index) => (
                  <TripCardView key={`${t.id}-${index}`} trip={t} onClick={() => handleTripClick(t.id)} />
                ))}
              </div>
              {loading && <div className="loading">불러오는 중…</div>}
              <div ref={sentinelRef} style={{ height: 1 }} />
            </>
          )}

          {/* 동행 신청 탭 */}
          {activeTab === 'accompany' && (
            <>
              {appsLoading && <div className="loading">불러오는 중…</div>}
              {!appsLoading && Object.keys(appsByPost).length === 0 && <p>신청 내역이 없습니다.</p>}

              {Object.entries(appsByPost).map(([postId, list]) => (
                <section key={postId} className="trip-card" style={{ padding: 12 }}>
                  <h4 style={{ margin: '8px 0' }}>게시글 #{postId}</h4>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {list.map(a => (
                      <li key={a.id} style={{ borderBottom: '1px solid #eee', padding: '8px 0' }}>
                        <div>신청자: {a.applicantName ?? a.applicantId} • 상태: {a.status}</div>
                        <div style={{ whiteSpace: 'pre-wrap' }}>{a.message}</div>
                        {a.status === 'PENDING' && (
                          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                            <button onClick={() => acceptApp(a.id)}>수락</button>
                            <button onClick={() => rejectApp(a.id)}>거부</button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </>
          )}
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
