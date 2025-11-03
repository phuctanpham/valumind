
import { useState } from 'react';
import type { CellItem } from '../App';
import './BotTab.css';

interface BotTabProps {
  certificateNumber: string;
  chatHistory: CellItem['chatHistory'];
}

export default function BotTab({ certificateNumber, chatHistory }: BotTabProps) {
  const [chatMessage, setChatMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    console.log('Sending message:', chatMessage);
    setChatMessage('');
  };

  return (
    <div className="chat-view">
      <div className="chat-header">
        <h4>Chat with Bot</h4>
        <p className="chat-subtitle">Ask about {certificateNumber}</p>
      </div>
      <div className="chat-messages">
        {chatHistory?.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.sender}`}>
            <div className="message-content">{msg.message}</div>
            <div className="message-timestamp">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        ))}
      </div>
      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          placeholder="Type a message..."
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
          className="chat-input"
          aria-label="Chat message"
        />
        <button type="submit" className="btn btn-primary" aria-label="Send message">
          Send
        </button>
      </form>
    </div>
  );
}
