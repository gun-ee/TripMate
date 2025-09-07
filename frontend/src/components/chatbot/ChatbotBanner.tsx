import React, { useState } from 'react';
import { FaRobot, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import TripMateBot from './TripMateBot';
import './ChatbotBanner.css';

const ChatbotBanner: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const { isLoggedIn } = useAuth();

  // 챗봇 위젯 열기
  const handleOpenChatbot = () => {
    setIsWidgetOpen(true);
  };

  // 챗봇 위젯 닫기
  const handleCloseChatbot = () => {
    setIsWidgetOpen(false);
  };

  if (!isLoggedIn) return null;

  return (
    <>
      {/* 챗봇 아이콘 */}
      <div className="chatbot-icon-container">
        <button
          className="chatbot-icon"
          onClick={handleOpenChatbot}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          aria-label="챗봇"
          title="TripMate 챗봇"
        >
          <FaRobot className="chatbot-icon-svg" />
        </button>
        
        {isHovered && (
          <div className="chatbot-tooltip">
            TripMate 챗봇
          </div>
        )}
      </div>

      {/* 챗봇 위젯 */}
      {isWidgetOpen && (
        <div className="chatbot-widget">
          <div className="chatbot-widget-header">
            <h3>TripMate 챗봇</h3>
            <button 
              className="chatbot-widget-close"
              onClick={handleCloseChatbot}
              aria-label="닫기"
            >
              <FaTimes />
            </button>
          </div>
          <div className="chatbot-widget-content">
            <TripMateBot />
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotBanner;
