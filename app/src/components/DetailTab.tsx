import { useState, useEffect } from 'react';
import type { CellItem } from '../App';
import './DetailTab.css';

interface DetailTabProps {
  selectedItem: CellItem;
  onUpdate: (field: string, value: any) => void;
  isEditing: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export default function DetailTab({ selectedItem, onUpdate, isEditing, onSave, onCancel }: DetailTabProps) {
  const [editedFields, setEditedFields] = useState<any>(null);

  useEffect(() => {
    if (selectedItem) {
      setEditedFields({
        ...selectedItem,
        customFields: selectedItem.customFields || {},
      });
    } else {
      setEditedFields(null);
    }
  }, [selectedItem]);

  if (!editedFields) {
    return null;
  }
  
  const handleFieldChange = (field: string, value: string) => {
    setEditedFields({ ...editedFields, [field]: value });
  };

  const handleCustomFieldChange = (field: string, value: string) => {
    const newCustomFields = { ...editedFields.customFields, [field]: value };
    setEditedFields({ ...editedFields, customFields: newCustomFields });
  };

  const handleSave = () => {
    if (editedFields.certificateNumber !== selectedItem.certificateNumber) {
        onUpdate('certificateNumber', editedFields.certificateNumber);
    }
    if (editedFields.owner !== selectedItem.owner) {
        onUpdate('owner', editedFields.owner);
    }
    if (editedFields.address !== selectedItem.address) {
        onUpdate('address', editedFields.address);
    }
    if (JSON.stringify(editedFields.customFields) !== JSON.stringify(selectedItem.customFields)) {
        onUpdate('customFields', editedFields.customFields);
    }
    
    onSave();
  };

  const handleCancel = () => {
    setEditedFields({
        ...selectedItem,
        customFields: selectedItem.customFields || {},
      });
    onCancel();
  };

  return (
    <div className="detail-tab">
      <div className="form-field">
        <label>Certificate Number</label>
        <input
          type="text"
          value={editedFields.certificateNumber}
          onChange={(e) => handleFieldChange('certificateNumber', e.target.value)}
          readOnly={!isEditing}
        />
      </div>
      <div className="form-field">
        <label>Owner</label>
        <input
          type="text"
          value={editedFields.owner}
          onChange={(e) => handleFieldChange('owner', e.target.value)}
          readOnly={!isEditing}
        />
      </div>
      <div className="form-field">
        <label>Address</label>
        <input
          type="text"
          value={editedFields.address}
          onChange={(e) => handleFieldChange('address', e.target.value)}
          readOnly={!isEditing}
        />
      </div>
      <div className="custom-fields-section">
        <h4>Custom Fields</h4>
        {Object.entries(editedFields.customFields).map(([field, value]) => (
          <div className="form-field custom" key={field}>
            <label>{field}</label>
            <input
              type="text"
              value={value as string}
              onChange={(e) => handleCustomFieldChange(field, e.target.value)}
              readOnly={!isEditing}
            />
          </div>
        ))}
      </div>

      {isEditing && (
        <div className="form-actions">
          <button onClick={handleCancel} className="cancel-btn">Cancel</button>
          <button onClick={handleSave} className="save-btn">Save</button>
        </div>
      )}
    </div>
  );
}
