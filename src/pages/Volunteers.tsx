import { useState, useEffect } from 'react';
import { Search, Plus, Upload, MessageCircle, Trash2, CheckSquare, Square, ChevronLeft, ChevronRight, Edit3 } from 'lucide-react';
import { getCandidates, saveCandidate, updateCandidate, deleteCandidate, Candidate } from '../lib/db';
import { useToast } from '../contexts/ToastContext';
import { useDialog } from '../contexts/DialogContext';
import { SwipeableLeadCard } from '../components/SwipeableLeadCard';

export default function Volunteers() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [genderFilter, setGenderFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const itemsPerPage = 10;

  const { addToast } = useToast();
  const { confirm } = useDialog();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const [formData, setFormData] = useState({ name: '', phone: '', type: 'Volunteer', location: '', gender: 'Female' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const data = getCandidates();
    setCandidates(data.filter(c => ['Hostess', 'Volunteer', 'Talent'].includes(c.type)));
    setSelectedIds(new Set());
    setOpenCardId(null);
  };

  const handleEdit = (candidate: Candidate) => {
    setOpenCardId(null);
    setEditingId(candidate.id);
    setFormData({
      name: candidate.name,
      phone: candidate.phone,
      type: candidate.type || 'Volunteer',
      location: candidate.location,
      gender: candidate.gender || 'Female'
    });
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: '', phone: '', type: 'Volunteer', location: '', gender: 'Female' });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', phone: '', type: 'Volunteer', location: '', gender: 'Female' });
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
      addToast('success', 'Candidate added successfully');
    }

    handleCloseModal();
    loadData();
  };

  const handleDelete = async (id: string) => {
    setOpenCardId(null);
    const ok = await confirm({
      title: 'Delete Candidate',
      description: 'Are you sure you want to delete this candidate? This action cannot be undone.',
      destructive: true,
      confirmLabel: 'Delete'
    });
    if (ok) {
      deleteCandidate(id);
      addToast('success', 'Candidate deleted successfully');
      loadData();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const ok = await confirm({
      title: 'Bulk Delete',
      description: `Are you sure you want to delete ${selectedIds.size} candidates? This cannot be undone.`,
      destructive: true,
      confirmLabel: 'Delete All Selected'
    });
    if (ok) {
      selectedIds.forEach(id => deleteCandidate(id));
      addToast('success', `${selectedIds.size} candidates deleted successfully`);
      loadData();
    }
  };

  const openWhatsApp = (phone: string) => {
    setOpenCardId(null);
    const cleaned = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleaned}`, '_blank');
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = (filteredIds: string[]) => {
    if (selectedIds.size === filteredIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredIds));
    }
  };

  const filtered = candidates.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    const matchesType = typeFilter === 'All' || c.type === typeFilter;
    const matchesGender = genderFilter === 'All' || c.gender === genderFilter;
    const matchesLocation = locationFilter === '' || c.location.toLowerCase().includes(locationFilter.toLowerCase());
    return matchesSearch && matchesType && matchesGender && matchesLocation;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, genderFilter, locationFilter]);

  return (
    <div>
      {/* Header Area */}
      <div className="flex justify-between items-center mb-4 flex-mobile-col">
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>Volunteers & Hostesses</h1>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: 16 }}>
            {filtered.length} total candidate{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="flex gap-4">
          <button className="btn btn-secondary">
            <Upload size={16} /> <span className="desktop-only">Import</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} /> Add <span className="desktop-only" style={{ marginLeft: 4 }}>Candidate</span>
          </button>
        </div>
      </div>

      {/* Filters Area */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 250px' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--color-text-secondary)' }} />
          <input 
            className="input-field" 
            style={{ paddingLeft: 36 }} 
            placeholder="Search name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <input 
          className="input-field" 
          style={{ flex: '1 1 150px' }}
          placeholder="Location filter..."
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
        />
        <select 
          className="input-field" 
          style={{ flex: '1 1 120px' }}
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
        >
          <option value="All">All Genders</option>
          <option value="Female">Female</option>
          <option value="Male">Male</option>
          <option value="Other">Other</option>
        </select>
        <select 
          className="input-field" 
          style={{ flex: '1 1 120px' }}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="All">All Types</option>
          <option value="Talent">Talent</option>
          <option value="Volunteer">Volunteer</option>
          <option value="Hostess">Hostess</option>
        </select>
      </div>

      {/* Selection Action Bar for Both Desktop & Mobile */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '8px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => toggleSelectAll(filtered.map(c => c.id))}
          className="btn btn-secondary mobile-only"
          style={{ padding: '8px 12px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '8px', flexShrink: 0 }}
        >
          {selectedIds.size === filtered.length && filtered.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
          <span>{selectedIds.size === filtered.length && filtered.length > 0 ? 'Deselect All' : 'Select All'}</span>
        </button>

        {selectedIds.size > 0 && (
          <div style={{ padding: '8px 12px', backgroundColor: 'rgba(211, 47, 47, 0.08)', border: '1px solid var(--color-danger)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1, minWidth: '160px' }}>
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
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="table-container desktop-only">
        <table>
          <thead>
            <tr>
              <th style={{ width: 40, textAlign: 'center' }}>
                <button onClick={() => toggleSelectAll(filtered.map(c => c.id))} style={{ background: 'none', border: 'none', color: 'inherit' }}>
                  {selectedIds.size === filtered.length && filtered.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>
              </th>
              <th>Name</th>
              <th>Phone</th>
              <th>Type</th>
              <th>Gender</th>
              <th>Location</th>
              <th style={{ width: 140 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map(c => (
              <tr key={c.id} style={{ backgroundColor: selectedIds.has(c.id) ? 'rgba(128,128,128,0.05)' : '' }}>
                <td style={{ textAlign: 'center' }}>
                  <button onClick={() => toggleSelect(c.id)} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)' }}>
                    {selectedIds.has(c.id) ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} />}
                  </button>
                </td>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td>{c.phone}</td>
                <td>
                  <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '12px', backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                    {c.type}
                  </span>
                </td>
                <td>{c.gender || 'N/A'}</td>
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
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>
                  No candidates found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARD VIEW (Slide to Edit/Delete + Long Press to Select) */}
      <div className="mobile-only" style={{ flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
        {paginatedData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', borderRadius: '16px', backgroundColor: 'var(--color-bg-primary)' }}>
            No candidates found
          </div>
        ) : (
          paginatedData.map(c => (
            <SwipeableLeadCard
              key={c.id}
              id={c.id}
              name={c.name}
              phone={c.phone}
              type={c.type}
              location={c.location}
              gender={c.gender}
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingBottom: '24px' }}>
          <div className="desktop-only" style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
          </div>
          <div className="mobile-only" style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button 
              className="btn btn-secondary" 
              style={{ padding: '6px 12px' }} 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '6px 12px' }} 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Add Candidate Modal */}
      {isModalOpen && (
        <div 
          className="modal-overlay" 
          onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-header">{editingId ? 'Edit Lead' : 'Add Candidate'}</h2>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Name</label>
              <input className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
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
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Type</label>
                <select className="input-field" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="Volunteer">Volunteer</option>
                  <option value="Hostess">Hostess</option>
                  <option value="Talent">Talent</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Gender</label>
                <select className="input-field" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
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
