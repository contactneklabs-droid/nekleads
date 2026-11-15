import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, MoreHorizontal, MessageSquare, Settings, ChevronLeft } from 'lucide-react';
import { ToastProvider } from './contexts/ToastContext';
import { DialogProvider } from './contexts/DialogContext';
import { AppLockProvider } from './contexts/AppLockContext';
import { MoreActionSheet } from './components/MoreActionSheet';
import { PayoutCalculatorModal } from './components/PayoutCalculatorModal';

const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const People = React.lazy(() => import('./pages/People'));
const Volunteers = React.lazy(() => import('./pages/Volunteers'));
const Manpower = React.lazy(() => import('./pages/Manpower'));
const Events = React.lazy(() => import('./pages/Events'));
const WhatsAppDrafts = React.lazy(() => import('./pages/WhatsAppDrafts'));
const SettingsPage = React.lazy(() => import('./pages/Settings'));

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isCalcOpen, setIsCalcOpen] = useState(false);

  // iOS Native Edge-Swipe Back Gesture
  const touchStartRef = React.useRef<{ x: number; y: number; isEdge: boolean } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isDashboard) return;
    const touch = e.touches[0];
    // Must originate within 32px of the left screen edge
    if (touch.clientX <= 32) {
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, isEdge: true };
    } else {
      touchStartRef.current = null;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !touchStartRef.current.isEdge) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    // Rightward horizontal swipe of >= 60px
    if (deltaX >= 60 && Math.abs(deltaY) < deltaX * 0.75) {
      navigate('/dashboard');
    }
    touchStartRef.current = null;
  };

  // Format title for inner pages
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/people':
      case '/volunteers': return 'People Hub';
      case '/events': return 'Events & Schedule';
      case '/manpower': return 'Manpower Directory';
      case '/whatsapp-drafts': return 'WhatsApp Drafts';
      case '/settings': return 'System Settings';
      default: return 'Overview';
    }
  };

  return (
    <div 
      className={`app-container ${isDashboard ? 'dashboard-view' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Desktop Sidebar */}
      {!isDashboard && (
        <nav className="sidebar desktop-only">
          <div className="sidebar-header" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
            NEK LEADS
          </div>
          <div className="nav-links">
            <NavLink to="/dashboard" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={20} />
              Overview
            </NavLink>
            <NavLink to="/people" className={({isActive}) => `nav-link ${isActive || location.pathname === '/volunteers' ? 'active' : ''}`}>
              <Users size={20} />
              People
            </NavLink>
            <NavLink to="/events" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <Calendar size={20} />
              Events
            </NavLink>
            <NavLink to="/whatsapp-drafts" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <MessageSquare size={20} />
              Drafts
            </NavLink>
            <NavLink to="/settings" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <Settings size={20} />
              Settings
            </NavLink>
          </div>
        </nav>
      )}

      {/* Main Content Area */}
      <main className="main-content">
        {!isDashboard && (
          <header className="topbar">
            {/* If on inner page, show sleek back button */}
            <button 
              onClick={() => navigate('/dashboard')}
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                background: 'none', 
                border: 'none', 
                color: 'var(--color-text-primary)', 
                fontSize: '14px', 
                fontWeight: 600, 
                padding: '6px 10px', 
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease'
              }}
            >
              <ChevronLeft size={20} />
              <span>Back</span>
            </button>

            <div className="desktop-only" style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              {getPageTitle()}
            </div>
          </header>
        )}

        <div className="page-content" style={{ paddingBottom: 'calc(84px + env(safe-area-inset-bottom))' }}>
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation: 4 Core Ecosystem Hubs */}
      <nav className="bottom-nav mobile-only">
        <NavLink to="/dashboard" className={({isActive}) => `bottom-nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>Home</span>
        </NavLink>
        <NavLink to="/people" className={({isActive}) => `bottom-nav-link ${isActive || location.pathname === '/volunteers' ? 'active' : ''}`}>
          <Users size={20} />
          <span>People</span>
        </NavLink>
        <NavLink to="/events" className={({isActive}) => `bottom-nav-link ${isActive ? 'active' : ''}`}>
          <Calendar size={20} />
          <span>Events</span>
        </NavLink>
        <button 
          onClick={() => setIsMoreOpen(true)}
          className={`bottom-nav-link ${isMoreOpen ? 'active' : ''}`}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <MoreHorizontal size={20} />
          <span>More</span>
        </button>
      </nav>

      {/* Slide-Up More Actions Hub */}
      <MoreActionSheet
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        onOpenCalculator={() => setIsCalcOpen(true)}
      />

      {/* Payout Calculator Modal */}
      <PayoutCalculatorModal
        isOpen={isCalcOpen}
        onClose={() => setIsCalcOpen(false)}
        onApplyToClientDraft={() => {
          setIsCalcOpen(false);
          navigate('/whatsapp-drafts');
        }}
        onApplyToTeamDraft={() => {
          setIsCalcOpen(false);
          navigate('/whatsapp-drafts');
        }}
      />
    </div>
  );
};

const App = () => {
  React.useEffect(() => {
    // 1. Editorial brand splash dismiss - instant fluid transition on mount
    const timer = setTimeout(() => {
      const splash = document.getElementById('splash-screen');
      if (splash) {
        splash.style.opacity = '0';
        splash.style.visibility = 'hidden';
        setTimeout(() => splash.remove(), 250);
      }
    }, 120);

    // 2. Freeze background completely whenever any popup or modal occurs
    const checkModalState = () => {
      const hasModal = document.querySelector('.modal-overlay') !== null;
      if (hasModal) {
        document.body.classList.add('modal-open');
      } else {
        document.body.classList.remove('modal-open');
      }
    };

    const observer = new MutationObserver(checkModalState);
    observer.observe(document.body, { childList: true, subtree: true });

    // Block background touch-scrolling on mobile while any popup is open
    const handleTouchMove = (e: TouchEvent) => {
      if (document.body.classList.contains('modal-open')) {
        const target = e.target as HTMLElement | null;
        if (!target || !target.closest('.modal-content')) {
          if (e.cancelable) {
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      document.removeEventListener('touchmove', handleTouchMove);
      document.body.classList.remove('modal-open');
    };
  }, []);

  return (
    <BrowserRouter>
      <ToastProvider>
        <DialogProvider>
          <AppLockProvider>
            <AppLayout>
              <React.Suspense fallback={
                <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                  Loading view...
                </div>
              }>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/people" element={<People />} />
                  <Route path="/volunteers" element={<Volunteers />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/manpower" element={<Manpower />} />
                  <Route path="/whatsapp-drafts" element={<WhatsAppDrafts />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </React.Suspense>
            </AppLayout>
          </AppLockProvider>
        </DialogProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
