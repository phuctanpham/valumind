
import { useState } from 'react';
import type { CellItem } from '../App';
import BotTab from './BotTab';
import LogTab from './LogTab';
import './RightColumn.css';

interface RightColumnProps {
  selectedItem: CellItem | undefined;
  expanded?: boolean;
  onToggleExpand?: () => void;
  onNavigate?: () => void;
}

type Tab = 'chat' | 'activity';

export default function RightColumn({
  selectedItem,
  expanded = true,
  onToggleExpand,
  onNavigate,
}: RightColumnProps) {
  const [activeTab, setActiveTab] = useState<Tab>('chat');

  if (!selectedItem) {
    return (
      <div className={`right-column ${expanded ? 'expanded' : 'collapsed'}`}>
        {onToggleExpand && (
          <button className="toggle-button" onClick={onToggleExpand} aria-label="Toggle column">
            {expanded ? '→' : '←'}
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
    <div className={`right-column ${expanded ? 'expanded' : 'collapsed'}`}>
      {onToggleExpand && (
        <button className="toggle-button" onClick={onToggleExpand} aria-label="Toggle column">
          {expanded ? '→' : '←'}
        </button>
      )}
      {expanded && (
        <>
          <div className="column-header">
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
          </div>

          <div className="tab-content">
            {activeTab === 'chat' ? (
              <BotTab
                certificateNumber={selectedItem.certificateNumber}
                chatHistory={selectedItem.chatHistory || []}
              />
            ) : (
              <LogTab
                certificateNumber={selectedItem.certificateNumber}
                activityLogs={selectedItem.activityLogs || []}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
