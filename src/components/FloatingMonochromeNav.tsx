import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Plus, User, MessageSquare, DownloadCloud, Settings, UserPlus, ChevronRight } from 'lucide-react';
import { downloadInstantBackup } from '../lib/backup';
import { useToast } from '../contexts/ToastContext';

interface FloatingMonochromeNavProps {
  onOpenQuickAdd: () => void;
}

export function FloatingMonochromeNav({ onOpenQuickAdd }: FloatingMonochromeNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isDashboardActive = location.pathname === '/' || location.pathname === '/dashboard';
  const isPeopleActive = location.pathname.startsWith('/people') || location.pathname === '/volunteers' || location.pathname === '/manpower';

  // Completely hide the floating navigation bar on Settings
  if (location.pathname === '/settings') {
    return null;
  }

  // Notch & Circle Horizontal Coordinates:
  // Left Slot (Home): center = 44px, circle left = 19px (44 - 25)
  // Right Slot (People): center = 216px, circle left = 191px (216 - 25)
  // Default to Home if on another route like drafts or settings
  const activePosition: 'home' | 'people' = isPeopleActive ? 'people' : 'home';
  const notchX = activePosition === 'home' ? 44 : 216;
  const circleX = activePosition === 'home' ? 19 : 191;

  const handleInstantBackup = () => {
    try {
      const count = downloadInstantBackup();
      addToast('success', `Backup downloaded! (${count} records)`);
      setIsMenuOpen(false);
    } catch {
      addToast('error', 'Could not create backup. Please try again.');
    }
  };

  const handleNavClick = (path: string) => {
    setIsMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* 1. Backdrop overlay when "+" menu is active */}
      {isMenuOpen && (
        <div 
          className="dock-menu-backdrop mobile-only"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* 2. Floating Quick Actions Card ("+" Menu) */}
      <div className={`dock-action-popover mobile-only ${isMenuOpen ? 'open' : ''}`}>
        <div className="dock-popover-content">
          <div className="dock-popover-header">
            <span className="dock-popover-title">Quick Actions</span>
            <span className="dock-popover-hint">1-tap shortcuts</span>
          </div>

          <div className="dock-popover-items">
            {/* WhatsApp Drafts */}
            <button 
              type="button"
              className="dock-popover-item"
              onClick={() => handleNavClick('/whatsapp-drafts')}
            >
              <div className="dock-item-icon-wrap">
                <MessageSquare size={18} />
              </div>
              <div className="dock-item-text">
                <span className="dock-item-title">WhatsApp Drafts</span>
                <span className="dock-item-desc">Client & crew messaging templates</span>
              </div>
              <ChevronRight size={16} className="dock-item-chevron" />
            </button>

            {/* Instant Backup (1-Tap) */}
            <button 
              type="button"
              className="dock-popover-item"
              onClick={handleInstantBackup}
            >
              <div className="dock-item-icon-wrap">
                <DownloadCloud size={18} />
              </div>
              <div className="dock-item-text">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="dock-item-title">Instant Backup</span>
                  <span className="dock-badge-pill">1-Tap</span>
                </div>
                <span className="dock-item-desc">Save full database to this device</span>
              </div>
              <ChevronRight size={16} className="dock-item-chevron" />
            </button>

            {/* Settings */}
            <button 
              type="button"
              className="dock-popover-item"
              onClick={() => handleNavClick('/settings')}
            >
              <div className="dock-item-icon-wrap">
                <Settings size={18} />
              </div>
              <div className="dock-item-text">
                <span className="dock-item-title">Settings</span>
                <span className="dock-item-desc">Preferences, appearance & data</span>
              </div>
              <ChevronRight size={16} className="dock-item-chevron" />
            </button>

            {/* Quick Add Lead */}
            <button 
              type="button"
              className="dock-popover-item"
              onClick={() => {
                setIsMenuOpen(false);
                onOpenQuickAdd();
              }}
              style={{ borderTop: '1px solid var(--color-border)', marginTop: '2px', paddingTop: '10px' }}
            >
              <div className="dock-item-icon-wrap" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg-primary)' }}>
                <UserPlus size={18} />
              </div>
              <div className="dock-item-text">
                <span className="dock-item-title" style={{ fontWeight: 800 }}>+ Add New Lead</span>
                <span className="dock-item-desc">Create volunteer, hostess or client</span>
              </div>
              <ChevronRight size={16} className="dock-item-chevron" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Floating Monochrome Navigation Bar */}
      <nav className="monochrome-floating-nav mobile-only" aria-label="Mobile Navigation">
        <div className="dock-container">
          {/* SVG Animated Notched Pill Background */}
          <svg 
            className="dock-svg-bg" 
            width="260" 
            height="56" 
            viewBox="0 0 260 56" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <mask id="dock-notch-mask">
                {/* Keep full pill surface */}
                <rect x="0" y="0" width="260" height="56" rx="28" fill="white" />
                
                {/* Notch cutout group that smoothly slides horizontally between Home (44px) and People (216px) */}
                <g 
                  className="notch-sliding-cutout"
                  style={{
                    transform: `translateX(${notchX}px)`,
                    transition: 'transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                >
                  <circle cx="0" cy="13" r="29" fill="black" />
                  {/* Smooth concave side fillets */}
                  <path d="M -29 0 C -29 5 -25 10 -20 11 L -20 0 Z" fill="black" />
                  <path d="M 29 0 C 29 5 25 10 20 11 L 20 0 Z" fill="black" />
                </g>
              </mask>
            </defs>

            {/* Pill Dock Body with Cutout Mask */}
            <rect 
              x="0.5" 
              y="0.5" 
              width="259" 
              height="55" 
              rx="27.5" 
              className="dock-body-rect"
              mask="url(#dock-notch-mask)"
            />
          </svg>

          {/* Elevated Circular Highlight Bubble that glides smoothly to active tab */}
          <div 
            className="dock-elevated-circle-bubble"
            style={{
              transform: `translateX(${circleX}px)`,
              transition: 'transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {activePosition === 'home' ? (
              <Home size={22} strokeWidth={2.4} className="dock-active-icon" />
            ) : (
              <User size={22} strokeWidth={2.4} className="dock-active-icon" />
            )}
          </div>

          {/* Tab 1: Home Button (Left slot) */}
          <button 
            type="button"
            onClick={() => handleNavClick('/dashboard')}
            className={`dock-btn dock-home-slot ${isDashboardActive ? 'active' : ''}`}
            aria-label="Dashboard"
            title="Dashboard"
          >
            {/* When not elevated, render subtle outline icon */}
            {activePosition !== 'home' && (
              <Home size={21} strokeWidth={1.8} className="dock-inactive-icon" />
            )}
          </button>

          {/* Tab 2: "+" Quick Actions Menu Button (Center slot) */}
          <button 
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className={`dock-btn dock-plus-slot ${isMenuOpen ? 'menu-open' : ''}`}
            aria-label="Quick Actions"
            title="Quick Actions"
          >
            <div className="dock-plus-icon-wrapper">
              <Plus size={24} strokeWidth={2.3} />
            </div>
          </button>

          {/* Tab 3: People / Lead Button (Right slot) */}
          <button 
            type="button"
            onClick={() => handleNavClick('/people')}
            className={`dock-btn dock-people-slot ${isPeopleActive ? 'active' : ''}`}
            aria-label="People & Leads"
            title="People Directory"
          >
            {/* When not elevated, render subtle outline icon */}
            {activePosition !== 'people' && (
              <User size={21} strokeWidth={1.8} className="dock-inactive-icon" />
            )}
          </button>
        </div>
      </nav>
    </>
  );
}
