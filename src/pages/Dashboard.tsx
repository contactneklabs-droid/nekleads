import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layers, 
  UserPlus, 
  Calendar, 
  Plus, 
  Upload, 
  MapPin, 
  ArrowUpRight, 
  X,
  Sparkles
} from 'lucide-react';
import { getCandidates, Candidate, saveCandidate, getEvents, EventItem, getActivities, ActivityItem, saveEvent, logActivity } from '../lib/db';
import { downloadInstantBackup } from '../lib/backup';
import { useToast } from '../contexts/ToastContext';
import { PayoutCalculatorModal } from '../components/PayoutCalculatorModal';
import { WhatsAppDirectModal } from '../components/WhatsAppDirectModal';

export default function Dashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [growthTimeframe, setGrowthTimeframe] = useState<'7D' | '30D' | '90D'>('30D');

  // Modals state
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [whatsAppCandidate, setWhatsAppCandidate] = useState<Candidate | null>(null);
  const [quickAddType, setQuickAddType] = useState<'talent' | 'client' | null>(null);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
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

  const [eventForm, setEventForm] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    staffRequired: '',
    status: 'Confirmed' as EventItem['status']
  });

  const loadData = () => {
    const candidateList = getCandidates();
    setCandidates(candidateList);
    setEvents(getEvents());
    setActivities(getActivities());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Format today's date: e.g. "SUNDAY, 15 NOVEMBER 2026"
  const formattedToday = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date()).toUpperCase();

  // Quick Add submit
  const handleQuickAddSubmit = () => {
    if (!quickAddForm.name || !quickAddForm.phone || !quickAddForm.location) {
      addToast('error', 'Please fill all required fields');
      return;
    }
    const isDuplicate = candidates.some(c => c.phone === quickAddForm.phone);
    if (isDuplicate) {
      addToast('error', 'Phone number already registered');
      return;
    }

    saveCandidate({
      name: quickAddForm.name,
      phone: quickAddForm.phone,
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
    if (!quickAddForm.name || !quickAddForm.phone || !quickAddForm.location) {
      addToast('error', 'Please fill all required fields');
      return;
    }
    const isDuplicate = candidates.some(c => c.phone === quickAddForm.phone);
    if (isDuplicate) {
      addToast('error', 'Phone number already registered');
      return;
    }

    saveCandidate({
      name: quickAddForm.name,
      phone: quickAddForm.phone,
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
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.name.trim() || !eventForm.location.trim()) {
      addToast('error', 'Please enter event name and location');
      return;
    }
    saveEvent({
      name: eventForm.name.trim(),
      date: eventForm.date,
      location: eventForm.location.trim(),
      staffRequired: eventForm.staffRequired.trim() || 'General Crew',
      status: eventForm.status
    });
    addToast('success', `Event "${eventForm.name}" created!`);
    setIsCreateEventOpen(false);
    setEventForm({
      name: '',
      date: new Date().toISOString().split('T')[0],
      location: '',
      staffRequired: '',
      status: 'Confirmed'
    });
    loadData();
  };

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

  const formatEventDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const day = String(d.getDate()).padStart(2, '0');
      return { month, day };
    } catch {
      return { month: 'EVT', day: '01' };
    }
  };

  const getStatusBadge = (status: EventItem['status']) => {
    switch (status) {
      case 'Confirmed':
        return { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: 'rgba(16, 185, 129, 0.25)' };
      case 'Pending':
        return { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.25)' };
      case 'Planning':
        return { bg: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.25)' };
    }
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
      
      {/* 1. DYNAMIC DATE & GREETING */}
      <div style={{ marginBottom: '20px', paddingTop: '4px' }}>
        <div style={{ 
          fontSize: '11px', 
          fontWeight: 700, 
          letterSpacing: '0.8px', 
          color: 'var(--color-text-secondary)',
          textTransform: 'uppercase'
        }}>
          {formattedToday}
        </div>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: 800, 
          letterSpacing: '-0.6px', 
          margin: '2px 0 2px 0',
          color: 'var(--color-text-primary)'
        }}>
          Overview
        </h1>
        <p style={{ 
          fontSize: '13.5px', 
          color: 'var(--color-text-secondary)', 
          margin: 0 
        }}>
          Your event operations at a glance.
        </p>
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

          {/* Create Event */}
          <div 
            className="quick-action-tile"
            onClick={() => setIsCreateEventOpen(true)}
          >
            <Calendar size={20} />
            <span>Create Event</span>
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
                   act.type === 'event' ? <Calendar size={16} /> :
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

      {/* 7. UPCOMING EVENTS */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0, letterSpacing: '-0.2px' }}>
            Upcoming Events
          </h2>
          <button
            onClick={() => navigate('/events')}
            style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}
          >
            View all &rarr;
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {events.slice(0, 3).map(evt => {
            const { month, day } = formatEventDate(evt.date);
            const badge = getStatusBadge(evt.status);
            return (
              <div
                key={evt.id}
                onClick={() => navigate('/events')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderRadius: '14px',
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer'
                }}
              >
                {/* Date Badge */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '44px',
                  height: '46px',
                  backgroundColor: 'var(--color-input-bg)',
                  borderRadius: '10px',
                  border: '1px solid var(--color-border)'
                }}>
                  <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--color-text-secondary)', letterSpacing: '0.4px' }}>
                    {month}
                  </span>
                  <span style={{ fontSize: '16px', fontWeight: 800, lineHeight: 1 }}>
                    {day}
                  </span>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {evt.name}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    {evt.location} &bull; {evt.staffRequired || 'Crew'}
                  </div>
                </div>

                {/* Status Pill */}
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '8px',
                  backgroundColor: badge.bg,
                  color: badge.color,
                  border: `1px solid ${badge.border}`,
                  whiteSpace: 'nowrap'
                }}>
                  {evt.status}
                </span>
              </div>
            );
          })}
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
                <label className="form-label">Phone Number</label>
                <input 
                  type="tel" 
                  className="input-field" 
                  placeholder="e.g. 9876543210"
                  value={quickAddForm.phone}
                  onChange={(e) => setQuickAddForm({ ...quickAddForm, phone: e.target.value })}
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

      {/* CREATE EVENT MODAL */}
      {isCreateEventOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateEventOpen(false)}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '440px', width: '90%', padding: '20px', borderRadius: '20px' }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>Create New Event</h2>
            <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label">Event Name</label>
                <input
                  type="text"
                  placeholder="e.g. Corporate Summit"
                  value={eventForm.name}
                  onChange={e => setEventForm({ ...eventForm, name: e.target.value })}
                  className="input-field"
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    value={eventForm.date}
                    onChange={e => setEventForm({ ...eventForm, date: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select
                    value={eventForm.status}
                    onChange={e => setEventForm({ ...eventForm, status: e.target.value as EventItem['status'] })}
                    className="input-field"
                  >
                    <option value="Confirmed">Confirmed</option>
                    <option value="Pending">Pending</option>
                    <option value="Planning">Planning</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Venue / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Whitefield, Bangalore"
                  value={eventForm.location}
                  onChange={e => setEventForm({ ...eventForm, location: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="form-label">Staffing Requirement</label>
                <input
                  type="text"
                  placeholder="e.g. 2 Hostess · 4 Volunteers"
                  value={eventForm.staffRequired}
                  onChange={e => setEventForm({ ...eventForm, staffRequired: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateEventOpen(false)}
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
                  Save Event
                </button>
              </div>
            </form>
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
