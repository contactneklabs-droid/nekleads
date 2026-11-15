import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Edit3, MessageCircle } from 'lucide-react';

export interface SwipeableLeadCardProps {
  id?: string;
  name: string;
  phone: string;
  type: string;
  location: string;
  gender?: string;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  onToggleSelect?: () => void;
  onLongPress?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onWhatsApp: () => void;
  getInitials: (name: string) => string;
}

export const getRoleColors = (type?: string) => {
  const t = (type || '').toLowerCase();
  if (t === 'hostess') {
    return {
      avatarBg: 'rgba(236, 72, 153, 0.14)',
      avatarBorder: 'rgba(236, 72, 153, 0.35)',
      color: '#db2777', // Pink
      badgeBg: 'rgba(236, 72, 153, 0.1)',
      badgeBorder: 'rgba(236, 72, 153, 0.25)'
    };
  }
  if (t === 'volunteer') {
    return {
      avatarBg: 'rgba(30, 64, 175, 0.14)',
      avatarBorder: 'rgba(30, 64, 175, 0.35)',
      color: '#1e40af', // Dark Blue
      badgeBg: 'rgba(30, 64, 175, 0.1)',
      badgeBorder: 'rgba(30, 64, 175, 0.25)'
    };
  }
  if (t === 'manpower') {
    return {
      avatarBg: 'var(--color-bg-secondary)',
      avatarBorder: 'var(--color-primary)',
      color: 'var(--color-primary)', // Black in light mode, White in dark mode
      badgeBg: 'var(--color-bg-secondary)',
      badgeBorder: 'var(--color-border)'
    };
  }
  // Default / Other
  return {
    avatarBg: 'var(--color-bg-secondary)',
    avatarBorder: 'var(--color-border)',
    color: 'var(--color-text-primary)',
    badgeBg: 'var(--color-bg-secondary)',
    badgeBorder: 'var(--color-border)'
  };
};

export const SwipeableLeadCard: React.FC<SwipeableLeadCardProps> = ({
  name,
  phone,
  type,
  location,
  isSelected = false,
  isSelectionMode = false,
  isOpen = false,
  onOpen,
  onClose,
  onToggleSelect,
  onLongPress,
  onEdit,
  onDelete,
  onWhatsApp,
  getInitials
}) => {
  const [translateX, setTranslateX] = useState(isOpen ? -136 : 0);
  const [isDragging, setIsDragging] = useState(false);

  const touchStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startTranslateX = useRef(0);
  const gestureDirection = useRef<'undecided' | 'horizontal' | 'vertical'>('undecided');
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTranslateX(isOpen ? -136 : 0);
  }, [isOpen]);

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    touchStartPos.current = { x: clientX, y: clientY };
    startTranslateX.current = translateX;
    gestureDirection.current = 'undecided';
    setIsDragging(true);

    longPressTimer.current = setTimeout(() => {
      onLongPress?.();
    }, 450);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const diffX = clientX - touchStartPos.current.x;
    const diffY = clientY - touchStartPos.current.y;

    if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
      clearLongPress();
    }

    if (gestureDirection.current === 'undecided') {
      if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 6) {
        gestureDirection.current = 'vertical';
        return;
      } else if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 6) {
        gestureDirection.current = 'horizontal';
      }
    }

    if (gestureDirection.current === 'horizontal') {
      const target = startTranslateX.current + diffX;
      if (target <= 0) {
        if (target >= -136) {
          setTranslateX(target);
        } else {
          // Rubber banding past -136px
          setTranslateX(-136 + (target + 136) * 0.2);
        }
      } else {
        // Rubber banding to right
        setTranslateX(target * 0.2);
      }
    }
  };

  const handleTouchEnd = () => {
    clearLongPress();
    setIsDragging(false);

    if (gestureDirection.current === 'horizontal') {
      if (translateX < -60) {
        // Snap open
        setTranslateX(-136);
        onOpen?.();
      } else {
        // Snap closed
        setTranslateX(0);
        onClose?.();
      }
    } else if (gestureDirection.current === 'undecided') {
      if (startTranslateX.current < -20) {
        // Tapped while open -> close
        setTranslateX(0);
        onClose?.();
      } else if (isSelectionMode) {
        onToggleSelect?.();
      }
    }

    gestureDirection.current = 'undecided';
  };

  const roleColors = getRoleColors(type);

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '16px',
        overflow: 'hidden',
        boxSizing: 'border-box',
        touchAction: 'pan-y',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        backgroundColor: 'var(--color-bg-secondary)',
        marginBottom: '2px'
      }}
    >
      {/* BACKGROUND ACTION DRAWER (Revealed upon swiping left) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: '136px',
          display: 'flex',
          zIndex: 1
        }}
      >
        {/* EDIT ACTION BUTTON */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setTranslateX(0);
            onClose?.();
            onEdit();
          }}
          aria-label={`Edit ${name}`}
          style={{
            flex: 1,
            backgroundColor: '#1e293b',
            color: '#FFFFFF',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            cursor: 'pointer',
            padding: 0
          }}
        >
          <Edit3 size={17} />
          <span style={{ fontSize: '11px', fontWeight: 700 }}>Edit</span>
        </button>

        {/* DELETE ACTION BUTTON */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setTranslateX(0);
            onClose?.();
            onDelete();
          }}
          aria-label={`Delete ${name}`}
          style={{
            flex: 1,
            backgroundColor: '#ef4444',
            color: '#FFFFFF',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            cursor: 'pointer',
            padding: 0
          }}
        >
          <Trash2 size={17} />
          <span style={{ fontSize: '11px', fontWeight: 700 }}>Delete</span>
        </button>
      </div>

      {/* FOREGROUND CARD SURFACE (Slides horizontally on swipe) */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        style={{
          position: 'relative',
          zIndex: 2,
          backgroundColor: 'var(--color-bg-primary)',
          border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
          borderRadius: '16px',
          padding: '12px 14px',
          boxSizing: 'border-box',
          boxShadow: isSelected ? '0 0 0 1px var(--color-primary)' : 'var(--shadow-sm)',
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: isSelectionMode ? 'pointer' : 'default'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          {/* Avatar Circle with Role-Based Theme */}
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: roleColors.avatarBg,
              border: `1.5px solid ${roleColors.avatarBorder}`,
              color: roleColors.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '13.5px',
              flexShrink: 0
            }}
          >
            {getInitials(name)}
          </div>

          {/* Name & Role · Location */}
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: '14.5px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {name}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
                marginTop: '2px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span style={{ fontWeight: 700, color: roleColors.color }}>{type}</span>
              <span>&bull;</span>
              <span>{location}</span>
              {phone && (
                <>
                  <span>&bull;</span>
                  <span style={{ opacity: 0.85 }}>{phone}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick WhatsApp Action (Direct 1-tap) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onWhatsApp();
          }}
          aria-label={`WhatsApp ${name}`}
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            color: '#10b981',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0
          }}
          title="Message on WhatsApp"
        >
          <MessageCircle size={18} />
        </button>
      </div>
    </div>
  );
};
