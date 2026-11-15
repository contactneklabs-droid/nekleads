import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Search, 
  Plus, 
  Users, 
  UserCheck, 
  Sparkles, 
  Wrench, 
  Filter, 
  MoreHorizontal, 
  Phone, 
  MessageCircle, 
  Edit3, 
  Trash2, 
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getCandidates, saveCandidate, updateCandidate, deleteCandidate, Candidate } from '../lib/db';
import { useToast } from '../contexts/ToastContext';
import { useDialog } from '../contexts/DialogContext';
import { WhatsAppDirectModal } from '../components/WhatsAppDirectModal';
import { LeadCardSkeleton } from '../components/LeadCardSkeleton';

export default function People() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { confirm } = useDialog();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [activeCategory, setActiveCategory] = useState<'All' | 'Volunteer' | 'Hostess' | 'Manpower'>('All');
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female' | 'Other'>('All');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [activeActionCandidate, setActiveActionCandidate] = useState<Candidate | null>(null);
  const [whatsAppCandidate, setWhatsAppCandidate] = useState<Candidate | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    type: 'Volunteer',
    location: '',
    gender: 'Male'
  });

  const loadData = () => {
    // Loads ALL people: Volunteers, Hostess, and Manpower merged
    const data = getCandidates();
    setCandidates(data);
  };

  useEffect(() => {
    loadData();
    const timer = setTimeout(() => setIsLoading(false), 150);
    return () => clearTimeout(timer);
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Filter candidates
  const filtered = candidates.filter(c => {
    // Category filter
    if (activeCategory === 'Volunteer' && c.type !== 'Volunteer') return false;
    if (activeCategory === 'Hostess' && c.type !== 'Hostess') return false;
    if (activeCategory === 'Manpower' && ['Volunteer', 'Hostess'].includes(c.type)) return false;

    // Gender filter
    if (genderFilter !== 'All' && c.gender !== genderFilter) return false;

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchRole = (c.type || '').toLowerCase().includes(q);
      const matchArea = (c.location || '').toLowerCase().includes(q);
      const matchPhone = (c.phone || '').includes(q);
      if (!matchName && !matchRole && !matchArea && !matchPhone) return false;
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenAdd = () => {
    setEditingCandidate(null);
    setForm({
      name: '',
      phone: '',
      type: activeCategory === 'Hostess' ? 'Hostess' : activeCategory === 'Manpower' ? 'Manpower' : 'Volunteer',
      location: '',
      gender: 'Male'
    });
    setIsAddModalOpen(true);
    setTimeout(() => nameInputRef.current?.focus(), 80);
  };

  const handleEdit = (c: Candidate) => {
    setActiveActionCandidate(null);
    setEditingCandidate(c);
    setForm({
      name: c.name,
      phone: c.phone,
      type: c.type || 'Volunteer',
      location: c.location,
      gender: c.gender || 'Male'
    });
    setIsAddModalOpen(true);
  };

  const handleDelete = async (c: Candidate) => {
    setActiveActionCandidate(null);
    const ok = await confirm({
      title: 'Delete record?',
      description: `Are you sure you want to remove ${c.name} from the directory?`,
      confirmLabel: 'Delete',
      destructive: true
    });
    if (!ok) return;

    deleteCandidate(c.id);
    addToast('info', `Removed ${c.name}`);
    loadData();
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.phone.trim() || !form.location.trim()) {
      addToast('error', 'Please fill name, phone, and location');
      return;
    }

    const isDup = candidates.some(c => c.phone === form.phone.trim() && c.id !== editingCandidate?.id);
    if (isDup) {
      addToast('error', 'Phone number already registered');
      return;
    }

    if (editingCandidate) {
      updateCandidate(editingCandidate.id, form);
      addToast('success', `Updated ${form.name}`);
    } else {
      saveCandidate(form);
      addToast('success', `Added ${form.name} to directory`);
    }

    setIsAddModalOpen(false);
    loadData();
  };

  const handleSaveAndAddAnother = () => {
    if (!form.name.trim() || !form.phone.trim() || !form.location.trim()) {
      addToast('error', 'Please fill all required fields');
      return;
    }
    const isDup = candidates.some(c => c.phone === form.phone.trim());
    if (isDup) {
      addToast('error', 'Phone number already registered');
      return;
    }

    saveCandidate(form);
    addToast('success', `Saved ${form.name}! Ready for next person...`);
    setForm(prev => ({ ...prev, name: '', phone: '' }));
    loadData();
    nameInputRef.current?.focus();
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '0 4px', position: 'relative', minHeight: '85vh' }}>
      
      {/* 1. TOP BAR: PROFILE & NOTIFICATIONS (NO 'NEK LEADS' TO SAVE SPACE) */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'flex-end', 
        gap: '10px',
        marginBottom: '12px',
        paddingTop: '2px'
      }}>
        {/* Notification Bell */}
        <button
          onClick={() => addToast('info', `${candidates.length} active people in directory.`)}
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
            color: 'var(--color-text-primary)',
            cursor: 'pointer'
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
        </button>

        {/* User Profile Avatar - Navigates to Settings when tapped */}
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

      {/* 2. CATEGORY / TITLE HEADER */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          fontSize: '11px', 
          fontWeight: 700, 
          letterSpacing: '0.8px', 
          color: 'var(--color-text-secondary)',
          textTransform: 'uppercase'
        }}>
          OPERATIONS / PEOPLE
        </div>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: 800, 
          letterSpacing: '-0.6px', 
          margin: '2px 0 2px 0',
          color: 'var(--color-text-primary)'
        }}>
          People
        </h1>
        <p style={{ 
          fontSize: '13px', 
          color: 'var(--color-text-secondary)', 
          margin: 0 
        }}>
          Manage Volunteers, Hostess and Manpower.
        </p>
      </div>

      {/* 3. CATEGORY PILLS (ALL PEOPLE, VOLUNTEERS, HOSTESS, MANPOWER) */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        overflowX: 'auto', 
        paddingBottom: '8px', 
        marginBottom: '14px',
        WebkitOverflowScrolling: 'touch'
      }}>
        {/* All People */}
        <button
          onClick={() => { setActiveCategory('All'); setCurrentPage(1); }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '24px',
            border: '1px solid',
            borderColor: activeCategory === 'All' ? 'var(--color-primary)' : 'var(--color-border)',
            backgroundColor: activeCategory === 'All' ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
            color: activeCategory === 'All' ? 'var(--color-bg-primary)' : 'var(--color-text-primary)',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <Users size={14} />
          <span>All People</span>
        </button>

        {/* Volunteers */}
        <button
          onClick={() => { setActiveCategory('Volunteer'); setCurrentPage(1); }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '24px',
            border: '1px solid',
            borderColor: activeCategory === 'Volunteer' ? 'var(--color-primary)' : 'var(--color-border)',
            backgroundColor: activeCategory === 'Volunteer' ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
            color: activeCategory === 'Volunteer' ? 'var(--color-bg-primary)' : 'var(--color-text-primary)',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <UserCheck size={14} />
          <span>Volunteers</span>
        </button>

        {/* Hostess */}
        <button
          onClick={() => { setActiveCategory('Hostess'); setCurrentPage(1); }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '24px',
            border: '1px solid',
            borderColor: activeCategory === 'Hostess' ? 'var(--color-primary)' : 'var(--color-border)',
            backgroundColor: activeCategory === 'Hostess' ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
            color: activeCategory === 'Hostess' ? 'var(--color-bg-primary)' : 'var(--color-text-primary)',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <Sparkles size={14} />
          <span>Hostess</span>
        </button>

        {/* Manpower */}
        <button
          onClick={() => { setActiveCategory('Manpower'); setCurrentPage(1); }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '24px',
            border: '1px solid',
            borderColor: activeCategory === 'Manpower' ? 'var(--color-primary)' : 'var(--color-border)',
            backgroundColor: activeCategory === 'Manpower' ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
            color: activeCategory === 'Manpower' ? 'var(--color-bg-primary)' : 'var(--color-text-primary)',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <Wrench size={14} />
          <span>Manpower</span>
        </button>
      </div>

      {/* 4. SEARCH AND FILTER BAR */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search 
            size={16} 
            color="var(--color-text-secondary)" 
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} 
          />
          <input
            type="text"
            placeholder="Search name, role, area..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            style={{
              width: '100%',
              padding: '11px 14px 11px 38px',
              borderRadius: '14px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-primary)',
              fontSize: '13.5px',
              outline: 'none'
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer'
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilterDropdown(!showFilterDropdown)}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            border: '1px solid var(--color-border)',
            backgroundColor: genderFilter !== 'All' ? 'var(--color-primary)' : 'var(--color-bg-primary)',
            color: genderFilter !== 'All' ? 'var(--color-bg-primary)' : 'var(--color-text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0
          }}
          title="Filter by gender"
        >
          <Filter size={17} />
        </button>
      </div>

      {/* Filter Dropdown Tray */}
      {showFilterDropdown && (
        <div style={{
          padding: '12px 14px',
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '14px',
          border: '1px solid var(--color-border)',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
            Gender:
          </span>
          {(['All', 'Male', 'Female', 'Other'] as const).map(g => (
            <button
              key={g}
              onClick={() => setGenderFilter(g)}
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: genderFilter === g ? 'var(--color-primary)' : 'var(--color-border)',
                backgroundColor: genderFilter === g ? 'var(--color-primary)' : 'var(--color-bg-primary)',
                color: genderFilter === g ? 'var(--color-bg-primary)' : 'var(--color-text-primary)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {/* 5. PEOPLE CARDS LIST (MATCHING REFERENCE IMAGE) */}
      {isLoading ? (
        <LeadCardSkeleton count={5} />
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 16px',
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '18px',
          border: '1px dashed var(--color-border)'
        }}>
          <Users size={36} style={{ color: 'var(--color-text-secondary)', marginBottom: '8px', opacity: 0.5 }} />
          <p style={{ fontWeight: 700, fontSize: '15px' }}>No people found</p>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '12.5px', marginTop: '4px' }}>
            Tap the + button below to add someone to the directory.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '70px' }}>
          {paginated.map(c => (
            <div
              key={c.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                backgroundColor: 'var(--color-bg-primary)',
                borderRadius: '16px',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                {/* Circular Avatar with Initials */}
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '13.5px',
                  flexShrink: 0
                }}>
                  {getInitials(c.name)}
                </div>

                {/* Name & Role · Area */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.type} &bull; {c.location}
                  </div>
                </div>
              </div>

              {/* Action 3-dots Button */}
              <button
                onClick={() => setActiveActionCandidate(c)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-secondary)',
                  padding: '8px',
                  cursor: 'pointer',
                  borderRadius: '8px'
                }}
                title="Options"
              >
                <MoreHorizontal size={20} />
              </button>
            </div>
          ))}

          {/* Pagination bar */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', marginTop: '12px' }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg-primary)',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.4 : 1
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg-primary)',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.4 : 1
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* 6. FLOATING ACTION BUTTON (FAB) (+) */}
      <button
        onClick={handleOpenAdd}
        style={{
          position: 'fixed',
          bottom: 'calc(76px + env(safe-area-inset-bottom))',
          right: '20px',
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-primary)',
          color: 'var(--color-bg-primary)',
          border: 'none',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 1500
        }}
        title="Add Person"
      >
        <Plus size={24} />
      </button>

      {/* PERSON CONTEXT ACTION SHEET (Tapped •••) */}
      {activeActionCandidate && (
        <div 
          className="modal-overlay" 
          onClick={() => setActiveActionCandidate(null)}
          style={{ zIndex: 3500 }}
        >
          <div 
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '420px', width: '100%', borderRadius: '24px 24px 0 0' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '14px'
              }}>
                {getInitials(activeActionCandidate.name)}
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                  {activeActionCandidate.name}
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {activeActionCandidate.type} &bull; {activeActionCandidate.phone}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* WhatsApp */}
              <button
                onClick={() => {
                  setWhatsAppCandidate(activeActionCandidate);
                  setActiveActionCandidate(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(37, 211, 102, 0.1)',
                  color: '#25D366',
                  border: '1px solid rgba(37, 211, 102, 0.25)',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  cursor: 'pointer'
                }}
              >
                <MessageCircle size={18} />
                <span>Message on WhatsApp</span>
              </button>

              {/* Direct Call */}
              <a
                href={`tel:${activeActionCandidate.phone.replace(/\D/g, '')}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  textDecoration: 'none'
                }}
              >
                <Phone size={18} />
                <span>Direct Phone Call</span>
              </a>

              {/* Edit */}
              <button
                onClick={() => handleEdit(activeActionCandidate)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  cursor: 'pointer'
                }}
              >
                <Edit3 size={18} />
                <span>Edit Lead Details</span>
              </button>

              {/* Delete */}
              <button
                onClick={() => handleDelete(activeActionCandidate)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={18} />
                <span>Delete from Directory</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT PERSON MODAL */}
      {isAddModalOpen && (
        <div 
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setIsAddModalOpen(false); }}
        >
          <div 
            className="modal-content"
            style={{ maxWidth: '460px', width: '100%' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                {editingCandidate ? 'Edit Person' : '+ Add to Directory'}
              </h2>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
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
                  ref={nameInputRef}
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Aarushi Sharma"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  autoFocus
                />
              </div>

              <div>
                <label className="form-label">Phone Number</label>
                <input 
                  type="tel" 
                  className="input-field" 
                  placeholder="e.g. 9876543210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label">Role / Category</label>
                  <select 
                    className="input-field"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option value="Volunteer">Volunteer</option>
                    <option value="Hostess">Hostess</option>
                    <option value="Manpower">Manpower</option>
                    <option value="Promoter">Promoter</option>
                    <option value="Technical">Technical</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Supervisor">Supervisor</option>
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

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                <button onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {!editingCandidate && (
                    <button 
                      type="button"
                      onClick={handleSaveAndAddAnother} 
                      className="btn btn-secondary"
                      style={{ fontWeight: 600, fontSize: '13px' }}
                    >
                      + Save & Add Another
                    </button>
                  )}
                  <button onClick={handleSave} className="btn btn-primary">
                    {editingCandidate ? 'Update' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Direct Messaging Modal */}
      <WhatsAppDirectModal
        isOpen={!!whatsAppCandidate}
        candidate={whatsAppCandidate}
        onClose={() => setWhatsAppCandidate(null)}
      />

    </div>
  );
}
