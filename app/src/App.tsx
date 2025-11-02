import { useState, useEffect } from 'react';
import TopBar from './components/TopBar';
import RightColumn from './components/RightColumn';
import MiddleColumn from './components/MiddleColumn';
import LeftColumn from './components/LeftColumn';
import FloatingBubble from './components/FloatingBubble';
import './App.css';

// Types
interface EndpointsConfig {
  IDENTITY_PROVIDER_CONFIG: boolean;
  API_ENDPOINT_CONFIG: boolean;
  apiEndpoint?: string;
  authEndpoint?: string;
}

export type SyncStatus = 'synced' | 'pending' | 'failed';

interface CellItem {
  id: string;
  avatar: string;
  address: string;
  certificateNumber: string;
  owner: string;
  syncStatus: SyncStatus;
}

type AppState = 'loading' | 'login' | 'main';
type AuthMode = 'guest' | 'authenticated';

function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [authMode, setAuthMode] = useState<AuthMode>('guest');
  const [config, setConfig] = useState<EndpointsConfig | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  const [items, setItems] = useState<CellItem[]>([]);
  
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileColumn, setMobileColumn] = useState<'left' | 'middle' | 'right'>('right');
  const [leftExpanded, setLeftExpanded] = useState(true);
  const [rightExpanded, setRightExpanded] = useState(true);
  const [showApiNotification, setShowApiNotification] = useState(false);
  const [bulkEditIds, setBulkEditIds] = useState<string[]>([]);

  // Persist items to local storage
  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem('items', JSON.stringify(items));
    }
  }, [items]);

  // Initialize app
  useEffect(() => {
    const initApp = async () => {
      try {
        setLoadingProgress(33);
        const endpointsResponse = await fetch('/endpoints.json');
        const endpointsData: EndpointsConfig = await endpointsResponse.json();
        setConfig(endpointsData);

        setLoadingProgress(66);
        await new Promise(resolve => {
          if (navigator.serviceWorker.controller) return resolve(true);
          navigator.serviceWorker.addEventListener('controllerchange', () => resolve(true));
          setTimeout(() => resolve(true), 2000);
        });

        const savedItems = localStorage.getItem('items');
        if (savedItems) {
          const parsedItems = JSON.parse(savedItems);
          setItems(parsedItems);
          setSelectedItemId(parsedItems[0]?.id || null);
        } else if (authMode === 'guest') {
          const response = await fetch('/mock.json');
          const data = await response.json();
          setItems(data);
          setSelectedItemId(data[0]?.id || null);
        }

        setLoadingProgress(100);
        await new Promise(resolve => setTimeout(resolve, 500));

        if (endpointsData.IDENTITY_PROVIDER_CONFIG && authMode === 'guest') {
          setAppState('login');
        } else {
          setAppState('main');
        }
      } catch (error) {
        console.error('App initialization failed:', error);
        setAuthMode('guest');
        setAppState('main');
      }
    };

    initApp();
  }, [authMode]);

  // Handle responsive layout and gestures
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    if (!isMobile) return;

    let touchStartX = 0;
    const handleTouchStart = (e: TouchEvent) => { touchStartX = e.changedTouches[0].screenX; };
    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].screenX;
      const swipeThreshold = 50;
      if (touchStartX - touchEndX > swipeThreshold) {
        if (mobileColumn === 'right') setMobileColumn('middle');
        else if (mobileColumn === 'middle') setMobileColumn('left');
      } else if (touchEndX - touchStartX > swipeThreshold) {
        if (mobileColumn === 'left') setMobileColumn('middle');
        else if (mobileColumn === 'middle') setMobileColumn('right');
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, mobileColumn]);

  const handleLogin = (mode: AuthMode) => {
    setAuthMode(mode);
    setAppState('main');
  };

  const handleAddItem = (newItem: Omit<CellItem, 'id' | 'syncStatus'>) => {
    if (authMode === 'guest' && items.length >= 2) {
      return;
    }
    const item: CellItem = {
      id: `item-${Date.now()}`,
      ...newItem,
      syncStatus: 'pending',
    };
    setItems(prev => [...prev, item]);
  };

  const handleUpdateItem = (id: string, field: string, value: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSync = (itemId: string) => {
    if (!config?.API_ENDPOINT_CONFIG) {
      setShowApiNotification(true);
      return;
    }
    
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, syncStatus: 'pending' } : item));
    setTimeout(() => {
      const isSuccess = Math.random() > 0.2;
      setItems(prev => prev.map(item => item.id === itemId ? { ...item, syncStatus: isSuccess ? 'synced' : 'failed' } : item));
    }, 2000);
  };

  const handleSelectItem = (id: string | null) => {
    setSelectedItemId(id);
  };
  
  const selectedItem = items.find(item => item.id === selectedItemId);

  if (appState === 'loading') {
    return (
      <div className="loading-screen">
        <img src="/logo.svg" alt="Logo" className="loading-logo" />
        <div className="progress-bar"><div className="progress-fill" style={{ width: `${loadingProgress}%` }} /></div>
      </div>
    );
  }

  return (
    <div className="app">
      <TopBar onMenuClick={() => {}} onSearch={() => {}} />
      <div className={`main-content ${isMobile ? 'mobile' : 'desktop'}`}>
        {isMobile ? (
          <>
            {mobileColumn === 'left' && <LeftColumn selectedItem={selectedItem} onNavigate={() => setMobileColumn('middle')} />}
            {mobileColumn === 'middle' && <MiddleColumn selectedItem={selectedItem} onUpdateItem={handleUpdateItem} apiValid={config?.API_ENDPOINT_CONFIG ?? false} onNavigate={() => setMobileColumn('right')} />}
            {mobileColumn === 'right' && <RightColumn items={items} selectedItemId={selectedItemId} onSelectItem={handleSelectItem} onSync={handleSync} onBulkEdit={setBulkEditIds} bulkSelectedIds={bulkEditIds} />}
          </>
        ) : (
          <>
            <RightColumn items={items} selectedItemId={selectedItemId} onSelectItem={handleSelectItem} onSync={handleSync} expanded={leftExpanded} onToggleExpand={() => setLeftExpanded(!leftExpanded)} onBulkEdit={setBulkEditIds} bulkSelectedIds={bulkEditIds} />
            <MiddleColumn selectedItem={selectedItem} onUpdateItem={handleUpdateItem} apiValid={config?.API_ENDPOINT_CONFIG ?? false} />
            <LeftColumn selectedItem={selectedItem} expanded={rightExpanded} onToggleExpand={() => setRightExpanded(!rightExpanded)} />
          </>
        )}
      </div>
      <FloatingBubble authMode={authMode} onAdd={handleAddItem} onLoginRequest={() => setAppState('login')} itemsLength={items.length} />
      
      {appState === 'login' && (
        <div className="notification-modal">
          <div className="notification-content">
            <img src="/logo.svg" alt="Logo" className="login-logo" />
            <h2>Welcome</h2>
            <div className="login-form">
              <input type="email" placeholder="Enter your email" className="login-input" />
              <button className="login-button">Send OTP</button>
              <div className="login-divider">or</div>
              <button className="guest-button" onClick={() => handleLogin('guest')}>Continue as Guest</button>
              <button className="btn" onClick={() => setAppState('main')}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showApiNotification && <div className="notification-modal"><div className="notification-content"><h3>Feature Disabled</h3><p>API endpoint not configured.</p><button onClick={() => setShowApiNotification(false)}>OK</button></div></div>}
    </div>
  );
}

export default App;
