import React from 'react';
import { FaArrowLeft, FaEllipsisH } from 'react-icons/fa';

interface ChatHeaderProps {
  city: string;
  isConnected: boolean;
  onClose: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ city, isConnected, onClose }) => {
  return (
    <div className="chat-modal-header">
      <div className="header-left">
        <button className="back-button" onClick={onClose}>
          <FaArrowLeft />
        </button>
        <div className="chat-room-info">
          <h2 className="chat-room-title">{city}</h2>
          <div className="connection-status">
            {isConnected && <span>🟢</span>}
            {!isConnected && <span>🔴</span>}
          </div>
        </div>
      </div>
      <button className="menu-button">
        <FaEllipsisH />
      </button>
    </div>
  );
};

export default ChatHeader;
