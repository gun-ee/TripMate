import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../api/axios';
import './Header.css';
import NotificationBell from './notifications/NotificationBell';
import ChatIcon from './chat/ChatIcon';
import ChatbotBanner from './chatbot/ChatbotBanner';

interface SubMenuItem {
  name: string;
  link: string;
}

interface MenuItem {
  name: string;
  link?: string;
  submenu: SubMenuItem[];
  disabled?: boolean;
}

const baseMenu: MenuItem[] = [
  {
    name: '여행 일정 계획',
    link: '/plan',
    submenu: [
      //{ name: '정보게시판', link: '/board/info' },
      //{ name: '자유게시판', link: '/board/free' },
      //{ name: 'Q&A', link: '/board/qna' },
      // { name: '산책동행', link: '/board/walkwith' },
    ],
  },
  {
    name: '동행구하기',
    link: '/accompany',
    submenu: [
      //{ name: '쇼핑', link: '/shop/shopping' },
      //{ name: 'Auction', link: '/shop/auction' },
    ],
  },
  {
    name: '트립톡',
    link: '/triptalk',
    submenu: [],
    disabled: false,
  },
  {
    name: '마이페이지',
    link: '/members/mypage',
    submenu: [],
  },
];

const Header: React.FC = () => {
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
  const [accordionOpen, setAccordionOpen] = useState<number | null>(null);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const { isLoggedIn, logout, isAdmin, profileImg, nickname } = useAuth();
  
  // profileImg, nickname 상태 변화 감지 로그 (무한 루프 방지)
  useEffect(() => {
    console.log('👤 [Header] profileImg, nickname 상태 변화:', {
      profileImg,
      nickname
    });
  }, [profileImg, nickname]); // ✅ 실제 의존성 추가

  // 사용자 정보 직접 가져오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await axiosInstance.get('/members/me');
        console.log('🔄 [Header] 사용자 정보 가져오기 성공:', response.data);
        // 여기서 필요한 경우 상태 업데이트
      } catch (error) {
        console.error('🔄 [Header] 사용자 정보 가져오기 실패:', error);
      }
    };
    
    if (isLoggedIn) {
      fetchUserInfo();
    }
  }, [isLoggedIn]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const menu = useMemo(() => {
    if (!isLoggedIn) {
      // 로그인하지 않은 사용자는 마이페이지를 제외한 메뉴만 표시
      return baseMenu.filter(item => item.name !== '마이페이지');
    }
    
    if (isAdmin) {
      // 관리자일 경우, '마이페이지'를 '관리 페이지'로 교체한 새 배열을 반환
      return baseMenu.map((item) =>
        item.name === '마이페이지'
          ? { name: '관리 페이지', link: '/admin', submenu: [] } // 링크도 /admin으로 변경
          : item
      );
    }
    // 일반 사용자는 기존 메뉴를 그대로 반환
    return baseMenu;
  }, [isLoggedIn, isAdmin]); // isLoggedIn과 isAdmin 값이 바뀔 때만 이 로직이 다시 실행됩니다.

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // 모바일 아코디언 토글
  const handleAccordion = (idx: number) => {
    setAccordionOpen(accordionOpen === idx ? null : idx);
  };



  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await logout(); // Contexts에서 제공하는 logout호출
      // 로그인 페이지로 리다이렉트
      window.location.href = '/';
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
      // 에러가 발생해도 토큰을 제거하고 리다이렉트
      window.location.href = '/';
    }
  };



  return (
    <>
      <nav className="main-navbar">
      <div className="main-navbar-container">
        {/* 로고 */}
        <a className="main-navbar-logo" href="/">
          <img src="/images/logo.png" alt="로고" />
        </a>
        {/* 데스크탑 메뉴 */}
        <ul className="main-navbar-menu desktop-menu">
          {menu.map((item, idx) => (
            <li
              key={item.name}
              className={`main-navbar-item${
                item.submenu.length ? ' has-dropdown' : ''
              }${item.disabled ? ' disabled' : ''}${
                openMenu === idx ? ' open' : ''
              }`}
              onMouseEnter={() => setOpenMenu(idx)}
              onMouseLeave={() => setOpenMenu(null)}
            >
              {item.disabled ? (
                <span
                  className="main-navbar-link"
                  style={{ cursor: 'default' }}
                  onClick={(e) => e.preventDefault()}
                >
                  {item.name}
                </span>
              ) : item.link ? (
                <Link to={item.link} className="main-navbar-link">
                  {item.name}
                </Link>
              ) : (
                <a href="#" className="main-navbar-link">
                  {item.name}
                </a>
              )}
              {item.submenu.length > 0 && openMenu === idx && (
                <div className="main-navbar-dropdown">
                  {item.submenu.map((sub) =>
                    typeof sub === 'string' ? (
                      <a
                        key={sub}
                        href="#"
                        className="main-navbar-dropdown-link"
                      >
                        {sub}
                      </a>
                    ) : (
                      <Link
                        key={sub.name}
                        to={sub.link}
                        className="main-navbar-dropdown-link"
                        style={{ pointerEvents: 'auto' }}
                      >
                        {sub.name}
                      </Link>
                    )
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
        {/* 우측 아이콘/프로필 (로그인 상태) */}
        {isLoggedIn ? (
          <div className="main-navbar-right desktop-menu">
            {/* 헤더 아이콘들 */}
            <div className="header-icons">
              <ChatIcon />
              <NotificationBell />
            </div>
            
            <div className="main-navbar-profile-container">
              <div
                className="main-navbar-profile"
                style={{ cursor: 'pointer' }}
                onClick={() => setShowProfileModal(true)}
              >
                <img
                  src={profileImg ? `http://localhost:80${profileImg}` : '/images/logo.png'}
                  alt="프로필"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    console.log('🖼️ [Header] 이미지 로드 실패:', target.src);
                    // 무한 루프 방지: 이미 기본 이미지인 경우 더 이상 변경하지 않음
                    if (target.src !== '/images/logo.png') {
                      target.src = '/images/logo.png';
                    }
                  }}
                  onLoad={() => {
                    console.log('🖼️ [Header] 프로필 이미지 로드 성공:', profileImg);
                  }}
                />
              </div>
              {nickname && (
                <div className="profile-nickname-dropdown" ref={dropdownRef}>
                  <span
                    className="profile-nickname clickable"
                    onClick={() => setShowDropdown((prev) => !prev)}
                  >
                    {nickname}&nbsp;님
                  </span>
                  {showDropdown && (
                    <div className="profile-dropdown-menu">
                      <button onClick={handleLogout} className="logout-btn">
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="main-navbar-right desktop-menu">
            <Link to="/login" className="main-navbar-login-btn">
              Login
            </Link>
          </div>
        )}
        {/* 햄버거 버튼 (모바일) */}
        <button
          className="main-navbar-hamburger mobile-menu"
          onClick={() => setMobileNavOpen(true)}
        >
          <FaBars size={28} />
        </button>
      </div>
      {/* 모바일 오버레이 네비게이션 */}
      <div className={`mobile-nav-overlay${mobileNavOpen ? ' open' : ''}`}>
        <button
          className="mobile-nav-close"
          onClick={() => setMobileNavOpen(false)}
        >
          <FaTimes size={28} />
        </button>
        <ul className="mobile-nav-menu">
          {menu.map((item, idx) => (
            <li
              key={item.name}
              className={`mobile-nav-item${item.disabled ? ' disabled' : ''}`}
            >
              <div
                className={`mobile-nav-link${
                  accordionOpen === idx ? ' open' : ''
                }`}
                onClick={() =>
                  item.submenu.length > 0 ? handleAccordion(idx) : undefined
                }
                                 style={{ cursor: item.disabled ? 'default' : 'pointer' }}
              >
                {item.disabled ? (
                  <span>{item.name}</span>
                ) : item.link ? (
                  <Link to={item.link}>{item.name}</Link>
                ) : (
                  <span>{item.name}</span>
                )}
                {item.submenu.length > 0 && (
                  <span
                    className={`accordion-arrow${
                      accordionOpen === idx ? ' open' : ''}
                    `}
                    style={{ fontSize: '0.95rem' }}
                  >
                    ▼
                  </span>
                )}
              </div>
              {item.submenu.length > 0 && (
                <ul
                  className={`mobile-nav-submenu${
                    accordionOpen === idx ? ' open' : ''
                  }`}
                  style={{
                    maxHeight: accordionOpen === idx ? '300px' : '0',
                    opacity: accordionOpen === idx ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                  }}
                >
                  {item.submenu.map((sub) =>
                    typeof sub === 'string' ? (
                      <li key={sub}>
                        <span>{sub}</span>
                      </li>
                    ) : (
                      <li key={sub.name}>
                        <Link to={sub.link}>{sub.name}</Link>
                      </li>
                    )
                  )}
                </ul>
              )}
            </li>
          ))}
        </ul>
                 <div className="mobile-nav-bottom">
           {isLoggedIn ? (
             <>
               <div className="mobile-profile-section">
                 <span className="main-navbar-profile">
                   <img
                     src={profileImg ? `http://localhost:80${profileImg}` : '/images/logo.png'}
                     alt="프로필"
                     onError={(e) => {
                       const target = e.target as HTMLImageElement;
                       console.log('🖼️ [Header] 모바일 이미지 로드 실패:', target.src);
                       // 무한 루프 방지: 이미 기본 이미지인 경우 더 이상 변경하지 않음
                       if (target.src !== '/images/logo.png') {
                         target.src = '/images/logo.png';
                       }
                     }}
                     onLoad={() => {
                       console.log('🖼️ [Header] 모바일 프로필 이미지 로드 성공:', profileImg);
                     }}
                   />
                 </span>
                 <button onClick={handleLogout} className="mobile-logout-btn">
                   Logout
                 </button>
               </div>
             </>
           ) : (
             <Link to="/login" className="main-navbar-login-btn">
               Login
             </Link>
           )}
         </div>
      </div>

      {/* 프로필 이미지 확대 모달 */}
      {showProfileModal && (
        <div className="profile-modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="profile-modal-close"
              onClick={() => setShowProfileModal(false)}
            >
              <FaTimes size={24} />
            </button>
            <div className="profile-modal-content">
              <img
                src={profileImg ? `http://localhost:80${profileImg}` : '/images/logo.png'}
                alt="프로필 확대"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== '/images/logo.png') {
                    target.src = '/images/logo.png';
                  }
                }}
              />
              {nickname && (
                <div className="profile-modal-info">
                  <h3>{nickname}</h3>
                  <p>프로필 이미지</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
    
      <ChatbotBanner />
    </>
  );
};

export default Header;

