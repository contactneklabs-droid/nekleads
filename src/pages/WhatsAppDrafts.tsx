import React, { useState, useEffect } from 'react';
import { Copy, RefreshCw, Send, Edit3, Wand2, Megaphone, CreditCard, CheckCircle2, FileText } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useDialog } from '../contexts/DialogContext';

type PresetType = 'requirement' | 'client_payment' | 'team_payment' | 'custom';

export default function WhatsAppDrafts() {
  const [activePreset, setActivePreset] = useState<PresetType>('requirement');

  // 1. Requirement State
  const [reqData, setReqData] = useState({
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

  // 2. Client Payment State
  const [clientData, setClientData] = useState({
    clientName: '',
    eventName: '',
    eventDates: '',
    totalAmount: '',
    dueAmount: '',
    paymentStage: 'advance', // advance, full, balance
    paymentDetails: 'UPI: payments@neklabs',
    dueDate: '',
    note: ''
  });

  // 3. Team Payment Completion State
  const [teamData, setTeamData] = useState({
    recipientName: '',
    eventName: '',
    eventDate: '',
    amountPaid: '',
    paymentMode: 'UPI',
    refId: '',
    remarks: ''
  });

  // 4. Custom Draft State
  const [customData, setCustomData] = useState({
    title: '',
    body: ''
  });

  // Manual overrides per preset
  const [manualMessages, setManualMessages] = useState<Record<PresetType, string>>({
    requirement: '',
    client_payment: '',
    team_payment: '',
    custom: ''
  });

  const [isManualMode, setIsManualMode] = useState<Record<PresetType, boolean>>({
    requirement: false,
    client_payment: false,
    team_payment: false,
    custom: false
  });

  const { addToast } = useToast();
  const { confirm } = useDialog();

  // Load cached presets on mount
  useEffect(() => {
    try {
      const savedReq = localStorage.getItem('nek_draft_requirement');
      if (savedReq) setReqData(JSON.parse(savedReq));

      const savedClient = localStorage.getItem('nek_draft_client');
      if (savedClient) setClientData(JSON.parse(savedClient));

      const savedTeam = localStorage.getItem('nek_draft_team');
      if (savedTeam) setTeamData(JSON.parse(savedTeam));

      const savedCustom = localStorage.getItem('nek_draft_custom');
      if (savedCustom) setCustomData(JSON.parse(savedCustom));

      const savedManuals = localStorage.getItem('nek_draft_manuals');
      if (savedManuals) setManualMessages(JSON.parse(savedManuals));

      const savedModes = localStorage.getItem('nek_draft_modes');
      if (savedModes) setIsManualMode(JSON.parse(savedModes));
    } catch {
      console.warn('Failed to parse cached WhatsApp drafts');
    }
  }, []);

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${m} ${ampm}`;
  };

  // Generate WhatsApp Message according to active preset
  const generateMessage = (): string => {
    const lines: string[] = [];

    if (activePreset === 'requirement') {
      lines.push('*EVENT REQUIREMENT*');
      lines.push('');
      if (reqData.eventName) lines.push(`*Event:* ${reqData.eventName}`);
      if (reqData.eventDate) {
        try {
          const d = new Date(reqData.eventDate);
          if (!isNaN(d.getTime())) {
            lines.push(`*Date:* ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'long' })}`);
          } else {
            lines.push(`*Date:* ${reqData.eventDate}`);
          }
        } catch {
          lines.push(`*Date:* ${reqData.eventDate}`);
        }
      }

      const start = formatTime(reqData.startTime);
      const end = formatTime(reqData.endTime);
      if (start && end) lines.push(`*Timing:* ${start} – ${end}`);
      else if (start) lines.push(`*Timing:* ${start}`);

      if (reqData.workProfile) lines.push(`*Work Profile:* ${reqData.workProfile}`);
      if (reqData.requirementCount) lines.push(`*Positions:* ${reqData.requirementCount}`);

      if (reqData.amount) lines.push(`*Payment:* ${reqData.amount}`);
      if (reqData.paymentCycle && reqData.paymentCycle !== 'undisclosed' && reqData.amount) {
        lines.push(`*Payment Cycle:* ${reqData.paymentCycle.charAt(0).toUpperCase() + reqData.paymentCycle.slice(1)}`);
      }

      if (reqData.dressCode) lines.push(`*Dress Code:* ${reqData.dressCode}`);

      if (reqData.venueName || reqData.mapsLink) {
        lines.push('');
        lines.push('*Work Location:*');
        if (reqData.venueName) lines.push(reqData.venueName);
        if (reqData.mapsLink) lines.push(reqData.mapsLink);
      }

      if (reqData.instructions) {
        lines.push('');
        lines.push(reqData.instructions);
      }

      lines.push('');
      lines.push('Interested candidates, please respond with your name, photo and location.');
      lines.push('');
      lines.push('NEK LEADS | Event & Manpower Management');
      return lines.join('\n');
    }

    if (activePreset === 'client_payment') {
      lines.push('*PAYMENT INVOICE / REMINDER*');
      lines.push('');
      if (clientData.clientName) lines.push(`*Client:* ${clientData.clientName}`);
      if (clientData.eventName) lines.push(`*Event:* ${clientData.eventName}`);
      if (clientData.eventDates) lines.push(`*Event Dates:* ${clientData.eventDates}`);
      lines.push('');

      if (clientData.totalAmount) lines.push(`*Total Invoice:* ${clientData.totalAmount}`);
      if (clientData.dueAmount) {
        const stageLabel = clientData.paymentStage === 'advance' ? 'Advance Payment' : clientData.paymentStage === 'balance' ? 'Final Balance' : 'Full Payment';
        lines.push(`*Amount Due:* ${clientData.dueAmount} (${stageLabel})`);
      }
      if (clientData.dueDate) lines.push(`*Due Date:* ${clientData.dueDate}`);

      if (clientData.paymentDetails) {
        lines.push('');
        lines.push('*Account / UPI Details:*');
        lines.push(clientData.paymentDetails);
      }

      if (clientData.note) {
        lines.push('');
        lines.push(clientData.note);
      }

      lines.push('');
      lines.push('Kindly process the transfer and share the transaction screenshot for confirmation.');
      lines.push('');
      lines.push('NEK LEADS | Accounts & Operations');
      return lines.join('\n');
    }

    if (activePreset === 'team_payment') {
      lines.push('*PAYMENT DISBURSED CONFIRMATION*');
      lines.push('');
      if (teamData.recipientName) lines.push(`*Team / Candidate:* ${teamData.recipientName}`);
      if (teamData.eventName) lines.push(`*Event:* ${teamData.eventName}`);
      if (teamData.eventDate) lines.push(`*Date:* ${teamData.eventDate}`);
      lines.push('');

      if (teamData.amountPaid) lines.push(`*Amount Cleared:* ${teamData.amountPaid}`);
      if (teamData.paymentMode) lines.push(`*Disbursement Mode:* ${teamData.paymentMode}`);
      if (teamData.refId) lines.push(`*Transaction Ref:* ${teamData.refId}`);

      if (teamData.remarks) {
        lines.push('');
        lines.push(teamData.remarks);
      }

      lines.push('');
      lines.push('Thank you for your dedication, punctuality and hard work!');
      lines.push('Looking forward to working with you on future events.');
      lines.push('');
      lines.push('NEK LEADS | Talent Operations');
      return lines.join('\n');
    }

    // Custom
    if (customData.title) lines.push(`*${customData.title.toUpperCase()}*`);
    if (customData.title) lines.push('');
    if (customData.body) lines.push(customData.body);
    lines.push('');
    lines.push('NEK LEADS | Event & Manpower Management');
    return lines.join('\n');
  };

  const currentMessage = isManualMode[activePreset] ? manualMessages[activePreset] : generateMessage();

  const handleManualEdit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const newModes = { ...isManualMode, [activePreset]: true };
    const newManuals = { ...manualMessages, [activePreset]: val };
    setIsManualMode(newModes);
    setManualMessages(newManuals);
    localStorage.setItem('nek_draft_modes', JSON.stringify(newModes));
    localStorage.setItem('nek_draft_manuals', JSON.stringify(newManuals));
  };

  const handleRegenerate = async () => {
    if (isManualMode[activePreset]) {
      const ok = await confirm({
        title: 'Discard manual edits?',
        description: 'This will reset the preview to the auto-generated format using your form values.',
        confirmLabel: 'Regenerate',
        destructive: true
      });
      if (!ok) return;
    }
    const newModes = { ...isManualMode, [activePreset]: false };
    const newManuals = { ...manualMessages, [activePreset]: '' };
    setIsManualMode(newModes);
    setManualMessages(newManuals);
    localStorage.setItem('nek_draft_modes', JSON.stringify(newModes));
    localStorage.setItem('nek_draft_manuals', JSON.stringify(newManuals));
    addToast('success', 'Message regenerated from details');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentMessage);
      addToast('success', 'Message copied to clipboard');
    } catch {
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

  const handleClearCurrent = async () => {
    const ok = await confirm({
      title: 'Reset Active Preset?',
      description: 'Clear all fields and custom text in this preset tab?',
      confirmLabel: 'Reset',
      destructive: true
    });
    if (!ok) return;

    if (activePreset === 'requirement') {
      const empty = { eventName: '', eventDate: '', startTime: '', endTime: '', requirementCount: '', workProfile: '', dressCode: '', amount: '', paymentCycle: 'daily', venueName: '', mapsLink: '', instructions: '' };
      setReqData(empty);
      localStorage.removeItem('nek_draft_requirement');
    } else if (activePreset === 'client_payment') {
      const empty = { clientName: '', eventName: '', eventDates: '', totalAmount: '', dueAmount: '', paymentStage: 'advance', paymentDetails: 'UPI: payments@neklabs', dueDate: '', note: '' };
      setClientData(empty);
      localStorage.removeItem('nek_draft_client');
    } else if (activePreset === 'team_payment') {
      const empty = { recipientName: '', eventName: '', eventDate: '', amountPaid: '', paymentMode: 'UPI', refId: '', remarks: '' };
      setTeamData(empty);
      localStorage.removeItem('nek_draft_team');
    } else {
      const empty = { title: '', body: '' };
      setCustomData(empty);
      localStorage.removeItem('nek_draft_custom');
    }

    const newModes = { ...isManualMode, [activePreset]: false };
    const newManuals = { ...manualMessages, [activePreset]: '' };
    setIsManualMode(newModes);
    setManualMessages(newManuals);
    localStorage.setItem('nek_draft_modes', JSON.stringify(newModes));
    localStorage.setItem('nek_draft_manuals', JSON.stringify(newManuals));
    addToast('info', 'Preset form cleared');
  };

  return (
    <div>
      {/* Header Area */}
      <div className="flex justify-between items-center mb-4 flex-mobile-col">
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>WhatsApp Drafts</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            Select a preset to broadcast requirements, request client payments, or confirm team payouts.
          </p>
        </div>
      </div>

      {/* Preset Segmented Selector */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        padding: '6px', 
        backgroundColor: 'var(--color-bg-secondary)', 
        border: '1px solid var(--color-border)', 
        borderRadius: '16px', 
        marginBottom: '24px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        <button
          onClick={() => setActivePreset('requirement')}
          style={{
            flex: 1,
            minWidth: '130px',
            padding: '10px 14px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: activePreset === 'requirement' ? 'var(--color-bg-primary)' : 'transparent',
            color: activePreset === 'requirement' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            fontWeight: 600,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: activePreset === 'requirement' ? 'var(--shadow-sm)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Megaphone size={16} /> Requirement
        </button>

        <button
          onClick={() => setActivePreset('client_payment')}
          style={{
            flex: 1,
            minWidth: '130px',
            padding: '10px 14px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: activePreset === 'client_payment' ? 'var(--color-bg-primary)' : 'transparent',
            color: activePreset === 'client_payment' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            fontWeight: 600,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: activePreset === 'client_payment' ? 'var(--shadow-sm)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <CreditCard size={16} /> Client Payment
        </button>

        <button
          onClick={() => setActivePreset('team_payment')}
          style={{
            flex: 1,
            minWidth: '130px',
            padding: '10px 14px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: activePreset === 'team_payment' ? 'var(--color-bg-primary)' : 'transparent',
            color: activePreset === 'team_payment' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            fontWeight: 600,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: activePreset === 'team_payment' ? 'var(--shadow-sm)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <CheckCircle2 size={16} /> Team Payout
        </button>

        <button
          onClick={() => setActivePreset('custom')}
          style={{
            flex: 1,
            minWidth: '100px',
            padding: '10px 14px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: activePreset === 'custom' ? 'var(--color-bg-primary)' : 'transparent',
            color: activePreset === 'custom' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            fontWeight: 600,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: activePreset === 'custom' ? 'var(--shadow-sm)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <FileText size={16} /> Custom
        </button>
      </div>

      <div className="responsive-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Left Column: Form according to active preset */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '32px' }}>
          
          {/* TAB 1: REQUIREMENT DRAFT */}
          {activePreset === 'requirement' && (
            <>
              <div style={{ border: '1px solid var(--color-border)', borderRadius: '16px', padding: '24px', backgroundColor: 'var(--color-bg-primary)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', fontFamily: 'Outfit, sans-serif' }}>Event Parameters</h2>
                
                <div className="form-group">
                  <label className="form-label">Event Name <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                  <input 
                    name="eventName" 
                    value={reqData.eventName} 
                    onChange={e => {
                      const updated = { ...reqData, eventName: e.target.value };
                      setReqData(updated);
                      localStorage.setItem('nek_draft_requirement', JSON.stringify(updated));
                    }} 
                    className="input-field" 
                    placeholder="e.g. Bangalore Tech Summit 2026" 
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Event Date</label>
                  <input 
                    type="date" 
                    name="eventDate" 
                    value={reqData.eventDate} 
                    onChange={e => {
                      const updated = { ...reqData, eventDate: e.target.value };
                      setReqData(updated);
                      localStorage.setItem('nek_draft_requirement', JSON.stringify(updated));
                    }} 
                    className="input-field" 
                  />
                </div>

                <div className="responsive-grid-inner">
                  <div className="form-group">
                    <label className="form-label">Start Time</label>
                    <input 
                      type="time" 
                      name="startTime" 
                      value={reqData.startTime} 
                      onChange={e => {
                        const updated = { ...reqData, startTime: e.target.value };
                        setReqData(updated);
                        localStorage.setItem('nek_draft_requirement', JSON.stringify(updated));
                      }} 
                      className="input-field" 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Time</label>
                    <input 
                      type="time" 
                      name="endTime" 
                      value={reqData.endTime} 
                      onChange={e => {
                        const updated = { ...reqData, endTime: e.target.value };
                        setReqData(updated);
                        localStorage.setItem('nek_draft_requirement', JSON.stringify(updated));
                      }} 
                      className="input-field" 
                    />
                  </div>
                </div>

                <div className="responsive-grid-inner">
                  <div className="form-group">
                    <label className="form-label">Work Profile</label>
                    <input 
                      name="workProfile" 
                      value={reqData.workProfile} 
                      onChange={e => {
                        const updated = { ...reqData, workProfile: e.target.value };
                        setReqData(updated);
                        localStorage.setItem('nek_draft_requirement', JSON.stringify(updated));
                      }} 
                      className="input-field" 
                      placeholder="e.g. VIP Hostess, Registration Desk" 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Positions Needed</label>
                    <input 
                      name="requirementCount" 
                      value={reqData.requirementCount} 
                      onChange={e => {
                        const updated = { ...reqData, requirementCount: e.target.value };
                        setReqData(updated);
                        localStorage.setItem('nek_draft_requirement', JSON.stringify(updated));
                      }} 
                      className="input-field" 
                      placeholder="e.g. 8 Female Candidates" 
                    />
                  </div>
                </div>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Venue / Work Location</label>
                  <input 
                    name="venueName" 
                    value={reqData.venueName} 
                    onChange={e => {
                      const updated = { ...reqData, venueName: e.target.value };
                      setReqData(updated);
                      localStorage.setItem('nek_draft_requirement', JSON.stringify(updated));
                    }} 
                    className="input-field" 
                    placeholder="Venue Name or Landmark" 
                    style={{ marginBottom: '8px' }} 
                  />
                  <input 
                    name="mapsLink" 
                    value={reqData.mapsLink} 
                    onChange={e => {
                      const updated = { ...reqData, mapsLink: e.target.value };
                      setReqData(updated);
                      localStorage.setItem('nek_draft_requirement', JSON.stringify(updated));
                    }} 
                    className="input-field" 
                    placeholder="Google Maps URL (Optional)" 
                  />
                </div>
              </div>

              <div style={{ border: '1px solid var(--color-border)', borderRadius: '16px', padding: '24px', backgroundColor: 'var(--color-bg-primary)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', fontFamily: 'Outfit, sans-serif' }}>Pay & Attire Details</h2>
                
                <div className="responsive-grid-inner">
                  <div className="form-group">
                    <label className="form-label">Remuneration</label>
                    <input 
                      name="amount" 
                      value={reqData.amount} 
                      onChange={e => {
                        const updated = { ...reqData, amount: e.target.value };
                        setReqData(updated);
                        localStorage.setItem('nek_draft_requirement', JSON.stringify(updated));
                      }} 
                      className="input-field" 
                      placeholder="e.g. ₹2,000" 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Cycle</label>
                    <select 
                      name="paymentCycle" 
                      value={reqData.paymentCycle} 
                      onChange={e => {
                        const updated = { ...reqData, paymentCycle: e.target.value };
                        setReqData(updated);
                        localStorage.setItem('nek_draft_requirement', JSON.stringify(updated));
                      }} 
                      className="input-field"
                    >
                      <option value="daily">Daily payout</option>
                      <option value="weekly">Weekly</option>
                      <option value="fortnightly">Fortnightly</option>
                      <option value="monthly">Monthly</option>
                      <option value="undisclosed">Undisclosed / On completion</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Dress Code</label>
                  <input 
                    name="dressCode" 
                    value={reqData.dressCode} 
                    onChange={e => {
                      const updated = { ...reqData, dressCode: e.target.value };
                      setReqData(updated);
                      localStorage.setItem('nek_draft_requirement', JSON.stringify(updated));
                    }} 
                    className="input-field" 
                    placeholder="e.g. Formal Black Blazer / Saree" 
                  />
                </div>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Specific Instructions</label>
                  <textarea 
                    name="instructions" 
                    value={reqData.instructions} 
                    onChange={e => {
                      const updated = { ...reqData, instructions: e.target.value };
                      setReqData(updated);
                      localStorage.setItem('nek_draft_requirement', JSON.stringify(updated));
                    }} 
                    className="input-field" 
                    rows={2} 
                    placeholder="e.g. Report 30 mins before briefing"
                  ></textarea>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: CLIENT PAYMENT DRAFT */}
          {activePreset === 'client_payment' && (
            <div style={{ border: '1px solid var(--color-border)', borderRadius: '16px', padding: '24px', backgroundColor: 'var(--color-bg-primary)', boxShadow: 'var(--shadow-sm)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', fontFamily: 'Outfit, sans-serif' }}>Client Invoice Details</h2>
              
              <div className="form-group">
                <label className="form-label">Client / Organization Name <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input 
                  value={clientData.clientName} 
                  onChange={e => {
                    const updated = { ...clientData, clientName: e.target.value };
                    setClientData(updated);
                    localStorage.setItem('nek_draft_client', JSON.stringify(updated));
                  }} 
                  className="input-field" 
                  placeholder="e.g. Titan Mediaworks" 
                />
              </div>

              <div className="responsive-grid-inner">
                <div className="form-group">
                  <label className="form-label">Event Name</label>
                  <input 
                    value={clientData.eventName} 
                    onChange={e => {
                      const updated = { ...clientData, eventName: e.target.value };
                      setClientData(updated);
                      localStorage.setItem('nek_draft_client', JSON.stringify(updated));
                    }} 
                    className="input-field" 
                    placeholder="e.g. Global Tech Conclave" 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Event Dates</label>
                  <input 
                    value={clientData.eventDates} 
                    onChange={e => {
                      const updated = { ...clientData, eventDates: e.target.value };
                      setClientData(updated);
                      localStorage.setItem('nek_draft_client', JSON.stringify(updated));
                    }} 
                    className="input-field" 
                    placeholder="e.g. 24–26 Oct 2026" 
                  />
                </div>
              </div>

              <div className="responsive-grid-inner">
                <div className="form-group">
                  <label className="form-label">Total Invoice Value</label>
                  <input 
                    value={clientData.totalAmount} 
                    onChange={e => {
                      const updated = { ...clientData, totalAmount: e.target.value };
                      setClientData(updated);
                      localStorage.setItem('nek_draft_client', JSON.stringify(updated));
                    }} 
                    className="input-field" 
                    placeholder="e.g. ₹50,000" 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount Currently Due</label>
                  <input 
                    value={clientData.dueAmount} 
                    onChange={e => {
                      const updated = { ...clientData, dueAmount: e.target.value };
                      setClientData(updated);
                      localStorage.setItem('nek_draft_client', JSON.stringify(updated));
                    }} 
                    className="input-field" 
                    placeholder="e.g. ₹25,000" 
                  />
                </div>
              </div>

              <div className="responsive-grid-inner">
                <div className="form-group">
                  <label className="form-label">Payment Stage</label>
                  <select 
                    value={clientData.paymentStage} 
                    onChange={e => {
                      const updated = { ...clientData, paymentStage: e.target.value };
                      setClientData(updated);
                      localStorage.setItem('nek_draft_client', JSON.stringify(updated));
                    }} 
                    className="input-field"
                  >
                    <option value="advance">50% Advance Booking</option>
                    <option value="full">100% Full Payment</option>
                    <option value="balance">Final Remaining Balance</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Due By</label>
                  <input 
                    value={clientData.dueDate} 
                    onChange={e => {
                      const updated = { ...clientData, dueDate: e.target.value };
                      setClientData(updated);
                      localStorage.setItem('nek_draft_client', JSON.stringify(updated));
                    }} 
                    className="input-field" 
                    placeholder="e.g. 22 Oct 2026" 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Payment & Banking Details</label>
                <input 
                  value={clientData.paymentDetails} 
                  onChange={e => {
                    const updated = { ...clientData, paymentDetails: e.target.value };
                    setClientData(updated);
                    localStorage.setItem('nek_draft_client', JSON.stringify(updated));
                  }} 
                  className="input-field" 
                  placeholder="UPI ID, Bank A/C or Payment Link" 
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Special Notes / PO Reference</label>
                <textarea 
                  value={clientData.note} 
                  onChange={e => {
                    const updated = { ...clientData, note: e.target.value };
                    setClientData(updated);
                    localStorage.setItem('nek_draft_client', JSON.stringify(updated));
                  }} 
                  className="input-field" 
                  rows={2} 
                  placeholder="e.g. Invoice attached as PDF separately"
                ></textarea>
              </div>
            </div>
          )}

          {/* TAB 3: TEAM PAYMENT COMPLETION DRAFT */}
          {activePreset === 'team_payment' && (
            <div style={{ border: '1px solid var(--color-border)', borderRadius: '16px', padding: '24px', backgroundColor: 'var(--color-bg-primary)', boxShadow: 'var(--shadow-sm)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', fontFamily: 'Outfit, sans-serif' }}>Disbursement Details</h2>
              
              <div className="form-group">
                <label className="form-label">Candidate Name / Team Group <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input 
                  value={teamData.recipientName} 
                  onChange={e => {
                    const updated = { ...teamData, recipientName: e.target.value };
                    setTeamData(updated);
                    localStorage.setItem('nek_draft_team', JSON.stringify(updated));
                  }} 
                  className="input-field" 
                  placeholder="e.g. Ananya Sharma or Hostess Team" 
                />
              </div>

              <div className="responsive-grid-inner">
                <div className="form-group">
                  <label className="form-label">Event Name</label>
                  <input 
                    value={teamData.eventName} 
                    onChange={e => {
                      const updated = { ...teamData, eventName: e.target.value };
                      setTeamData(updated);
                      localStorage.setItem('nek_draft_team', JSON.stringify(updated));
                    }} 
                    className="input-field" 
                    placeholder="e.g. Auto Expo 2026" 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Event Date</label>
                  <input 
                    value={teamData.eventDate} 
                    onChange={e => {
                      const updated = { ...teamData, eventDate: e.target.value };
                      setTeamData(updated);
                      localStorage.setItem('nek_draft_team', JSON.stringify(updated));
                    }} 
                    className="input-field" 
                    placeholder="e.g. 12 Oct 2026" 
                  />
                </div>
              </div>

              <div className="responsive-grid-inner">
                <div className="form-group">
                  <label className="form-label">Amount Cleared</label>
                  <input 
                    value={teamData.amountPaid} 
                    onChange={e => {
                      const updated = { ...teamData, amountPaid: e.target.value };
                      setTeamData(updated);
                      localStorage.setItem('nek_draft_team', JSON.stringify(updated));
                    }} 
                    className="input-field" 
                    placeholder="e.g. ₹2,500" 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mode of Payment</label>
                  <select 
                    value={teamData.paymentMode} 
                    onChange={e => {
                      const updated = { ...teamData, paymentMode: e.target.value };
                      setTeamData(updated);
                      localStorage.setItem('nek_draft_team', JSON.stringify(updated));
                    }} 
                    className="input-field"
                  >
                    <option value="UPI">UPI Transfer</option>
                    <option value="Bank NEFT/IMPS">Bank NEFT/IMPS</option>
                    <option value="Cash">Cash in hand</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Transaction Reference ID (Optional)</label>
                <input 
                  value={teamData.refId} 
                  onChange={e => {
                    const updated = { ...teamData, refId: e.target.value };
                    setTeamData(updated);
                    localStorage.setItem('nek_draft_team', JSON.stringify(updated));
                  }} 
                  className="input-field" 
                  placeholder="e.g. UPI-9284719284" 
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Performance Remarks / Feedback</label>
                <textarea 
                  value={teamData.remarks} 
                  onChange={e => {
                    const updated = { ...teamData, remarks: e.target.value };
                    setTeamData(updated);
                    localStorage.setItem('nek_draft_team', JSON.stringify(updated));
                  }} 
                  className="input-field" 
                  rows={2} 
                  placeholder="Optional note thanking the team"
                ></textarea>
              </div>
            </div>
          )}

          {/* TAB 4: CUSTOM DRAFT */}
          {activePreset === 'custom' && (
            <div style={{ border: '1px solid var(--color-border)', borderRadius: '16px', padding: '24px', backgroundColor: 'var(--color-bg-primary)', boxShadow: 'var(--shadow-sm)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', fontFamily: 'Outfit, sans-serif' }}>Freeform Notice</h2>
              
              <div className="form-group">
                <label className="form-label">Announcement Title</label>
                <input 
                  value={customData.title} 
                  onChange={e => {
                    const updated = { ...customData, title: e.target.value };
                    setCustomData(updated);
                    localStorage.setItem('nek_draft_custom', JSON.stringify(updated));
                  }} 
                  className="input-field" 
                  placeholder="e.g. URGENT BRIEFING UPDATE" 
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Message Content</label>
                <textarea 
                  value={customData.body} 
                  onChange={e => {
                    const updated = { ...customData, body: e.target.value };
                    setCustomData(updated);
                    localStorage.setItem('nek_draft_custom', JSON.stringify(updated));
                  }} 
                  className="input-field" 
                  rows={8} 
                  placeholder="Write your custom announcement or broadcast instructions here..."
                ></textarea>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex justify-between items-center">
            <button className="btn btn-secondary text-danger" onClick={handleClearCurrent} style={{ borderColor: 'transparent' }}>
              <RefreshCw size={15} /> Reset This Preset
            </button>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Presets cached locally
            </span>
          </div>
        </div>

        {/* Right Column: Live WhatsApp Preview */}
        <div style={{ position: 'sticky', top: '80px', height: 'fit-content' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>Live Preview</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              {isManualMode[activePreset] ? (
                <button className="btn btn-secondary" onClick={handleRegenerate} style={{ padding: '4px 10px', fontSize: '12px', height: 'auto', borderRadius: '12px' }}>
                  <Wand2 size={12} /> Reset to Auto
                </button>
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                  <Wand2 size={12} /> Auto-generating
                </span>
              )}
            </div>
          </div>

          <div style={{ border: '1px solid var(--color-border)', borderRadius: '16px', overflow: 'hidden', backgroundColor: 'var(--color-bg-primary)', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '10px 16px', backgroundColor: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isManualMode[activePreset] ? <Edit3 size={14} /> : <Wand2 size={14} />} 
                <span style={{ fontWeight: 600 }}>{isManualMode[activePreset] ? 'Direct Manual Edit' : 'Auto Template Mode'}</span>
              </div>
              <span style={{ textTransform: 'capitalize', fontSize: '11px', fontWeight: 600 }}>
                {activePreset.replace('_', ' ')}
              </span>
            </div>
            
            <textarea 
              className="input-field" 
              value={currentMessage} 
              onChange={handleManualEdit}
              placeholder="Start filling out the parameters on the left..."
              style={{ 
                border: 'none', 
                borderRadius: 0, 
                minHeight: '340px', 
                padding: '20px', 
                resize: 'vertical',
                backgroundColor: 'transparent',
                fontFamily: 'monospace',
                fontSize: '13px',
                lineHeight: '1.6'
              }} 
            />
            
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-secondary)' }}>
              <span>{currentMessage.length} characters</span>
              <span>Ready to broadcast</span>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button className="btn btn-secondary" style={{ flex: 1, borderRadius: '12px', padding: '12px' }} onClick={handleCopy}>
              <Copy size={16} /> Copy Message
            </button>
            <button className="btn btn-primary" style={{ flex: 1, backgroundColor: '#000000', color: '#FFFFFF', border: 'none', borderRadius: '12px', padding: '12px' }} onClick={handleOpenWhatsApp}>
              <Send size={16} /> Open WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
