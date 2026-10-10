import React, { useState, useEffect } from 'react';
import { Copy, RefreshCw, Save, Send, Edit3, Wand2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useDialog } from '../contexts/DialogContext';

const DRAFT_STORAGE_KEY = 'nek_leads_whatsapp_draft';
const TEMPLATE_STORAGE_KEY = 'nek_leads_saved_templates';

export default function WhatsAppDrafts() {
  const [formData, setFormData] = useState({
    eventName: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    requirementCount: '',
    workProfile: '',
    dressCode: '',
    amount: '',
    paymentCycle: 'daily',
    venueName: '',
    mapsLink: '',
    instructions: ''
  });
  
  const [manualMessage, setManualMessage] = useState('');
  const [isManualMode, setIsManualMode] = useState(false);
  
  const { addToast } = useToast();
  const { confirm } = useDialog();

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed.formData || parsed);
        if (parsed.manualMessage) {
          setManualMessage(parsed.manualMessage);
          setIsManualMode(parsed.isManualMode);
        }
      } catch (e) {
        console.error("Failed to parse saved draft");
      }
    }
  }, []);

  const saveToStorage = (data: any, manual: string, mode: boolean) => {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
      formData: data,
      manualMessage: manual,
      isManualMode: mode
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const newData = { ...formData, [e.target.name]: e.target.value };
    setFormData(newData);
    saveToStorage(newData, manualMessage, isManualMode);
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${m} ${ampm}`;
  };

  const generateMessage = () => {
    const lines = [];
    lines.push(`*EVENT REQUIREMENT*`);
    lines.push('');
    
    if (formData.eventName) lines.push(`*Event:* ${formData.eventName}`);
    
    if (formData.eventDate) {
      try {
        const d = new Date(formData.eventDate);
        if (!isNaN(d.getTime())) {
          const formattedDate = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'long' });
          lines.push(`*Date:* ${formattedDate}`);
        } else {
          lines.push(`*Date:* ${formData.eventDate}`);
        }
      } catch {
        lines.push(`*Date:* ${formData.eventDate}`);
      }
    }
    
    const formattedStart = formatTime(formData.startTime);
    const formattedEnd = formatTime(formData.endTime);
    
    if (formattedStart && formattedEnd) lines.push(`*Timing:* ${formattedStart} – ${formattedEnd}`);
    else if (formattedStart) lines.push(`*Timing:* ${formattedStart}`);
    
    if (formData.workProfile) lines.push(`*Work Profile:* ${formData.workProfile}`);
    if (formData.requirementCount) lines.push(`*Positions:* ${formData.requirementCount}`);
    
    if (formData.amount) lines.push(`*Payment:* ${formData.amount}`);
    if (formData.paymentCycle && formData.paymentCycle !== 'undisclosed' && formData.amount) {
      lines.push(`*Payment Cycle:* ${formData.paymentCycle.charAt(0).toUpperCase() + formData.paymentCycle.slice(1)}`);
    }
    
    if (formData.dressCode) lines.push(`*Dress Code:* ${formData.dressCode}`);
    
    if (formData.venueName || formData.mapsLink) {
      lines.push('');
      lines.push(`*Work Location:*`);
      if (formData.venueName) lines.push(formData.venueName);
      if (formData.mapsLink) lines.push(formData.mapsLink);
    }
    
    if (formData.instructions) {
      lines.push('');
      lines.push(formData.instructions);
    }
    
    lines.push('');
    lines.push('Interested candidates, please respond with your name and location.');
    lines.push('');
    lines.push('NEK LEADS | Event & Manpower Management');
    
    return lines.join('\n');
  };

  const currentMessage = isManualMode ? manualMessage : generateMessage();

  const handleManualEdit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isManualMode) {
      setIsManualMode(true);
    }
    setManualMessage(e.target.value);
    saveToStorage(formData, e.target.value, true);
  };

  const handleRegenerate = async () => {
    if (isManualMode) {
      const ok = await confirm({
        title: 'Discard manual edits?',
        description: 'This will overwrite your manual changes with the auto-generated template. Continue?',
        confirmLabel: 'Regenerate',
        destructive: true
      });
      if (!ok) return;
    }
    setIsManualMode(false);
    setManualMessage('');
    saveToStorage(formData, '', false);
    addToast('success', 'Message regenerated from details');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentMessage);
      addToast('success', 'Message copied to clipboard');
    } catch (err) {
      addToast('error', 'Failed to access clipboard');
    }
  };

  const handleOpenWhatsApp = () => {
    if (!currentMessage.trim()) {
      addToast('error', 'Cannot send an empty message');
      return;
    }
    const encoded = encodeURIComponent(currentMessage);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleClear = async () => {
    const ok = await confirm({
      title: 'Reset Form?',
      description: 'Are you sure you want to clear all event details and the drafted message?',
      confirmLabel: 'Reset',
      destructive: true
    });

    if (ok) {
      const empty = {
        eventName: '', eventDate: '', startTime: '', endTime: '', requirementCount: '',
        workProfile: '', dressCode: '', amount: '', paymentCycle: 'daily',
        venueName: '', mapsLink: '', instructions: ''
      };
      setFormData(empty);
      setManualMessage('');
      setIsManualMode(false);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      addToast('info', 'Form reset successfully');
    }
  };

  const handleSaveTemplate = async () => {
    // Cloudflare Worker / Google Sheets Integration Placeholder
    // Documenting missing config as requested
    addToast('error', 'Template storage unavailable. Cloudflare backend requires Google Sheets API credentials setup.');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-mobile-col">
        <h1 className="page-title" style={{ marginBottom: 0 }}>WhatsApp Drafts</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
          <Save size={14} /> Auto-saving draft
        </div>
      </div>
      
      <div className="responsive-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Left Column: Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '32px' }}>
          <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '24px', backgroundColor: 'var(--color-bg-primary)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', fontFamily: 'Outfit, sans-serif' }}>Event Details</h2>
            
            <div className="form-group">
              <label className="form-label">Event Name <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input name="eventName" value={formData.eventName} onChange={handleChange} className="input-field" placeholder="e.g. Tech Conference 2026" />
            </div>
            
            <div className="responsive-grid-inner">
              <div className="form-group">
                <label className="form-label">Event Date <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input type="date" name="eventDate" value={formData.eventDate} onChange={handleChange} className="input-field" />
              </div>
              <div className="responsive-grid-inner">
                <div className="form-group">
                  <label className="form-label">Start <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                  <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} className="input-field" />
                </div>
                <div className="form-group">
                  <label className="form-label">End <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                  <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} className="input-field" />
                </div>
              </div>
            </div>

            <div className="responsive-grid-inner">
              <div className="form-group">
                <label className="form-label">Work Profile</label>
                <input name="workProfile" value={formData.workProfile} onChange={handleChange} className="input-field" placeholder="e.g. Hostess, VIP Staff" />
              </div>
              <div className="form-group">
                <label className="form-label">Positions Needed</label>
                <input name="requirementCount" value={formData.requirementCount} onChange={handleChange} className="input-field" placeholder="e.g. 10 Female Promoters" />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Work Location <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input name="venueName" value={formData.venueName} onChange={handleChange} className="input-field" placeholder="Venue Name or Address" style={{ marginBottom: '8px' }} />
              <input name="mapsLink" value={formData.mapsLink} onChange={handleChange} className="input-field" placeholder="Google Maps URL (Optional)" />
            </div>
          </div>

          <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '24px', backgroundColor: 'var(--color-bg-primary)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', fontFamily: 'Outfit, sans-serif' }}>Additional Details</h2>
            
            <div className="responsive-grid-inner">
              <div className="form-group">
                <label className="form-label">Payment Amount</label>
                <input name="amount" value={formData.amount} onChange={handleChange} className="input-field" placeholder="Optional" />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Cycle</label>
                <select name="paymentCycle" value={formData.paymentCycle} onChange={handleChange} className="input-field">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="fortnightly">Fortnightly</option>
                  <option value="monthly">Monthly</option>
                  <option value="undisclosed">Not specified</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Dress Code</label>
              <input name="dressCode" value={formData.dressCode} onChange={handleChange} className="input-field" placeholder="Optional" />
            </div>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Extra Instructions</label>
              <textarea name="instructions" value={formData.instructions} onChange={handleChange} className="input-field" rows={2} placeholder="Optional instructions"></textarea>
            </div>
          </div>
          
          <div className="flex justify-between">
            <button className="btn btn-secondary text-danger" onClick={handleClear} style={{ borderColor: 'transparent' }}>
              <RefreshCw size={16} /> Reset Form
            </button>
            <button className="btn btn-secondary" onClick={handleSaveTemplate}>
              <Save size={16} /> Save Template
            </button>
          </div>
        </div>
        
        {/* Right Column: Preview */}
        <div style={{ position: 'sticky', top: '80px', height: 'fit-content' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}>Live Preview</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              {isManualMode ? (
                <button className="btn btn-secondary" onClick={handleRegenerate} style={{ padding: '4px 8px', fontSize: '12px', height: 'auto' }}>
                  <Wand2 size={12} /> Regenerate
                </button>
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Wand2 size={12} /> Auto-syncing
                </span>
              )}
            </div>
          </div>

          <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'var(--color-bg-primary)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px 16px', backgroundColor: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              {isManualMode ? <Edit3 size={14} /> : <Wand2 size={14} />} 
              {isManualMode ? 'Manual Edit Mode' : 'Generated Mode'}
            </div>
            
            <textarea 
              className="input-field" 
              value={currentMessage} 
              onChange={handleManualEdit}
              style={{ 
                border: 'none', 
                borderRadius: 0, 
                minHeight: '350px', 
                padding: '16px', 
                resize: 'vertical',
                backgroundColor: 'transparent',
                fontFamily: 'monospace',
                fontSize: '13px',
                lineHeight: '1.6'
              }} 
            />
            
            <div style={{ padding: '8px 16px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              <span>{currentMessage.length} characters</span>
            </div>
          </div>

          <div className="flex gap-4 mt-4">
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleCopy}>
              <Copy size={16} /> Copy
            </button>
            <button className="btn btn-primary" style={{ flex: 1, backgroundColor: '#25D366', color: 'white', border: 'none' }} onClick={handleOpenWhatsApp}>
              <Send size={16} /> Open WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
