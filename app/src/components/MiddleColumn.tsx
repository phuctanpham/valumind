
import { useState, useEffect } from 'react';
import DetailTab from './DetailTab';
import ValuationTab from './ValuationTab';
import type { CellItem } from '../App';
import './MiddleColumn.css';

const GearIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="gear-icon"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
);

interface MiddleColumnProps {
  selectedItem: CellItem | undefined;
  onNavigate?: () => void;
  onUpdateItem: (id: string, field: string, value: any) => void;
  apiValid: boolean;
}

export default function MiddleColumn({
  selectedItem,
  onNavigate,
  onUpdateItem,
  apiValid,
}: MiddleColumnProps) {
  const [activeTab, setActiveTab] = useState('detail');
  const [isEditing, setIsEditing] = useState(false);
  const [flags, setFlags] = useState<any>({});

  useEffect(() => {
    fetch('/flags.json')
      .then((response) => response.json())
      .then((data) => setFlags(data));
  }, []);

  useEffect(() => {
    if (isEditing) {
      const handleBeforeUnload = (event: BeforeUnloadEvent) => {
        event.preventDefault();
        event.returnValue = '';
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [isEditing]);

  const handleTabChange = (tab: string) => {
    if (isEditing) {
      if (window.confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        setIsEditing(false);
        setActiveTab(tab);
      }
    } else {
      setActiveTab(tab);
    }
  };

  if (!selectedItem) {
    return (
      <div className="middle-column empty-state-container">
        <div className="empty-state">
          <h2>No Item Selected</h2>
          <p>Select an item from the left panel to view details</p>
          {onNavigate && (
            <button className="btn btn-primary" onClick={onNavigate}>
              Go to Items
            </button>
          )}
        </div>
      </div>
    );
  }

  const handleUpdate = (field: string, value: any) => {
    onUpdateItem(selectedItem.id, field, value);
  };

  return (
    <div className="middle-column">
      <div className="column-header">
        <div className="tabs">
          <button
            className={`tab-button ${activeTab === 'detail' ? 'active' : ''}`}
            onClick={() => handleTabChange('detail')}
          >
            {flags.DetailTab_editSwitch && <GearIcon />}
            Detail
          </button>
          <button
            className={`tab-button ${activeTab === 'valuation' ? 'active' : ''}`}
            onClick={() => handleTabChange('valuation')}
          >
            Valuation
          </button>
        </div>
      </div>
      <div className="tab-content">
        {activeTab === 'detail' && (
          <DetailTab
            selectedItem={selectedItem}
            onUpdate={handleUpdate}
            isEditing={isEditing}
            onSave={() => setIsEditing(false)}
            onCancel={() => setIsEditing(false)} />
        )}
        {activeTab === 'valuation' && <ValuationTab selectedItem={selectedItem} apiValid={apiValid} />}
      </div>
    </div>
  );
}
