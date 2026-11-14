import React from 'react';
import { History, X, Trash2, ArrowRight, Copy } from 'lucide-react';

export interface DraftHistoryItem {
  id: string;
  timestamp: number;
  preset: string;
  title: string;
  message: string;
}

interface DraftHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: DraftHistoryItem[];
  onSelect: (item: DraftHistoryItem) => void;
  onClear: () => void;
  onCopy: (text: string) => void;
}

export const DraftHistoryModal: React.FC<DraftHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelect,
  onClear,
  onCopy
}) => {
  if (!isOpen) return null;

  const formatRelativeTime = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getPresetBadge = (preset: string) => {
    switch (preset) {
      case 'requirement': return { label: 'Requirement', color: '#3B82F6' };
      case 'client_payment': return { label: 'Client Payment', color: '#10B981' };
      case 'team_payment': return { label: 'Team Payout', color: '#F59E0B' };
      default: return { label: 'Custom', color: '#EC4899' };
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 2500,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center'
      }}
    >
      <div
        className="modal-content"
        style={{
          width: '100%',
          maxWidth: '540px',
          maxHeight: '85vh',
          backgroundColor: 'var(--color-bg-primary)',
          borderTop: '1px solid var(--color-border)',
          borderRadius: '24px 24px 0 0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
          animation: 'slideUpSheet 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Grab Handle */}
        <div style={{ padding: '12px 0 4px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--color-border)' }} />
        </div>

        {/* Header */}
        <div style={{ padding: '12px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={18} />
            <h3 style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'Outfit, sans-serif', margin: 0 }}>
              Draft History
            </h3>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', fontWeight: 600 }}>
              {history.length} saved
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {history.length > 0 && (
              <button
                onClick={onClear}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-danger)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Trash2 size={13} /> Clear
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', WebkitOverflowScrolling: 'touch' }}>
          {history.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
              No previous drafts found. Sent or copied messages will automatically appear here.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {history.map((item) => {
                const badge = getPresetBadge(item.preset);
                return (
                  <div
                    key={item.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '16px',
                      backgroundColor: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: `${badge.color}15`,
                          color: badge.color,
                          border: `1px solid ${badge.color}30`
                        }}>
                          {badge.label}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          {item.title || 'Untitled Draft'}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                        {formatRelativeTime(item.timestamp)}
                      </span>
                    </div>

                    <p style={{
                      margin: 0,
                      fontSize: '12px',
                      color: 'var(--color-text-secondary)',
                      lineHeight: '1.4',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      fontFamily: 'monospace'
                    }}>
                      {item.message}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                      <button
                        onClick={() => onCopy(item.message)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Copy size={12} /> Copy
                      </button>
                      <button
                        onClick={() => {
                          onSelect(item);
                          onClose();
                        }}
                        className="btn btn-primary"
                        style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <span>Load Draft</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
