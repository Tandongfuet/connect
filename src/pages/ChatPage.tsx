import React from 'react';
import ChatInterface from '../components/ChatInterface';

const ChatPage: React.FC = () => {
  return (
    <div className="h-[75vh] md:h-[80vh]">
      <ChatInterface isPage />
    </div>
  );
};

export default ChatPage;