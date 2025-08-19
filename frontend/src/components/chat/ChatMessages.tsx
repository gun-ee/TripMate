import React, { useRef, useEffect } from 'react';
import type { ChatMessage } from '../../types/regionChat';

interface ChatMessagesProps {
  messages: ChatMessage[];
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 시간 포맷팅 함수 (yyyy-MM-DD 오전/오후 hh:mm 형식)
  const formatMessageTime = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    const ampm = hours < 12 ? '오전' : '오후';
    const displayHours = hours < 12 ? hours : hours === 12 ? 12 : hours - 12;
    const displayHoursStr = displayHours === 0 ? '12' : String(displayHours).padStart(2, '0');
    
    return `${year}-${month}-${day} ${ampm} ${displayHoursStr}:${minutes}`;
  };

  // 날짜 구분선 표시 함수
  const shouldShowDateSeparator = (currentIndex: number): boolean => {
    if (currentIndex === 0) return true;
    
    const currentMessage = messages[currentIndex];
    const previousMessage = messages[currentIndex - 1];
    
    if (!currentMessage || !previousMessage) return false;
    
    const currentDate = new Date(currentMessage.createdAt).toDateString();
    const previousDate = new Date(previousMessage.createdAt).toDateString();
    
    return currentDate !== previousDate;
  };

  // 날짜 구분선 텍스트 생성
  const getDateSeparatorText = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}년 ${month}월 ${day}일`;
  };

  // 메시지 자동 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="chat-messages">
      {messages.length === 0 ? (
        <div className="no-messages">
          <p>아직 메시지가 없습니다.</p>
          <p>첫 번째 메시지를 남겨보세요!</p>
        </div>
      ) : (
        messages.map((message, index) => (
          <React.Fragment key={message.id}>
            {/* 날짜 구분선 */}
            {shouldShowDateSeparator(index) && (
              <div className="date-separator">
                {getDateSeparatorText(message.createdAt)}
              </div>
            )}
            
            {/* 메시지 아이템 */}
            <div className="message-item">
              <div className="message-profile">
                <img 
                  src={message.authorProfileImg || '/images/logo.png'} 
                  alt="프로필" 
                  className="profile-image"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/logo.png';
                  }}
                />
              </div>
              <div className="message-content">
                <div className="message-header">
                  <span className="message-author">{message.memberName || message.authorName}</span>
                  <span className="message-time">{formatMessageTime(message.createdAt)}</span>
                </div>
                <div className="message-bubble">
                  {message.isDeleted ? (
                    <span className="deleted-message">① 삭제된 메시지입니다.</span>
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            </div>
          </React.Fragment>
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
