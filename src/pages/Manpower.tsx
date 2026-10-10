import { useState, useEffect } from 'react';
import { Search, Plus, Upload, MessageCircle, Trash2, MoreVertical } from 'lucide-react';
import { getCandidates, saveCandidate, deleteCandidate, Candidate } from '../lib/db';
import { useToast } from '../contexts/ToastContext';
import { useDialog } from '../contexts/DialogContext';

export default function Manpower() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  const { addToast } = useToast();
  const { confirm } = useDialog();

  const [formData, setFormData] = useState({ name: '', phone: '', type: 'Promoter', location: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const data = getCandidates();
    setCandidates(data.filter(c => !['Hostess', 'Volunteer'].includes(c.type)));
    setOpenMenuId(null);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleSave = () => {
    if (!formData.name || !formData.phone || !formData.location) {
      addToast('error', 'Please fill all required fields');
      return;
    }

    const isDuplicate = candidates.some(c => c.phone === formData.phone);
    if (isDuplicate) {
      addToast('error', 'Phone number already exists');
      return;
    }

    saveCandidate(formData);
    addToast('success', 'Manpower added successfully');
    setIsModalOpen(false);
    setFormData({ name: '', phone: '', type: 'Promoter', location: '' });
    loadData();
  };

  const handleDelete = async (id: string) => {
    setOpenMenuId(null);
    const ok = await confirm({
      title: 'Delete Manpower',
      description: 'Are you sure you want to delete this record? This action cannot be undone.',
      destructive: true,
      confirmLabel: 'Delete'
    });
    if (ok) {
      deleteCandidate(id);
      addToast('success', 'Manpower deleted successfully');
      loadData();
    }
  };

  const openWhatsApp = (phone: string) => {
    setOpenMenuId(null);
    const cleaned = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleaned}`, '_blank');
  };

  const filtered = candidates.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.phone.includes(search) || 
                          c.location.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'All' || c.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-mobile-col">
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>Manpower</h1>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: 16 }}>
            {filtered.length} total record{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="flex gap-4">
          <button className="btn btn-secondary">
            <Upload size={16} /> <span className="desktop-only">Import</span>
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Add <span className="desktop-only" style={{ marginLeft: 4 }}>Manpower</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 250px' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--color-text-secondary)' }} />
          <input 
            className="input-field" 
            style={{ paddingLeft: 36 }} 
            placeholder="Search by name, phone or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="input-field" 
          style={{ flex: '1 1 150px' }}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="All">All Categories</option>
          <option value="Promoter">Promoter</option>
          <option value="Supervisor">Supervisor</option>
          <option value="Event Staff">Event Staff</option>
        </select>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="table-container desktop-only">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Work Category</th>
              <th>Location / Landmark</th>
              <th style={{ width: 120 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td>{c.phone}</td>
                <td>
                  <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '12px', backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                    {c.type}
                  </span>
                </td>
                <td>{c.location}</td>
                <td>
                  <div className="flex gap-2">
                    <button onClick={() => openWhatsApp(c.phone)} className="btn btn-secondary" style={{ padding: 6 }} title="WhatsApp">
                      <MessageCircle size={16} />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="btn btn-secondary text-danger" style={{ padding: 6, borderColor: 'transparent' }} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>
                  No manpower records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="mobile-only" style={{ flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', borderRadius: '12px', backgroundColor: 'var(--color-bg-primary)' }}>
            No manpower records found
          </div>
        ) : (
          filtered.map(c => (
            <div key={c.id} style={{ 
              backgroundColor: 'var(--color-bg-primary)', 
              border: '1px solid var(--color-border)', 
              borderRadius: '12px', 
              padding: '16px',
              position: 'relative',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: 'var(--color-bg-primary)', fontWeight: 600, fontSize: '14px', flexShrink: 0 }}>
                    {getInitials(c.name)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--color-text-primary)', marginBottom: '2px' }}>{c.name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{c.phone}</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button onClick={() => openWhatsApp(c.phone)} style={{ background: 'none', border: 'none', color: 'var(--color-success)', padding: '4px' }}>
                    <MessageCircle size={20} />
                  </button>
                  <div style={{ position: 'relative' }}>
                    <button 
                      onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', padding: '4px' }}
                    >
                      <MoreVertical size={20} />
                    </button>
                    {openMenuId === c.id && (
                      <div style={{ position: 'absolute', right: 0, top: '30px', backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '8px', boxShadow: 'var(--shadow-md)', zIndex: 10, minWidth: '120px', overflow: 'hidden' }}>
                        <button onClick={() => handleDelete(c.id)} style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: '14px', textAlign: 'left' }}>
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingLeft: '48px' }}>
                <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', fontWeight: 500 }}>
                  {c.type}
                </span>
                <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  📍 {c.location}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-header">Add Manpower</h2>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="input-field" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Work Category</label>
              <select className="input-field" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="Promoter">Promoter</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Event Staff">Event Staff</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Location / Landmark</label>
              <input className="input-field" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            </div>
            <div className="flex justify-between mt-4">
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
