import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, Settings, ChevronLeft, Bell, Monitor } from 'lucide-react';
import { ToastProvider } from './contexts/ToastContext';
import { DialogProvider } from './contexts/DialogContext';
import { AppLockProvider } from './contexts/AppLockContext';
import { FloatingMonochromeNav } from './components/FloatingMonochromeNav';
import { QuickAddLeadModal } from './components/QuickAddLeadModal';

import Dashboard from './pages/Dashboard';
import People from './pages/People';
import WhatsAppDrafts from './pages/WhatsAppDrafts';
import SettingsPage from './pages/Settings';
import DesktopApp from './Desktop Version/DesktopApp';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isDesktopView = location.pathname.startsWith('/desktop');

  if (isDesktopView) {
    return <>{children}</>;
  }

  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';
  const isSettings = location.pathname === '/settings';
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

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

  return (
    <div 
      className={`app-container ${isDashboard ? 'dashboard-view' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Desktop Sidebar */}
      {!isDashboard && (
        <nav className="sidebar desktop-only">
          <div className="sidebar-header" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer', fontFamily: "var(--font-display, 'Urbanist', sans-serif)" }}>
            <span style={{ fontWeight: 300, letterSpacing: '2.5px' }}>NEK</span>
            <span style={{ fontWeight: 900, letterSpacing: '1px', marginLeft: '6px' }}>LEADS</span>
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
            <NavLink to="/whatsapp-drafts" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <MessageSquare size={20} />
              Drafts
            </NavLink>
            <NavLink to="/settings" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <Settings size={20} />
              Settings
            </NavLink>
            <NavLink to="/desktop" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} style={{ marginTop: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
              <Monitor size={20} />
              Desktop View
            </NavLink>
          </div>
        </nav>
      )}

      {/* Main Content Area */}
      <main className="main-content">
        {/* Inner Pages Topbar: Left "<", Right Bell + N (Not on Dashboard to avoid empty top-left space) */}
        {!isDashboard && (
          <header className="topbar" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 'calc(52px + env(safe-area-inset-top, 20px))',
            paddingTop: 'calc(env(safe-area-inset-top, 20px) + 6px)',
            paddingLeft: '16px',
            paddingRight: '16px',
            background: 'transparent',
            borderBottom: 'none'
          }}>
            {/* Left: Just "<" (no text) on inner pages */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button 
                onClick={() => navigate('/dashboard')}
                aria-label="Back"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: '36px',
                  height: '36px',
                  background: 'var(--color-bg-secondary)', 
                  border: '1px solid var(--color-border)', 
                  color: 'var(--color-text-primary)', 
                  borderRadius: '50%',
                  cursor: 'pointer'
                }}
              >
                <ChevronLeft size={20} />
              </button>
            </div>

            {/* Right: Notification Bell & Profile Avatar N on the EXACT same line */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  position: 'relative',
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-primary)'
                }}
                title="Notifications"
              >
                <Bell size={16} />
                <span style={{
                  position: 'absolute',
                  top: '7px',
                  right: '8px',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444'
                }} />
              </div>

              <div
                onClick={() => navigate('/settings')}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-bg-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)'
                }}
                title="Settings & Profile"
              >
                N
              </div>
            </div>
          </header>
        )}

        <div 
          className="page-content" 
          style={{ 
            paddingTop: isDashboard ? 'calc(env(safe-area-inset-top, 24px) + 20px)' : undefined,
            paddingBottom: isSettings ? 'calc(24px + env(safe-area-inset-bottom))' : 'calc(72px + env(safe-area-inset-bottom))' 
          }}
        >
          {children}
        </div>
      </main>

      {/* Mobile Floating Monochrome Navigation Dock (Hidden on Settings) */}
      {!isSettings && (
        <FloatingMonochromeNav onOpenQuickAdd={() => setIsQuickAddOpen(true)} />
      )}

      {/* Quick Add Lead Modal (Global access from center + button) */}
      <QuickAddLeadModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
      />
    </div>
  );
};

const RootRedirect: React.FC = () => {
  const isDesktopScreen = window.innerWidth >= 1024 && !/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  return <Navigate to={isDesktopScreen ? "/desktop" : "/dashboard"} replace />;
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

    // 2. Freeze background completely whenever any popup or modal occurs (prevents iOS scroll shifts)
    let savedScrollY = 0;
    const checkModalState = () => {
      const hasModal = document.querySelector('.modal-overlay') !== null;
      if (hasModal) {
        if (!document.body.classList.contains('modal-open')) {
          savedScrollY = window.scrollY;
          document.body.style.top = `-${savedScrollY}px`;
          document.body.classList.add('modal-open');
        }
      } else {
        if (document.body.classList.contains('modal-open')) {
          document.body.classList.remove('modal-open');
      document.body.style.top = '';
          document.body.style.top = '';
          window.scrollTo(0, savedScrollY);
        }
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
      document.body.style.top = '';
    };
  }, []);

  return (
    <BrowserRouter>
      <ToastProvider>
        <DialogProvider>
          <AppLockProvider>
            <AppLayout>
              <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/people" element={<People />} />
                <Route path="/volunteers" element={<Navigate to="/people" replace />} />
                <Route path="/manpower" element={<Navigate to="/people" replace />} />
                <Route path="/whatsapp-drafts" element={<WhatsAppDrafts />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/desktop" element={<DesktopApp />} />
              </Routes>
            </AppLayout>
          </AppLockProvider>
        </DialogProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
