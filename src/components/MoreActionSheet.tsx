import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Calculator, Download, Settings, X, ChevronRight, Calendar } from 'lucide-react';
import { downloadInstantBackup } from '../lib/backup';
import { useToast } from '../contexts/ToastContext';

interface MoreActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCalculator: () => void;
}

export const MoreActionSheet: React.FC<MoreActionSheetProps> = ({
  isOpen,
  onClose,
  onOpenCalculator
}) => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  if (!isOpen) return null;

  const handleBackup = () => {
    const count = downloadInstantBackup();
    addToast('success', `Backed up ${count} leads to device!`);
    onClose();
  };

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{ zIndex: 3000 }}
    >
      <div 
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '480px',
          width: '100%',
          padding: '24px 20px calc(28px + env(safe-area-inset-bottom)) 20px',
          borderRadius: '24px 24px 0 0'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.8px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
              Quick Hub
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '2px 0 0 0' }}>
              More Options & Tools
            </h2>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ width: '32px', height: '32px', padding: 0, borderRadius: '50%' }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* WhatsApp Drafts */}
          <div
            onClick={() => handleNavigate('/whatsapp-drafts')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              backgroundColor: 'var(--color-bg-secondary)',
              borderRadius: '16px',
              border: '1px solid var(--color-border)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: 'rgba(37, 211, 102, 0.12)',
                color: '#25D366',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <MessageSquare size={20} />
              </div>
              <div>
                <div style={{ fontSize: '14.5px', fontWeight: 700 }}>WhatsApp Drafts</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Requirement notice, client billing & team payouts
                </div>
              </div>
            </div>
            <ChevronRight size={18} color="var(--color-text-secondary)" />
          </div>

          {/* Payout Calculator */}
          <div
            onClick={() => {
              onClose();
              onOpenCalculator();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              backgroundColor: 'var(--color-bg-secondary)',
              borderRadius: '16px',
              border: '1px solid var(--color-border)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Calculator size={20} />
              </div>
              <div>
                <div style={{ fontSize: '14.5px', fontWeight: 700 }}>Payout & Margin Calculator</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Calculate client margins and team payout splits
                </div>
              </div>
            </div>
            <ChevronRight size={18} color="var(--color-text-secondary)" />
          </div>

          {/* Events Hub */}
          <div
            onClick={() => handleNavigate('/events')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              backgroundColor: 'var(--color-bg-secondary)',
              borderRadius: '16px',
              border: '1px solid var(--color-border)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Calendar size={20} />
              </div>
              <div>
                <div style={{ fontSize: '14.5px', fontWeight: 700 }}>Events & Schedule</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Manage upcoming corporate & private events
                </div>
              </div>
            </div>
            <ChevronRight size={18} color="var(--color-text-secondary)" />
          </div>

          {/* 1-Tap Instant Backup */}
          <div
            onClick={handleBackup}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              backgroundColor: 'var(--color-bg-secondary)',
              borderRadius: '16px',
              border: '1px solid var(--color-border)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Download size={20} />
              </div>
              <div>
                <div style={{ fontSize: '14.5px', fontWeight: 700 }}>1-Tap Instant Backup</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Download timestamped JSON backup to device
                </div>
              </div>
            </div>
            <ChevronRight size={18} color="var(--color-text-secondary)" />
          </div>

          {/* System Settings */}
          <div
            onClick={() => handleNavigate('/settings')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              backgroundColor: 'var(--color-bg-secondary)',
              borderRadius: '16px',
              border: '1px solid var(--color-border)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: 'rgba(107, 114, 128, 0.12)',
                color: 'var(--color-text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Settings size={20} />
              </div>
              <div>
                <div style={{ fontSize: '14.5px', fontWeight: 700 }}>System Settings</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Passcode lock, cloud sync & restore
                </div>
              </div>
            </div>
            <ChevronRight size={18} color="var(--color-text-secondary)" />
          </div>
        </div>
      </div>
    </div>
  );
};
