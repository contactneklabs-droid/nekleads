import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { getCandidates, Candidate, syncQueue } from '../lib/db';
import { useToast } from '../contexts/ToastContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [stats, setStats] = useState({ talent: 0, manpower: 0, pendingSync: 0 });
  const [recent, setRecent] = useState<Candidate[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Artificial delay for premium skeleton loading effect
    const timer = setTimeout(() => {
      const data = getCandidates();
      const talentCount = data.filter(c => c.type === 'Hostess' || c.type === 'Volunteer').length;
      const manpowerCount = data.length - talentCount;
      
      const queue = JSON.parse(localStorage.getItem('nek_leads_offline_queue') || '[]');
      setStats({ talent: talentCount, manpower: manpowerCount, pendingSync: queue.length });
      
      const sorted = [...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecent(sorted.slice(0, 10)); // Expanded from 5 to 10
      setIsLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncQueue();
      if (result.success) {
        addToast('success', `Successfully synchronized ${result.syncedCount} offline actions.`);
        setStats(prev => ({ ...prev, pendingSync: 0 }));
      } else {
        addToast('error', 'Cannot sync: You are currently offline.');
      }
    } catch (e) {
      addToast('error', 'Sync failed. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 className={`page-title ${isLoading ? 'skeleton' : ''}`} style={{ marginBottom: '4px', fontSize: '28px', width: isLoading ? '60%' : 'auto' }}>
          {isLoading ? 'Loading...' : getGreeting()}
        </h1>
        <p className={isLoading ? 'skeleton' : ''} style={{ color: 'var(--color-text-secondary)', fontSize: '15px', width: isLoading ? '40%' : 'auto' }}>
          {isLoading ? 'Please wait' : "Here is what's happening today."}
        </p>
      </div>
      
      <div className="dashboard-stats">
        <div className={isLoading ? 'skeleton' : ''} style={{ padding: '20px', border: '1px solid var(--color-border)', borderRadius: '12px', backgroundColor: 'var(--color-bg-primary)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', fontWeight: 600 }}>
            Talent
          </div>
          <div className="font-display" style={{ fontSize: '42px', fontWeight: 800, letterSpacing: '-1.5px' }}>{stats.talent}</div>
        </div>
        
        <div className={isLoading ? 'skeleton' : ''} style={{ padding: '20px', border: '1px solid var(--color-border)', borderRadius: '12px', backgroundColor: 'var(--color-bg-primary)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', fontWeight: 600 }}>
            Manpower
          </div>
          <div className="font-display" style={{ fontSize: '42px', fontWeight: 800, letterSpacing: '-1.5px' }}>{stats.manpower}</div>
        </div>

        {stats.pendingSync > 0 && !isLoading && (
          <div style={{ padding: '20px', border: '1px solid var(--color-danger)', borderRadius: '12px', backgroundColor: 'rgba(211, 47, 47, 0.05)', boxShadow: 'var(--shadow-sm)', gridColumn: '1 / -1' }}>
            <div className="flex justify-between items-center">
              <div>
                <div style={{ color: 'var(--color-danger)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: 600 }}>
                  Offline Queue
                </div>
                <div className="font-display" style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-danger)', letterSpacing: '-1px' }}>
                  {stats.pendingSync} <span style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '0' }}>pending</span>
                </div>
              </div>
              <button className="btn btn-primary" onClick={handleSync} disabled={isSyncing} style={{ padding: '8px 16px', borderRadius: '8px' }}>
                <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} /> Sync
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '32px' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={isLoading ? 'skeleton' : ''} style={{ fontSize: '16px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-secondary)' }}>
            Activity Timeline
          </h2>
          {!isLoading && (
            <button 
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => navigate('/volunteers')}
            >
              View All <ArrowRight size={14} />
            </button>
          )}
        </div>
        
        <div style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden', padding: '8px 0' }}>
          {isLoading ? (
            // Skeleton Timeline items
            [1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="recent-list-item" style={{ border: 'none', position: 'relative' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', width: '100%' }}>
                  <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0 }}></div>
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: '16px', width: '60%', marginBottom: '8px' }}></div>
                    <div className="skeleton" style={{ height: '12px', width: '40%' }}></div>
                  </div>
                </div>
              </div>
            ))
          ) : recent.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
              No recent activity found.
            </div>
          ) : (
            recent.map((c, index) => (
              <div key={c.id} className="recent-list-item" style={{ border: 'none', position: 'relative' }}>
                {index !== recent.length - 1 && (
                  <div style={{ position: 'absolute', left: '35px', top: '48px', bottom: '-16px', width: '2px', backgroundColor: 'var(--color-border)', zIndex: 0 }}></div>
                )}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', zIndex: 1, position: 'relative', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', fontWeight: 600, fontSize: '14px', flexShrink: 0, border: '2px solid var(--color-bg-primary)' }}>
                    {getInitials(c.name)}
                  </div>
                  <div style={{ flex: 1, paddingBottom: '4px' }}>
                    <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--color-text-primary)' }}>{c.name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{c.type} • {c.location}</span>
                      <span style={{ fontWeight: 500 }}>
                        {new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
