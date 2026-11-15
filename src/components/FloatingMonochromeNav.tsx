import { NavLink, useLocation } from 'react-router-dom';
import { Home, Plus, User } from 'lucide-react';

interface FloatingMonochromeNavProps {
  onOpenQuickAdd: () => void;
}

export function FloatingMonochromeNav({ onOpenQuickAdd }: FloatingMonochromeNavProps) {
  const location = useLocation();
  const isDashboardActive = location.pathname === '/' || location.pathname === '/dashboard';
  const isPeopleActive = location.pathname.startsWith('/people') || location.pathname === '/volunteers' || location.pathname === '/manpower';

  return (
    <nav className="monochrome-floating-nav mobile-only" aria-label="Mobile Navigation">
      <div className="dock-container">
        {/* SVG Notched Pill Background */}
        <svg 
          className="dock-svg-bg" 
          width="260" 
          height="56" 
          viewBox="0 0 260 56" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M 28 0 L 179 0 C 183 0 186 5 187 10 A 29 29 0 0 0 245 10 C 246 5 249 0 253 0 A 7 7 0 0 1 260 7 L 260 36 A 20 20 0 0 1 240 56 L 28 56 A 28 28 0 0 1 0 28 A 28 28 0 0 1 28 0 Z" 
            className="dock-path"
          />
        </svg>

        {/* 1. Left: Home */}
        <NavLink 
          to="/dashboard" 
          className={`dock-btn dock-home-btn ${isDashboardActive ? 'active' : ''}`}
          aria-label="Home"
          title="Home"
        >
          <Home size={22} strokeWidth={isDashboardActive ? 2.4 : 1.8} />
        </NavLink>

        {/* 2. Middle: Quick Add (+) */}
        <button 
          type="button"
          onClick={onOpenQuickAdd} 
          className="dock-btn dock-plus-btn"
          aria-label="Quick Add Lead"
          title="Add Lead"
        >
          <Plus size={24} strokeWidth={2.2} />
        </button>

        {/* 3. Right: Elevated People / User Circular Button */}
        <NavLink 
          to="/people" 
          className={`dock-btn dock-user-btn ${isPeopleActive ? 'active' : ''}`}
          aria-label="People"
          title="People Directory"
        >
          <User size={22} strokeWidth={isPeopleActive ? 2.4 : 1.9} />
        </NavLink>
      </div>
    </nav>
  );
}
