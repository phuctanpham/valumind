
import { useState } from 'react';
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

  if (!selectedItem) {
    return (
      <div className="middle-column empty-state-container">
        <div className="empty-state">
          <h2>No Item Selected</h2>
          <p>Select an item from the right panel to view details</p>
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
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'detail' ? 'active' : ''}`}
          onClick={() => setActiveTab('detail')}
        >
          Detail
        </button>
        <button
          className={`tab-button ${activeTab === 'valuation' ? 'active' : ''}`}
          onClick={() => setActiveTab('valuation')}
        >
          Valuation
        </button>
      </div>
      <div className="tab-content">
        {activeTab === 'detail' && (
          <DetailTab selectedItem={selectedItem} onUpdate={handleUpdate} />
        )}
        {activeTab === 'valuation' && <ValuationTab apiValid={apiValid} />}
      </div>
    </div>
  );
}
