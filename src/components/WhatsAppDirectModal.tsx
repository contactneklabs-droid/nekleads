import React, { useState } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Smartphone 
} from 'lucide-react';
import { openWhatsAppDirect, formatPhoneForWhatsApp, QUICK_TEMPLATES } from '../lib/whatsapp';
import { useToast } from '../contexts/ToastContext';

export interface WhatsAppDirectModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: {
    id: string;
    name: string;
    phone: string;
    type?: string;
    location?: string;
  } | null;
}

export const WhatsAppDirectModal: React.FC<WhatsAppDirectModalProps> = ({
  isOpen,
  onClose,
  candidate
}) => {
  const { addToast } = useToast();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('availability');
  const [customText, setCustomText] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  if (!isOpen || !candidate) return null;

  // Read saved requirement draft if available to offer as quick option
  const savedRequirementRaw = localStorage.getItem('nek_draft_requirement');
  let savedEventName = '';
  if (savedRequirementRaw) {
    try {
      const parsed = JSON.parse(savedRequirementRaw);
      savedEventName = parsed.eventName || '';
    } catch (e) {}
  }

  const selectedTemplate = QUICK_TEMPLATES.find(t => t.id === selectedTemplateId);
  const activeMessage = useCustom 
    ? customText 
    : (selectedTemplate ? selectedTemplate.generateText(candidate.name, { eventName: savedEventName, location: candidate.location }) : '');

  const handleSend = () => {
    openWhatsAppDirect(candidate.phone, activeMessage);
    addToast('success', `Opening WhatsApp for ${candidate.name}`);
    onClose();
  };

  const handleOpenBlankChat = () => {
    openWhatsAppDirect(candidate.phone);
    addToast('success', `Opening WhatsApp chat with ${candidate.name}`);
    onClose();
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
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
          maxWidth: '520px',
          maxHeight: '90vh',
          backgroundColor: 'var(--color-bg-primary)',
          border: '1px solid var(--color-border)',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 20px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--color-bg-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#25D366',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <MessageCircle size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                WhatsApp Direct Link
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                {candidate.name} &bull; {formatPhoneForWhatsApp(candidate.phone)}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="btn btn-secondary" 
            style={{ width: '32px', height: '32px', padding: 0, borderRadius: '50%' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Direct Chat Shortcut */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: 'var(--color-bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--color-border)'
          }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Empty Chat</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Open chat without pre-filling text</div>
            </div>
            <button 
              onClick={handleOpenBlankChat}
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '6px 12px', gap: '6px' }}
            >
              <Smartphone size={14} /> Open Chat
            </button>
          </div>

          {/* Quick Message Presets */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Quick Templates
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
              {QUICK_TEMPLATES.map((tmpl) => {
                const isSelected = !useCustom && selectedTemplateId === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => {
                      setUseCustom(false);
                      setSelectedTemplateId(tmpl.id);
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      backgroundColor: isSelected ? 'var(--color-bg-secondary)' : 'var(--color-bg-primary)',
                      color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: isSelected ? 600 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <span style={{ fontSize: '13px' }}>
                      {tmpl.id === 'availability' && '📅'}
                      {tmpl.id === 'briefing' && '📋'}
                      {tmpl.id === 'payment_ready' && '💳'}
                      {tmpl.id === 'general' && '💬'}
                    </span>
                    <span>{tmpl.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message Preview / Customizer */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                Message Preview
              </span>
              <button 
                onClick={() => {
                  if (!useCustom) {
                    setCustomText(activeMessage);
                  }
                  setUseCustom(!useCustom);
                }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '11px', 
                  color: 'var(--color-primary)', 
                  fontWeight: 600, 
                  cursor: 'pointer' 
                }}
              >
                {useCustom ? 'Use Preset Template' : '✏️ Edit Message'}
              </button>
            </div>

            {useCustom ? (
              <textarea 
                className="input-field"
                rows={5}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: '13px', lineHeight: 1.5 }}
                placeholder="Type your WhatsApp message..."
              />
            ) : (
              <div style={{
                padding: '14px',
                borderRadius: '12px',
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                fontSize: '13px',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                color: 'var(--color-text-primary)'
              }}>
                {activeMessage}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          backgroundColor: 'var(--color-bg-secondary)'
        }}>
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button 
            onClick={handleSend} 
            className="btn btn-primary"
            style={{ 
              backgroundColor: '#25D366', 
              color: '#FFFFFF', 
              borderColor: '#25D366',
              gap: '6px' 
            }}
          >
            <Send size={15} /> Send on WhatsApp
          </button>
        </div>

      </div>
    </div>
  );
};
