
import { useState, useEffect } from 'react';
import TopBar from './components/TopBar';
import LeftColumn from './components/LeftColumn';
import MiddleColumn from './components/MiddleColumn';
import RightColumn from './components/RightColumn';
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

interface Valuation {
  aiModel: string;
  confidenceScore: number;
  totalValue: number;
  unitValue: number;
  valueChange: {
    percent: number;
    period: string;
  };
}

interface ValuationHistory {
  date: string;
  value: number;
}

interface NearbyValuation {
  address: string;
  value: number;
  lat: number;
  lng: number;
}

interface ChatMessage {
  sender: 'bot' | 'user';
  message: string;
  timestamp: string;
}

interface ActivityLog {
  activity: string;
  timestamp: string;
}

export interface CellItem {
  id: string;
  avatar: string;
  address: string;
  lat: number;
  lng: number;
  certificateNumber: string;
  owner: string;
  syncStatus: SyncStatus;
  valuation: Valuation;
  valuationHistory: ValuationHistory[] | null;
  nearbyValuations: NearbyValuation[];
  chatHistory: ChatMessage[];
  activityLogs: ActivityLog[];
  customFields?: { [key: string]: string };
}

type Data = { [key: string]: CellItem };
type AppState = 'loading' | 'login' | 'main';
type AuthMode = 'guest' | 'authenticated';

function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [authMode, setAuthMode] = useState<AuthMode>('guest');
  const [config, setConfig] = useState<EndpointsConfig | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  const [items, setItems] = useState<Data>({});
  
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileColumn, setMobileColumn] = useState<'left' | 'middle' | 'right'>('left');
  const [leftExpanded, setLeftExpanded] = useState(true);
  const [rightExpanded, setRightExpanded] = useState(true);
  const [showApiNotification, setShowApiNotification] = useState(false);
  const [bulkEditIds, setBulkEditIds] = useState<string[]>([]);

  // Persist items to local storage
  useEffect(() => {
    if (Object.keys(items).length > 0) {
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
          setSelectedItemId(Object.keys(parsedItems)[0] || null);
        } else if (authMode === 'guest') {
          const response = await fetch('/mock.json');
          const data = await response.json();
          setItems(data);
          setSelectedItemId(Object.keys(data)[0] || null);
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
        if (mobileColumn === 'left') setMobileColumn('middle');
        else if (mobileColumn === 'middle') setMobileColumn('right');
      } else if (touchEndX - touchStartX > swipeThreshold) {
        if (mobileColumn === 'right') setMobileColumn('middle');
        else if (mobileColumn === 'middle') setMobileColumn('left');
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
    if (authMode === 'guest' && Object.keys(items).length >= 3) {
      return;
    }
    const id = `item-${Date.now()}`;
    const item: CellItem = {
      id,
      ...newItem,
      syncStatus: 'pending',
    };
    setItems(prev => ({ ...prev, [id]: item }));
  };

  const handleUpdateItem = (id: string, field: string, value: any) => {
    setItems(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleSync = (itemId: string) => {
    if (!config?.API_ENDPOINT_CONFIG) {
      setShowApiNotification(true);
      return;
    }
    
    setItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], syncStatus: 'pending' },
    }));
    
    setTimeout(() => {
      const isSuccess = Math.random() > 0.2;
      setItems(prev => ({
        ...prev,
        [itemId]: { ...prev[itemId], syncStatus: isSuccess ? 'synced' : 'failed' },
      }));
    }, 2000);
  };

  const handleSelectItem = (id: string | null) => {
    setSelectedItemId(id);
  };
  
  const selectedItem = selectedItemId ? items[selectedItemId] : undefined;
  const itemsArray = Object.values(items);

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
            {mobileColumn === 'left' && <LeftColumn items={itemsArray} selectedItemId={selectedItemId} onSelectItem={handleSelectItem} onSync={handleSync} onBulkEdit={setBulkEditIds} bulkSelectedIds={bulkEditIds} />}
            {mobileColumn === 'middle' && <MiddleColumn selectedItem={selectedItem} onUpdateItem={handleUpdateItem} apiValid={config?.API_ENDPOINT_CONFIG ?? false} onNavigate={() => setMobileColumn('left')} />}
            {mobileColumn === 'right' && <RightColumn selectedItem={selectedItem} onNavigate={() => setMobileColumn('middle')} />}
          </>
        ) : (
          <>
            <LeftColumn items={itemsArray} selectedItemId={selectedItemId} onSelectItem={handleSelectItem} onSync={handleSync} expanded={leftExpanded} onToggleExpand={() => setLeftExpanded(!leftExpanded)} onBulkEdit={setBulkEditIds} bulkSelectedIds={bulkEditIds} />
            <MiddleColumn selectedItem={selectedItem} onUpdateItem={handleUpdateItem} apiValid={config?.API_ENDPOINT_CONFIG ?? false} />
            <RightColumn selectedItem={selectedItem} expanded={rightExpanded} onToggleExpand={() => setRightExpanded(!rightExpanded)} />
          </>
        )}
      </div>
      <FloatingBubble authMode={authMode} onAdd={handleAddItem} onLoginRequest={() => setAppState('login')} itemsLength={itemsArray.length} />
      
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
