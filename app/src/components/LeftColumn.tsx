
import { useState, useRef, useEffect } from 'react';
import type { CellItem } from '../App';
import './LeftColumn.css';

interface LeftColumnProps {
  items: CellItem[];
  selectedItemId: string | null;
  onSelectItem: (id: string | null) => void;
  onSync: (id: string) => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
  onBulkEdit: (ids: string[]) => void;
  bulkSelectedIds: string[];
}

const BulkEditingBar = () => (
  <div className="bulk-editing-bar">
    {/* Add bulk editing actions here */}
  </div>
);

export default function LeftColumn({
  items,
  selectedItemId,
  onSelectItem,
  onSync,
  expanded = true,
  onToggleExpand,
  onBulkEdit,
  bulkSelectedIds,
}: LeftColumnProps) {
  const [multiSelect, setMultiSelect] = useState(false);
  const longPressTimer = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop <= clientHeight * 1.5) {
        setVisibleCount(prev => Math.min(prev + 20, items.length));
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [items.length]);

  const handleTouchStart = (id: string) => {
    longPressTimer.current = window.setTimeout(() => {
      setMultiSelect(true);
      onBulkEdit([id]);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleClick = (id: string) => {
    if (multiSelect) {
      const newSelectedItems = bulkSelectedIds.includes(id)
        ? bulkSelectedIds.filter(item => item !== id)
        : [...bulkSelectedIds, id];
      onBulkEdit(newSelectedItems);
    } else {
      onSelectItem(id);
    }
  };

  useEffect(() => {
    if (multiSelect && bulkSelectedIds.length === 0) {
      setMultiSelect(false);
      onBulkEdit([]);
    }
  }, [bulkSelectedIds, multiSelect, onBulkEdit]);

  return (
    <div className={`left-column ${expanded ? 'expanded' : 'collapsed'}`}>
      {onToggleExpand && <button className="toggle-button" onClick={onToggleExpand}>{expanded ? '→' : '←'}</button>}
      {expanded && (
        <>
            <div className="column-header">
                <div className="tabs">
                    <button className="tab active" aria-label="Items tab">
                    Item ({items.length})
                    </button>
                </div>
            </div>
          {multiSelect && <BulkEditingBar />}
          <div className="items-list" ref={containerRef}>
            {items.slice(0, visibleCount).map(item => (
              <div
                key={item.id}
                className={`item-cell ${selectedItemId === item.id ? 'selected' : ''} ${bulkSelectedIds.includes(item.id) ? 'multi-selected' : ''}`}
                onClick={() => handleClick(item.id)}
                onTouchStart={() => handleTouchStart(item.id)}
                onTouchEnd={handleTouchEnd}
              >
                {item.syncStatus === 'pending' && <div className="sync-status" onClick={(e) => { e.stopPropagation(); onSync(item.id); }} />}
                <div className="item-avatar">
                  {item.avatar ? <img src={item.avatar} alt={item.owner} /> : <div className="avatar-placeholder">?</div>}
                </div>
                <div className="item-details">
                  <div className="item-field">{item.certificateNumber}</div>
                  <div className="item-field">{item.owner}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
