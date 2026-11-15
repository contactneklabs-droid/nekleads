import { useState, useEffect, useRef } from 'react';
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
  const [isScrollHidden, setIsScrollHidden] = useState(false);
  const [isStretching, setIsStretching] = useState(false);

  const isDashboardActive = location.pathname === '/' || location.pathname === '/dashboard';
  const isPeopleActive = location.pathname.startsWith('/people') || location.pathname === '/volunteers' || location.pathname === '/manpower';

  // Completely hide the floating navigation bar on Settings
  if (location.pathname === '/settings') {
    return null;
  }

  // Notch & Circle Horizontal Coordinates (Minimized Compact Geometry):
  // Left Slot (Home): center = 34px, circle left = 13px (34 - 21)
  // Right Slot (People): center = 186px, circle left = 165px (186 - 21)
  const activePosition: 'home' | 'people' = isPeopleActive ? 'people' : 'home';
  const notchX = activePosition === 'home' ? 34 : 186;
  const circleX = activePosition === 'home' ? 13 : 165;

  // 1 & 2. Liquid Elastic Stretch & Hop detection on tab transition
  const prevPosRef = useRef(activePosition);
  useEffect(() => {
    if (prevPosRef.current !== activePosition) {
      setIsStretching(true);
      const timer = setTimeout(() => setIsStretching(false), 380);
      prevPosRef.current = activePosition;
      return () => clearTimeout(timer);
    }
  }, [activePosition]);

  // 4. Smart Scroll-Aware Hide & Reveal
  const lastScrollY = useRef(0);
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      // Always show at top of page
      if (currentY <= 30) {
        setIsScrollHidden(false);
        lastScrollY.current = currentY;
        return;
      }

      const delta = currentY - lastScrollY.current;
      if (delta > 8) {
        // Scrolling down -> hide dock & close popover
        setIsScrollHidden(true);
        setIsMenuOpen(false);
      } else if (delta < -6) {
        // Scrolling up -> reveal dock
        setIsScrollHidden(false);
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      {/* Backdrop overlay when "+" menu is active */}
      {isMenuOpen && (
        <div 
          className="dock-menu-backdrop mobile-only"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Floating Quick Actions Card ("+" Menu with 3. Staggered Cascade) */}
      <div className={`dock-action-popover mobile-only ${isMenuOpen ? 'open' : ''}`}>
        <div className="dock-popover-content">
          <div className="dock-popover-header">
            <span className="dock-popover-title">Quick Actions</span>
            <span className="dock-popover-hint">1-tap shortcuts</span>
          </div>

          <div className="dock-popover-items">
            {/* 1. WhatsApp Drafts */}
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

            {/* 2. Instant Backup (1-Tap) */}
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

            {/* 3. Settings */}
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

            {/* 4. Quick Add Lead */}
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

      {/* Floating Monochrome Navigation Bar (with 4. Smart Scroll Hide & 1. Liquid Elastic Stretch) */}
      <nav 
        className={`monochrome-floating-nav mobile-only ${isScrollHidden ? 'scroll-hidden' : ''}`} 
        aria-label="Mobile Navigation"
      >
        <div className="dock-container">
          {/* SVG Animated Notched Pill Background */}
          <svg 
            className="dock-svg-bg" 
            width="220" 
            height="48" 
            viewBox="0 0 220 48" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <mask id="dock-notch-mask">
                <rect x="0" y="0" width="220" height="48" rx="24" fill="white" />
                
                <g 
                  className="notch-sliding-cutout"
                  style={{
                    transform: `translateX(${notchX}px)`,
                    transition: 'transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                >
                  <circle cx="0" cy="11" r="25" fill="black" />
                  <path d="M -25 0 C -25 4 -21 8 -16 9 L -16 0 Z" fill="black" />
                  <path d="M 25 0 C 25 4 21 8 16 9 L 16 0 Z" fill="black" />
                </g>
              </mask>
            </defs>

            <rect 
              x="0.5" 
              y="0.5" 
              width="219" 
              height="47" 
              rx="23.5" 
              className="dock-body-rect"
              mask="url(#dock-notch-mask)"
            />
          </svg>

          {/* Elevated Circular Bubble with 1. Liquid Elastic Stretch & 2. Icon Spring Hop */}
          <div 
            className="dock-elevated-circle-bubble"
            style={{
              transform: `translateX(${circleX}px)`,
              transition: 'transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            <div className={`dock-bubble-liquid-inner ${isStretching ? 'is-stretching' : 'is-settling'}`}>
              {activePosition === 'home' ? (
                <Home size={19} strokeWidth={2.4} className="dock-active-icon" />
              ) : (
                <User size={19} strokeWidth={2.4} className="dock-active-icon" />
              )}
            </div>
          </div>

          {/* Tab 1: Home Button (Left slot) */}
          <button 
            type="button"
            onClick={() => handleNavClick('/dashboard')}
            className={`dock-btn dock-home-slot ${isDashboardActive ? 'active' : ''}`}
            aria-label="Dashboard"
            title="Dashboard"
          >
            {activePosition !== 'home' && (
              <Home size={18} strokeWidth={1.8} className="dock-inactive-icon" />
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
              <Plus size={21} strokeWidth={2.3} />
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
            {activePosition !== 'people' && (
              <User size={18} strokeWidth={1.8} className="dock-inactive-icon" />
            )}
          </button>
        </div>
      </nav>
    </>
  );
}
