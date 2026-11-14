import React, { useState } from 'react';
import { CheckCheck, Edit3, Eye, Copy, Send, Smartphone } from 'lucide-react';

interface WhatsAppBubblePreviewProps {
  message: string;
  isManualMode: boolean;
  onManualEdit: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onCopy: () => void;
  onSend: () => void;
  onSendToCandidate?: () => void;
  candidateName?: string;
  candidateRole?: string;
}

export const WhatsAppBubblePreview: React.FC<WhatsAppBubblePreviewProps> = ({
  message,
  isManualMode,
  onManualEdit,
  onCopy,
  onSend,
  onSendToCandidate,
  candidateName,
  candidateRole
}) => {
  const [viewMode, setViewMode] = useState<'bubble' | 'raw'>('bubble');

  // Format bold WhatsApp markdown (*text*) into styled elements
  const renderFormattedContent = (text: string) => {
    if (!text.trim()) {
      return (
        <span style={{ color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>
          Fill in parameters on the left to see your live WhatsApp broadcast message...
        </span>
      );
    }

    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // replace *text* with <strong>text</strong>
      const parts = line.split(/(\*[^*]+\*)/g);
      return (
        <React.Fragment key={idx}>
          {parts.map((part, pIdx) => {
            if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
              return (
                <strong key={pIdx} style={{ fontWeight: 700, color: '#ffffff' }}>
                  {part.slice(1, -1)}
                </strong>
              );
            }
            return <span key={pIdx}>{part}</span>;
          })}
          {idx < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{
      borderRadius: '20px',
      overflow: 'hidden',
      backgroundColor: '#0b141a',
      border: '1px solid rgba(255,255,255,0.1)',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 8px 30px rgba(0,0,0,0.4)'
    }}>
      {/* WhatsApp Chat Header Simulation */}
      <div style={{
        backgroundColor: '#1f2c34',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#00a884',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '13px'
          }}>
            {candidateName ? candidateName.slice(0, 2).toUpperCase() : 'NEK'}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#e9edef', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{candidateName || 'Broadcast Preview'}</span>
              {candidateRole && (
                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.1)', color: '#8696a0', fontWeight: 500 }}>
                  {candidateRole}
                </span>
              )}
            </div>
            <div style={{ fontSize: '11px', color: '#00a884', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#00a884' }} />
              <span>online • preview</span>
            </div>
          </div>
        </div>

        {/* View mode toggle */}
        <div style={{ display: 'flex', gap: '4px', backgroundColor: '#111b21', padding: '3px', borderRadius: '8px' }}>
          <button
            onClick={() => setViewMode('bubble')}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: viewMode === 'bubble' ? '#202c33' : 'transparent',
              color: viewMode === 'bubble' ? '#ffffff' : '#8696a0',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Eye size={12} /> Bubble
          </button>
          <button
            onClick={() => setViewMode('raw')}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: viewMode === 'raw' ? '#202c33' : 'transparent',
              color: viewMode === 'raw' ? '#ffffff' : '#8696a0',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Edit3 size={12} /> Raw
          </button>
        </div>
      </div>

      {/* WhatsApp Message Canvas */}
      <div style={{
        padding: '20px 16px',
        minHeight: '260px',
        maxHeight: '440px',
        overflowY: 'auto',
        backgroundColor: '#0b141a',
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '16px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        WebkitOverflowScrolling: 'touch'
      }}>
        {viewMode === 'bubble' ? (
          /* Outgoing Message Bubble */
          <div style={{
            maxWidth: '92%',
            backgroundColor: '#005c4b',
            color: '#e9edef',
            borderRadius: '12px 2px 12px 12px',
            padding: '10px 14px 24px',
            position: 'relative',
            fontSize: '13.5px',
            lineHeight: '1.55',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap'
          }}>
            {renderFormattedContent(message)}

            {/* Bubble Meta (Time + Double Blue Checkmarks) */}
            <div style={{
              position: 'absolute',
              bottom: '4px',
              right: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.6)',
              userSelect: 'none'
            }}>
              <span>{currentTime}</span>
              <CheckCheck size={14} color="#53bdeb" />
            </div>
          </div>
        ) : (
          /* Editable Raw Textarea */
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <textarea
              value={message}
              onChange={onManualEdit}
              placeholder="Edit message directly..."
              style={{
                width: '100%',
                minHeight: '260px',
                backgroundColor: '#111b21',
                color: '#e9edef',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '13px',
                fontFamily: 'monospace',
                lineHeight: '1.6',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {isManualMode && (
              <span style={{ fontSize: '11px', color: '#53bdeb', marginTop: '6px' }}>
                ✏️ Custom manual edit active
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bubble Action Footer */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#1f2c34',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#8696a0' }}>
          <span>{message.length} characters</span>
          <span>WhatsApp Ready</span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={onCopy}
            className="btn btn-secondary"
            style={{
              flex: 1,
              backgroundColor: '#2a3942',
              color: '#e9edef',
              borderColor: 'transparent',
              borderRadius: '10px',
              padding: '10px 14px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Copy size={15} /> Copy
          </button>

          {candidateName && onSendToCandidate ? (
            <button
              onClick={onSendToCandidate}
              className="btn btn-primary"
              style={{
                flex: 1.3,
                backgroundColor: '#25D366',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Smartphone size={16} /> Send to {candidateName.split(' ')[0]}
            </button>
          ) : (
            <button
              onClick={onSend}
              className="btn btn-primary"
              style={{
                flex: 1.3,
                backgroundColor: '#25D366',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Send size={15} /> Open WhatsApp
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
