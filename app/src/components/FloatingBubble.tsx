import { useState } from 'react';
import type { CellItem } from '../App';
import './FloatingBubble.css';

interface FloatingBubbleProps {
  onAdd: (item: Omit<CellItem, 'id' | 'syncStatus'>) => void;
}

export default function FloatingBubble({
  onAdd,
}: FloatingBubbleProps) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    avatar: '',
    address: '',
    certificateNumber: '',
    owner: '',
  });

  const handleClick = () => {
    setShowModal(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prev) => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: Omit<CellItem, 'id' | 'syncStatus'> = {
      ...formData,
      lat: 0, // Placeholder, will be updated on sync
      lng: 0, // Placeholder, will be updated on sync
      valuation: {
        aiModel: 'N/A',
        confidenceScore: 0,
        totalValue: 0,
        unitValue: 0,
        valueChange: { percent: 0, period: 'N/A' },
      },
      valuationHistory: [],
      nearbyValuations: [],
      chatHistory: [],
      activityLogs: [],
    };
    onAdd(newItem);
    setFormData({ avatar: '', address: '', certificateNumber: '', owner: '' });
    setShowModal(false);
  };

  return (
    <>
      <button
        className="floating-bubble"
        onClick={handleClick}
        aria-label="Add new item"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {showModal && (
        <div className="add-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Item</h3>
              <button
                className="close-button"
                onClick={() => setShowModal(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="add-form">
              <div className="form-field">
                <label htmlFor="image-upload">Image</label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="address">Address</label>
                <input
                  id="address"
                  type="text"
                  placeholder="Enter address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="cert-number">Certificate Number</label>
                <input
                  id="cert-number"
                  type="text"
                  placeholder="Enter certificate number"
                  value={formData.certificateNumber}
                  onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="owner">Owner</label>
                <input
                  id="owner"
                  type="text"
                  placeholder="Enter owner name"
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  Add Item
                </button>
                <button type="button" className="btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}