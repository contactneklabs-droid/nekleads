import { useState, useEffect } from 'react';
import { Search, Plus, Upload, MessageCircle, Trash2, Edit3 } from 'lucide-react';
import { getCandidates, saveCandidate, updateCandidate, deleteCandidate, Candidate } from '../lib/db';
import { useToast } from '../contexts/ToastContext';
import { useDialog } from '../contexts/DialogContext';
import { SwipeableLeadCard } from '../components/SwipeableLeadCard';

export default function Manpower() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const { addToast } = useToast();
  const { confirm } = useDialog();

  const [formData, setFormData] = useState({ name: '', phone: '', type: 'Manpower', location: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const data = getCandidates();
    setCandidates(data.filter(c => !['Hostess', 'Volunteer', 'Talent'].includes(c.type)));
    setSelectedIds(new Set());
    setOpenCardId(null);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const ok = await confirm({
      title: 'Bulk Delete',
      description: `Are you sure you want to delete ${selectedIds.size} records? This cannot be undone.`,
      destructive: true,
      confirmLabel: 'Delete All Selected'
    });
    if (ok) {
      selectedIds.forEach(id => deleteCandidate(id));
      addToast('success', `${selectedIds.size} records deleted successfully`);
      loadData();
    }
  };

  const handleEdit = (candidate: Candidate) => {
    setOpenCardId(null);
    setEditingId(candidate.id);
    setFormData({
      name: candidate.name,
      phone: candidate.phone,
      type: candidate.type || 'Manpower',
      location: candidate.location
    });
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: '', phone: '', type: 'Manpower', location: '' });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', phone: '', type: 'Manpower', location: '' });
  };

  const handleSave = () => {
    if (!formData.name || !formData.phone || !formData.location) {
      addToast('error', 'Please fill all required fields');
      return;
    }

    const isDuplicate = candidates.some(c => c.phone === formData.phone && c.id !== editingId);
    if (isDuplicate) {
      addToast('error', 'Phone number already exists');
      return;
    }

    if (editingId) {
      updateCandidate(editingId, formData);
      addToast('success', 'Lead updated successfully');
    } else {
      saveCandidate(formData);
      addToast('success', 'Manpower added successfully');
    }

    handleCloseModal();
    loadData();
  };

  const handleDelete = async (id: string) => {
    setOpenCardId(null);
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
    setOpenCardId(null);
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
          <h1 className="page-title" style={{ marginBottom: 4 }}>Manpowers</h1>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: 16 }}>
            {filtered.length} total record{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="flex gap-4">
          <button className="btn btn-secondary">
            <Upload size={16} /> <span className="desktop-only">Import</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
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
          <option value="Manpower">Manpower</option>
          <option value="Promoter">Promoter</option>
          <option value="Supervisor">Supervisor</option>
          <option value="Event Staff">Event Staff</option>
        </select>
      </div>

      {/* Selection Action Bar for Mobile & Desktop when items selected */}
      {selectedIds.size > 0 && (
        <div style={{ padding: '8px 12px', backgroundColor: 'rgba(211, 47, 47, 0.08)', border: '1px solid var(--color-danger)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-danger)', fontSize: '13px' }}>{selectedIds.size} selected</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button className="btn btn-danger" style={{ padding: '5px 10px', fontSize: '12px', borderRadius: '6px' }} onClick={handleBulkDelete}>
              <Trash2 size={13} /> Bulk Delete
            </button>
            <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '12px', borderRadius: '6px' }} onClick={() => setSelectedIds(new Set())}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* DESKTOP TABLE VIEW */}
      <div className="table-container desktop-only">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Work Category</th>
              <th>Location / Landmark</th>
              <th style={{ width: 140 }}>Action</th>
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
                    <button onClick={() => handleEdit(c)} className="btn btn-secondary" style={{ padding: 6 }} title="Edit Lead">
                      <Edit3 size={16} />
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

      {/* MOBILE CARD VIEW (Slide to Edit/Delete + Long Press to Select) */}
      <div className="mobile-only" style={{ flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', borderRadius: '16px', backgroundColor: 'var(--color-bg-primary)' }}>
            No manpower records found
          </div>
        ) : (
          filtered.map(c => (
            <SwipeableLeadCard
              key={c.id}
              id={c.id}
              name={c.name}
              phone={c.phone}
              type={c.type}
              location={c.location}
              isSelected={selectedIds.has(c.id)}
              isSelectionMode={selectedIds.size > 0}
              isOpen={openCardId === c.id}
              onOpen={() => setOpenCardId(c.id)}
              onClose={() => setOpenCardId(null)}
              onToggleSelect={() => toggleSelect(c.id)}
              onLongPress={() => toggleSelect(c.id)}
              onEdit={() => handleEdit(c)}
              onDelete={() => handleDelete(c.id)}
              onWhatsApp={() => openWhatsApp(c.phone)}
              getInitials={getInitials}
            />
          ))
        )}
      </div>

      {isModalOpen && (
        <div 
          className="modal-overlay" 
          onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-header">{editingId ? 'Edit Lead' : 'Add Manpower'}</h2>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input 
                type="tel" 
                inputMode="numeric" 
                pattern="[0-9]*" 
                placeholder="e.g. 9876543210" 
                className="input-field" 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Work Category</label>
              <select className="input-field" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="Manpower">Manpower</option>
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
              <button className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>{editingId ? 'Update Lead' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
