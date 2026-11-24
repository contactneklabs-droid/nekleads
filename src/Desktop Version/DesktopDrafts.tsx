import React, { useState } from 'react';
import { 
  Send, 
  Copy, 
  Check, 
  Users, 
  Sparkles, 
  Calendar,
  Clock
} from 'lucide-react';
import { Candidate } from '../lib/db';
import { useToast } from '../contexts/ToastContext';

interface DesktopDraftsProps {
  candidates: Candidate[];
}

export const DesktopDrafts: React.FC<DesktopDraftsProps> = ({ candidates }) => {
  const { addToast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<'crew_call' | 'shift_timing' | 'client_confirm' | 'payment'>('crew_call');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(candidates[0]?.id || '');
  const [copied, setCopied] = useState(false);

  const [variables] = useState({
    eventName: 'Annual Tech Summit 2026',
    venue: 'Palace Grounds, Bangalore',
    date: 'Sunday, Nov 30',
    callTime: '08:00 AM',
    dressCode: 'All Black Formals',
    payRate: '₹1,500/day'
  });

  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId) || candidates[0];

  const getTemplateContent = () => {
    const name = selectedCandidate?.name || '[Candidate Name]';
    const role = selectedCandidate?.type || 'Crew';

    switch (selectedTemplate) {
      case 'crew_call':
        return `Hi ${name}! 👋\n\nYou are shortlisted as *${role}* for our upcoming event:\n\n📅 *Event:* ${variables.eventName}\n📍 *Venue:* ${variables.venue}\n🗓️ *Date:* ${variables.date}\n⏰ *Call Time:* ${variables.callTime}\n👔 *Dress Code:* ${variables.dressCode}\n💰 *Pay:* ${variables.payRate}\n\nPlease reply with *CONFIRM* to lock your slot.\n\n— NEK Operations`;
      case 'shift_timing':
        return `Hello ${name},\n\nHere are your finalized shift details for *${variables.eventName}*:\n\n📍 *Reporting Location:* ${variables.venue}\n⏰ *Shift Hours:* ${variables.callTime} to 07:00 PM\n📞 *On-ground Lead:* Bharath (NEK Leads)\n\nPlease arrive 15 minutes prior to call time.\n\n— NEK Operations`;
      case 'client_confirm':
        return `Dear Client,\n\nNEK Leads has confirmed your event staffing requirements for *${variables.eventName}*:\n\n👥 *Staffing Pool:* Volunteers, Hostesses & Logistics Crew\n📍 *Deployment Venue:* ${variables.venue}\n🗓️ *Date:* ${variables.date}\n\nOur crew lead will report directly to your event supervisor.\n\nBest regards,\nNEK Event Staffing Solutions`;
      case 'payment':
        return `Hi ${name},\n\nYour shift payment for *${variables.eventName}* has been processed:\n\n💵 *Amount:* ${variables.payRate}\n✅ *Status:* Credited / Cash Settled\n\nThank you for working with NEK Leads! See you at the next event. 🚀`;
      default:
        return '';
    }
  };

  const messageText = getTemplateContent();

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    addToast('success', 'Draft copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    if (!selectedCandidate) {
      addToast('error', 'Please select a candidate first');
      return;
    }
    const cleanPhone = selectedCandidate.phone.replace(/\D/g, '').slice(-10);
    const encoded = encodeURIComponent(messageText);
    window.open(`https://wa.me/91${cleanPhone}?text=${encoded}`, '_blank');
  };

  return (
    <div className="desktop-main-pane">
      {/* Header */}
      <div>
        <div style={{ fontSize: '13px', color: 'var(--desktop-text-muted)', marginBottom: '4px', fontWeight: 500 }}>
          NEK Leads / Messaging
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0, letterSpacing: '-0.8px' }}>
          WhatsApp Studio
        </h1>
      </div>

      {/* 2-Column Desktop Draft Composer */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '20px' }}>
        {/* Left: Templates & Variables */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Templates list */}
          <div style={{
            backgroundColor: 'var(--desktop-card-bg)',
            border: '1px solid var(--desktop-border)',
            borderRadius: '16px',
            padding: '16px',
            boxShadow: 'var(--desktop-shadow-card)'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--desktop-text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
              Select Template
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { id: 'crew_call', label: 'Crew Shortlist & Call Time', icon: Users },
                { id: 'shift_timing', label: 'Shift Reporting Details', icon: Clock },
                { id: 'client_confirm', label: 'Client Staffing Confirmation', icon: Sparkles },
                { id: 'payment', label: 'Payment Settlement Receipt', icon: Calendar },
              ].map(t => {
                const isSelected = selectedTemplate === t.id;
                const Icon = t.icon;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id as any)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--desktop-text-primary)' : 'var(--desktop-border)',
                      backgroundColor: isSelected ? 'var(--desktop-accent-soft)' : 'transparent',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: isSelected ? 700 : 500
                    }}
                  >
                    <Icon size={16} />
                    <span>{t.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Target Candidate Selector */}
          <div style={{
            backgroundColor: 'var(--desktop-card-bg)',
            border: '1px solid var(--desktop-border)',
            borderRadius: '16px',
            padding: '16px',
            boxShadow: 'var(--desktop-shadow-card)'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--desktop-text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
              Target Lead
            </div>

            <select
              value={selectedCandidateId}
              onChange={(e) => setSelectedCandidateId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--desktop-border)',
                backgroundColor: 'var(--desktop-card-bg)',
                color: 'var(--desktop-text-primary)',
                fontSize: '13px',
                fontWeight: 600,
                outline: 'none'
              }}
            >
              {candidates.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type}) — {c.phone}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Message Preview Box */}
        <div style={{
          backgroundColor: 'var(--desktop-card-bg)',
          border: '1px solid var(--desktop-border)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: 'var(--desktop-shadow-card)',
          minHeight: '420px'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--desktop-text-muted)', textTransform: 'uppercase' }}>
                WhatsApp Draft Preview
              </span>
              {selectedCandidate && (
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#10B981' }}>
                  Target: {selectedCandidate.phone}
                </span>
              )}
            </div>

            <div style={{
              backgroundColor: 'var(--desktop-sidebar-bg)',
              border: '1px solid var(--desktop-border)',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '13.5px',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              fontFamily: 'inherit',
              color: 'var(--desktop-text-primary)'
            }}>
              {messageText}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={handleCopy}
              className="btn btn-secondary"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                height: '42px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              {copied ? <Check size={16} color="#10B981" /> : <Copy size={16} />}
              <span>{copied ? 'Copied!' : 'Copy Draft'}</span>
            </button>

            <button
              onClick={handleOpenWhatsApp}
              className="btn btn-primary"
              style={{
                flex: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                height: '42px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                backgroundColor: '#10B981',
                borderColor: '#10B981'
              }}
            >
              <Send size={16} />
              <span>Send via WhatsApp Web</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
