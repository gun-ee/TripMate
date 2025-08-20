// frontend/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authApi } from '../api/auth';

interface User {
  id?: number;
  email: string;
  nickname: string;
  phone: string;
  profileImg?: string;
  role?: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  profileImg: string;
  role: string;
  nickname: string;
  email: string | null;
  isAdmin: boolean;
  login: (token: string, role: string, profileImg: string, nickname: string) => Promise<void>;
  socialLogin: (token: string, role: string, profileImg: string, nickname: string, id?: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('accessToken'));
  const [profileImg, setProfileImg] = useState(() => {
    const savedImg = localStorage.getItem('profileImg');
    return savedImg && savedImg.trim() !== '' ? savedImg : '/images/profile-default.png';
  });
  const [role, setRole] = useState(localStorage.getItem('role') || '');
  const [nickname, setNickname] = useState(localStorage.getItem('nickname') || '');
  const [email, setEmail] = useState(localStorage.getItem('email') || null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  const login = async (token: string, role: string, profileImg: string, nickname: string, memberId?: number) => {
    try {
      const decoded = jwtDecode(token);
      const userEmail = decoded.sub; // 토큰에서 이메일(sub) 추출

      localStorage.setItem('accessToken', token);
      localStorage.setItem('role', role);
      localStorage.setItem('profileImg', profileImg || '');
      localStorage.setItem('nickname', nickname || '');
      localStorage.setItem('email', userEmail); // email도 localStorage에 저장
      if (memberId) {
        localStorage.setItem('memberId', memberId.toString()); // memberId 저장
      }

      setIsLoggedIn(true);
      setRole(role);
      setNickname(nickname || '');
      const finalProfileImg = profileImg && profileImg.trim() !== '' ? profileImg : '/images/profile-default.png';
      setProfileImg(finalProfileImg);
      setEmail(userEmail); // state에도 email 저장
      setIsAdmin(role === 'ADMIN');
    } catch (error) {
      console.error("로그인 처리 중 토큰 디코딩 실패", error);
      logout(); // 문제 발생 시 로그아웃 처리
    }
  };

  // 소셜 로그인용 함수
  const socialLogin = async (token: string, role: string, profileImg: string, nickname: string, id?: string) => {
    try {
      const decoded = jwtDecode(token);
      const userEmail = decoded.sub; // 토큰에서 이메일(sub) 추출

      localStorage.setItem('accessToken', token);
      localStorage.setItem('role', role);
      localStorage.setItem('profileImg', profileImg || '');
      localStorage.setItem('nickname', nickname || '');
      localStorage.setItem('email', userEmail); // email도 localStorage에 저장
      if (id) {
        localStorage.setItem('memberId', id); // memberId 저장
      }

      setIsLoggedIn(true);
      setRole(role);
      setNickname(nickname || '');
      const finalProfileImg = profileImg && profileImg.trim() !== '' ? profileImg : '/images/profile-default.png';
      setProfileImg(finalProfileImg);
      setEmail(userEmail); // state에도 email 저장
      setIsAdmin(role === 'ADMIN');
    } catch (error) {
      console.error("소셜 로그인 처리 중 토큰 디코딩 실패", error);
      logout(); // 문제 발생 시 로그아웃 처리
    }
  };

  const signup = async (data: any) => {
    try {
      const response = await authApi.signup(data);
      localStorage.setItem('accessToken', response.token);
      localStorage.setItem('role', response.member.role || '');
      localStorage.setItem('profileImg', response.member.profileImg || '');
      localStorage.setItem('nickname', response.member.nickname || '');
      localStorage.setItem('email', response.member.email || '');
      if (response.member.id) {
        localStorage.setItem('memberId', response.member.id.toString()); // memberId 저장
      }
      
      setIsLoggedIn(true);
      setIsAdmin(response.member.role === 'ADMIN');
      setProfileImg(response.member.profileImg || '/images/profile-default.png');
      setNickname(response.member.nickname || '');
      setEmail(response.member.email || '');
    } catch (error) {
      console.error('회원가입 실패:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('로그아웃 시작 - 현재 토큰:', localStorage.getItem('accessToken'));
      await authApi.logout();
    } catch (error) {
      console.error('로그아웃 실패:', error);
    } finally {
      console.log('토큰 제거 전:', localStorage.getItem('accessToken'));
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('profileImg');
      localStorage.removeItem('nickname');
      localStorage.removeItem('email');
      localStorage.removeItem('id');
      // 이전 키들도 정리
      localStorage.removeItem('member_ProfileImg');
      localStorage.removeItem('member_Nickname');
      localStorage.removeItem('member_Role');
      localStorage.removeItem('memberId');
      console.log('토큰 제거 후:', localStorage.getItem('accessToken'));
      setIsLoggedIn(false);
      setRole('');
      setProfileImg('/images/profile-default.png');
      setNickname('');
      setEmail(null);
      setIsAdmin(false);
    }
  };

  // 페이지 새로고침 시 localStorage의 정보로 상태를 복원하는 로직 (무한 루프 방지)
  useEffect(() => {
    console.log('🔄 [AuthContext] useEffect 실행 - localStorage 복원 시작');
    const token = localStorage.getItem('accessToken');
    console.log('🔄 [AuthContext] localStorage에서 토큰 확인:', token ? '토큰 있음' : '토큰 없음');
    
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log('🔄 [AuthContext] 토큰 디코딩 성공:', decoded);
        
        if (decoded.exp && decoded.exp * 1000 > Date.now()) {
          // 토큰이 유효하면 모든 상태를 localStorage 값으로 복원
          console.log('🔄 [AuthContext] 토큰 유효 - 상태 복원 시작');
          setIsLoggedIn(true);
          const savedRole = localStorage.getItem('role') || '';
          setRole(savedRole);
          setIsAdmin(savedRole === 'ADMIN');
          setNickname(localStorage.getItem('nickname') || '');
          setEmail(localStorage.getItem('email') || decoded.sub || '');
          const savedImg = localStorage.getItem('profileImg');
          setProfileImg(savedImg && savedImg.trim() !== '' ? savedImg : '/images/profile-default.png');
          console.log('🔄 [AuthContext] 상태 복원 완료');
        } else {
          // 토큰이 만료되었으면 로그아웃 처리
          console.log('🔄 [AuthContext] 토큰 만료 - 로그아웃 처리');
          logout();
        }
      } catch (error) {
        console.error("페이지 로드 시 토큰 처리 오류", error);
        logout();
      }
    } else {
      console.log('🔄 [AuthContext] 토큰 없음 - 초기 상태 유지');
    }
  }, []); // ✅ 빈 배열로 한 번만 실행

  const value: AuthContextType = {
    isLoggedIn,
    profileImg,
    role,
    nickname,
    email,
    isAdmin,
    login,
    socialLogin,
    signup,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};