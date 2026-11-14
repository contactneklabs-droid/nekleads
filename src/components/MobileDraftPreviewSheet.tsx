import React from 'react';
import { X, User, ChevronRight } from 'lucide-react';
import { WhatsAppBubblePreview } from './WhatsAppBubblePreview';
import { Candidate } from '../lib/db';

interface MobileDraftPreviewSheetProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  isManualMode: boolean;
  onManualEdit: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onCopy: () => void;
  onSend: () => void;
  selectedCandidate: Candidate | null;
  onOpenCandidatePicker: () => void;
  onSendToCandidate: () => void;
}

export const MobileDraftPreviewSheet: React.FC<MobileDraftPreviewSheetProps> = ({
  isOpen,
  onClose,
  message,
  isManualMode,
  onManualEdit,
  onCopy,
  onSend,
  selectedCandidate,
  onOpenCandidatePicker,
  onSendToCandidate
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 2400,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center'
      }}
    >
      <div
        className="modal-content"
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '92vh',
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
        <div style={{ padding: '10px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, fontFamily: 'Outfit, sans-serif', margin: 0 }}>
              Live WhatsApp Preview
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              Inspect and dispatch directly
            </span>
          </div>

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

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px', WebkitOverflowScrolling: 'touch' }}>
          {/* Candidate Selector Trigger Bar */}
          <div
            onClick={onOpenCandidatePicker}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '12px',
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: selectedCandidate ? '#25D366' : 'var(--color-bg-primary)',
                color: selectedCandidate ? '#fff' : 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '12px'
              }}>
                {selectedCandidate ? selectedCandidate.name.slice(0, 2).toUpperCase() : <User size={15} />}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {selectedCandidate ? selectedCandidate.name : 'Select Candidate from Directory'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  {selectedCandidate ? `${selectedCandidate.type || 'Lead'} • ${selectedCandidate.location || 'Area'} • ${selectedCandidate.phone}` : 'Tap to search & pick recipient'}
                </div>
              </div>
            </div>
            <ChevronRight size={16} color="var(--color-text-secondary)" />
          </div>

          {/* Bubble Preview */}
          <WhatsAppBubblePreview
            message={message}
            isManualMode={isManualMode}
            onManualEdit={onManualEdit}
            onCopy={onCopy}
            onSend={onSend}
            onSendToCandidate={onSendToCandidate}
            candidateName={selectedCandidate?.name}
            candidateRole={selectedCandidate?.type}
          />
        </div>
      </div>
    </div>
  );
};
