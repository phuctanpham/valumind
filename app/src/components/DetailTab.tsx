
import { useState } from 'react';
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
  const [customFields, setCustomFields] = useState(selectedItem.customFields || {});
  const [selectedField, setSelectedField] = useState('');

  if (!selectedItem) return null;

  const handleAddField = () => {
    if (selectedField && !customFields[selectedField]) {
      const newCustomFields = { ...customFields, [selectedField]: '' };
      setCustomFields(newCustomFields);
      onUpdate('customFields', newCustomFields);
      setSelectedField('');
    }
  };

  const handleRemoveField = (field: string) => {
    const { [field]: _, ...remainingCustomFields } = customFields;
    setCustomFields(remainingCustomFields);
    onUpdate('customFields', remainingCustomFields);
  };

  const handleCustomFieldChange = (field: string, value: string) => {
    const newCustomFields = { ...customFields, [field]: value };
    setCustomFields(newCustomFields);
    onUpdate('customFields', newCustomFields);
  };

  return (
    <div className="detail-tab">
      <div className="form-field">
        <label>Certificate Number</label>
        <input
          type="text"
          value={selectedItem.certificateNumber}
          onChange={(e) => onUpdate('certificateNumber', e.target.value)}
        />
      </div>
      <div className="form-field">
        <label>Owner</label>
        <input
          type="text"
          value={selectedItem.owner}
          onChange={(e) => onUpdate('owner', e.target.value)}
        />
      </div>
      <div className="form-field">
        <label>Address</label>
        <input
          type="text"
          value={selectedItem.address}
          onChange={(e) => onUpdate('address', e.target.value)}
        />
      </div>
      <div className="custom-fields-section">
        <h4>Custom Fields</h4>
        <div className="add-field-container">
          <select value={selectedField} onChange={(e) => setSelectedField(e.target.value)}>
            <option value="">Select a field</option>
            {availableFields
              .filter((field) => !customFields.hasOwnProperty(field))
              .map((field) => (
                <option key={field} value={field}>
                  {field}
                </option>
              ))}
          </select>
          <button onClick={handleAddField} disabled={!selectedField}>Add Field</button>
        </div>
        {Object.entries(customFields).map(([field, value]) => (
          <div className="form-field custom" key={field}>
            <label>{field}</label>
            <div className="custom-field-input">
              <input
                type="text"
                value={value as string}
                onChange={(e) => handleCustomFieldChange(field, e.target.value)}
              />
              <button className="remove-btn" onClick={() => handleRemoveField(field)}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
