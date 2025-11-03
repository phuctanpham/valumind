
import { useState, useEffect } from 'react';
import DetailTab from './DetailTab';
import ValuationTab from './ValuationTab';
import './MiddleColumn.css';

interface CellItem {
  id: string;
  avatar: string;
  address: string;
  certificateNumber: string;
  owner: string;
  customFields?: { [key: string]: string };
}

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
            Detail
            </button>
            <button
            className={`tab-button ${activeTab === 'valuation' ? 'active' : ''}`}
            onClick={() => handleTabChange('valuation')}
            >
            Valuation
            </button>
        </div>
        {activeTab === 'detail' && flags.DetailTab_editSwitch && (
            <div className="edit-gear-container">
                <span className="gear-icon" onClick={() => setIsEditing(!isEditing)}></span>
            </div>
        )}
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
        {activeTab === 'valuation' && <ValuationTab apiValid={apiValid} />}
      </div>
    </div>
  );
}
