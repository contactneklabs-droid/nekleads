import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, UserCog, MessageSquare, Settings } from 'lucide-react';
import { ToastProvider } from './contexts/ToastContext';
import { DialogProvider } from './contexts/DialogContext';

import Dashboard from './pages/Dashboard';
import Volunteers from './pages/Volunteers';
import Manpower from './pages/Manpower';
import WhatsAppDrafts from './pages/WhatsAppDrafts';
import SettingsPage from './pages/Settings';

import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';

  // Format title for inner pages
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/volunteers': return 'Talent Directory';
      case '/manpower': return 'Manpower Staff';
      case '/whatsapp-drafts': return 'WhatsApp Drafts';
      case '/settings': return 'System Settings';
      default: return 'NEK LEADS';
    }
  };

  return (
    <div className={`app-container ${isDashboard ? 'dashboard-view' : ''}`}>
      {/* Desktop Sidebar: Only visible when NOT on dashboard */}
      {!isDashboard && (
        <nav className="sidebar desktop-only">
          <div className="sidebar-header" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
            NEK LEADS
          </div>
          <div className="nav-links">
            <NavLink to="/dashboard" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={20} />
              Dashboard
            </NavLink>
            <NavLink to="/volunteers" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <Users size={20} />
              Talent
            </NavLink>
            <NavLink to="/manpower" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <UserCog size={20} />
              Manpower
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
        <header className="topbar">
          {/* If on inner page, show sleek back button */}
          {!isDashboard ? (
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
              <span>Dashboard</span>
            </button>
          ) : (
            <div className="font-display" style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '1px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              NEK. <span style={{ fontSize: '13px', fontWeight: 500, letterSpacing: '3px', color: 'var(--color-text-secondary)' }}>LEADS</span>
            </div>
          )}

          {!isDashboard && (
            <div className="desktop-only" style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              {getPageTitle()}
            </div>
          )}

        </header>

        <div className="page-content" style={{ paddingBottom: isDashboard ? '40px' : 'calc(90px + env(safe-area-inset-bottom))' }}>
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation: Strictly hidden on Dashboard */}
      {!isDashboard && (
        <nav className="bottom-nav mobile-only">
          <NavLink to="/dashboard" className={({isActive}) => `bottom-nav-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            <span>Home</span>
          </NavLink>
          <NavLink to="/volunteers" className={({isActive}) => `bottom-nav-link ${isActive ? 'active' : ''}`}>
            <Users size={20} />
            <span>Talent</span>
          </NavLink>
          <NavLink to="/manpower" className={({isActive}) => `bottom-nav-link ${isActive ? 'active' : ''}`}>
            <UserCog size={20} />
            <span>Staff</span>
          </NavLink>
          <NavLink to="/whatsapp-drafts" className={({isActive}) => `bottom-nav-link ${isActive ? 'active' : ''}`}>
            <MessageSquare size={20} />
            <span>Drafts</span>
          </NavLink>
          <NavLink to="/settings" className={({isActive}) => `bottom-nav-link ${isActive ? 'active' : ''}`}>
            <Settings size={20} />
            <span>Settings</span>
          </NavLink>
        </nav>
      )}
    </div>
  );
};

const App = () => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const splash = document.getElementById('splash-screen');
      if (splash) {
        splash.style.opacity = '0';
        splash.style.visibility = 'hidden';
        setTimeout(() => splash.remove(), 600); // Remove from DOM after smooth transition
      }
    }, 1800); // 1.8 seconds for editorial brand animation
    return () => clearTimeout(timer);
  }, []);

  return (
    <BrowserRouter>
      <ToastProvider>
        <DialogProvider>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/volunteers" element={<Volunteers />} />
              <Route path="/manpower" element={<Manpower />} />
              <Route path="/whatsapp-drafts" element={<WhatsAppDrafts />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </AppLayout>
        </DialogProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
