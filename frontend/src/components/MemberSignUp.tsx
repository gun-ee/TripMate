import React, { useState, useRef } from 'react';
import './MemberSignUp.css';
import axiosInstance from '../api/axios';
import { useNavigate } from 'react-router-dom';


const initialState = {
  email: '',
  emailVerified: false,
  verificationCode: '',
  verificationCodeSent: false,
  verificationCodeInput: '',
  verificationCodeSuccess: false,
  password: '',
  confirmPassword: '',
  nickname: '',
  phone: '',
  profileImgFile: null,
  terms1: false,
  terms2: false,
  terms3: false,
};

const MemberSignUp = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    ...initialState,
    member_Email: '',
    member_Pw: '',
  });
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState('');
  const [passwordStrengthLevel, setPasswordStrengthLevel] = useState('');
  const [profileImgPreview, setProfileImgPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeBtnCompleted, setCodeBtnCompleted] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [timer, setTimer] = useState(0);
  const [isCodeExpired, setIsCodeExpired] = useState(false);
  const [newMemberId, setNewMemberId] = useState(null);
  const fileInputRef = useRef();

  // 토스트 메시지 자동 제거
  React.useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // 타이머 관리
  React.useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prevTimer => {
          if (prevTimer <= 1) {
            setIsCodeExpired(true);
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  // 타이머 포맷팅 함수
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 유효성 검사 함수들
  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isValidPhone = (value) => /^01[0-9]-[0-9]{3,4}-[0-9]{4}$/.test(value);
  const isValidPassword = (pw) => {
    if (pw.length < 8) return false;
    if (!/[a-z]/.test(pw)) return false;
    if (!/[A-Z]/.test(pw)) return false;
    if (!/[0-9]/.test(pw)) return false;
    if (!/[^A-Za-z0-9]/.test(pw)) return false;
    return true;
  };
  const checkPasswordStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 2) return { level: 'weak', text: '약함' };
    if (score <= 3) return { level: 'medium', text: '보통' };
    return { level: 'strong', text: '강함' };
  };

  // 이메일 인증번호 보내기
  const handleSendVerification = async () => {
    if (!isValidEmail(form.member_Email)) {
      setErrors((e) => ({ ...e, member_Email: '올바른 이메일 형식을 입력해주세요.' }));
      return;
    }
    setLoading(true);
    try {
      const response = await axiosInstance.post('/auth/send-code', 
        new URLSearchParams({ email: form.member_Email }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );
      
      if (response.status === 200) {
        setForm((f) => ({ ...f, verificationCodeSent: true }));
        setToastMessage('이메일로 인증코드가 전송되었습니다.');
        setTimer(180);
        setIsCodeExpired(false);
        setForm((f) => ({ ...f, verificationCodeInput: '' }));
      }
    } catch (error) {
      setToastMessage('인증번호 전송 실패');
      console.error('인증번호 전송 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 인증코드 확인 (실제 검증)
  const handleVerifyCode = async () => {
    if (!form.verificationCodeInput) {
      setErrors((e) => ({ ...e, verificationCode: '인증코드를 입력해주세요.' }));
      return;
    }
    setCodeLoading(true);
    try {
      const response = await axiosInstance.post('/auth/verify-code',
        new URLSearchParams({
          email: form.member_Email,
          code: form.verificationCodeInput,
        }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );
      
      if (response.status === 200) {
        setForm((f) => ({ ...f, emailVerified: true }));
        setCodeBtnCompleted(true);
        setErrors((e) => ({ ...e, verificationCode: undefined }));
        setTimer(0);
        setToastMessage('인증 성공!');
      }
    } catch (error) {
      setErrors((e) => ({ ...e, verificationCode: '인증코드가 올바르지 않습니다.' }));
      setToastMessage('인증코드가 올바르지 않습니다.');
      console.error('인증코드 확인 오류:', error);
    } finally {
      setCodeLoading(false);
    }
  };

  // 재전송 처리
  const handleResendCode = () => {
    setForm((f) => ({ ...f, verificationCodeInput: '' }));
    setErrors((e) => ({ ...e, verificationCode: undefined }));
    setIsCodeExpired(false);
    setTimer(180); // 3분 타이머 재시작
    setToastMessage('인증코드가 재전송되었습니다.');
  };

  // 비밀번호 강도 체크
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, member_Pw: value }));

    if (value.length > 0) {
      const strength = checkPasswordStrength(value);
      setPasswordStrength(strength.text);
      setPasswordStrengthLevel(strength.level);
    } else {
      setPasswordStrength('');
      setPasswordStrengthLevel('');
    }
  };

  // 프로필 이미지 미리보기
  const handleProfileImgChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((e) => ({ ...e, profileImg: '파일 크기는 5MB를 초과할 수 없습니다.' }));
        setProfileImgPreview(null);
        return;
      }
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setErrors((e) => ({ ...e, profileImg: '지원하지 않는 이미지 형식입니다. (JPG, JPEG, PNG, GIF만 허용)' }));
        setProfileImgPreview(null);
        return;
      }
      setForm((f) => ({ ...f, profileImgFile: file }));
      setErrors((e) => ({ ...e, profileImg: undefined }));
      const reader = new FileReader();
      reader.onload = (ev) => setProfileImgPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setProfileImgPreview(null);
    }
  };

  // 연락처 하이픈 자동 입력
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    let formatted = value;
    if (value.length >= 7) {
      formatted = value.replace(/(\d{3})(\d{4})(\d{0,4})/, '$1-$2-$3').replace(/-$/, '');
    } else if (value.length >= 4) {
      formatted = value.replace(/(\d{3})(\d{0,4})/, '$1-$2');
    }
    setForm(f => ({ ...f, phone: formatted }));
    setErrors(err => ({ ...err, phone: undefined }));
  };

  // 입력값 변경 핸들러
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    setErrors((err) => ({ ...err, [name]: undefined }));
  };


  // 폼 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    let valid = true;
    let newErrors = {};

    if (!isValidEmail(form.member_Email)) {
      newErrors.member_Email = '올바른 이메일 형식을 입력해주세요.';
      valid = false;
    }
    if (!form.emailVerified) {
      newErrors.member_Email = '이메일 인증을 완료해주세요.';
      valid = false;
    }
    if (!isValidPassword(form.member_Pw)) {
      newErrors.member_Pw = '비밀번호는 8자 이상, 영문 대소문자, 숫자, 특수문자를 모두 포함해야 합니다.';
      valid = false;
    }
    if (form.member_Pw !== form.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
      valid = false;
    }
    if (!form.nickname) {
      newErrors.nickname = '닉네임을 입력해주세요.';
      valid = false;
    }
    if (!isValidPhone(form.phone)) {
      newErrors.phone = '올바른 연락처 형식을 입력해주세요.';
      valid = false;
    }
    if (!form.terms1) {
      newErrors.terms1 = '필수 약관에 동의해야 합니다.';
      valid = false;
    }
    if (!form.terms2) {
      newErrors.terms2 = '필수 약관에 동의해야 합니다.';
      valid = false;
    }

    setErrors(newErrors);
    if (!valid) return;

    // 실제 회원가입 API 연동
    try {
      const formData = new FormData();

      // JSON 데이터를 문자열로 변환하여 추가
      const memberData = {
        nickname: form.nickname,
        email: form.member_Email,
        password: form.member_Pw,
        phone: form.phone
      };

      formData.append('data', new Blob([JSON.stringify(memberData)], {
        type: 'application/json'
      }));

      // 프로필 이미지 파일이 있으면 추가
      if (form.profileImgFile) {
        formData.append('member_ProfileImgFile', form.profileImgFile);
      }

      const response = await axiosInstance.post('/members/signup', formData);

      if (response.status === 200) {
        const responseData = response.data;
        setNewMemberId(responseData.memberId);
        setToastMessage('회원가입이 완료되었습니다!');
        
        // 1초 후 로그인 페이지로 이동
        setTimeout(() => {
          navigate('/login');
        }, 1000);
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      if (error.response?.data) {
        setToastMessage(`회원가입 실패: ${error.response.data}`);
      } else {
        setToastMessage('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  };

    return (
    <div className="signup-container">
      <div className="container">
        <div className="header">
          <div className="logo" style={{ cursor: 'pointer' }} onClick={() => window.location.href = '/'}>
            <img src="/images/logo.png" alt="로고" className="logo-img" />
          </div>
          <p>새로운 계정을 만들어보세요</p>
        </div>
        <form onSubmit={handleSubmit} encType="multipart/form-data" autoComplete="off">
          {/* 이메일(아이디) */}
          <div className="form-group">
            <label htmlFor="member_Email">이메일(아이디) *</label>
            <div className="email-verification">
              <div className="form-group">
                <input
                  type="email"
                  id="member_Email"
                  name="member_Email"
                  required
                  placeholder="이메일을 입력하세요"
                  value={form.member_Email}
                  onChange={handleChange}
                  disabled={form.emailVerified}
                />
              </div>
              <button
                type="button"
                className="verify-btn"
                onClick={handleSendVerification}
                disabled={form.emailVerified || loading || form.verificationCodeSent}
              >
                인증
              </button>
            </div>
            {errors.member_Email && <div className="error">{errors.member_Email}</div>}
          </div>
          {/* 이메일 인증코드 */}
          <div className={`verification-code${form.verificationCodeSent ? ' show' : ''}`}>
            <div className="verification-input">
              <div className="form-group">
                <label htmlFor="verificationCodeInput">인증코드 *</label>
                <input
                  type="text"
                  id="verificationCodeInput"
                  name="verificationCodeInput"
                  placeholder="인증코드를 입력하세요"
                  value={form.verificationCodeInput}
                  onChange={handleChange}
                  disabled={form.emailVerified || isCodeExpired}
                />
                {timer > 0 && (
                  <div className="timer-display">
                    {formatTime(timer)}
                  </div>
                )}
                {isCodeExpired && (
                  <div className="expired-message">
                    인증코드가 만료되었습니다. 재전송해주세요.
                  </div>
                )}
                {errors.verificationCode && <div className="error">{errors.verificationCode}</div>}
                {form.emailVerified && <div className="success">인증이 완료되었습니다.</div>}
              </div>
              <button
                type="button"
                className={`verify-code-btn${codeBtnCompleted ? ' completed' : ''}`}
                onClick={isCodeExpired ? handleResendCode : handleVerifyCode}
                disabled={form.emailVerified || codeLoading}
              >
                {form.emailVerified ? '인증완료' : (codeLoading ? '확인 중...' : (isCodeExpired ? '재전송' : '확인'))}
              </button>
            </div>
          </div>
          {/* 비밀번호 */}
          <div className="form-group">
            <label htmlFor="member_Pw">비밀번호 *</label>
            <input
              type="password"
              id="member_Pw"
              name="member_Pw"
              required
              placeholder="비밀번호를 입력하세요"
              value={form.member_Pw}
              onChange={handlePasswordChange}
            />
            {passwordStrength && (
              <div className={`password-strength strength-${passwordStrengthLevel}`}>비밀번호 강도: {passwordStrength}</div>
            )}
            {errors.member_Pw && <div className="error">{errors.member_Pw}</div>}
          </div>
          {/* 비밀번호 확인 */}
          <div className="form-group">
            <label htmlFor="confirmPassword">비밀번호 확인 *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required
              placeholder="비밀번호를 다시 입력하세요"
              value={form.confirmPassword}
              onChange={handleChange}
            />
            {errors.confirmPassword && <div className="error">{errors.confirmPassword}</div>}
          </div>
          {/* 닉네임 */}
          <div className="form-group">
            <label htmlFor="nickname">닉네임 *</label>
            <input
              type="text"
              id="nickname"
              name="nickname"
              required
              placeholder="닉네임을 입력하세요"
              value={form.nickname}
              onChange={handleChange}
            />
            {errors.nickname && <div className="error">{errors.nickname}</div>}
          </div>
          {/* 연락처 */}
          <div className="form-group">
            <label htmlFor="phone">연락처 *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              placeholder="연락처를 입력하세요 (예: 010-1234-5678)"
              value={form.phone}
              onChange={handlePhoneChange}
            />
            {errors.phone && <div className="error">{errors.phone}</div>}
          </div>
          {/* 프로필 이미지 업로드 */}
          <div className="form-group">
            <label htmlFor="profileImgFile">프로필 이미지 (선택사항)</label>
            <div className="profile-img-upload">
              {profileImgPreview ? (
                <img
                  src={profileImgPreview}
                  alt="미리보기"
                  className="profile-img-preview"
                />
              ) : (
                <div className="profile-img-preview">
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="32" cy="32" r="32" fill="#e0e7ef"/>
                    <ellipse cx="32" cy="26" rx="14" ry="14" fill="#b0b8c1"/>
                    <ellipse cx="32" cy="50" rx="20" ry="12" fill="#d1d5db"/>
                  </svg>
                </div>
              )}
              <label htmlFor="profileImgFile" className="profile-img-label">사진 선택</label>
              <input
                type="file"
                id="profileImgFile"
                name="profileImgFile"
                accept="image/*"
                className="profile-img-input"
                onChange={handleProfileImgChange}
                ref={fileInputRef}
              />
              <div className="profile-img-info">
                지원 형식: JPG, JPEG, PNG, GIF (최대 5MB)
              </div>
            </div>
            {errors.profileImg && <div className="error">{errors.profileImg}</div>}
          </div>
          {/* 약관동의 */}
          <div className="form-group">
            <div className="checkbox-row">
              <label><input type="checkbox" name="terms1" checked={form.terms1} onChange={handleChange} required /> (필수) 만 14세 이상이며, 이용약관에 동의합니다.</label>
            </div>
            <div className="checkbox-row">
              <label><input type="checkbox" name="terms2" checked={form.terms2} onChange={handleChange} required /> (필수) 개인정보 수집 및 이용에 동의합니다.</label>
            </div>
            <div className="checkbox-row">
              <label><input type="checkbox" name="terms3" checked={form.terms3} onChange={handleChange} /> (선택) 마케팅 정보 수신에 동의합니다.</label>
            </div>
            {(errors.terms1 || errors.terms2) && <div className="error">{errors.terms1 || errors.terms2}</div>}
          </div>
          <button type="submit" className="submit-btn">회원가입</button>
        </form>
      </div>
      {toastMessage && (
        <div className="toast-message">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default MemberSignUp;
