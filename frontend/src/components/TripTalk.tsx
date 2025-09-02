import React, { useState, useEffect } from 'react';
import { FaHeart, FaComment, FaClock, FaChevronLeft, FaChevronRight, FaPause, FaPlay, FaUserPlus, FaUserCheck } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { usePostContext, type Post } from '../contexts/PostContext';
import axiosInstance from '../api/axios';
import { followApi } from '../api/follow';
import Header from './Header';
import PostDetailModal from './PostDetailModal';
import RegionChatModal from './RegionChatModal';
import './TripTalk.css';

const TripTalk: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const {
    posts,
    setPosts,
    updatePostLikeCount,
    addPost
  } = usePostContext();

  // 여행지 선택 상태 추가
  const [selectedRegion, setSelectedRegion] = useState<string>('대한민국'); // 기본값은 일본

  // 여행지별 도시 정보 매핑
  const regionCities = {
    '대한민국': ['서울', '부산', '제주', '인천', '경주'],
    '동남아시아': ['미얀마', '라오스', '베트남', '태국', '대만'],
    '일본': ['오사카', '후쿠오카', '도쿄', '삿포로'],
    '유럽': ['독일', '스페인', '영국', '이탈리아', '체코', '프랑스']
  };

  const [profileImg, setProfileImg] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [currentMemberId, setCurrentMemberId] = useState<number | null>(null);

  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    image: null as File | null,
    region: '대한민국' // 기본값은 대한민국
  });

  // 모달 관련 상태
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRegionChatOpen, setIsRegionChatOpen] = useState(false); // 지역채팅 모달 상태 추가
  const [selectedCity, setSelectedCity] = useState<string>(''); // 선택된 도시 상태 추가

  // 무한스크롤링 관련 상태
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 팔로우 상태 관리
  const [followStatus, setFollowStatus] = useState<Map<number, boolean>>(new Map());
  const [postsPerPage] = useState<number>(10);

  // 날씨 관련 상태 수정 - 4개 도시 지원
  const [weatherList, setWeatherList] = useState<Array<{
    city: string;
    tempC: number;
    feelslikeC: number;
    humidity: number;
    windKph: number;
    weatherIcon: string;
    condition: string;
    uv: number;
  }>>([]);

  // 날씨 API 응답 타입 정의
  interface WeatherApiResponse {
    tempC: number;
    feelslikeC: number;
    humidity: number;
    windKph: number;
    weatherIcon: string;
    condition: string;
    uv: number;
  }
  const [currentWeatherIndex, setCurrentWeatherIndex] = useState(0);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [isAutoSlide, setIsAutoSlide] = useState(true);

  // 인기 게시글 상태 추가
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(false);

  // 4개 도시의 날씨 정보 가져오기 함수 수정
  const fetchAllCitiesWeather = async () => {
    setWeatherLoading(true);
    try {
      // 여행지별 날씨 API 호출
      const response = await axiosInstance.get(`/weather/region/${encodeURIComponent(selectedRegion)}`);
      const currentCities = regionCities[selectedRegion as keyof typeof regionCities] || regionCities['일본'];
      
      const weatherData = response.data.map((weather: WeatherApiResponse, index: number) => ({
        city: currentCities[index % currentCities.length],
        ...weather
      }));
      setWeatherList(weatherData);
      console.log(`🌤️ [TripTalk] ${selectedRegion} 도시 날씨 정보:`, weatherData);
    } catch (error) {
      console.error('🌤️ [TripTalk] 날씨 정보 가져오기 실패:', error);
    } finally {
      setWeatherLoading(false);
    }
  };

  // 인기 게시글 가져오기 함수
  const fetchTrendingPosts = async () => {
    setTrendingLoading(true);
    try {
      const response = await axiosInstance.get('/posts/trending');
      // 좋아요가 1개 이상인 게시글만 필터링
      const filteredPosts = response.data.filter((post: Post) => post.likeCount >= 1);
      setTrendingPosts(filteredPosts);
      console.log('🔥 [TripTalk] 인기 게시글 (좋아요 1개 이상):', filteredPosts);
    } catch (error) {
      console.error('🔥 [TripTalk] 인기 게시글 가져오기 실패:', error);
    } finally {
      setTrendingLoading(false);
    }
  };

  // 자동 슬라이드 함수
  const nextWeather = () => {
    setCurrentWeatherIndex((prev) => (prev + 1) % weatherList.length);
  };

  const prevWeather = () => {
    setCurrentWeatherIndex((prev) => (prev - 1 + weatherList.length) % weatherList.length);
  };

  // 슬라이드 방향 상태 추가
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [isAnimating, setIsAnimating] = useState(false);

  // 애니메이션과 함께 슬라이드 변경
  const changeWeatherWithAnimation = (direction: 'left' | 'right') => {
    if (isAnimating) return;

    console.log(`🎬 [TripTalk] 슬라이드 애니메이션 시작: ${direction} 방향`);
    setIsAnimating(true);
    setSlideDirection(direction);

    // 애니메이션 완료 후 인덱스 변경
    setTimeout(() => {
      if (direction === 'right') {
        nextWeather(); // 다음 도시로 이동
      } else {
        prevWeather(); // 이전 도시로 이동
      }

      // 애니메이션 상태 정리
      setTimeout(() => {
        setIsAnimating(false);
        console.log(`🎬 [TripTalk] 슬라이드 애니메이션 완료`);
      }, 100);
    }, 600);
  };

  // 자동 슬라이드 제어
  const toggleAutoSlide = () => {
    setIsAutoSlide(!isAutoSlide);
  };

  // 자동 슬라이드 useEffect
  useEffect(() => {
    if (isAutoSlide && weatherList.length > 0) {
      const interval = setInterval(() => {
        changeWeatherWithAnimation('right');
      }, 5000); // 5초마다 자동 슬라이드
      return () => clearInterval(interval);
    }
  }, [isAutoSlide, weatherList.length]);

  // 사용자 정보 가져오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await axiosInstance.get('/members/me');
        console.log('🔄 [TripTalk] 사용자 정보 가져오기 성공:', response.data);
        if (response.data.profileImg) {
          setProfileImg(response.data.profileImg);
        }
        if (response.data.nickname) {
          setNickname(response.data.nickname);
        }
        if (response.data.id) {
          setCurrentMemberId(response.data.id);
        }
      } catch (error) {
        console.error('🔄 [TripTalk] 사용자 정보 가져오기 실패:', error);
      }
    };

    if (isLoggedIn) {
      fetchUserInfo();
    }
  }, [isLoggedIn]);

  // 선택된 여행지가 변경될 때 newPost.region도 업데이트
  useEffect(() => {
    setNewPost(prev => ({ ...prev, region: selectedRegion }));
  }, [selectedRegion]);

  // 날씨 정보와 인기 게시글 가져오기 useEffect 수정
  useEffect(() => {
    fetchAllCitiesWeather();
    fetchTrendingPosts();
    // 30분마다 업데이트
    const interval = setInterval(() => {
      fetchAllCitiesWeather();
      fetchTrendingPosts();
    }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // selectedRegion 변경 시 날씨 정보 업데이트
  useEffect(() => {
    fetchAllCitiesWeather();
  }, [selectedRegion]);

  // 시간 표시 함수 추가 (안전장치 포함)
  const formatTimestamp = (createdAt: Date | string): string => {
    // createdAt이 Date 객체가 아닌 경우 Date 객체로 변환
    const date = createdAt instanceof Date ? createdAt : new Date(createdAt);

    // 유효하지 않은 날짜인 경우 기본값 반환
    if (isNaN(date.getTime())) {
      return '방금 전';
    }

    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}분전`;
    } else if (diffInHours < 24) {
      return `${diffInHours}시간전`;
    } else if (diffInDays < 7) {
      return `${diffInDays}일전`;
    } else {
      // createdAt이 Date 객체인지 확인하고 안전하게 처리
      const date = createdAt instanceof Date ? createdAt : new Date(createdAt);
      if (isNaN(date.getTime())) {
        return '방금 전';
      }
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    }
  };

  // 게시글 로드 함수 (무한스크롤링용)
  const loadPosts = async (page: number = 0, append: boolean = false) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      // currentMemberId가 없으면 사용자 정보 다시 가져오기
      if (!currentMemberId && isLoggedIn) {
        try {
          const userResponse = await axiosInstance.get('/members/me');
          if (userResponse.data.id) {
            setCurrentMemberId(userResponse.data.id);
          }
        } catch (userError) {
          console.error('사용자 정보 재확인 실패:', userError);
        }
      }

      // 선택된 여행지에 따라 region 파라미터 추가
      const regionParam = selectedRegion ? `&region=${encodeURIComponent(selectedRegion)}` : '';
      const response = await axiosInstance.get(`/posts?page=${page}&size=${postsPerPage}${regionParam}`);
             const newPosts = response.data.content;

       // 이미지 URL 디버깅
       newPosts.forEach((post: Post) => {
         console.log(`📸 [TripTalk] 게시글 ${post.id} 이미지 URL:`, post.imageUrl);
       });

       if (append) {
         setPosts(prev => [...prev, ...newPosts]);
       } else {
         setPosts(newPosts);
       }

      setHasMore(!response.data.last);
      setCurrentPage(page);

    } catch (error) {
      console.error('게시글 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 스크롤 이벤트 핸들러
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

    // 스크롤이 하단에 도달했을 때 다음 페이지 로드
    if (scrollTop + clientHeight >= scrollHeight - 100 && hasMore && !isLoading) {
      loadPosts(currentPage + 1, true);
    }
  };

  // 초기 게시글 로드
  useEffect(() => {
    loadPosts(0, false);
  }, []);

  // 선택된 여행지가 변경될 때마다 게시글 다시 로드
  useEffect(() => {
    setPosts([]); // 기존 게시글 초기화
    setCurrentPage(0);
    setHasMore(true);
    loadPosts(0, false);
  }, [selectedRegion]);

  const handleLike = async (postId: number) => {
    try {
      const response = await axiosInstance.post(`/posts/${postId}/like`);
      const { isLiked, likeCount } = response.data;

      // PostContext를 통해 상태 업데이트 (실제 백엔드 값 사용)
      updatePostLikeCount(postId, likeCount, isLiked);

    } catch (error) {
      console.error('좋아요 처리 실패:', error);
    }
  };

  // 게시글 클릭 시 모달 열기
  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  // 팔로우/언팔로우 핸들러
  const handleFollowClick = async (e: React.MouseEvent, authorId: number) => {
    e.stopPropagation(); // 게시글 클릭 이벤트 방지
    
    try {
      const isCurrentlyFollowing = followStatus.get(authorId);
      
      if (isCurrentlyFollowing) {
        // 언팔로우
        await followApi.unfollow(authorId);
        setFollowStatus(prev => new Map(prev.set(authorId, false)));
      } else {
        // 팔로우
        await followApi.follow(authorId);
        setFollowStatus(prev => new Map(prev.set(authorId, true)));
      }
    } catch (error) {
      console.error('팔로우/언팔로우 실패:', error);
      alert('팔로우/언팔로우에 실패했습니다.');
    }
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim()) return;

    const formData = new FormData();
    formData.append('title', newPost.title);
    formData.append('content', newPost.content);
    formData.append('region', selectedRegion); // 현재 선택된 여행지 정보 추가
    if (newPost.image) {
      formData.append('image', newPost.image);
    }

    try {
      const response = await axiosInstance.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

             // 새 게시글을 PostContext에 추가
       const newPostData: Post = {
         id: response.data.id,
         title: response.data.title,
         content: response.data.content,
         imageUrl: response.data.imageUrl,
         authorName: response.data.authorName,
         authorProfileImg: response.data.authorProfileImg,
         region: response.data.region,
         createdAt: new Date(response.data.createdAt),
         likeCount: response.data.likeCount,
         commentCount: response.data.commentCount,
         isLikedByMe: response.data.isLikedByMe
       };

       console.log('📸 [TripTalk] 새 게시글 이미지 URL:', response.data.imageUrl);

      addPost(newPostData);
      setNewPost({ title: '', content: '', image: null, region: selectedRegion }); // region 정보 유지

      // 게시물 작성 후 현재 사용자 정보 다시 확인 (팔로우 버튼 표시를 위해)
      try {
        const userResponse = await axiosInstance.get('/members/me');
        if (userResponse.data.id) {
          setCurrentMemberId(userResponse.data.id);
        }
      } catch (userError) {
        console.error('사용자 정보 재확인 실패:', userError);
      }

    } catch (error) {
      console.error('게시글 작성 실패:', error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewPost({ ...newPost, image: e.target.files[0] });
    }
  };

  const filteredPosts = posts;

  return (
    <>
      <Header />
      <div className="triptalk-container">
        {/* 좌측 사이드바 */}
        <div className="triptalk-sidebar-left">
          <div className="sidebar-card">
            <h3>여행지</h3>
            <div className="quick-filters">
              <button 
                className={`quick-filter-btn ${selectedRegion === '대한민국' ? 'active' : ''}`}
                onClick={() => setSelectedRegion('대한민국')}
              >
                대한민국
              </button>
              <button 
                className={`quick-filter-btn ${selectedRegion === '동남아시아' ? 'active' : ''}`}
                onClick={() => setSelectedRegion('동남아시아')}
              >
                동남아시아
              </button>
              <button 
                className={`quick-filter-btn ${selectedRegion === '일본' ? 'active' : ''}`}
                onClick={() => setSelectedRegion('일본')}
              >
                일본
              </button>
              <button 
                className={`quick-filter-btn ${selectedRegion === '유럽' ? 'active' : ''}`}
                onClick={() => setSelectedRegion('유럽')}
              >
                유럽
              </button>
            </div>
          </div>

          <div className="sidebar-card">
            <h3>인기 게시글</h3>
            <div className="trending-posts">
              {trendingLoading ? (
                <div className="trending-loading">인기 게시글 로딩 중...</div>
              ) : trendingPosts.length > 0 ? (
                trendingPosts.map((post, index) => (
                  <div
                    key={post.id}
                    className="trending-post"
                    onClick={() => handlePostClick(post)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="trending-number">{index + 1}</span>
                    <span className="trending-title">{post.title}</span>
                  </div>
                ))
              ) : (
                <div className="trending-empty">아직 인기 게시글이 없습니다</div>
              )}
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="triptalk-main">
          {/* 헤더 */}
          <div className="triptalk-header">
            <h1>{selectedRegion}</h1>
            <div className="triptalk-stats">
              <div className="region-chat-buttons-scroll">
                {regionCities[selectedRegion as keyof typeof regionCities]?.map((city) => (
                  <button 
                    key={city}
                    className="region-chat-btn"
                    onClick={() => {
                      setSelectedCity(city);
                      setIsRegionChatOpen(true);
                    }}
                  >
                    💬 {city} 채팅방
                  </button>
                ))}
              </div>
            </div>
            <div className="triptalk-image">
              <img src="/images/logo.png" alt={selectedRegion} />
            </div>
          </div>

          {/* 필터 */}
          <div className="triptalk-filters">
            <select className="filter-select">
              <option>여행시기</option>
            </select>

            <select className="filter-select">
              <option>주제</option>
            </select>


          </div>

          {/* 새 게시글 작성 */}
          {isLoggedIn && (
            <div className="create-post">
              <div className="post-header">
                <img
                  src={profileImg ? `http://localhost:80${profileImg}` : '/images/logo.png'}
                  alt="프로필"
                  className="author-avatar"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== '/images/logo.png') {
                      target.src = '/images/logo.png';
                    }
                  }}
                />
                <span className="author-name">{nickname || '사용자'}</span>
              </div>

              <form onSubmit={handleSubmitPost}>
                <input
                  type="text"
                  placeholder="제목을 입력해주세요"
                  value={newPost.title}
                  onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                  className="post-title-input"
                />

                <textarea
                  placeholder="내용을 입력해주세요..."
                  value={newPost.content}
                  onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  className="post-content-input"
                />

                <div className="post-actions">
                  <div className="image-upload">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      id="image-upload"
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="image-upload" className="upload-btn">
                      📷 사진 추가
                    </label>
                    {newPost.image && (
                      <span className="selected-image">{newPost.image.name}</span>
                    )}
                  </div>

                  <button type="submit" className="submit-btn">
                    게시하기
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 게시글 목록 */}
          <div className="posts-container" onScroll={handleScroll}>
            {filteredPosts.map(post => (
              <div
                key={post.id}
                className="post-card"
                onClick={() => handlePostClick(post)}
                style={{ cursor: 'pointer' }}
              >
                <div className="post-header">
                  <img
                    src={post.authorProfileImg ? `http://localhost:80${post.authorProfileImg}` : '/images/logo.png'}
                    alt="프로필"
                    className="author-avatar"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== '/images/logo.png') {
                        target.src = '/images/logo.png';
                      }
                    }}
                  />
                  <div className="author-info">
                    <span className="author-name">{post.authorName}</span>
                    <div className="post-meta">
                      <span className="location">
                        {post.region || '지역 정보 없음'}
                      </span>
                    </div>
                  </div>
                  {post.authorId && post.authorId !== currentMemberId && (
                    <button 
                      className={`follow-btn ${followStatus.get(post.authorId) ? 'following' : 'follow'}`}
                      onClick={(e) => handleFollowClick(e, post.authorId)}
                      title={followStatus.get(post.authorId) ? '언팔로우' : '팔로우'}
                    >
                      {followStatus.get(post.authorId) ? (
                        <>
                          <FaUserCheck />
                          <span>팔로잉</span>
                        </>
                      ) : (
                        <>
                          <FaUserPlus />
                          <span>팔로우</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="post-content">
                  <h3 className="post-title">{post.title}</h3>
                  <p className="post-text">{post.content}</p>
                                     {post.imageUrl && (
                     <img
                       src={post.imageUrl.startsWith('http') ? post.imageUrl : `http://localhost:80${post.imageUrl}`}
                       alt="게시글 이미지"
                       className="post-image"
                       onError={(e) => {
                         console.error('게시글 이미지 로드 실패:', post.imageUrl);
                         const target = e.target as HTMLImageElement;
                         target.style.display = 'none';
                       }}
                     />
                   )}
                </div>

                <div className="post-footer">
                  <div className="post-actions-left">
                    <button
                      className="action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(post.id);
                      }}
                    >
                      <FaHeart style={{ color: post.isLikedByMe ? '#e41e3f' : 'inherit' }} /> {post.likeCount}
                    </button>
                    <button className="action-btn">
                      <FaComment /> {post.commentCount}
                    </button>
                  </div>
                  <div className="post-timestamp">
                    <FaClock /> {formatTimestamp(post.createdAt)}
                  </div>
                </div>
              </div>
            ))}

            {/* 로딩 인디케이터 */}
            {isLoading && (
              <div className="loading-indicator">
                <div className="loading-spinner"></div>
                게시글을 불러오는 중...
              </div>
            )}

            {/* 게시글 끝 표시 */}
            {!hasMore && posts.length > 0 && (
              <div className="end-of-posts">
                모든 게시글을 불러왔습니다
              </div>
            )}
          </div>
        </div>

        {/* 우측 사이드바 */}
        <div className="triptalk-sidebar-right">
          {/* 실시간 정보 - 4개 도시 자동 슬라이드 */}
          <div className="sidebar-card">
            <h3>{weatherList.length > 0 ? `${weatherList[currentWeatherIndex].city} 실시간 정보` : '실시간 정보'}</h3>
            <div className={`weather-info-container ${isAnimating ? 'sliding' : ''}`}>
              <div
                className={`live-info ${isAnimating ? `slide-${slideDirection}` : 'slide-center'}`}
                onMouseEnter={() => setIsAutoSlide(false)}
                onMouseLeave={() => setIsAutoSlide(true)}
              >
              {weatherLoading ? (
                <div className="info-item">
                  <span className="info-label">날씨 정보 로딩 중...</span>
                </div>
              ) : weatherList.length > 0 ? (
                <>
                  <div className="info-item">
                    <span className="info-label">현재 온도</span>
                    <span className="info-value">{weatherList[currentWeatherIndex].tempC}°C</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">체감 온도</span>
                    <span className="info-value">{weatherList[currentWeatherIndex].feelslikeC}°C</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">습도</span>
                    <span className="info-value">{weatherList[currentWeatherIndex].humidity}%</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">바람</span>
                    <span className="info-value">{weatherList[currentWeatherIndex].windKph} km/h</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">날씨</span>
                    <div className="weather-condition">
                      {weatherList[currentWeatherIndex].weatherIcon && weatherList[currentWeatherIndex].weatherIcon.trim() !== '' ? (
                        weatherList[currentWeatherIndex].weatherIcon.startsWith('http') ? (
                          <img
                            src={weatherList[currentWeatherIndex].weatherIcon}
                            alt="날씨 아이콘"
                            className="weather-icon"
                            onError={(e) => {
                              console.error('🌤️ [TripTalk] 아이콘 로드 실패:', weatherList[currentWeatherIndex].weatherIcon);
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                            onLoad={() => {
                              console.log('🌤️ [TripTalk] 아이콘 로드 성공:', weatherList[currentWeatherIndex].weatherIcon);
                            }}
                          />
                        ) : (
                          <span className="weather-emoji">{weatherList[currentWeatherIndex].weatherIcon}</span>
                        )
                      ) : (
                        <span className="weather-placeholder">🌤️</span>
                      )}
                      <span className="info-value">{weatherList[currentWeatherIndex].condition}</span>
                    </div>
                  </div>
                  <div className="info-item">
                    <span className="info-label">자외선 지수</span>
                    <span className="info-value">{weatherList[currentWeatherIndex].uv}</span>
                  </div>
                </>
              ) : (
                <div className="info-item">
                  <span className="info-label">날씨 정보를 불러올 수 없습니다</span>
                </div>
              )}
              </div>
            </div>

            {/* 날씨 제어 버튼 */}
            <div className="weather-controls">
              <button onClick={() => changeWeatherWithAnimation('left')} className="control-btn">
                <FaChevronLeft />
              </button>
              <button onClick={toggleAutoSlide} className="control-btn">
                {isAutoSlide ? <FaPause /> : <FaPlay />}
              </button>
              <button onClick={() => changeWeatherWithAnimation('right')} className="control-btn">
                <FaChevronRight />
              </button>
            </div>
          </div>
          

        </div>
      </div>

      {/* 게시글 상세 모달 */}
      <PostDetailModal
        post={selectedPost}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {/* 지역채팅 모달 */}
      <RegionChatModal
        isOpen={isRegionChatOpen}
        onClose={() => setIsRegionChatOpen(false)}
        region={selectedRegion}
        city={selectedCity || regionCities[selectedRegion as keyof typeof regionCities]?.[0] || '도시'}
      />
    </>
  );
};

export default TripTalk;
