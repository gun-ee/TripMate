import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../api/axios';


interface Member {
  member_ProfileImg?: string;
  member_NickName?: string;
  member_Email?: string;
}
    
interface LocationState {
  member?: Member;
}

function MemberSocialExtra() {
  const location = useLocation();
  const state = location.state as LocationState;
  const member = state?.member || {};
  
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div 
            className="cursor-pointer mb-6" 
            onClick={handleLogoClick}
          >
            <img 
              src="/images/logo.png" 
              alt="TripMate 로고" 
              className="h-16 mx-auto mb-2" 
            />
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-9">
            추가 정보 입력
          </h2>
          
          {/* Profile Image */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            {member.member_ProfileImg ? (
              <img 
                src={member.member_ProfileImg} 
                alt="프로필 이미지" 
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-700"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-gray-700 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="text-center mb-8">
          <div className="text-lg font-bold text-gray-900 mb-1">
            {member.member_NickName || '사용자'}
          </div>
          <div className="text-sm text-gray-600">
            {member.member_Email || '이메일 정보 없음'}
          </div>
        </div>

        {/* Messages */}
        {success && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
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
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-gray-50 focus:bg-white transition-all duration-200"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-bold rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '처리 중...' : '가입하기'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default MemberSocialExtra;
