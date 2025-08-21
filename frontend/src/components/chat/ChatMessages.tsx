import React, { useRef, useEffect, useState } from 'react';
import type { ChatMessage } from '../../types/regionChat';

interface ChatMessagesProps {
  messages: ChatMessage[];
  onLoadPrevious?: () => void;
  hasMoreMessages?: boolean;
  isLoadingPrevious?: boolean;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, onLoadPrevious, hasMoreMessages = false, isLoadingPrevious = false }) => {
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
    
    // 무한 스크롤: 스크롤이 위쪽 5% 지점에 도달하면 이전 메시지 로드
    if (onLoadPrevious && hasMoreMessages && !isLoadingPrevious) {
      const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
      if (scrollPercentage < 0.05) {
        console.log('🔄 [ChatMessages] 무한 스크롤 트리거: 위쪽 5% 도달');
        onLoadPrevious();
      }
    }
  };

  // 메시지 자동 스크롤 (스마트 스크롤)
  useEffect(() => {
    if (messages.length > 0 && shouldAutoScroll) {
      scrollToBottom();
    }
  }, [messages, shouldAutoScroll]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    
    // 추가로 컨테이너 자체도 맨 아래로 스크롤
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // 컴포넌트 마운트 시 맨 아래로 스크롤
  useEffect(() => {
    // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 스크롤
    const timer = setTimeout(() => {
      scrollToBottom();
      console.log('🔄 [ChatMessages] 초기 스크롤: 맨 아래로 이동');
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // 디버깅: messages가 변경될 때마다 isMine 값 확인
  useEffect(() => {
    if (messages.length > 0) {
      console.log('🔍 [ChatMessages] messages 변경됨:', messages.map(msg => ({
        messageId: msg.id,
        memberId: msg.memberId,
        memberName: msg.memberName,
        isMine: msg.isMine,
        localStorageMemberId: localStorage.getItem('memberId')
      })));
    }
  }, [messages]);

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
           {/* 무한 스크롤 로딩 인디케이터 */}
           {hasMoreMessages && (
             <div className="loading-indicator">
               {isLoadingPrevious ? (
                 <p>이전 메시지 로딩 중...</p>
               ) : (
                 <p>위로 스크롤하여 이전 메시지 보기</p>
               )}
             </div>
           )}
           
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
              
                                 {/* 메시지 아이템 - 카카오톡/라인 스타일 */}
                 <div className={`message-item ${message.isMine ? 'my-message' : 'other-message'}`}>
                   {!message.isMine && (
                    <div className="message-profile">
                      <img 
                        src={message.memberProfileImg || message.authorProfileImg || '/images/logo.png'} 
                        alt="프로필" 
                        className="chat-profile-image"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/logo.png';
                        }}
                      />
                    </div>
                  )}
                  <div className="message-content">
                    {!message.isMine && (
                      <div className="message-header">
                        <span className="message-author">{message.memberName || message.authorName}</span>
                      </div>
                    )}
                    <div className="message-bubble">
                      {message.isDeleted ? (
                        <span className="deleted-message">① 삭제된 메시지입니다.</span>
                      ) : (
                        message.content
                      )}
                    </div>
                    <div className="message-time">
                      {formatMessageTime(message.createdAt)}
                    </div>
                  </div>
                  {/* 내가 보낸 메시지는 프로필 이미지 없음 */}
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
