import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';

const Home: React.FC = () => {
  const { isLoggedIn, nickname, email, profileImg, loading } = useAuth();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const videos = [
    '/videos/PinkOcean.mp4',
    '/videos/Travel.mp4',
    '/videos/Green.mp4'
  ];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVideoEnd = () => {
      console.log('동영상 종료:', videos[currentVideoIndex]);
      setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videos.length);
    };

    const handleVideoError = (e: Event) => {
      console.error('동영상 오류:', videos[currentVideoIndex], e);
      // 오류 발생 시 다음 동영상으로 넘어가기
      setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videos.length);
    };

    const handleVideoLoadStart = () => {
      console.log('동영상 로드 시작:', videos[currentVideoIndex]);
    };

    const handleVideoCanPlay = () => {
      console.log('동영상 재생 가능:', videos[currentVideoIndex]);
      video.play().catch(console.error);
    };

    video.addEventListener('ended', handleVideoEnd);
    video.addEventListener('error', handleVideoError);
    video.addEventListener('loadstart', handleVideoLoadStart);
    video.addEventListener('canplay', handleVideoCanPlay);
    
    return () => {
      video.removeEventListener('ended', handleVideoEnd);
      video.removeEventListener('error', handleVideoError);
      video.removeEventListener('loadstart', handleVideoLoadStart);
      video.removeEventListener('canplay', handleVideoCanPlay);
    };
  }, [currentVideoIndex, videos]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* 배경 동영상 */}
      <video
        ref={videoRef}
        key={currentVideoIndex}
        autoPlay
        muted
        loop={false}
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        className="absolute inset-0 w-full h-full object-cover z-0"
        onError={(e) => {
          console.error('동영상 로드 오류:', videos[currentVideoIndex], e);
          setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videos.length);
        }}
      >
        <source src={videos[currentVideoIndex]} type="video/mp4" />
        {/* 동영상을 지원하지 않는 브라우저를 위한 대체 이미지 */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500"></div>
      </video>
      
      {/* 콘텐츠 오버레이 */}
      <div className="relative z-10">
        <Header />
        
        {/* 
        <main className="mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-white mb-4">
                  TripMate에 오신 것을 환영합니다!
                </h1>
                
                {isLoggedIn ? (
                  <div className="space-y-4">
                    <p className="text-xl text-white">
                      안녕하세요, <span className="font-semibold">{nickname}</span>님!
                    </p>
                    <div className="bg-white bg-opacity-90 p-6 rounded-lg shadow-md max-w-md mx-auto">
                      <h2 className="text-lg font-semibold mb-4">회원 정보</h2>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">이메일:</span> {email}</p>
                        <p><span className="font-medium">닉네임:</span> {nickname}</p>
                        {profileImg && profileImg !== '/images/logo.png' && (
                          <div>
                            <span className="font-medium">프로필 이미지:</span>
                            <img 
                              src={profileImg ? `http://localhost:80${profileImg}` : '/images/logo.png'}
                              alt="프로필" 
                              className="w-16 h-16 rounded-full mt-2"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/images/logo.png';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <p className="text-xl text-white">
                      여행을 더욱 즐겁게 만들어보세요!
                    </p>
                    <div className="flex space-x-4 justify-center">
                      <a
                        href="/login"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md text-lg font-medium"
                      >
                        로그인
                      </a>
                      <a
                        href="/signup"
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md text-lg font-medium"
                      >
                        회원가입
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
        */}
      </div>
    </div>
  );
};

export default Home;

