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

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="app-container">
      {/* Desktop Sidebar */}
      <nav className="sidebar desktop-only">
        <div className="sidebar-header">
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

      {/* Main Content Area */}
      <main className="main-content">
        <header className="topbar">
          <div className="mobile-only font-display" style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '1.5px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            NEK. <span style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '3px', color: 'var(--color-text-secondary)' }}>LEADS</span>
          </div>
          <div className="desktop-only" />
          <div className="text-sm" style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--color-success)' }}></div>
            Online
          </div>
        </header>
        <div className="page-content">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
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
