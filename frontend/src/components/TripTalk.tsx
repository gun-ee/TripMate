import React, { useState, useEffect } from 'react';
import { FaHeart, FaComment, FaClock } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../api/axios';
import Header from './Header';
import './TripTalk.css';

interface Post {
  id: number;
  author: {
    id: number;
    username: string;
    profileImg: string;
    isTraveling: boolean;
  };
  location: string;
  timestamp: string;
  title: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  createdAt: Date; // 실제 생성 시간을 저장할 필드 추가
}

const TripTalk: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const [profileImg, setProfileImg] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [showOnlyTraveling, setShowOnlyTraveling] = useState<boolean>(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    image: null as File | null
  });

  // 무한스크롤링 관련 상태
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [postsPerPage] = useState<number>(10);

  // 날씨 관련 상태 추가
  const [weather, setWeather] = useState<{
    tempC: number;
    feelslikeC: number;
    humidity: number;
    windKph: number;
    weatherIcon: string;
    condition: string;
    uv: number;
  } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);




  // 날씨 정보 가져오기 함수 추가
  const fetchOsakaWeather = async () => {
    setWeatherLoading(true);
    try {
      const response = await axiosInstance.get('/weather/osaka');
      setWeather(response.data);
      console.log('🌤️ [TripTalk] 오사카 날씨 정보:', response.data);
      console.log('🌤️ [TripTalk] 날씨 아이콘 URL:', response.data.weatherIcon);
    } catch (error) {
      console.error('🌤️ [TripTalk] 날씨 정보 가져오기 실패:', error);
    } finally {
      setWeatherLoading(false);
    }
  };

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
      } catch (error) {
        console.error('🔄 [TripTalk] 사용자 정보 가져오기 실패:', error);
      }
    };
    
    if (isLoggedIn) {
      fetchUserInfo();
    }
  }, [isLoggedIn]);

  // 날씨 정보 가져오기 useEffect 추가
  useEffect(() => {
    fetchOsakaWeather();
    // 30분마다 업데이트
    const interval = setInterval(fetchOsakaWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // 시간 표시 함수 추가
  const formatTimestamp = (createdAt: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - createdAt.getTime();
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
      return createdAt.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    }
  };



  // 게시글 로드 함수 (무한스크롤링용)
  const loadPosts = async (page: number = 1, append: boolean = false) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      // 실제 API 호출 시 사용할 코드
      // const response = await axiosInstance.get(`/posts?page=${page}&size=${postsPerPage}`);
      // const newPosts = response.data.content;
      
      // 임시로 더미 데이터 생성 (실제 DB 연동 시 제거)
      const dummyPosts: Post[] = Array.from({ length: postsPerPage }, (_, index) => ({
        id: (page - 1) * postsPerPage + index + 1,
        author: {
          id: 1,
          username: 'hyeyoung',
          profileImg: '/images/logo.png',
          isTraveling: true
        },
        location: '오사카',
        timestamp: '1시간전',
        title: `게시글 제목 ${(page - 1) * postsPerPage + index + 1}`,
        content: `게시글 내용 ${(page - 1) * postsPerPage + index + 1}입니다.`,
        likes: Math.floor(Math.random() * 10),
        comments: Math.floor(Math.random() * 5),
        createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
      }));

      if (append) {
        setPosts(prev => [...prev, ...dummyPosts]);
      } else {
        setPosts(dummyPosts);
      }

      // 더미 데이터이므로 항상 다음 페이지가 있다고 가정 (실제로는 API 응답에 따라 결정)
      setHasMore(dummyPosts.length === postsPerPage);
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
    loadPosts(1, false);
  }, []);

  const handleLike = (postId: number) => {
    setPosts(posts.map(post => 
      post.id === postId ? { ...post, likes: post.likes + 1 } : post
    ));
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim()) return;

    const formData = new FormData();
    formData.append('title', newPost.title);
    formData.append('content', newPost.content);
    if (newPost.image) {
      formData.append('image', newPost.image);
    }

    try {
      // 실제 API 호출
      // const response = await axiosInstance.post('/posts', formData);
      console.log('게시글 작성:', formData);
      
      // 임시로 로컬 상태에 추가
      const newPostObj: Post = {
        id: Date.now(),
        author: {
          id: 1,
          username: nickname || '사용자',
          profileImg: profileImg || '/images/logo.png',
          isTraveling: true
        },
        location: '현재 위치',
        timestamp: '방금전',
        title: newPost.title,
        content: newPost.content,
        likes: 0,
        comments: 0,
        createdAt: new Date()
      };
      
      setPosts([newPostObj, ...posts]);
      setNewPost({ title: '', content: '', image: null });
    } catch (error) {
      console.error('게시글 작성 실패:', error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewPost({ ...newPost, image: e.target.files[0] });
    }
  };

  const filteredPosts = posts.filter(post => {
    if (showOnlyTraveling && !post.author.isTraveling) return false;
    return true;
  });

  return (
    <>
      <Header />
      <div className="triptalk-container">
        {/* 좌측 사이드바 */}
        <div className="triptalk-sidebar-left">
          <div className="sidebar-card">
            <h3>빠른 필터</h3>
            <div className="quick-filters">
              <button className="quick-filter-btn">여행중인 사람</button>
              <button className="quick-filter-btn">동행 구함</button>
              <button className="quick-filter-btn">맛집 정보</button>
              <button className="quick-filter-btn">날씨 정보</button>
            </div>
          </div>
          
          <div className="sidebar-card">
            <h3>인기 게시글</h3>
            <div className="trending-posts">
              <div className="trending-post">
                <span className="trending-number">1</span>
                <span className="trending-title">오사카 맛집 추천</span>
              </div>
              <div className="trending-post">
                <span className="trending-number">2</span>
                <span className="trending-title">도쿄 날씨 정보</span>
              </div>
              <div className="trending-post">
                <span className="trending-number">3</span>
                <span className="trending-title">교토 동행 구함</span>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="triptalk-main">
          {/* 헤더 */}
          <div className="triptalk-header">
            <h1>일본 전체</h1>
            <div className="triptalk-stats">
              <div className="stat-item">
                <span className="stat-label">여행 준비중</span>
                <span className="stat-value">63,106명</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">여행중</span>
                <span className="stat-value">4,826명</span>
              </div>
            </div>
            <div className="triptalk-image">
              <img src="/images/logo.png" alt="일본" />
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

            <label className="traveling-only">
              <input 
                type="checkbox" 
                checked={showOnlyTraveling}
                onChange={(e) => setShowOnlyTraveling(e.target.checked)}
              />
              여행중인 사람만
            </label>
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
              <div key={post.id} className="post-card">
                <div className="post-header">
                  <img 
                    src={post.author.profileImg} 
                    alt="프로필" 
                    className="author-avatar"
                  />
                  <div className="author-info">
                    <span className="author-name">{post.author.username}</span>
                    <div className="post-meta">
                      <span className="location">
                        {post.location}
                      </span>
                    </div>
                  </div>
                  
                </div>
                
                <div className="post-content">
                  <h3 className="post-title">{post.title}</h3>
                  <p className="post-text">{post.content}</p>
                  {post.image && (
                    <img src={post.image} alt="게시글 이미지" className="post-image" />
                  )}
                </div>
                
                <div className="post-footer">
                  <div className="post-actions-left">
                    <button 
                      className="action-btn"
                      onClick={() => handleLike(post.id)}
                    >
                      <FaHeart /> {post.likes}
                    </button>
                    <button className="action-btn">
                      <FaComment /> {post.comments}
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
          {/* 실시간 정보 - 기존 코드를 교체 */}
          <div className="sidebar-card">
            <h3>오사카 실시간 정보</h3>
            <div className="live-info">
              {weatherLoading ? (
                <div className="info-item">
                  <span className="info-label">날씨 정보 로딩 중...</span>
                </div>
              ) : weather ? (
                <>
                  <div className="info-item">
                    <span className="info-label">현재 온도</span>
                    <span className="info-value">{weather.tempC}°C</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">체감 온도</span>
                    <span className="info-value">{weather.feelslikeC}°C</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">습도</span>
                    <span className="info-value">{weather.humidity}%</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">바람</span>
                    <span className="info-value">{weather.windKph} km/h</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">날씨</span>
                    <div className="weather-condition">
                      {weather.weatherIcon && weather.weatherIcon.trim() !== '' ? (
                        weather.weatherIcon.startsWith('http') ? (
                          <img 
                            src={weather.weatherIcon} 
                            alt="날씨 아이콘" 
                            className="weather-icon"
                            onError={(e) => {
                              console.error('🌤️ [TripTalk] 아이콘 로드 실패:', weather.weatherIcon);
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                            onLoad={() => {
                              console.log('🌤️ [TripTalk] 아이콘 로드 성공:', weather.weatherIcon);
                            }}
                          />
                        ) : (
                          <span className="weather-emoji">{weather.weatherIcon}</span>
                        )
                      ) : (
                        <span className="weather-placeholder">🌤️</span>
                      )}
                      <span className="info-value">{weather.condition}</span>
                    </div>
                  </div>
                  <div className="info-item">
                    <span className="info-label">자외선 지수</span>
                    <span className="info-value">{weather.uv}</span>
                  </div>
                </>
              ) : (
                <div className="info-item">
                  <span className="info-label">날씨 정보를 불러올 수 없습니다</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="sidebar-card">
            <h3>최근 활동</h3>
            <div className="recent-activities">
              <div className="activity-item">
                <span className="activity-user">김여행</span>
                <span className="activity-action">새 게시글을 작성했습니다</span>
              </div>
              <div className="activity-item">
                <span className="activity-user">박동행</span>
                <span className="activity-action">댓글을 남겼습니다</span>
              </div>
              <div className="activity-item">
                <span className="activity-user">이맛집</span>
                <span className="activity-action">좋아요를 눌렀습니다</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TripTalk;
