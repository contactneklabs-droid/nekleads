import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserCog, 
  MessageSquare, 
  Settings, 
  CreditCard, 
  ArrowRight, 
  RefreshCw, 
  Database
} from 'lucide-react';
import { getCandidates, Candidate, syncQueue } from '../lib/db';
import { useToast } from '../contexts/ToastContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [stats, setStats] = useState({ talent: 0, manpower: 0, pendingSync: 0 });
  const [recent, setRecent] = useState<Candidate[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  useEffect(() => {
    const data = getCandidates();
    const talentCount = data.filter(c => c.type === 'Hostess' || c.type === 'Volunteer').length;
    const manpowerCount = data.length - talentCount;
    
    const queue = JSON.parse(localStorage.getItem('nek_leads_offline_queue') || '[]');
    setStats({ talent: talentCount, manpower: manpowerCount, pendingSync: queue.length });
    
    const sorted = [...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setRecent(sorted.slice(0, 5));

    // Update real clock time
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
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
    if (hour < 12) return 'Good morning!';
    if (hour < 18) return 'Good afternoon!';
    return 'Good evening!';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // 6 Bento Grid Sections matching the layout from the user reference
  const bentoSections = [
    {
      title: 'Talent Directory',
      meta: `${stats.talent} registered`,
      path: '/volunteers',
      icon: <Users size={20} strokeWidth={2} />,
      badge: 'Active'
    },
    {
      title: 'Manpowers',
      meta: `${stats.manpower} registered`,
      path: '/manpower',
      icon: <UserCog size={20} strokeWidth={2} />,
      badge: 'Active'
    },
    {
      title: 'WhatsApp Drafts',
      meta: 'Event announcer',
      path: '/whatsapp-drafts',
      icon: <MessageSquare size={20} strokeWidth={2} />,
      badge: 'Ready'
    },
    {
      title: 'Payment Notices',
      meta: 'Client & team payouts',
      path: '/whatsapp-drafts',
      icon: <CreditCard size={20} strokeWidth={2} />,
      badge: 'Billing'
    },
    {
      title: 'Offline Sync Queue',
      meta: `${stats.pendingSync} pending tasks`,
      path: '#sync',
      onClick: handleSync,
      icon: <RefreshCw size={20} strokeWidth={2} className={isSyncing ? "animate-spin" : ""} />,
      badge: stats.pendingSync > 0 ? `${stats.pendingSync} Pending` : 'Up to date'
    },
    {
      title: 'System Settings',
      meta: 'Backups & exports',
      path: '/settings',
      icon: <Settings size={20} strokeWidth={2} />,
      badge: 'Config'
    }
  ];

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto' }}>
      
      {/* 1. TOP GREETING HERO CARD (Exact layout as Reference Mockup with Typographic Styling) */}
      <div className="bento-hero-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
          <div>
            <h1 style={{ 
              fontFamily: "'Outfit', sans-serif", 
              fontSize: '28px', 
              fontWeight: 800, 
              letterSpacing: '-0.8px',
              color: 'var(--color-text-primary)',
              lineHeight: 1.15
            }}>
              {getGreeting()}
            </h1>
            <p style={{ 
              color: 'var(--color-text-secondary)', 
              fontSize: '16px', 
              fontWeight: 400,
              marginTop: '6px',
              letterSpacing: '-0.2px',
              lineHeight: 1.3
            }}>
              here are your lead sections for today.
            </p>
          </div>
          
          {/* Editorial Typographic Stamp (replaces icon badge) */}
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', flexShrink: 0, paddingTop: '4px' }}>
            <div style={{ 
              fontFamily: "'Outfit', sans-serif", 
              fontSize: '12px', 
              fontWeight: 800, 
              letterSpacing: '2.5px', 
              textTransform: 'uppercase', 
              color: 'var(--color-text-primary)',
              lineHeight: 1
            }}>
              NEK·OS
            </div>
            <div style={{ 
              fontFamily: "'Inter', sans-serif", 
              fontSize: '10px', 
              fontWeight: 500, 
              letterSpacing: '1.2px', 
              textTransform: 'uppercase', 
              color: 'var(--color-text-secondary)',
              lineHeight: 1.2
            }}>
              EDITION 2026.4
            </div>
          </div>
        </div>

        {/* Clean Typographic Time Chip */}
        <div className="bento-time-pill" style={{ 
          fontFamily: "'Outfit', sans-serif", 
          fontSize: '12px', 
          fontWeight: 700, 
          letterSpacing: '0.8px', 
          fontVariantNumeric: 'tabular-nums'
        }}>
          <span>{currentTimeStr || '6:15 AM'}</span>
        </div>
      </div>

      {/* 2. BENTO NAVIGATION GRID (3x2 Desktop, 2x3 Mobile) */}
      <div className="bento-grid">
        {bentoSections.map((item, idx) => (
          <div
            key={idx}
            className="bento-card"
            onClick={() => {
              if (item.onClick) {
                item.onClick();
              } else {
                navigate(item.path);
              }
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="bento-icon-wrapper">
                  {item.icon}
                </div>
                <span style={{ 
                  fontSize: '10px', 
                  fontWeight: 600, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.5px',
                  color: 'var(--color-text-secondary)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--color-bg-primary)',
                  border: '1px solid var(--color-border)'
                }}>
                  {item.badge}
                </span>
              </div>
            </div>

            <div>
              <div className="bento-card-title">{item.title}</div>
              <div className="bento-card-meta">{item.meta}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. RECENT ACTIVITY TIMELINE */}
      <div style={{ marginTop: '12px', paddingBottom: '32px' }}>
        <div className="flex justify-between items-center mb-3">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={16} color="var(--color-text-secondary)" />
            <h2 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-text-secondary)' }}>
              Recent Entries
            </h2>
          </div>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => navigate('/volunteers')}
          >
            View Directory <ArrowRight size={14} />
          </button>
        </div>

        <div style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '20px', overflow: 'hidden', padding: '6px' }}>
          {recent.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
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
                  borderBottom: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-primary)',
                  borderRadius: '14px',
                  margin: '4px',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    width: '36px', 
                    height: '36px', 
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
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      {c.type} &bull; {c.location}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 600, 
                    padding: '3px 8px', 
                    borderRadius: '12px', 
                    backgroundColor: 'var(--color-bg-secondary)', 
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-secondary)'
                  }}>
                    {new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
