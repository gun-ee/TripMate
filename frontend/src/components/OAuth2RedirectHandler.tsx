// frontend/src/components/OAuth2RedirectHandler.tsx
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../api/axios';

function getQueryParams(search: string) {
  return Object.fromEntries(new URLSearchParams(search));
}

const OAuth2RedirectHandler: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { socialLogin } = useAuth();

  useEffect(() => {
    const params = getQueryParams(location.search);
    const { token, role, profileImg, nickname, needPhoneInput, memberId }: {
      token?: string;
      role?: string;
      profileImg?: string;
      nickname?: string;
      needPhoneInput?: string;
      memberId?: string;
    } = params;

    if (!token) return;

    // 로그인 이미 되어 있으면 재로그인 방지
    if (!localStorage.getItem('accessToken')) {
      // localStorage에 직접 설정 (기존 프로젝트와 동일한 방식)
      localStorage.setItem('accessToken', token);
      localStorage.setItem('profileImg', profileImg || '');
      localStorage.setItem('nickname', nickname || '');
      if (memberId) {
        localStorage.setItem('id', memberId);
      }
      
      socialLogin(
        token,
        role || 'USER',
        profileImg || '/images/profile-default.png',
        nickname || '',
        memberId
      );
    }

    if (needPhoneInput === 'true') {
      fetchMemberInfo(token).then(memberInfo => {
        navigate('/members/social-extra', {
          state: { member: memberInfo },
          replace: true
        });
      }).catch(error => {
        console.error('회원 정보 가져오기 실패:', error);
        navigate('/members/social-extra', { replace: true });
      });
    } else {
      navigate('/', { replace: true });
    }
  }, [location, navigate, socialLogin]);

  const fetchMemberInfo = async (token: string) => {
    try {
      const response = await axiosInstance.get('/members/me');
      const memberInfo = response.data;
      return memberInfo;
    } catch (error: any) {
      console.error('회원 정보 API 호출 실패:', error);
      return {};
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">소셜 로그인 처리 중...</p>
      </div>
    </div>
  );
};

export default OAuth2RedirectHandler;