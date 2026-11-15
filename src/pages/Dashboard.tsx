import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell,
  Layers, 
  UserPlus, 
  Plus, 
  Upload, 
  MapPin, 
  ArrowUpRight, 
  X,
  Sparkles,
  Calculator
} from 'lucide-react';
import { getCandidates, Candidate, saveCandidate, getActivities, ActivityItem, logActivity } from '../lib/db';
import { downloadInstantBackup } from '../lib/backup';
import { useToast } from '../contexts/ToastContext';
import { PayoutCalculatorModal } from '../components/PayoutCalculatorModal';
import { WhatsAppDirectModal } from '../components/WhatsAppDirectModal';

export default function Dashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [growthTimeframe, setGrowthTimeframe] = useState<'7D' | '30D' | '90D'>('30D');

  // Modals state
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [whatsAppCandidate, setWhatsAppCandidate] = useState<Candidate | null>(null);
  const [quickAddType, setQuickAddType] = useState<'talent' | 'client' | null>(null);
  const [isAddAreaOpen, setIsAddAreaOpen] = useState(false);
  const [areaInput, setAreaInput] = useState('');

  // Forms
  const quickAddNameRef = useRef<HTMLInputElement>(null);
  const [quickAddForm, setQuickAddForm] = useState({
    name: '',
    phone: '',
    type: 'Volunteer',
    location: '',
    gender: 'Male'
  });

  const loadData = () => {
    const candidateList = getCandidates();
    setCandidates(candidateList);
    setActivities(getActivities());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('nek-data-updated', handleUpdate);
    return () => window.removeEventListener('nek-data-updated', handleUpdate);
  }, []);

  // Format today's date: e.g. "SUNDAY, NOVEMBER 15, 2026"
  const formattedToday = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date()).toUpperCase();

  const [dayName, ...restDateParts] = formattedToday.split(',');
  const restDate = restDateParts.join(',').trim();

  // Quick Add submit
  const handleQuickAddSubmit = () => {
    const cleanPhone = quickAddForm.phone.replace(/\D/g, '');
    if (!quickAddForm.name || !quickAddForm.location) {
      addToast('error', 'Please fill name and location');
      return;
    }

    if (cleanPhone.length !== 10) {
      addToast('error', 'Please enter a valid 10-digit phone number');
      return;
    }

    const isDuplicate = candidates.some(c => c.phone === cleanPhone);
    if (isDuplicate) {
      addToast('error', 'Phone number already registered');
      return;
    }

    saveCandidate({
      name: quickAddForm.name,
      phone: cleanPhone,
      type: quickAddForm.type,
      location: quickAddForm.location,
      gender: quickAddForm.gender
    });

    addToast('success', `Added ${quickAddForm.name} to directory`);
    setQuickAddType(null);
    setQuickAddForm({ name: '', phone: '', type: 'Volunteer', location: '', gender: 'Male' });
    loadData();
  };

  const handleQuickAddAndAnother = () => {
    const cleanPhone = quickAddForm.phone.replace(/\D/g, '');
    if (!quickAddForm.name || !quickAddForm.location) {
      addToast('error', 'Please fill name and location');
      return;
    }

    if (cleanPhone.length !== 10) {
      addToast('error', 'Please enter a valid 10-digit phone number');
      return;
    }

    const isDuplicate = candidates.some(c => c.phone === cleanPhone);
    if (isDuplicate) {
      addToast('error', 'Phone number already registered');
      return;
    }

    saveCandidate({
      name: quickAddForm.name,
      phone: cleanPhone,
      type: quickAddForm.type,
      location: quickAddForm.location,
      gender: quickAddForm.gender
    });

    addToast('success', `Saved ${quickAddForm.name}! Ready for next lead...`);
    setQuickAddForm(prev => ({
      ...prev,
      name: '',
      phone: ''
    }));
    loadData();
    quickAddNameRef.current?.focus();
  };

  // Event Create Submit
  // Add Area Submit
  const handleAddArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaInput.trim()) return;
    logActivity('area', `Area created: ${areaInput.trim()}`, 'Bangalore Zone');
    addToast('success', `Area "${areaInput.trim()}" created!`);
    setAreaInput('');
    setIsAddAreaOpen(false);
    loadData();
  };

  const formatRelativeTime = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 60) return `${diffMins || 1}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      return 'Yesterday';
    } catch {
      return 'Recent';
    }
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '0 4px' }}>
      
      {/* 1. TOP HEADER & GREETING: DATE & TITLE ON LEFT, NOTIFICATIONS + PROFILE ON RIGHT */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        justifyContent: 'space-between', 
        marginBottom: '16px',
        paddingTop: '2px'
      }}>
        <div>
          {/* 1. Date Kicker: Bold Day + Light Date with Space Grotesk */}
          <div style={{ 
            fontFamily: "var(--font-tech, 'Space Grotesk', sans-serif)",
            fontSize: '11px', 
            letterSpacing: '1.8px', 
            textTransform: 'uppercase',
            color: 'var(--color-text-secondary)',
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '2px' }}>
              {dayName}
            </span>
            <span style={{ opacity: 0.35 }}>•</span>
            <span style={{ fontWeight: 300, letterSpacing: '1.6px' }}>
              {restDate}
            </span>
          </div>

          {/* 2. Hero Title: Sculpted Geometric Display in Urbanist */}
          <h1 style={{ 
            fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
            fontSize: '36px', 
            letterSpacing: '-1.4px', 
            lineHeight: 1.05,
            margin: '2px 0 4px 0',
            color: 'var(--color-text-primary)'
          }}>
            <span style={{ fontWeight: 900 }}>Over</span><span style={{ fontWeight: 300, opacity: 0.88 }}>view</span>
          </h1>

          {/* 3. Subtitle: Bold Lead + Light Ending in Urbanist */}
          <p style={{ 
            fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
            fontSize: '14px', 
            color: 'var(--color-text-secondary)', 
            margin: 0,
            lineHeight: 1.4
          }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Your lead operations</span>{' '}
            <span style={{ fontWeight: 300 }}>at a glance.</span>
          </p>
        </div>

        {/* Right Actions: Notifications & Profile N */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '4px' }}>
          <div
            style={{
              position: 'relative',
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-primary)'
            }}
            title="Notifications"
          >
            <Bell size={16} />
            <span style={{
              position: 'absolute',
              top: '7px',
              right: '8px',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#ef4444'
            }} />
          </div>

          <div
            onClick={() => navigate('/settings')}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-bg-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '13.5px',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)'
            }}
            title="Settings & Profile"
          >
            N
          </div>
        </div>
      </div>

      {/* 3. METRICS STATS ROW (TOTAL LEADS & NEW LEADS) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        marginBottom: '16px'
      }}>
        {/* Total Leads */}
        <div 
          className="ecosystem-card"
          onClick={() => navigate('/people')}
          style={{ cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Total Leads
            </span>
            <Layers size={18} style={{ color: 'var(--color-text-secondary)', opacity: 0.8 }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, margin: '8px 0 4px 0', letterSpacing: '-0.5px' }}>
            {candidates.length || 248}
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 700, color: '#10b981' }}>
            <ArrowUpRight size={13} />
            <span>+12%</span>
          </div>
        </div>

        {/* New Leads */}
        <div 
          className="ecosystem-card"
          onClick={() => {
            setQuickAddType('talent');
            setQuickAddForm({ name: '', phone: '', type: 'Volunteer', location: '', gender: 'Male' });
          }}
          style={{ cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              New Leads
            </span>
            <UserPlus size={18} style={{ color: 'var(--color-text-secondary)', opacity: 0.8 }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, margin: '8px 0 4px 0', letterSpacing: '-0.5px' }}>
            32
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 700, color: '#10b981' }}>
            <ArrowUpRight size={13} />
            <span>+18%</span>
          </div>
        </div>
      </div>

      {/* 4. LEADS GROWTH AREA CHART */}
      <div className="ecosystem-card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, letterSpacing: '-0.2px' }}>
              Leads Growth
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Last 30 days
            </span>
          </div>

          <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--color-bg-secondary)', padding: '3px', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
            {(['7D', '30D', '90D'] as const).map(pill => (
              <button
                key={pill}
                onClick={() => setGrowthTimeframe(pill)}
                style={{
                  border: 'none',
                  background: growthTimeframe === pill ? 'var(--color-primary)' : 'transparent',
                  color: growthTimeframe === pill ? 'var(--color-bg-primary)' : 'var(--color-text-secondary)',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '7px',
                  cursor: 'pointer'
                }}
              >
                {pill}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Area Chart */}
        <div style={{ position: 'relative', width: '100%', height: '140px', overflow: 'hidden' }}>
          <svg viewBox="0 0 360 140" style={{ width: '100%', height: '100%', display: 'block' }}>
            <defs>
              <linearGradient id="growthAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-text-primary)" stopOpacity="0.22" />
                <stop offset="65%" stopColor="var(--color-text-primary)" stopOpacity="0.05" />
                <stop offset="100%" stopColor="var(--color-text-primary)" stopOpacity="0.00" />
              </linearGradient>
            </defs>

            {/* Faint Horizontal Grid lines */}
            <line x1="0" y1="35" x2="360" y2="35" stroke="var(--color-border)" strokeDasharray="3 3" opacity="0.6" />
            <line x1="0" y1="75" x2="360" y2="75" stroke="var(--color-border)" strokeDasharray="3 3" opacity="0.6" />
            <line x1="0" y1="115" x2="360" y2="115" stroke="var(--color-border)" strokeDasharray="3 3" opacity="0.6" />

            {/* Area Fill */}
            <path
              d="M 10 120 
                 C 40 118, 60 112, 90 102 
                 C 120 92, 140 96, 170 82 
                 C 200 68, 220 72, 250 54 
                 C 280 40, 310 46, 345 28 
                 L 345 135 L 10 135 Z"
              fill="url(#growthAreaGrad)"
            />

            {/* Top Smooth Curve Stroke */}
            <path
              d="M 10 120 
                 C 40 118, 60 112, 90 102 
                 C 120 92, 140 96, 170 82 
                 C 200 68, 220 72, 250 54 
                 C 280 40, 310 46, 345 28"
              fill="none"
              stroke="var(--color-text-primary)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Current End Marker Dot */}
            <circle cx="345" cy="28" r="4.5" fill="var(--color-text-primary)" />
            <circle cx="345" cy="28" r="7.5" fill="none" stroke="var(--color-text-primary)" strokeWidth="1.5" opacity="0.4" />
          </svg>

          {/* Interactive Floating Pill Tooltip */}
          <div style={{
            position: 'absolute',
            top: '4px',
            right: '8px',
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-bg-primary)',
            fontSize: '10.5px',
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: '6px',
            boxShadow: 'var(--shadow-sm)',
            letterSpacing: '0.3px'
          }}>
            {candidates.length || 248} Leads
          </div>
        </div>

        {/* Date Labels under chart */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '4px', padding: '0 4px' }}>
          <span>Oct 16</span>
          <span>Oct 24</span>
          <span>Nov 01</span>
          <span>Nov 09</span>
          <span>Today</span>
        </div>
      </div>

      {/* 5. QUICK ACTIONS DOCK (2x2) */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '10px', letterSpacing: '-0.2px' }}>
          Quick Actions
        </h2>
        <div className="quick-actions-grid">
          {/* Add Lead */}
          <div 
            className="quick-action-tile"
            onClick={() => {
              setQuickAddType('talent');
              setQuickAddForm({ name: '', phone: '', type: 'Volunteer', location: '', gender: 'Male' });
            }}
          >
            <Plus size={20} />
            <span>Add Lead</span>
          </div>

          {/* Payout Calculator */}
          <div 
            className="quick-action-tile"
            onClick={() => setIsCalcOpen(true)}
          >
            <Calculator size={20} />
            <span>Payout Calc</span>
          </div>

          {/* Add Area */}
          <div 
            className="quick-action-tile"
            onClick={() => setIsAddAreaOpen(true)}
          >
            <MapPin size={20} />
            <span>Add Area</span>
          </div>

          {/* Export Data */}
          <div 
            className="quick-action-tile"
            onClick={() => {
              const count = downloadInstantBackup();
              addToast('success', `Exported ${count} records to device.`);
            }}
          >
            <Upload size={20} />
            <span>Export Data</span>
          </div>
        </div>
      </div>

      {/* 6. RECENT ACTIVITY */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0, letterSpacing: '-0.2px' }}>
            Recent Activity
          </h2>
          <button
            onClick={() => navigate('/people')}
            style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}
          >
            View all &rarr;
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {activities.slice(0, 4).map(act => (
            <div key={act.id} className="activity-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <div className="activity-icon-bubble">
                  {act.type === 'lead' ? <UserPlus size={16} /> :
                   act.type === 'area' ? <MapPin size={16} /> : <Sparkles size={16} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {act.title}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', marginTop: '1px' }}>
                    {act.description}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {formatRelativeTime(act.timestamp)}
              </span>
            </div>
          ))}
        </div>
      </div>


      {/* QUICK ADD LEAD MODAL */}
      {quickAddType && (
        <div 
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setQuickAddType(null); }}
        >
          <div 
            className="modal-content"
            style={{ maxWidth: '460px', width: '100%' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                + Add New Lead
              </h2>
              <button 
                onClick={() => setQuickAddType(null)} 
                className="btn btn-secondary" 
                style={{ width: '32px', height: '32px', padding: 0, borderRadius: '50%' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">Full Name</label>
                <input 
                  ref={quickAddNameRef}
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Priya Sharma"
                  value={quickAddForm.name}
                  onChange={(e) => setQuickAddForm({ ...quickAddForm, name: e.target.value })}
                  autoFocus
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Phone Number *</label>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 700,
                    color: quickAddForm.phone.length === 10 ? '#10b981' : quickAddForm.phone.length > 0 ? 'var(--color-primary)' : 'var(--color-text-secondary)' 
                  }}>
                    {quickAddForm.phone.length}/10 digits
                  </span>
                </div>
                <input 
                  type="tel" 
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  className="input-field" 
                  placeholder="10-digit mobile number"
                  value={quickAddForm.phone}
                  onChange={(e) => setQuickAddForm({ ...quickAddForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label">Category</label>
                  <select 
                    className="input-field"
                    value={quickAddForm.type}
                    onChange={(e) => setQuickAddForm({ ...quickAddForm, type: e.target.value })}
                  >
                    <option value="Volunteer">Volunteer</option>
                    <option value="Hostess">Hostess</option>
                    <option value="Promoter">Promoter</option>
                    <option value="Manpower">Manpower</option>
                    <option value="Supervisor">Supervisor</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Gender</label>
                  <select 
                    className="input-field"
                    value={quickAddForm.gender}
                    onChange={(e) => setQuickAddForm({ ...quickAddForm, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Location / Area</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Indiranagar, Bangalore"
                  value={quickAddForm.location}
                  onChange={(e) => setQuickAddForm({ ...quickAddForm, location: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                <button onClick={() => setQuickAddType(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    type="button"
                    onClick={handleQuickAddAndAnother} 
                    className="btn btn-secondary"
                    style={{ fontWeight: 600, fontSize: '13px' }}
                  >
                    + Save & Add Another
                  </button>
                  <button onClick={handleQuickAddSubmit} className="btn btn-primary">
                    Save Lead
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ADD AREA MODAL */}
      {isAddAreaOpen && (
        <div className="modal-overlay" onClick={() => setIsAddAreaOpen(false)}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '380px', width: '90%', padding: '20px', borderRadius: '20px' }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '14px' }}>Add Location / Area</h2>
            <form onSubmit={handleAddArea} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label">Area Name</label>
                <input
                  type="text"
                  placeholder="e.g. Koramangala, Indiranagar"
                  value={areaInput}
                  onChange={e => setAreaInput(e.target.value)}
                  className="input-field"
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddAreaOpen(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Add Area
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payout Calculator Modal */}
      <PayoutCalculatorModal
        isOpen={isCalcOpen}
        onClose={() => setIsCalcOpen(false)}
        onApplyToClientDraft={() => {
          setIsCalcOpen(false);
          navigate('/whatsapp-drafts');
        }}
        onApplyToTeamDraft={() => {
          setIsCalcOpen(false);
          navigate('/whatsapp-drafts');
        }}
      />

      {/* WhatsApp Direct Messaging Modal */}
      <WhatsAppDirectModal
        isOpen={!!whatsAppCandidate}
        candidate={whatsAppCandidate}
        onClose={() => setWhatsAppCandidate(null)}
      />

    </div>
  );
}
