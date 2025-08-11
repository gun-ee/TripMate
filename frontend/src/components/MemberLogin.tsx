import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../api/axios';
import './MemberLogin.css';

function LoginForm() {
  const location = useLocation();
  const toast = location.state?.toast;
  const userIdFromState = location.state?.userId || ""; // 인증된 이메일
  const [email, setEmail] = useState(userIdFromState); // 여기 초기값에 반영
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [toastMessage, setToastMessage] = useState(''); // 커스텀 토스트용
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    if (toast) {
      // 예: 토스트 메시지 띄우기
      alert(toast); // 또는 setToastMessage(toast) 등
    }
  }, [toast]);

  
  const isValidEmail = (value: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;
    if (!email.trim()) {
      setEmailError(true);
      hasError = true;
    } else if (!isValidEmail(email)) {
      setEmailError(true);
      hasError = true;
    } else {
      setEmailError(false);
    }
    if (!password.trim()) {
      setPasswordError(true);
      hasError = true;
    } else {
      setPasswordError(false);
    }
    if (hasError) return;
    setLoginError('');
    
    try {
      const response = await axiosInstance.post('/members/login', { email, password });
      const data = response.data;
      console.log('로그인 응답 데이터:', data); // 디버깅용
      
      // AuthContext의 login 함수 호출
      if (data.token) {
        await login(data.token, data.role || 'USER', data.profileImg || '', data.nickname || '');
        
        // 추가: memberId 저장 - 결제 검증할때 반드시 보내야하는 데이터
        if (data.memberId) {
          localStorage.setItem('id', data.memberId);
        }
        
        // 로그인 성공 후 홈으로 이동
        navigate('/');
      } else {
        setLoginError('토큰이 없습니다.');
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      setLoginError('로그인 중 오류가 발생했습니다.');
    }
  };

  const handleSocialLogin = (provider: string) => {
    window.location.href = `http://localhost:80/oauth2/authorization/${provider}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorMsg = params.get('error');
    if (errorMsg) {
      if (decodeURIComponent(errorMsg).includes('이미 해당 이메일로 가입된 계정이 있습니다')) {
        setToastMessage('이미 사용중인 이메일 입니다.');
      } else {
        setToastMessage(decodeURIComponent(errorMsg));
      }
      params.delete('error');
      navigate({
        pathname: location.pathname,
        search: params.toString()
      }, { replace: true });
    }
  }, [location, navigate]);

  // 토스트 메시지 자동 제거 (2초 후)
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const profileImg = params.get("profileImg");
    const nickname = params.get("nickname");
    const memberId = params.get("memberId"); //추가-결제검증에 필요

    if (token) {
      localStorage.removeItem("accessToken"); // 기존 토큰 제거
      localStorage.setItem("accessToken", token); // 새 토큰 저장
      localStorage.setItem("profileImg", profileImg || "");
      localStorage.setItem("nickname", nickname || "");

      //추가 - id 저장 - 결제 검증할 때 반드시 보내야 하는 데이터
      if (memberId) {
        localStorage.setItem("id", memberId);
      }

      console.log("소셜 로그인 토큰 저장 완료:", token);
      window.location.href = "/"; // 또는 navigate("/") 사용 가능
    }
  }, []);

  return (
    <div className="login-page-wrapper">
      <div className="login-container">
        <div className="login-header">
          <div className="logo" style={{ cursor: 'pointer' }} onClick={() => window.location.href = '/'}>
            <img src="/images/logo.png" alt="로고" className="logo-img" />
          </div>
        </div>
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group">
            <label htmlFor="member_email">이메일(아이디)</label>
            <input
              type="text"
              id="member_email"
              name="member_email"
              placeholder="이메일(아이디)를 입력하세요"
              value={email}
              onChange={e => { setEmail(e.target.value); setEmailError(false); }}
              className={emailError ? 'input-error' : ''}
            />
            {emailError && (
              <div className="error">이메일을 입력해주세요.</div>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="member_pw">비밀번호</label>
            <input
              type="password"
              id="member_pw"
              name="member_pw"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={e => { setPassword(e.target.value); setPasswordError(false); }}
              className={emailError ? 'input-error' : ''}
            />
            {passwordError && (
              <div className="error">비밀번호를 입력해주세요.</div>
            )}
          </div>
          <button type="submit" className="login-btn">로그인</button>
          {loginError && <div className="login-error">{loginError}</div>}
          <div className="find-links">
            <div className="find-links-group">
              <a href="/find-id" id="findId">아이디 찾기</a>
              <a href="/find-pw" id="findPw">비밀번호 찾기</a>
            </div>
            <a href="signup" id="signUp" className="signup-link">회원가입</a>
          </div>
        </form>
        <div className="social-login">
          <hr className="divider" />
          <div className="social-btns">
            <button type="button" className="social-btn social-kakao" onClick={() => handleSocialLogin('kakao')}>Kakao로 로그인</button>
            <button type="button" className="social-btn social-naver" onClick={() => handleSocialLogin('naver')}>NAVER로 로그인</button>
            <button type="button" className="social-btn social-google" onClick={() => handleSocialLogin('google')}>Google로 로그인</button>
          </div>
        </div>
      </div>
      {toastMessage && (
        <div className="toast-message">{toastMessage}</div>
      )}
    </div>
  );
}

export default LoginForm;
