import React from 'react';
import { 
  Bell, 
  RotateCw, 
  MessageCircle, 
  PhoneCall, 
  CheckCircle
} from 'lucide-react';
import { Candidate, ActivityItem } from '../lib/db';

interface DesktopRightPanelProps {
  candidates: Candidate[];
  activities?: ActivityItem[];
  onOpenQuickAdd?: () => void;
  onRefreshData: () => void;
  onSelectLeadForWhatsApp: (candidate: Candidate) => void;
}

export const DesktopRightPanel: React.FC<DesktopRightPanelProps> = ({
  candidates,
  onRefreshData,
  onSelectLeadForWhatsApp
}) => {
  const recentCandidates = candidates.slice(-5).reverse();

  return (
    <aside className="desktop-inspector-pane">
      {/* Top Action Icons Row (matches reference) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '4px' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--desktop-text-secondary)' }}>
          Operations Feed
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button 
            onClick={onRefreshData}
            title="Refresh database"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              border: '1px solid var(--desktop-border)',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--desktop-text-secondary)'
            }}
          >
            <RotateCw size={13} />
          </button>

          <button 
            title="System notifications"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              border: '1px solid var(--desktop-border)',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--desktop-text-secondary)'
            }}
          >
            <Bell size={13} />
          </button>
        </div>
      </div>

      {/* Title & Subtitle */}
      <div>
        <div style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.3px', marginBottom: '2px' }}>
          Recent Activity
        </div>
        <div style={{ fontSize: '11.5px', color: 'var(--desktop-text-muted)' }}>
          Real-time candidate registrations & alerts
        </div>
      </div>

      {/* Activity Cards Stack (matches reference right cards) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto' }}>
        {recentCandidates.length === 0 ? (
          <div style={{
            padding: '24px 16px',
            textAlign: 'center',
            color: 'var(--desktop-text-muted)',
            fontSize: '12px'
          }}>
            No recent leads yet.
          </div>
        ) : (
          recentCandidates.map((c) => (
            <div key={c.id} className="desktop-activity-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--desktop-text-primary)' }}>
                  {c.name}
                </span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--desktop-accent-soft)',
                  color: 'var(--desktop-text-primary)'
                }}>
                  {c.type}
                </span>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--desktop-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>{c.phone}</span>
                <span>·</span>
                <span>{c.location || 'Bangalore'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ fontSize: '10.5px', color: 'var(--desktop-text-muted)' }}>
                  {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Active'}
                </span>

                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => {
                      const clean = c.phone.replace(/\D/g, '').slice(-10);
                      window.open(`tel:${clean}`, '_self');
                    }}
                    title="Direct Call"
                    style={{
                      padding: '3px 8px',
                      borderRadius: '5px',
                      border: '1px solid var(--desktop-border)',
                      background: 'transparent',
                      fontSize: '11px',
                      cursor: 'pointer',
                      color: 'var(--desktop-text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <PhoneCall size={11} />
                    <span>Call</span>
                  </button>

                  <button
                    onClick={() => onSelectLeadForWhatsApp(c)}
                    title="Open WhatsApp"
                    style={{
                      padding: '3px 8px',
                      borderRadius: '5px',
                      border: '1px solid #10B981',
                      background: 'rgba(16, 185, 129, 0.08)',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: '#10B981',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <MessageCircle size={11} />
                    <span>Chat</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom PWA Sync & Storage Status Banner */}
      <div style={{
        padding: '12px 14px',
        borderRadius: '12px',
        backgroundColor: 'var(--desktop-card-subtle)',
        border: '1px solid var(--desktop-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle size={13} color="#10B981" />
          <span style={{ fontSize: '11.5px', fontWeight: 700 }}>Local Storage Ready</span>
        </div>
        <div style={{ fontSize: '10.5px', color: 'var(--desktop-text-muted)' }}>
          {candidates.length} leads safely cached offline in PWA storage.
        </div>
      </div>
    </aside>
  );
};
