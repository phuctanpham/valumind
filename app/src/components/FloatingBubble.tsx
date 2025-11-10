import { useState } from 'react';
import type { CellItem } from '../App';
import './FloatingBubble.css';

interface FloatingBubbleProps {
  onAdd: (item: Omit<CellItem, 'id' | 'syncStatus'>) => void;
  isMobile: boolean;
}

export default function FloatingBubble({
  onAdd,
  isMobile,
}: FloatingBubbleProps) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    avatar: '',
    address: '',
    certificateNumber: '',
    owner: '',
    size: '',
    longitude: '',
    latitude: '',
    livingSize: '',
    width: '',
    length: '',
    rooms: '',
    toilets: '',
    floors: '',
    category: '',
    region: '',
    area: '',
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
    
    const customFields: { [key: string]: string } = {};
    if (formData.size) customFields['size'] = formData.size;
    if (formData.longitude) customFields['longitude'] = formData.longitude;
    if (formData.latitude) customFields['latitude'] = formData.latitude;
    if (formData.livingSize) customFields['living size'] = formData.livingSize;
    if (formData.width) customFields['width'] = formData.width;
    if (formData.length) customFields['length'] = formData.length;
    if (formData.rooms) customFields['rooms'] = formData.rooms;
    if (formData.toilets) customFields['toilets'] = formData.toilets;
    if (formData.floors) customFields['floors'] = formData.floors;
    if (formData.category) customFields['category'] = formData.category;
    if (formData.region) customFields['region'] = formData.region;
    if (formData.area) customFields['area'] = formData.area;

    const newItem: Omit<CellItem, 'id' | 'syncStatus'> = {
      avatar: formData.avatar,
      address: formData.address,
      certificateNumber: formData.certificateNumber,
      owner: formData.owner,
      lat: 0,
      lng: 0,
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
      customFields,
    };
    onAdd(newItem);
    setFormData({
      avatar: '',
      address: '',
      certificateNumber: '',
      owner: '',
      size: '',
      longitude: '',
      latitude: '',
      livingSize: '',
      width: '',
      length: '',
      rooms: '',
      toilets: '',
      floors: '',
      category: '',
      region: '',
      area: '',
    });
    setShowModal(false);
  };

  if (!isMobile) {
    return null;
  }

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

              <div className="form-field">
                <label htmlFor="size">Size (m²)</label>
                <input
                  id="size"
                  type="text"
                  placeholder="e.g., 85.5"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  onFocus={(e) => e.target.placeholder = ''}
                  onBlur={(e) => e.target.placeholder = 'e.g., 85.5'}
                />
              </div>

              <div className="form-field">
                <label htmlFor="longitude">Longitude</label>
                <input
                  id="longitude"
                  type="text"
                  placeholder="e.g., 105.80"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  onFocus={(e) => e.target.placeholder = ''}
                  onBlur={(e) => e.target.placeholder = 'e.g., 105.80'}
                />
              </div>

              <div className="form-field">
                <label htmlFor="latitude">Latitude</label>
                <input
                  id="latitude"
                  type="text"
                  placeholder="e.g., 21.01"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  onFocus={(e) => e.target.placeholder = ''}
                  onBlur={(e) => e.target.placeholder = 'e.g., 21.01'}
                />
              </div>

              <div className="form-field">
                <label htmlFor="livingSize">Living Size (m²)</label>
                <input
                  id="livingSize"
                  type="text"
                  placeholder="e.g., 250.0"
                  value={formData.livingSize}
                  onChange={(e) => setFormData({ ...formData, livingSize: e.target.value })}
                  onFocus={(e) => e.target.placeholder = ''}
                  onBlur={(e) => e.target.placeholder = 'e.g., 250.0'}
                />
              </div>

              <div className="form-field">
                <label htmlFor="width">Width (m)</label>
                <input
                  id="width"
                  type="text"
                  placeholder="e.g., 5.0"
                  value={formData.width}
                  onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                  onFocus={(e) => e.target.placeholder = ''}
                  onBlur={(e) => e.target.placeholder = 'e.g., 5.0'}
                />
              </div>

              <div className="form-field">
                <label htmlFor="length">Length (m)</label>
                <input
                  id="length"
                  type="text"
                  placeholder="e.g., 17.1"
                  value={formData.length}
                  onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                  onFocus={(e) => e.target.placeholder = ''}
                  onBlur={(e) => e.target.placeholder = 'e.g., 17.1'}
                />
              </div>

              <div className="form-field">
                <label htmlFor="rooms">Rooms</label>
                <input
                  id="rooms"
                  type="text"
                  placeholder="e.g., 4"
                  value={formData.rooms}
                  onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
                  onFocus={(e) => e.target.placeholder = ''}
                  onBlur={(e) => e.target.placeholder = 'e.g., 4'}
                />
              </div>

              <div className="form-field">
                <label htmlFor="toilets">Toilets</label>
                <input
                  id="toilets"
                  type="text"
                  placeholder="e.g., 3"
                  value={formData.toilets}
                  onChange={(e) => setFormData({ ...formData, toilets: e.target.value })}
                  onFocus={(e) => e.target.placeholder = ''}
                  onBlur={(e) => e.target.placeholder = 'e.g., 3'}
                />
              </div>

              <div className="form-field">
                <label htmlFor="floors">Floors</label>
                <input
                  id="floors"
                  type="text"
                  placeholder="e.g., 3"
                  value={formData.floors}
                  onChange={(e) => setFormData({ ...formData, floors: e.target.value })}
                  onFocus={(e) => e.target.placeholder = ''}
                  onBlur={(e) => e.target.placeholder = 'e.g., 3'}
                />
              </div>

              <div className="form-field">
                <label htmlFor="category">Category</label>
                <input
                  id="category"
                  type="text"
                  placeholder="e.g., Nhà riêng"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  onFocus={(e) => e.target.placeholder = ''}
                  onBlur={(e) => e.target.placeholder = 'e.g., Nhà riêng'}
                />
              </div>

              <div className="form-field">
                <label htmlFor="region">Region</label>
                <input
                  id="region"
                  type="text"
                  placeholder="e.g., Hà Nội"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  onFocus={(e) => e.target.placeholder = ''}
                  onBlur={(e) => e.target.placeholder = 'e.g., Hà Nội'}
                />
              </div>

              <div className="form-field">
                <label htmlFor="area">Area</label>
                <input
                  id="area"
                  type="text"
                  placeholder="e.g., Quận Ba Đình"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  onFocus={(e) => e.target.placeholder = ''}
                  onBlur={(e) => e.target.placeholder = 'e.g., Quận Ba Đình'}
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