import React, { useState } from 'react';
import { FaImage } from 'react-icons/fa';

interface ChatInputProps {
  canChat: boolean;
  onSendMessage: (message: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ canChat, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !canChat) return;

    onSendMessage(newMessage.trim());
    setNewMessage('');
  };

  const handleImageUpload = () => {
    // 이미지 업로드 기능 구현
    console.log('이미지 업로드');
  };

  return (
    <form className="chat-input-form" onSubmit={handleSubmit}>
      <div className="chat-input-container">
        <button 
          type="button" 
          className="image-upload-button"
          onClick={handleImageUpload}
        >
          <FaImage />
        </button>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="대화를 해보세요"
          disabled={!canChat}
          className="chat-input"
        />
        <button 
          type="submit" 
          disabled={!canChat || !newMessage.trim()}
          className="send-button"
        >
          보내기
        </button>
      </div>
    </form>
  );
};

export default ChatInput;
