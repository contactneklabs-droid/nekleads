import { useState, useRef, useEffect } from 'react';
import { X, UserPlus } from 'lucide-react';
import { saveCandidate, logActivity } from '../lib/db';
import { useToast } from '../contexts/ToastContext';

interface QuickAddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'Volunteer' | 'Hostess' | 'Manpower' | 'Client';
}

export function QuickAddLeadModal({ isOpen, onClose, defaultType = 'Volunteer' }: QuickAddLeadModalProps) {
  const { addToast } = useToast();
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    type: defaultType,
    location: '',
    gender: 'Male'
  });

  useEffect(() => {
    if (isOpen) {
      setForm({
        name: '',
        phone: '',
        type: defaultType,
        location: '',
        gender: 'Male'
      });
      setTimeout(() => nameInputRef.current?.focus(), 120);
    }
  }, [isOpen, defaultType]);

  if (!isOpen) return null;

  const handleSubmit = (addAnother = false) => {
    const cleanPhone = form.phone.replace(/\D/g, '');
    if (!form.name.trim()) {
      addToast('error', 'Please enter a name');
      return;
    }

    if (cleanPhone.length !== 10) {
      addToast('error', 'Please enter a valid 10-digit phone number');
      return;
    }

    saveCandidate({
      name: form.name.trim(),
      phone: cleanPhone,
      type: form.type,
      location: form.location.trim() || 'Bangalore',
      gender: form.gender
    });

    logActivity('lead', `New lead added: ${form.name.trim()}`, `${form.type} · ${form.location.trim() || 'Bangalore'}`);
    addToast('success', `Lead "${form.name.trim()}" saved!`);

    // Notify any active views (Dashboard, People) to reload data immediately
    window.dispatchEvent(new CustomEvent('nek-data-updated'));

    if (addAnother) {
      setForm({
        name: '',
        phone: '',
        type: form.type,
        location: form.location,
        gender: 'Male'
      });
      setTimeout(() => nameInputRef.current?.focus(), 80);
    } else {
      onClose();
    }
  };

  return (
    <div 
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ zIndex: 3000 }}
    >
      <div 
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '440px', width: '92%', borderRadius: '24px', padding: '24px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserPlus size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>Add New Lead</h2>
              <span style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)' }}>Quick lead creation</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="btn btn-secondary" 
            style={{ width: '32px', height: '32px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(false); }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="form-label">Full Name *</label>
            <input 
              ref={nameInputRef}
              type="text" 
              className="input-field" 
              placeholder="e.g. Priya Sharma"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label className="form-label" style={{ margin: 0 }}>Phone Number *</label>
              <span style={{ 
                fontSize: '11px', 
                fontWeight: 700,
                color: form.phone.length === 10 ? '#10b981' : form.phone.length > 0 ? 'var(--color-primary)' : 'var(--color-text-secondary)' 
              }}>
                {form.phone.length}/10 digits
              </span>
            </div>
            <input 
              type="tel" 
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              className="input-field" 
              placeholder="10-digit mobile number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="form-label">Category</label>
              <select 
                className="input-field"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as any })}
              >
                <option value="Volunteer">Volunteer</option>
                <option value="Hostess">Hostess</option>
                <option value="Manpower">Manpower</option>
                <option value="Promoter">Promoter</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Client">Client</option>
              </select>
            </div>

            <div>
              <label className="form-label">Gender</label>
              <select 
                className="input-field"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
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
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: '0 0 auto' }}>
              Cancel
            </button>
            <div style={{ display: 'flex', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
              <button 
                type="button"
                onClick={() => handleSubmit(true)} 
                className="btn btn-secondary"
                style={{ fontWeight: 600, fontSize: '12.5px', padding: '10px 12px' }}
              >
                + Save & Next
              </button>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px' }}>
                Save Lead
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
