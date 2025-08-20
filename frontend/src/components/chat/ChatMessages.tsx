import React, { useRef, useEffect, useState } from 'react';
import type { ChatMessage } from '../../types/regionChat';

interface ChatMessagesProps {
  messages: ChatMessage[];
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

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



  // 날짜 구분선 텍스트 생성
  const getDateSeparatorText = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}년 ${month}월 ${day}일`;
  };



  // 스크롤 위치 감지 함수
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px 여유
    
    setShouldAutoScroll(isAtBottom);
  };

  // 메시지 자동 스크롤 (스마트 스크롤)
  useEffect(() => {
    if (messages.length > 0 && shouldAutoScroll) {
      scrollToBottom();
    }
  }, [messages, shouldAutoScroll]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 컴포넌트 마운트 시 맨 아래로 스크롤
  useEffect(() => {
    scrollToBottom();
  }, []);

  return (
    <div 
      className="chat-messages" 
      ref={messagesContainerRef}
      onScroll={handleScroll}
    >
      {messages.length === 0 ? (
        <div className="no-messages">
          <p>아직 메시지가 없습니다.</p>
          <p>첫 번째 메시지를 남겨보세요!</p>
        </div>
      ) : (
        <>
          {/* 첫 날짜선을 별도로 먼저 렌더링 (테스트1 아래에 표시) */}
          <div className="date-separator">
            {getDateSeparatorText(messages[messages.length - 1].createdAt)}
          </div>
          
          {/* 메시지들 렌더링 */}
          {messages.map((message, index) => {
            // 날짜가 바뀌는 지점에만 추가 날짜선 표시
            const shouldShow = (() => {
              if (index === 0) return false; // 첫 번째는 이미 위에서 처리
              
              const currentMessage = message;
              const previousMessage = messages[index - 1];
              
              if (!currentMessage || !previousMessage) return false;
              
              const currentDate = new Date(currentMessage.createdAt).toDateString();
              const previousDate = new Date(previousMessage.createdAt).toDateString();
              
              return currentDate !== previousDate;
            })();
            
            return (
              <React.Fragment key={message.id}>
                {/* 추가 날짜 구분선 */}
                {shouldShow && (
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
            );
          })}
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
