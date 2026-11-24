import React, { useMemo } from 'react';
import { 
  Search, 
  Plus, 
  PhoneCall, 
  MessageCircle, 
  Trash2, 
  MapPin
} from 'lucide-react';
import { Candidate, deleteCandidate } from '../lib/db';
import { useDialog } from '../contexts/DialogContext';
import { useToast } from '../contexts/ToastContext';

interface DesktopPeopleProps {
  candidates: Candidate[];
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
  onOpenQuickAdd: () => void;
  onSelectLeadForWhatsApp: (candidate: Candidate) => void;
  onRefreshData: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const DesktopPeople: React.FC<DesktopPeopleProps> = ({
  candidates,
  selectedCategory,
  setSelectedCategory,
  onOpenQuickAdd,
  onSelectLeadForWhatsApp,
  onRefreshData,
  searchQuery,
  setSearchQuery
}) => {
  const { confirm } = useDialog();
  const { addToast } = useToast();

  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const matchCat = !selectedCategory || c.type === selectedCategory;
      const matchSearch = !searchQuery || 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        (c.location && c.location.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [candidates, selectedCategory, searchQuery]);

  const handleDelete = async (c: Candidate) => {
    const ok = await confirm({
      title: `Delete ${c.name}?`,
      description: `Are you sure you want to remove ${c.name} (${c.phone}) from your directory?`,
      confirmLabel: 'Delete Lead',
      destructive: true
    });

    if (ok) {
      deleteCandidate(c.id);
      addToast('success', `Deleted ${c.name}`);
      onRefreshData();
    }
  };

  return (
    <div className="desktop-main-pane">
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '13px', color: 'var(--desktop-text-muted)', marginBottom: '4px', fontWeight: 500 }}>
            NEK Leads / Directory
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0, letterSpacing: '-0.8px' }}>
            {selectedCategory ? `${selectedCategory}s Roster` : 'Leads & Crew Directory'}
          </h1>
        </div>

        <button
          onClick={onOpenQuickAdd}
          className="btn btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 700
          }}
        >
          <Plus size={15} />
          <span>Add Lead</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['All', 'Volunteer', 'Hostess', 'Manpower', 'Client'].map((cat) => {
            const isSelected = (!selectedCategory && cat === 'All') || selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === 'All' ? null : cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--desktop-border)',
                  backgroundColor: isSelected ? 'var(--desktop-text-primary)' : 'var(--desktop-card-bg)',
                  color: isSelected ? 'var(--desktop-card-bg)' : 'var(--desktop-text-secondary)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.12s ease'
                }}
              >
                {cat === 'All' ? `All (${candidates.length})` : cat}
              </button>
            );
          })}
        </div>

        <div className="desktop-search-input-wrap" style={{ width: '260px' }}>
          <Search size={14} color="var(--desktop-text-muted)" />
          <input 
            type="text"
            placeholder="Search by name, phone, area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '12.5px',
              color: 'var(--desktop-text-primary)',
              width: '100%'
            }}
          />
        </div>
      </div>

      {/* Desktop Table */}
      <div style={{
        backgroundColor: 'var(--desktop-card-bg)',
        border: '1px solid var(--desktop-border)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: 'var(--desktop-shadow-card)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{
              backgroundColor: 'var(--desktop-sidebar-bg)',
              borderBottom: '1px solid var(--desktop-border)',
              color: 'var(--desktop-text-muted)',
              fontSize: '11.5px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              <th style={{ padding: '12px 18px', width: '50px' }}>#</th>
              <th style={{ padding: '12px 18px' }}>Candidate Name</th>
              <th style={{ padding: '12px 18px' }}>10-Digit Phone</th>
              <th style={{ padding: '12px 18px' }}>Role / Category</th>
              <th style={{ padding: '12px 18px' }}>Location</th>
              <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCandidates.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--desktop-text-muted)' }}>
                  No leads found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredCandidates.map((c, idx) => (
                <tr 
                  key={c.id}
                  style={{
                    borderBottom: '1px solid var(--desktop-border)',
                    transition: 'background-color 0.1s ease'
                  }}
                  className="desktop-table-row"
                >
                  <td style={{ padding: '14px 18px', color: 'var(--desktop-text-muted)', fontWeight: 600 }}>
                    {idx + 1}
                  </td>

                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--desktop-accent-soft)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '13px',
                        color: 'var(--desktop-text-primary)'
                      }}>
                        {c.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--desktop-text-primary)' }}>{c.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--desktop-text-muted)' }}>{c.gender}</div>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontWeight: 600 }}>
                    {c.phone}
                  </td>

                  <td style={{ padding: '14px 18px' }}>
                    <span style={{
                      fontSize: '11.5px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor: 
                        c.type === 'Volunteer' ? 'rgba(59, 130, 246, 0.1)' :
                        c.type === 'Hostess' ? 'rgba(236, 72, 153, 0.1)' :
                        c.type === 'Manpower' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color:
                        c.type === 'Volunteer' ? '#3B82F6' :
                        c.type === 'Hostess' ? '#EC4899' :
                        c.type === 'Manpower' ? '#F59E0B' : '#10B981',
                    }}>
                      {c.type}
                    </span>
                  </td>

                  <td style={{ padding: '14px 18px', color: 'var(--desktop-text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} color="var(--desktop-text-muted)" />
                      <span>{c.location || 'Bangalore'}</span>
                    </div>
                  </td>

                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                      <button
                        onClick={() => {
                          const clean = c.phone.replace(/\D/g, '').slice(-10);
                          window.open(`tel:${clean}`, '_self');
                        }}
                        title="Direct Call"
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '6px',
                          border: '1px solid var(--desktop-border)',
                          background: 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: 'var(--desktop-text-primary)'
                        }}
                      >
                        <PhoneCall size={13} />
                      </button>

                      <button
                        onClick={() => onSelectLeadForWhatsApp(c)}
                        title="Direct WhatsApp"
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '6px',
                          border: '1px solid #10B981',
                          background: 'rgba(16, 185, 129, 0.08)',
                          color: '#10B981',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <MessageCircle size={13} />
                      </button>

                      <button
                        onClick={() => handleDelete(c)}
                        title="Delete"
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '6px',
                          border: '1px solid var(--desktop-border)',
                          background: 'transparent',
                          color: 'var(--desktop-text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
