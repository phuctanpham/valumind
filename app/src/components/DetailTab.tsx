
import { useState, useEffect } from 'react';
import './DetailTab.css';

const availableFields = [
  'Land Area (m2)',
  'Usable Area (m2)',
  'Bedrooms',
  'Width (m)',
  'Length (m)',
  'Total Floors',
];

interface DetailTabProps {
  selectedItem: any;
  onUpdate: (field: string, value: any) => void;
}

export default function DetailTab({ selectedItem, onUpdate }: DetailTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedFields, setEditedFields] = useState<any>(null);
  const [selectedField, setSelectedField] = useState('');

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

  const handleAddField = () => {
    if (selectedField && !editedFields.customFields.hasOwnProperty(selectedField)) {
      const newCustomFields = { ...editedFields.customFields, [selectedField]: '' };
      setEditedFields({ ...editedFields, customFields: newCustomFields });
      setSelectedField('');
    }
  };

  const handleRemoveField = (field: string) => {
    const { [field]: _, ...remainingCustomFields } = editedFields.customFields;
    setEditedFields({ ...editedFields, customFields: remainingCustomFields });
  };
  
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
    
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedFields({
        ...selectedItem,
        customFields: selectedItem.customFields || {},
      });
    setIsEditing(false);
  };

  return (
    <div className="detail-tab">
      <div className="edit-switch-container">
        <label className="switch">
          <input type="checkbox" checked={isEditing} onChange={() => setIsEditing(!isEditing)} />
          <span className="slider round"></span>
        </label>
        <span>Edit Mode</span>
      </div>

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
        {isEditing && (
            <div className="add-field-container">
            <select value={selectedField} onChange={(e) => setSelectedField(e.target.value)}>
                <option value="">Select a field</option>
                {availableFields
                .filter((field) => !editedFields.customFields.hasOwnProperty(field))
                .map((field) => (
                    <option key={field} value={field}>
                    {field}
                    </option>
                ))}
            </select>
            <button onClick={handleAddField} disabled={!selectedField}>Add Field</button>
            </div>
        )}
        {Object.entries(editedFields.customFields).map(([field, value]) => (
          <div className="form-field custom" key={field}>
            <label>{field}</label>
            <div className="custom-field-input">
              <input
                type="text"
                value={value as string}
                onChange={(e) => handleCustomFieldChange(field, e.target.value)}
                readOnly={!isEditing}
              />
              {isEditing && <button className="remove-btn" onClick={() => handleRemoveField(field)}>✕</button>}
            </div>
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
