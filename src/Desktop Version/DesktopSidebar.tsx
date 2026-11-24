import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  Calculator, 
  Settings, 
  Sun, 
  Moon, 
  Plus, 
  Search,
  FolderOpen
} from 'lucide-react';
import { Candidate } from '../lib/db';

interface DesktopSidebarProps {
  activeTab: 'overview' | 'people' | 'drafts' | 'calculator' | 'settings';
  setActiveTab: (tab: 'overview' | 'people' | 'drafts' | 'calculator' | 'settings') => void;
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
  candidates: Candidate[];
  onOpenQuickAdd: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  setActiveTab,
  selectedCategory,
  setSelectedCategory,
  candidates,
  onOpenQuickAdd,
  theme,
  toggleTheme,
  searchQuery,
  setSearchQuery
}) => {
  const volunteerCount = candidates.filter(c => c.type === 'Volunteer').length;
  const hostessCount = candidates.filter(c => c.type === 'Hostess').length;
  const manpowerCount = candidates.filter(c => c.type === 'Manpower').length;
  const clientCount = candidates.filter(c => c.type === 'Client').length;

  return (
    <aside className="desktop-sidebar-pane">
      {/* Top User Profile Header (matches reference) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 4px 14px 4px',
        borderBottom: '1px solid var(--desktop-border)',
        marginBottom: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: 'var(--desktop-accent)',
            color: 'var(--desktop-card-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '15px',
            flexShrink: 0
          }}>
            N
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '13.5px', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              NEK Operations
            </div>
            <div style={{ fontSize: '11px', color: 'var(--desktop-text-muted)', whiteSpace: 'nowrap' }}>
              Lead & Crew Network
            </div>
          </div>
        </div>

        <button 
          onClick={onOpenQuickAdd}
          title="Quick Add Lead"
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            border: '1px solid var(--desktop-border)',
            background: 'var(--desktop-card-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--desktop-text-primary)'
          }}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Search Input Bar (matches reference) */}
      <div style={{ marginBottom: '16px' }}>
        <div className="desktop-search-input-wrap">
          <Search size={14} color="var(--desktop-text-muted)" />
          <input 
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '12.5px',
              color: 'var(--desktop-text-primary)',
              width: '100%'
            }}
          />
          <span className="desktop-kbd-pill">⌘K</span>
        </div>
      </div>

      {/* Scrollable Navigation Sections */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* SECTION: Essentials */}
        <div>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--desktop-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            padding: '0 8px 6px 8px'
          }}>
            Essentials
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div 
              className={`desktop-nav-link ${activeTab === 'overview' && !selectedCategory ? 'active' : ''}`}
              onClick={() => { setActiveTab('overview'); setSelectedCategory(null); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <LayoutDashboard size={16} />
                <span>Overview</span>
              </div>
            </div>

            <div 
              className={`desktop-nav-link ${activeTab === 'people' && !selectedCategory ? 'active' : ''}`}
              onClick={() => { setActiveTab('people'); setSelectedCategory(null); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={16} />
                <span>Leads & Crew</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--desktop-text-muted)' }}>{candidates.length}</span>
            </div>

            <div 
              className={`desktop-nav-link ${activeTab === 'drafts' ? 'active' : ''}`}
              onClick={() => { setActiveTab('drafts'); setSelectedCategory(null); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MessageSquare size={16} />
                <span>WhatsApp Drafts</span>
              </div>
            </div>

            <div 
              className={`desktop-nav-link ${activeTab === 'calculator' ? 'active' : ''}`}
              onClick={() => { setActiveTab('calculator'); setSelectedCategory(null); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Calculator size={16} />
                <span>Payout Calculator</span>
              </div>
            </div>

            <div 
              className={`desktop-nav-link ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => { setActiveTab('settings'); setSelectedCategory(null); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Settings size={16} />
                <span>Settings & Data</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: Categories (with pill indicators) */}
        <div>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--desktop-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            padding: '0 8px 6px 8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Categories</span>
            <FolderOpen size={12} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div 
              className={`desktop-nav-link ${selectedCategory === 'Volunteer' ? 'active' : ''}`}
              onClick={() => { setActiveTab('people'); setSelectedCategory('Volunteer'); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3B82F6' }}></span>
                <span>Volunteers</span>
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: 600 }}>{volunteerCount}</span>
            </div>

            <div 
              className={`desktop-nav-link ${selectedCategory === 'Hostess' ? 'active' : ''}`}
              onClick={() => { setActiveTab('people'); setSelectedCategory('Hostess'); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EC4899' }}></span>
                <span>Hostesses</span>
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: 600 }}>{hostessCount}</span>
            </div>

            <div 
              className={`desktop-nav-link ${selectedCategory === 'Manpower' ? 'active' : ''}`}
              onClick={() => { setActiveTab('people'); setSelectedCategory('Manpower'); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B' }}></span>
                <span>Manpower</span>
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: 600 }}>{manpowerCount}</span>
            </div>

            <div 
              className={`desktop-nav-link ${selectedCategory === 'Client' ? 'active' : ''}`}
              onClick={() => { setActiveTab('people'); setSelectedCategory('Client'); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }}></span>
                <span>Clients</span>
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: 600 }}>{clientCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls (Theme toggle) */}
      <div style={{
        paddingTop: '12px',
        borderTop: '1px solid var(--desktop-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <div 
          className="desktop-nav-link"
          onClick={toggleTheme}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            <span>{theme === 'dark' ? 'Light Appearance' : 'Dark Appearance'}</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--desktop-text-muted)' }}>
            {theme === 'dark' ? 'Dark' : 'Light'}
          </span>
        </div>
      </div>
    </aside>
  );
};
