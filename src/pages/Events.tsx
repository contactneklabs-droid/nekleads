import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Plus, Trash2 } from 'lucide-react';
import { getEvents, saveEvent, deleteEvent, EventItem } from '../lib/db';
import { useToast } from '../contexts/ToastContext';

export default function Events() {
  const { addToast } = useToast();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [filter, setFilter] = useState<'All' | 'Confirmed' | 'Pending' | 'Planning'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    staffRequired: '',
    status: 'Confirmed' as EventItem['status']
  });

  const loadData = () => {
    setEvents(getEvents());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.location.trim()) {
      addToast('error', 'Please enter event name and location');
      return;
    }
    saveEvent({
      name: form.name.trim(),
      date: form.date,
      location: form.location.trim(),
      staffRequired: form.staffRequired.trim() || 'General Crew',
      status: form.status
    });
    addToast('success', `Event "${form.name}" created!`);
    setIsModalOpen(false);
    setForm({
      name: '',
      date: new Date().toISOString().split('T')[0],
      location: '',
      staffRequired: '',
      status: 'Confirmed'
    });
    loadData();
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete event "${name}"?`)) {
      deleteEvent(id);
      addToast('info', 'Event deleted');
      loadData();
    }
  };

  const filtered = events.filter(e => filter === 'All' || e.status === filter);

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

  return (
    <div className="container" style={{ padding: '16px', maxWidth: '720px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.8px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
            Operations & Schedule
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '2px 0 0 0', letterSpacing: '-0.5px' }}>
            Events Hub
          </h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--color-primary)',
            color: 'var(--color-bg-primary)',
            border: 'none',
            padding: '10px 16px',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          <Plus size={16} />
          <span>New Event</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px' }}>
        {(['All', 'Confirmed', 'Pending', 'Planning'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid',
              borderColor: filter === tab ? 'var(--color-primary)' : 'var(--color-border)',
              backgroundColor: filter === tab ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
              color: filter === tab ? 'var(--color-bg-primary)' : 'var(--color-text-primary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Events List */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 16px',
          background: 'var(--color-bg-secondary)',
          borderRadius: '16px',
          border: '1px dashed var(--color-border)'
        }}>
          <Calendar size={36} style={{ color: 'var(--color-text-secondary)', marginBottom: '8px', opacity: 0.6 }} />
          <p style={{ fontWeight: 600, fontSize: '15px' }}>No events found</p>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Tap "+ New Event" to schedule an upcoming operation.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(evt => {
            const { month, day } = formatEventDate(evt.date);
            const badge = getStatusBadge(evt.status);
            return (
              <div
                key={evt.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px',
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderRadius: '16px',
                  border: '1px solid var(--color-border)'
                }}
              >
                {/* Date Box */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '50px',
                  height: '52px',
                  backgroundColor: 'var(--color-input-bg)',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)'
                }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-text-secondary)', letterSpacing: '0.5px' }}>
                    {month}
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: 800, lineHeight: 1 }}>
                    {day}
                  </span>
                </div>

                {/* Event Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {evt.name}
                    </h3>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '8px',
                      backgroundColor: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`,
                      whiteSpace: 'nowrap'
                    }}>
                      {evt.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} />
                      {evt.location}
                    </span>
                    {evt.staffRequired && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={12} />
                        {evt.staffRequired}
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete action */}
                <button
                  onClick={() => handleDelete(evt.id, evt.name)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-secondary)',
                    padding: '8px',
                    cursor: 'pointer',
                    borderRadius: '8px'
                  }}
                  title="Delete event"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '440px', width: '90%', padding: '20px', borderRadius: '20px' }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>Schedule New Event</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                  Event Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Corporate Summit"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-input-bg)',
                    marginTop: '4px',
                    fontSize: '14px'
                  }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-input-bg)',
                      marginTop: '4px',
                      fontSize: '13px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as EventItem['status'] })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-input-bg)',
                      marginTop: '4px',
                      fontSize: '13px'
                    }}
                  >
                    <option value="Confirmed">Confirmed</option>
                    <option value="Pending">Pending</option>
                    <option value="Planning">Planning</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                  Location / Venue
                </label>
                <input
                  type="text"
                  placeholder="e.g. Indiranagar, Bangalore"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-input-bg)',
                    marginTop: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                  Staffing Requirement
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2 Hostess · 4 Volunteers"
                  value={form.staffRequired}
                  onChange={e => setForm({ ...form, staffRequired: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-input-bg)',
                    marginTop: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'transparent',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-bg-primary)',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
