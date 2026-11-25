import React, { useMemo } from 'react';
import { 
  Users, 
  Sparkles, 
  Wrench, 
  MessageSquare, 
  Calculator, 
  ArrowUpDown, 
  Search, 
  Plus, 
  ShieldCheck
} from 'lucide-react';
import { Candidate, ActivityItem } from '../lib/db';

interface DesktopOverviewProps {
  candidates: Candidate[];
  activities?: ActivityItem[];
  onNavigateTab: (tab: 'people' | 'drafts' | 'calculator' | 'settings', category?: string) => void;
  onOpenQuickAdd: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const DesktopOverview: React.FC<DesktopOverviewProps> = ({
  candidates,
  onNavigateTab,
  onOpenQuickAdd,
  searchQuery,
  setSearchQuery
}) => {
  const volunteerCount = candidates.filter(c => c.type === 'Volunteer').length;
  const hostessCount = candidates.filter(c => c.type === 'Hostess').length;
  const manpowerCount = candidates.filter(c => c.type === 'Manpower').length;
  const clientCount = candidates.filter(c => c.type === 'Client').length;
  const totalLeads = candidates.length;

  // Real time 30-day cumulative timeline curve calculated directly from actual candidate registration timestamps
  const trendPoints = useMemo(() => {
    if (totalLeads === 0) {
      // Clean baseline zero graph when no data registered
      return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }

    const now = new Date();
    // Create 12 timeline sample points across the last 30 days
    const intervals = 12;
    const points: number[] = [];

    for (let i = 0; i < intervals; i++) {
      // Days ago from past (30 days ago) to today (0 days ago)
      const daysAgo = 30 - (i * (30 / (intervals - 1)));
      const sampleDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      // Count candidates created up to this sample date
      const countUpToDate = candidates.filter(c => {
        if (!c.createdAt) return true;
        return new Date(c.createdAt).getTime() <= sampleDate.getTime();
      }).length;

      points.push(countUpToDate);
    }

    // Ensure the last point matches exact live total
    points[points.length - 1] = totalLeads;
    return points;
  }, [candidates, totalLeads]);

  // Generate smooth SVG cubic Bezier path
  const svgPathData = useMemo(() => {
    const width = 560;
    const height = 150;
    const maxVal = Math.max(...trendPoints, 10);
    const minVal = 0;
    
    const pts = trendPoints.map((val, idx) => {
      const x = (idx / (trendPoints.length - 1)) * (width - 40) + 20;
      const y = height - 20 - ((val - minVal) / (maxVal - minVal || 1)) * (height - 45);
      return { x, y, val };
    });

    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const curr = pts[i];
      const next = pts[i + 1];
      const mx = (curr.x + next.x) / 2;
      d += ` C ${mx} ${curr.y}, ${mx} ${next.y}, ${next.x} ${next.y}`;
    }

    const areaPath = `${d} L ${pts[pts.length - 1].x} ${height} L ${pts[0].x} ${height} Z`;
    return { linePath: d, areaPath, points: pts };
  }, [trendPoints]);

  // Donut chart percentages
  const percentages = useMemo(() => {
    if (totalLeads === 0) return { vol: 45, host: 30, man: 15, cli: 10 };
    return {
      vol: Math.round((volunteerCount / totalLeads) * 100) || 0,
      host: Math.round((hostessCount / totalLeads) * 100) || 0,
      man: Math.round((manpowerCount / totalLeads) * 100) || 0,
      cli: Math.round((clientCount / totalLeads) * 100) || 0,
    };
  }, [totalLeads, volunteerCount, hostessCount, manpowerCount, clientCount]);

  return (
    <div className="desktop-main-pane">
      {/* Top Header Row with Breadcrumbs & Action Bar (matches reference) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '13px', color: 'var(--desktop-text-muted)', marginBottom: '4px', fontWeight: 500 }}>
            NEK Leads / Operations
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0, letterSpacing: '-0.8px' }}>
            Overview
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="desktop-search-input-wrap" style={{ width: '220px' }}>
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
            <span className="desktop-kbd-pill">⌘F</span>
          </div>

          <button
            onClick={onOpenQuickAdd}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 700
            }}
          >
            <Plus size={15} />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* 1. TOP 6 FEATURE CARDS GRID (matches reference 3x2 cards) */}
      <div className="desktop-feature-grid">
        {/* Card 1: Volunteers */}
        <div className="desktop-grid-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--desktop-accent-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3B82F6'
            }}>
              <Users size={18} />
            </div>
            <span style={{ fontSize: '18px', fontWeight: 800 }}>{volunteerCount}</span>
          </div>
          <div style={{ margin: '10px 0 12px 0' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>Volunteers Pool</div>
            <div style={{ fontSize: '11.5px', color: 'var(--desktop-text-secondary)', lineHeight: 1.35 }}>
              Active event volunteers available across Bangalore zones.
            </div>
          </div>
          <button 
            className="desktop-card-btn"
            onClick={() => onNavigateTab('people', 'Volunteer')}
          >
            View All
          </button>
        </div>

        {/* Card 2: Hostesses */}
        <div className="desktop-grid-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--desktop-accent-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#EC4899'
            }}>
              <Sparkles size={18} />
            </div>
            <span style={{ fontSize: '18px', fontWeight: 800 }}>{hostessCount}</span>
          </div>
          <div style={{ margin: '10px 0 12px 0' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>Hostesses Roster</div>
            <div style={{ fontSize: '11.5px', color: 'var(--desktop-text-secondary)', lineHeight: 1.35 }}>
              Verified VIP & corporate event hostesses on standby.
            </div>
          </div>
          <button 
            className="desktop-card-btn"
            onClick={() => onNavigateTab('people', 'Hostess')}
          >
            View All
          </button>
        </div>

        {/* Card 3: Manpower */}
        <div className="desktop-grid-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--desktop-accent-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F59E0B'
            }}>
              <Wrench size={18} />
            </div>
            <span style={{ fontSize: '18px', fontWeight: 800 }}>{manpowerCount}</span>
          </div>
          <div style={{ margin: '10px 0 12px 0' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>Event Manpower</div>
            <div style={{ fontSize: '11.5px', color: 'var(--desktop-text-secondary)', lineHeight: 1.35 }}>
              Stage setup, sound, security, and venue logistics crew.
            </div>
          </div>
          <button 
            className="desktop-card-btn"
            onClick={() => onNavigateTab('people', 'Manpower')}
          >
            View All
          </button>
        </div>

        {/* Card 4: WhatsApp Drafts */}
        <div className="desktop-grid-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--desktop-accent-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981'
            }}>
              <MessageSquare size={18} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#10B981', padding: '2px 8px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)' }}>
              Ready
            </span>
          </div>
          <div style={{ margin: '10px 0 12px 0' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>WhatsApp Studio</div>
            <div style={{ fontSize: '11.5px', color: 'var(--desktop-text-secondary)', lineHeight: 1.35 }}>
              1-tap automated crew call, shift confirmation & client drafts.
            </div>
          </div>
          <button 
            className="desktop-card-btn"
            onClick={() => onNavigateTab('drafts')}
          >
            Compose
          </button>
        </div>

        {/* Card 5: Payout Calculator */}
        <div className="desktop-grid-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--desktop-accent-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--desktop-text-primary)'
            }}>
              <Calculator size={18} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--desktop-text-muted)' }}>
              Margins
            </span>
          </div>
          <div style={{ margin: '10px 0 12px 0' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>Payout Calculator</div>
            <div style={{ fontSize: '11.5px', color: 'var(--desktop-text-secondary)', lineHeight: 1.35 }}>
              Calculate shifts, food allowances, OT, and agency profits.
            </div>
          </div>
          <button 
            className="desktop-card-btn"
            onClick={() => onNavigateTab('calculator')}
          >
            Calculate
          </button>
        </div>

        {/* Card 6: Data & Backup */}
        <div className="desktop-grid-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--desktop-accent-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--desktop-text-primary)'
            }}>
              <ArrowUpDown size={18} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--desktop-text-muted)' }}>
              JSON / Excel
            </span>
          </div>
          <div style={{ margin: '10px 0 12px 0' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>Import & Export</div>
            <div style={{ fontSize: '11.5px', color: 'var(--desktop-text-secondary)', lineHeight: 1.35 }}>
              Smart import from Google Forms, full JSON backup & CSV export.
            </div>
          </div>
          <button 
            className="desktop-card-btn"
            onClick={() => onNavigateTab('settings')}
          >
            Manage Data
          </button>
        </div>
      </div>

      {/* 2. SHORTCUT ROW (matches reference folder row) */}
      <div>
        <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: '14px', letterSpacing: '-0.3px' }}>
          Shortcut
        </div>

        <div className="desktop-shortcuts-scroll">
          <div className="desktop-folder-item" onClick={() => onNavigateTab('people', 'Volunteer')}>
            <div className="desktop-folder-icon-3d">
              <Users size={24} color="#FFFFFF" />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>Volunteers</span>
          </div>

          <div className="desktop-folder-item" onClick={() => onNavigateTab('people', 'Hostess')}>
            <div className="desktop-folder-icon-3d">
              <Sparkles size={24} color="#FFFFFF" />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>Hostesses</span>
          </div>

          <div className="desktop-folder-item" onClick={() => onNavigateTab('people', 'Manpower')}>
            <div className="desktop-folder-icon-3d">
              <Wrench size={24} color="#FFFFFF" />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>Manpower</span>
          </div>

          <div className="desktop-folder-item" onClick={() => onNavigateTab('people', 'Client')}>
            <div className="desktop-folder-icon-3d">
              <ShieldCheck size={24} color="#FFFFFF" />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>Clients</span>
          </div>

          <div className="desktop-folder-item" onClick={() => onNavigateTab('drafts')}>
            <div className="desktop-folder-icon-3d">
              <MessageSquare size={24} color="#FFFFFF" />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>Drafts</span>
          </div>

          <div className="desktop-folder-item" onClick={() => onNavigateTab('calculator')}>
            <div className="desktop-folder-icon-3d">
              <Calculator size={24} color="#FFFFFF" />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>Payouts</span>
          </div>

          <div className="desktop-folder-item" onClick={() => onNavigateTab('settings')}>
            <div className="desktop-folder-icon-3d">
              <ArrowUpDown size={24} color="#FFFFFF" />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>Backups</span>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM ANALYTICS ROW (matches reference spline graph + donut progress) */}
      <div className="desktop-analytics-grid">
        {/* Left: Documentation / Staffing Engagement Trend */}
        <div className="desktop-analytics-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.2px' }}>
              Lead & Crew Acquisition Trend
            </span>
            <span style={{ fontSize: '11px', color: 'var(--desktop-text-muted)', fontWeight: 600 }}>
              Last 30 Days · {totalLeads} Total Leads
            </span>
          </div>

          <div style={{ position: 'relative', height: '170px', width: '100%', overflow: 'hidden' }}>
            <svg 
              viewBox="0 0 560 150" 
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="desktopSplineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E24A4A" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#E24A4A" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal hairline reference grid */}
              <line x1="20" y1="35" x2="540" y2="35" stroke="var(--desktop-border)" strokeDasharray="3 3" />
              <line x1="20" y1="75" x2="540" y2="75" stroke="var(--desktop-border)" strokeDasharray="3 3" />
              <line x1="20" y1="115" x2="540" y2="115" stroke="var(--desktop-border)" strokeDasharray="3 3" />

              {/* Area gradient fill below curve */}
              <path d={svgPathData.areaPath} fill="url(#desktopSplineGrad)" />

              {/* Spline Line */}
              <path 
                d={svgPathData.linePath} 
                fill="none" 
                stroke="#E24A4A" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
              />

              {/* Data points (matching red nodes with white centers in reference) */}
              {svgPathData.points.map((pt, i) => (
                <g key={i}>
                  <circle cx={pt.x} cy={pt.y} r="5" fill="#E24A4A" />
                  <circle cx={pt.x} cy={pt.y} r="2.5" fill="#FFFFFF" />
                </g>
              ))}
            </svg>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: 'var(--desktop-text-muted)',
            fontWeight: 600,
            marginTop: '8px',
            padding: '0 8px'
          }}>
            <span>Week 1</span>
            <span>Week 2</span>
            <span>Week 3</span>
            <span>Week 4</span>
            <span style={{ color: 'var(--desktop-text-primary)' }}>Today</span>
          </div>
        </div>

        {/* Right: Category Distribution Donut Ring Chart */}
        <div className="desktop-analytics-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.2px', marginBottom: '8px' }}>
            Category Ratio
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', height: '140px' }}>
            <svg viewBox="0 0 120 120" style={{ width: '120px', height: '120px', transform: 'rotate(-90deg)' }}>
              {/* Background ring */}
              <circle
                cx="60"
                cy="60"
                r="45"
                fill="none"
                stroke="var(--desktop-border)"
                strokeWidth="12"
              />
              {/* Volunteers Arc */}
              <circle
                cx="60"
                cy="60"
                r="45"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="12"
                strokeDasharray={`${(percentages.vol / 100) * 282.7} 282.7`}
                strokeDashoffset="0"
                strokeLinecap="round"
              />
              {/* Hostesses Arc */}
              <circle
                cx="60"
                cy="60"
                r="45"
                fill="none"
                stroke="#EC4899"
                strokeWidth="12"
                strokeDasharray={`${(percentages.host / 100) * 282.7} 282.7`}
                strokeDashoffset={`-${(percentages.vol / 100) * 282.7}`}
                strokeLinecap="round"
              />
            </svg>

            {/* Inner Center Label */}
            <div style={{
              position: 'absolute',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '20px', fontWeight: 900 }}>{totalLeads}</span>
              <span style={{ fontSize: '10px', color: 'var(--desktop-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Leads</span>
            </div>
          </div>

          {/* Donut Legend */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px', fontWeight: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3B82F6' }}></span>
              <span>Vol ({percentages.vol}%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EC4899' }}></span>
              <span>Host ({percentages.host}%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B' }}></span>
              <span>Crew ({percentages.man}%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }}></span>
              <span>Clients ({percentages.cli}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
