import React, { useState, useEffect } from 'react';
import { FaRobot, FaTimes, FaMinus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './ChatbotBanner.css';

const ChatbotBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  // 로컬 스토리지에서 상태 복원
  useEffect(() => {
    const savedVisibility = localStorage.getItem('chatbot-banner-visible');
    const savedMinimized = localStorage.getItem('chatbot-banner-minimized');
    
    if (savedVisibility === 'false') {
      setIsVisible(false);
    }
    if (savedMinimized === 'true') {
      setIsMinimized(true);
    }
  }, []);

  // 상태 저장
  const saveVisibility = (visible: boolean) => {
    localStorage.setItem('chatbot-banner-visible', visible.toString());
  };

  const saveMinimized = (minimized: boolean) => {
    localStorage.setItem('chatbot-banner-minimized', minimized.toString());
  };

  // 챗봇 열기
  const handleOpenChatbot = () => {
    navigate('/chatbot');
  };

  // 배너 닫기
  const handleClose = () => {
    setIsVisible(false);
    saveVisibility(false);
  };

  // 배너 최소화/최대화
  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
    saveMinimized(!isMinimized);
  };

  if (!isLoggedIn || !isVisible) return null;

  return (
    <div className={`chatbot-banner ${isMinimized ? 'minimized' : ''}`}>
      <div className="chatbot-content">
        <div className="chatbot-info">
          <div className="chatbot-icon">
            <FaRobot />
          </div>
          <div className="chatbot-text">
            <div className="chatbot-title">TripMate 챗봇</div>
            <div className="chatbot-description">
              여행 관련 질문을 도와드려요!
            </div>
          </div>
        </div>
        
        <div className="chatbot-actions">
          <button
            className="chatbot-btn minimize-btn"
            onClick={handleToggleMinimize}
            title={isMinimized ? '최대화' : '최소화'}
          >
            <FaMinus />
          </button>
          <button
            className="chatbot-btn close-btn"
            onClick={handleClose}
            title="닫기"
          >
            <FaTimes />
          </button>
        </div>
      </div>
      
      {!isMinimized && (
        <div className="chatbot-footer">
          <button
            className="chatbot-open-btn"
            onClick={handleOpenChatbot}
          >
            챗봇과 대화하기
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatbotBanner;
