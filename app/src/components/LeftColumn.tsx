
import { useState } from 'react';
import './LeftColumn.css';

interface ChatMessage {
  sender: 'user' | 'bot';
  message: string;
  timestamp: string;
}

interface ActivityLog {
  activity: string;
  timestamp: string;
}

interface CellItem {
  id: string;
  avatar: string;
  address: string;
  certificateNumber: string;
  owner: string;
  chatHistory?: ChatMessage[];
  activityLogs?: ActivityLog[];
}

interface LeftColumnProps {
  selectedItem: CellItem | undefined;
  expanded?: boolean;
  onToggleExpand?: () => void;
  onNavigate?: () => void;
}

type Tab = 'chat' | 'activity';

export default function LeftColumn({
  selectedItem,
  expanded = true,
  onToggleExpand,
  onNavigate,
}: LeftColumnProps) {
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [chatMessage, setChatMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    
    console.log('Sending message:', chatMessage);
    setChatMessage('');
  };

  if (!selectedItem) {
    return (
      <div className={`left-column ${expanded ? 'expanded' : 'collapsed'}`}>
        {onToggleExpand && (
          <button className="toggle-button" onClick={onToggleExpand} aria-label="Toggle column">
            {expanded ? '←' : '→'}
          </button>
        )}
        {expanded && (
          <div className="empty-state">
            <h3>No Item Selected</h3>
            <p>Select an item to view chat and activity</p>
            {onNavigate && (
              <button className="btn btn-primary" onClick={onNavigate}>
                Go to Items
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`left-column ${expanded ? 'expanded' : 'collapsed'}`}>
      {onToggleExpand && (
        <button className="toggle-button" onClick={onToggleExpand} aria-label="Toggle column">
          {expanded ? '←' : '→'}
        </button>
      )}
      {expanded && (
        <>
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
              aria-label="Chat tab"
            >
              Chat
            </button>
            <button
              className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveTab('activity')}
              aria-label="Activity tab"
            >
              Activity
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'chat' ? (
              <div className="chat-view">
                <div className="chat-header">
                  <h4>Chat with Bot</h4>
                  <p className="chat-subtitle">Ask about {selectedItem.certificateNumber}</p>
                </div>
                <div className="chat-messages">
                  {selectedItem.chatHistory?.map((msg, index) => (
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
            ) : (
              <div className="changelog-view">
                <div className="changelog-header">
                  <h4>Activity Log</h4>
                  <p className="changelog-subtitle">{selectedItem.certificateNumber}</p>
                </div>
                <div className="changelog-entries">
                  {selectedItem.activityLogs?.map((entry, index) => (
                    <div key={index} className="changelog-entry">
                      <div className="entry-action">{entry.activity}</div>
                      <div className="entry-meta">
                        <span className="entry-timestamp">{new Date(entry.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
