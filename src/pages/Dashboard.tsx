import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserCog, 
  MessageSquare, 
  Settings, 
  Database,
  Calculator,
  Search,
  X,
  Plus,
  Phone,
  MessageCircle,
  ChevronRight
} from 'lucide-react';
import { getCandidates, Candidate, syncQueue, saveCandidate } from '../lib/db';
import { useToast } from '../contexts/ToastContext';
import { PayoutCalculatorModal } from '../components/PayoutCalculatorModal';
import { WhatsAppDirectModal } from '../components/WhatsAppDirectModal';

export default function Dashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stats, setStats] = useState({ 
    total: 0,
    talent: 0, 
    manpower: 0, 
    hostesses: 0,
    volunteers: 0,
    promoters: 0,
    pendingSync: 0 
  });
  const [recent, setRecent] = useState<Candidate[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  
  // Modals state
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [whatsAppCandidate, setWhatsAppCandidate] = useState<Candidate | null>(null);
  const [quickAddType, setQuickAddType] = useState<'talent' | 'manpower' | null>(null);
  const [quickAddForm, setQuickAddForm] = useState({
    name: '',
    phone: '',
    type: 'Volunteer',
    location: '',
    gender: 'Male'
  });

  // Global Instant Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  // Active Draft info
  const [activeDraftEvent, setActiveDraftEvent] = useState<string>('');

  const loadData = () => {
    const data = getCandidates();
    setCandidates(data);

    const hostesses = data.filter(c => c.type === 'Hostess').length;
    const volunteers = data.filter(c => c.type === 'Volunteer').length;
    const talentCount = data.filter(c => ['Hostess', 'Volunteer', 'Talent'].includes(c.type)).length;
    const promoters = data.filter(c => c.type === 'Promoter').length;
    const manpowerCount = data.length - talentCount;

    const queue = JSON.parse(localStorage.getItem('nek_leads_offline_queue') || '[]');
    setStats({ 
      total: data.length,
      talent: talentCount, 
      manpower: manpowerCount, 
      hostesses,
      volunteers,
      promoters,
      pendingSync: queue.length 
    });
    
    const sorted = [...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setRecent(sorted.slice(0, 5));

    // Check saved draft title
    try {
      const savedReq = localStorage.getItem('nek_draft_requirement');
      if (savedReq) {
        const parsed = JSON.parse(savedReq);
        if (parsed.eventName) setActiveDraftEvent(parsed.eventName);
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadData();

    // Clock ticker
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);

    // Click outside search dismiss
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await syncQueue();
      if (result.success) {
        addToast('success', `Synced ${result.syncedCount} offline updates.`);
        setStats(prev => ({ ...prev, pendingSync: 0 }));
      } else {
        addToast('error', 'Sync unavailable in offline mode.');
      }
    } catch {
      addToast('error', 'Sync failed. Try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Search filtering across entire database
  const searchResults = searchQuery.trim() === '' ? [] : candidates.filter(c => {
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) ||
           c.phone.includes(q) ||
           c.location.toLowerCase().includes(q) ||
           c.type.toLowerCase().includes(q);
  }).slice(0, 8);

  // Quick Add submit
  const handleQuickAddSubmit = () => {
    if (!quickAddForm.name || !quickAddForm.phone || !quickAddForm.location) {
      addToast('error', 'Please fill all required fields');
      return;
    }
    const isDuplicate = candidates.some(c => c.phone === quickAddForm.phone);
    if (isDuplicate) {
      addToast('error', 'Phone number already registered');
      return;
    }

    saveCandidate({
      name: quickAddForm.name,
      phone: quickAddForm.phone,
      type: quickAddForm.type,
      location: quickAddForm.location,
      gender: quickAddForm.gender
    });

    addToast('success', `Added ${quickAddForm.name} to directory`);
    setQuickAddType(null);
    setQuickAddForm({ name: '', phone: '', type: 'Volunteer', location: '', gender: 'Male' });
    loadData();
  };

  const handleApplyClientDraft = (data: { clientName: string; eventName: string; totalAmount: string; note: string }) => {
    localStorage.setItem('nek_draft_client', JSON.stringify({
      clientName: data.clientName,
      eventName: data.eventName,
      totalAmount: data.totalAmount,
      dueAmount: data.totalAmount,
      note: data.note,
      paymentStage: 'advance',
      paymentDetails: 'UPI: payments@neklabs',
      dueDate: '',
      eventDates: ''
    }));
    navigate('/whatsapp-drafts');
  };

  const handleApplyTeamDraft = (data: { eventName: string; amountPaid: string; remarks: string }) => {
    localStorage.setItem('nek_draft_team', JSON.stringify({
      eventName: data.eventName,
      amountPaid: data.amountPaid,
      remarks: data.remarks,
      recipientName: '',
      eventDate: '',
      paymentMode: 'UPI',
      refId: ''
    }));
    navigate('/whatsapp-drafts');
  };

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* 1. TOP COMMAND HERO CARD */}
      <div className="bento-hero-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ 
                fontSize: '11px', 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                letterSpacing: '1px',
                color: 'var(--color-text-secondary)'
              }}>
                NEK COMMAND DESK
              </span>
              <span style={{
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '999px',
                backgroundColor: stats.pendingSync > 0 ? 'rgba(211, 47, 47, 0.15)' : 'rgba(56, 142, 60, 0.15)',
                color: stats.pendingSync > 0 ? 'var(--color-danger)' : 'var(--color-success)',
                fontWeight: 600,
                cursor: 'pointer'
              }} onClick={handleSync}>
                {stats.pendingSync > 0 ? `● ${stats.pendingSync} To Sync` : '● Synced'}
              </span>
            </div>

            <h1 style={{ 
              fontFamily: "'Outfit', sans-serif", 
              fontSize: '32px', 
              fontWeight: 800, 
              letterSpacing: '-1px',
              color: 'var(--color-text-primary)',
              lineHeight: 1.15
            }}>
              {getGreeting()}!
            </h1>
            <p style={{ 
              color: 'var(--color-text-secondary)', 
              fontSize: '14px', 
              fontWeight: 400,
              marginTop: '4px'
            }}>
              {stats.total} total leads in database &bull; {stats.talent} talent &bull; {stats.manpower} crew
            </p>
          </div>
          
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
            <div className="bento-time-pill" style={{ 
              fontFamily: "'Outfit', sans-serif", 
              fontSize: '12px', 
              fontWeight: 700, 
              letterSpacing: '0.8px', 
              fontVariantNumeric: 'tabular-nums',
              marginTop: 0
            }}>
              <span>{currentTimeStr || '12:00 PM'}</span>
            </div>
            <div style={{ 
              fontFamily: "'Inter', sans-serif", 
              fontSize: '10px', 
              fontWeight: 600, 
              letterSpacing: '0.8px', 
              color: 'var(--color-text-secondary)'
            }}>
              EDITION 2026.4
            </div>
          </div>
        </div>
      </div>

      {/* 2. UNIVERSAL INSTANT SEARCH BAR */}
      <div className="dashboard-search-box" ref={searchBoxRef}>
        <div style={{ position: 'relative' }}>
          <Search 
            size={18} 
            color="var(--color-text-secondary)" 
            style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} 
          />
          <input
            type="text"
            className="dashboard-search-input"
            placeholder="Quick search across all Talent & Manpower (name, phone, area)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchFocused(true);
            }}
            onFocus={() => setIsSearchFocused(true)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Live Search Floating Results */}
        {isSearchFocused && searchQuery.trim() !== '' && (
          <div className="dashboard-search-results">
            {searchResults.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                No candidate found matching "{searchQuery}"
              </div>
            ) : (
              searchResults.map(c => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--color-bg-secondary)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-bg-primary)',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '11px'
                    }}>
                      {getInitials(c.name)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{c.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', gap: '6px' }}>
                        <span style={{ fontWeight: 600 }}>{c.type}</span>
                        <span>&bull;</span>
                        <span>{c.location}</span>
                        <span>&bull;</span>
                        <span>{c.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <a 
                      href={`tel:${c.phone.replace(/\D/g, '')}`} 
                      className="lead-quick-btn call"
                      title="Direct Call"
                    >
                      <Phone size={14} />
                    </a>
                    <button 
                      onClick={() => {
                        setWhatsAppCandidate(c);
                        setIsSearchFocused(false);
                      }} 
                      className="lead-quick-btn whatsapp"
                      title="WhatsApp Direct"
                    >
                      <MessageCircle size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 3. SPEED ACTION STRIP (4 Thumb-Friendly Action Targets) */}
      <div className="speed-strip">
        <button 
          className="speed-strip-btn"
          onClick={() => {
            setQuickAddType('talent');
            setQuickAddForm({ name: '', phone: '', type: 'Volunteer', location: '', gender: 'Male' });
          }}
        >
          <Plus size={16} />
          <span>+ Add Talent</span>
        </button>

        <button 
          className="speed-strip-btn"
          onClick={() => {
            setQuickAddType('manpower');
            setQuickAddForm({ name: '', phone: '', type: 'Manpower', location: '', gender: 'Male' });
          }}
        >
          <Plus size={16} />
          <span>+ Add Crew</span>
        </button>

        <button 
          className="speed-strip-btn"
          onClick={() => navigate('/whatsapp-drafts')}
        >
          <MessageSquare size={16} />
          <span>📢 Drafts</span>
        </button>

        <button 
          className="speed-strip-btn"
          onClick={() => setIsCalcOpen(true)}
        >
          <Calculator size={16} />
          <span>🧮 Margin Calc</span>
        </button>
      </div>

      {/* 4. ASYMMETRIC BENTO GRID */}
      <div className="dashboard-bento-grid">
        
        {/* HERO BENTO TILE: TALENT & CREW HEALTH (Spans 2 columns on desktop, full width on mobile) */}
        <div 
          className="bento-card dashboard-bento-hero"
          onClick={() => navigate('/volunteers')}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="bento-icon-wrapper" style={{ margin: 0 }}>
                  <Users size={18} />
                </div>
                <div>
                  <div className="bento-card-title" style={{ fontSize: '15px' }}>Talent Directory</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    {stats.total} total candidates active
                  </div>
                </div>
              </div>
              <span style={{ 
                fontSize: '11px', 
                fontWeight: 700, 
                padding: '3px 8px', 
                borderRadius: '8px',
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
                whiteSpace: 'nowrap'
              }}>
                View All &rarr;
              </span>
            </div>

            {/* Visual Proportion Bar */}
            <div style={{ width: '100%', height: '6px', borderRadius: '3px', overflow: 'hidden', display: 'flex', backgroundColor: 'var(--color-border)', margin: '10px 0' }}>
              <div style={{ width: `${stats.total > 0 ? (stats.hostesses / stats.total) * 100 : 33}%`, backgroundColor: '#EC4899' }} title="Hostesses" />
              <div style={{ width: `${stats.total > 0 ? (stats.volunteers / stats.total) * 100 : 25}%`, backgroundColor: '#3B82F6' }} title="Volunteers" />
              <div style={{ width: `${stats.total > 0 ? (stats.promoters / stats.total) * 100 : 20}%`, backgroundColor: '#10B981' }} title="Promoters" />
              <div style={{ width: `${stats.total > 0 ? ((stats.total - stats.hostesses - stats.volunteers - stats.promoters) / stats.total) * 100 : 22}%`, backgroundColor: '#F59E0B' }} title="Other Crew" />
            </div>

            {/* Category breakdown chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#EC4899' }} />
                <span>Hostesses: <strong>{stats.hostesses}</strong></span>
              </span>
              <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#3B82F6' }} />
                <span>Volunteers: <strong>{stats.volunteers}</strong></span>
              </span>
              <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                <span>Promoters: <strong>{stats.promoters}</strong></span>
              </span>
              <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                <span>Crew: <strong>{stats.manpower}</strong></span>
              </span>
            </div>
          </div>
        </div>

        {/* TILE 2: WHATSAPP EVENT ANNOUNCER */}
        <div 
          className="bento-card"
          onClick={() => navigate('/whatsapp-drafts')}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="bento-icon-wrapper" style={{ backgroundColor: '#25D366', color: '#FFF', borderColor: '#25D366' }}>
                <MessageSquare size={16} />
              </div>
              <span className="bento-card-badge" style={{ 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                backgroundColor: 'rgba(37, 211, 102, 0.15)',
                color: '#25D366',
                border: '1px solid rgba(37, 211, 102, 0.3)'
              }}>
                Ready
              </span>
            </div>
          </div>
          <div>
            <div className="bento-card-title">WhatsApp Drafts</div>
            <div className="bento-card-meta">
              {activeDraftEvent ? activeDraftEvent : 'Broadcast event notices'}
            </div>
          </div>
        </div>

        {/* TILE 3: PAYOUT & MARGIN CALCULATOR */}
        <div 
          className="bento-card"
          onClick={() => setIsCalcOpen(true)}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="bento-icon-wrapper">
                <Calculator size={16} />
              </div>
              <span className="bento-card-badge" style={{ 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                color: 'var(--color-text-secondary)',
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)'
              }}>
                Finance
              </span>
            </div>
          </div>
          <div>
            <div className="bento-card-title">Payout Calc</div>
            <div className="bento-card-meta">Margins & client billing</div>
          </div>
        </div>

        {/* TILE 4: MANPOWERS DIRECTORY */}
        <div 
          className="bento-card"
          onClick={() => navigate('/manpower')}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="bento-icon-wrapper">
                <UserCog size={16} />
              </div>
              <span className="bento-card-badge" style={{ 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                color: 'var(--color-text-secondary)',
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)'
              }}>
                {stats.manpower} Crew
              </span>
            </div>
          </div>
          <div>
            <div className="bento-card-title">Manpowers</div>
            <div className="bento-card-meta">Security, Bouncers & Crew</div>
          </div>
        </div>

        {/* TILE 5: SYNC & SETTINGS */}
        <div 
          className="bento-card"
          onClick={() => navigate('/settings')}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="bento-icon-wrapper">
                <Settings size={16} />
              </div>
              <span className="bento-card-badge" style={{ 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                color: 'var(--color-text-secondary)',
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)'
              }}>
                Config
              </span>
            </div>
          </div>
          <div>
            <div className="bento-card-title">Settings</div>
            <div className="bento-card-meta">Passcode, sync & export</div>
          </div>
        </div>

      </div>

      {/* 5. INTERACTIVE RECENT LEADS TIMELINE (1-Tap Call & WhatsApp) */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={16} color="var(--color-text-secondary)" />
            <h2 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-text-secondary)' }}>
              Recent Leads &bull; Quick Action
            </h2>
          </div>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => navigate('/volunteers')}
          >
            View All <ChevronRight size={15} />
          </button>
        </div>

        <div style={{ 
          backgroundColor: 'var(--color-bg-secondary)', 
          border: '1px solid var(--color-border)', 
          borderRadius: '20px', 
          overflow: 'hidden', 
          padding: '6px' 
        }}>
          {recent.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
              No recent candidate records found.
            </div>
          ) : (
            recent.map((c) => (
              <div 
                key={c.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '12px 16px', 
                  backgroundColor: 'var(--color-bg-primary)',
                  borderRadius: '14px',
                  margin: '4px',
                  border: '1px solid var(--color-border)',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    width: '38px', 
                    height: '38px', 
                    borderRadius: '50%', 
                    backgroundColor: 'var(--color-bg-secondary)', 
                    color: 'var(--color-text-primary)', 
                    fontWeight: 700, 
                    fontSize: '13px', 
                    flexShrink: 0, 
                    border: '1px solid var(--color-border)' 
                  }}>
                    {getInitials(c.name)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>{c.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: 600, 
                        padding: '1px 6px', 
                        borderRadius: '6px', 
                        backgroundColor: 'var(--color-bg-secondary)', 
                        border: '1px solid var(--color-border)' 
                      }}>
                        {c.type}
                      </span>
                      <span>&bull;</span>
                      <span>{c.location}</span>
                    </div>
                  </div>
                </div>

                {/* 1-Tap Call & WhatsApp Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <a 
                    href={`tel:${c.phone.replace(/\D/g, '')}`} 
                    className="lead-quick-btn call"
                    title="Direct Phone Call"
                  >
                    <Phone size={14} />
                  </a>

                  <button 
                    onClick={() => setWhatsAppCandidate(c)} 
                    className="lead-quick-btn whatsapp"
                    title="Send WhatsApp Message"
                  >
                    <MessageCircle size={15} />
                  </button>

                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 600, 
                    padding: '3px 8px', 
                    borderRadius: '10px', 
                    backgroundColor: 'var(--color-bg-secondary)', 
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-secondary)',
                    marginLeft: '4px'
                  }} className="desktop-only">
                    {new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* QUICK ADD LEAD MODAL */}
      {quickAddType && (
        <div 
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setQuickAddType(null); }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(6px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            boxSizing: 'border-box'
          }}
        >
          <div 
            className="modal-content"
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: 'var(--color-bg-primary)',
              borderRadius: '20px',
              border: '1px solid var(--color-border)',
              padding: '24px',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                {quickAddType === 'talent' ? '+ Add New Talent' : '+ Add New Crew Member'}
              </h2>
              <button 
                onClick={() => setQuickAddType(null)} 
                className="btn btn-secondary" 
                style={{ width: '32px', height: '32px', padding: 0, borderRadius: '50%' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Priya Sharma"
                  value={quickAddForm.name}
                  onChange={(e) => setQuickAddForm({ ...quickAddForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Phone Number</label>
                <input 
                  type="tel" 
                  className="input-field" 
                  placeholder="e.g. 9876543210"
                  value={quickAddForm.phone}
                  onChange={(e) => setQuickAddForm({ ...quickAddForm, phone: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label">Category</label>
                  <select 
                    className="input-field"
                    value={quickAddForm.type}
                    onChange={(e) => setQuickAddForm({ ...quickAddForm, type: e.target.value })}
                  >
                    {quickAddType === 'talent' ? (
                      <>
                        <option value="Volunteer">Volunteer</option>
                        <option value="Hostess">Hostess</option>
                        <option value="Talent">Talent</option>
                        <option value="Model">Model</option>
                      </>
                    ) : (
                      <>
                        <option value="Manpower">Manpower</option>
                        <option value="Promoter">Promoter</option>
                        <option value="Supervisor">Supervisor</option>
                        <option value="Event Staff">Event Staff</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="form-label">Gender</label>
                  <select 
                    className="input-field"
                    value={quickAddForm.gender}
                    onChange={(e) => setQuickAddForm({ ...quickAddForm, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Location / Area</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Indiranagar, Bangalore"
                  value={quickAddForm.location}
                  onChange={(e) => setQuickAddForm({ ...quickAddForm, location: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button onClick={() => setQuickAddType(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button onClick={handleQuickAddSubmit} className="btn btn-primary">
                  Save Candidate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payout & Margin Calculator Modal */}
      <PayoutCalculatorModal
        isOpen={isCalcOpen}
        onClose={() => setIsCalcOpen(false)}
        onApplyToClientDraft={handleApplyClientDraft}
        onApplyToTeamDraft={handleApplyTeamDraft}
      />

      {/* WhatsApp Direct Messaging Modal */}
      <WhatsAppDirectModal
        isOpen={!!whatsAppCandidate}
        candidate={whatsAppCandidate}
        onClose={() => setWhatsAppCandidate(null)}
      />

    </div>
  );
}
