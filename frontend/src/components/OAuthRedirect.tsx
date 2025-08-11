// frontend/src/components/OAuthRedirect.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const OAuthRedirect: React.FC = () => {
  const navigate = useNavigate();
  const { socialLogin } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const profileImg = params.get('profileImg');
    const nickname = params.get('nickname');

    if (token) {
      // 기존 토큰 초기화
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');

      // 소셜 로그인 처리
      socialLogin(
        token,
        'USER',
        profileImg || '',
        nickname || ''
      );

      navigate('/');
    } else {
      alert('토큰이 전달되지 않았습니다.');
      navigate('/login');
    }
  }, [navigate, socialLogin]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">소셜 로그인 처리 중...</p>
      </div>
    </div>
  );
};

export default OAuthRedirect;