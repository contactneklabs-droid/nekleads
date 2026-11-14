import React, { useState, useMemo } from 'react';
import { Search, X, Users, MapPin, Phone, Check } from 'lucide-react';
import { Candidate } from '../lib/db';

interface CandidatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: Candidate[];
  selectedId: string;
  onSelect: (candidate: Candidate) => void;
}

export const CandidatePickerModal: React.FC<CandidatePickerModalProps> = ({
  isOpen,
  onClose,
  candidates,
  selectedId,
  onSelect
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Hostess' | 'Volunteer' | 'Manpower' | 'Promoter'>('All');

  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const matchType = typeFilter === 'All' ? true : c.type?.toLowerCase() === typeFilter.toLowerCase();
      if (!matchType) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.location && c.location.toLowerCase().includes(q))
      );
    });
  }, [candidates, search, typeFilter]);

  if (!isOpen) return null;

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase() || 'C';
  };

  const getTypeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'hostess': return '#EC4899';
      case 'volunteer': return '#3B82F6';
      case 'manpower': return '#F59E0B';
      case 'promoter': return '#10B981';
      default: return 'var(--color-primary)';
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 2500,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center'
      }}
    >
      <div
        className="modal-content"
        style={{
          width: '100%',
          maxWidth: '540px',
          maxHeight: '88vh',
          backgroundColor: 'var(--color-bg-primary)',
          borderTop: '1px solid var(--color-border)',
          borderRadius: '24px 24px 0 0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
          animation: 'slideUpSheet 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Grab Handle */}
        <div style={{ padding: '12px 0 4px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--color-border)' }} />
        </div>

        {/* Header */}
        <div style={{ padding: '12px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'Outfit, sans-serif', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} />
              <span>Choose Recipient</span>
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
              {candidates.length} leads in directory
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Search Input */}
        <div style={{ padding: '12px 20px 8px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
            <input
              type="text"
              autoFocus
              className="input-field"
              placeholder="Search by name, phone, or area..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '38px', paddingRight: search ? '36px' : '14px', fontSize: '14px', height: '44px' }}
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
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '6px', padding: '0 20px 12px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {(['All', 'Hostess', 'Volunteer', 'Manpower', 'Promoter'] as const).map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: typeFilter === type ? 'var(--color-primary)' : 'var(--color-border)',
                backgroundColor: typeFilter === type ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                color: typeFilter === type ? 'var(--color-bg-primary)' : 'var(--color-text-secondary)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Candidates List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 24px', WebkitOverflowScrolling: 'touch' }}>
          {filteredCandidates.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
              No candidates found matching "{search}"
            </div>
          ) : (
            filteredCandidates.map(c => {
              const isSelected = c.id === selectedId;
              const typeColor = getTypeColor(c.type);
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelect(c);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    margin: '4px 0',
                    borderRadius: '14px',
                    backgroundColor: isSelected ? 'rgba(37, 211, 102, 0.08)' : 'var(--color-bg-secondary)',
                    border: '1px solid',
                    borderColor: isSelected ? '#25D366' : 'var(--color-border)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-bg-primary)',
                        border: `1.5px solid ${typeColor}`,
                        color: typeColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '12px',
                        flexShrink: 0
                      }}
                    >
                      {getInitials(c.name)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-primary)' }}>
                        {c.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        <span style={{
                          padding: '1px 6px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--color-bg-primary)',
                          border: '1px solid var(--color-border)',
                          fontWeight: 600,
                          color: typeColor
                        }}>
                          {c.type || 'Lead'}
                        </span>
                        {c.location && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <MapPin size={10} /> {c.location}
                          </span>
                        )}
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Phone size={10} /> {c.phone}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#25D366', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={14} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
