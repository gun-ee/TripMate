import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../api/axios';
import './MemberSocialExtra.css';

interface Member {
  profileImg?: string;
  nickname?: string;
  email?: string;
}
    
interface LocationState {
  member?: Member;
}

function MemberSocialExtra() {
  const location = useLocation();
  const state = location.state as LocationState;
  const member = state?.member || {};
  
  // 디버깅을 위한 콘솔 로그
  console.log('📍 MemberSocialExtra - member 정보:', member);
  console.log('📍 MemberSocialExtra - profileImg 경로:', member.profileImg);
  console.log('📍 MemberSocialExtra - 완전한 이미지 URL:', member.profileImg ? `http://localhost:80${member.profileImg}` : '없음');
  
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(!member.profileImg);
  const navigate = useNavigate();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length >= 3 && value.length <= 7) {
      value = value.slice(0, 3) + '-' + value.slice(3);
    } else if (value.length > 7) {
      value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11);
    }
    setPhone(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    const phonePattern = /^[0-9]{3}-[0-9]{4}-[0-9]{4}$/;
    if (!phonePattern.test(phone)) {
      setError('올바른 연락처 형식으로 입력해 주세요.');
      setIsLoading(false);
      return;
    }

    try {
      await axiosInstance.post('/members/update-phone', { phone });
      setSuccess('전화번호가 성공적으로 업데이트되었습니다.');
      
      // 성공 후 1초 뒤 메인 페이지로 이동
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '전화번호 업데이트 중 오류가 발생했습니다.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <div className="member-social-extra-page">
      <div className="member-social-extra-container">
        {/* Header */}
        <div className="member-social-extra-header">
          <div 
            className="logo-container" 
            onClick={handleLogoClick}
          >
            <img 
              src="/images/logo.png" 
              alt="TripMate 로고" 
              className="logo-img" 
            />
          </div>
          <h2 className="header-title">
            추가 정보 입력
          </h2>
          
          {/* Profile Image */}
          <div className="profile-image-wrapper">
            {member.profileImg && !showPlaceholder && (
              <img 
                src={`http://localhost:80${member.profileImg}`}
                alt="프로필 이미지" 
                className="profile-image"
                onError={() => {
                  setShowPlaceholder(true);
                }}
              />
            )}
            {showPlaceholder && (
              <div className="profile-image-placeholder">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="user-info">
          <div className="user-nickname">
            {member.nickname || '사용자'}
          </div>
          <div className="user-email">
            {member.email || '이메일 정보 없음'}
          </div>
        </div>

        {/* Messages */}
        {success && (
          <div className="message success">
            {success}
          </div>
        )}
        {error && (
          <div className="message error">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="phone">
              연락처 *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              placeholder="연락처를 입력하세요 (예: 010-1234-5678)"
              value={phone}
              onChange={handlePhoneChange}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="submit-button"
          >
            {isLoading ? '처리 중...' : '가입하기'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default MemberSocialExtra;