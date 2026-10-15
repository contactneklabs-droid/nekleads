import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Trash2, Edit3, CheckSquare, Square } from 'lucide-react';

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

export const SwipeableLeadCard: React.FC<SwipeableLeadCardProps> = ({
  name,
  phone,
  type,
  location,
  gender,
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
  const [translateX, setTranslateX] = useState(isOpen ? -140 : 0);
  const [isDragging, setIsDragging] = useState(false);
  const [isPressing, setIsPressing] = useState(false);

  const touchStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startTranslateX = useRef(0);
  const gestureDirection = useRef<'undecided' | 'horizontal' | 'vertical'>('undecided');
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasTriggeredLongPress = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      setTranslateX(0);
    } else {
      setTranslateX(-140);
    }
  }, [isOpen]);

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsPressing(false);
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    touchStartPos.current = { x: clientX, y: clientY };
    startTranslateX.current = translateX;
    gestureDirection.current = 'undecided';
    hasTriggeredLongPress.current = false;
    setIsDragging(true);
    setIsPressing(true);

    // iOS WhatsApp style long-press detection (450ms)
    longPressTimer.current = setTimeout(() => {
      hasTriggeredLongPress.current = true;
      setIsPressing(false);
      try {
        if ('vibrate' in navigator) {
          navigator.vibrate?.(45);
        }
      } catch (err) {
        // Safe fallback
      }
      onLongPress?.();
    }, 450);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const diffX = clientX - touchStartPos.current.x;
    const diffY = clientY - touchStartPos.current.y;

    // Movement threshold cancels long-press
    if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
      clearLongPress();
    }

    // Determine direction
    if (gestureDirection.current === 'undecided') {
      if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 6) {
        gestureDirection.current = 'vertical';
        return;
      } else if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 6) {
        gestureDirection.current = 'horizontal';
      }
    }

    if (gestureDirection.current === 'horizontal') {
      // Swiping horizontally
      const target = startTranslateX.current + diffX;
      if (target <= 0) {
        if (target >= -140) {
          setTranslateX(target);
        } else {
          // Rubber banding beyond -140px
          setTranslateX(-140 + (target + 140) * 0.22);
        }
      } else {
        // Rubber banding to the right
        setTranslateX(target * 0.18);
      }
    }
  };

  const handleTouchEnd = () => {
    clearLongPress();
    setIsDragging(false);

    if (hasTriggeredLongPress.current) {
      hasTriggeredLongPress.current = false;
      return;
    }

    if (gestureDirection.current === 'horizontal') {
      if (translateX < -65) {
        // Snap open
        setTranslateX(-140);
        try {
          if ('vibrate' in navigator) {
            navigator.vibrate?.(15);
          }
        } catch (e) {}
        onOpen?.();
      } else {
        // Snap closed
        setTranslateX(0);
        onClose?.();
      }
    } else if (gestureDirection.current === 'undecided') {
      // Clean tap without dragging
      if (startTranslateX.current < -20) {
        // Tapped while open -> close
        setTranslateX(0);
        onClose?.();
      } else if (isSelectionMode) {
        // Tapped in selection mode -> toggle
        onToggleSelect?.();
      }
    }

    gestureDirection.current = 'undecided';
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTranslateX(0);
    onClose?.();
    onEdit();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTranslateX(0);
    onClose?.();
    onDelete();
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onWhatsApp();
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect?.();
  };

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
        backgroundColor: 'var(--color-bg-secondary)'
      }}
    >
      {/* BACKGROUND ACTION DRAWER (Revealed upon swiping left) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: '140px',
          display: 'flex',
          zIndex: 1
        }}
      >
        {/* EDIT ACTION BUTTON */}
        <button
          onClick={handleEditClick}
          aria-label={`Edit ${name}`}
          style={{
            flex: 1,
            backgroundColor: '#2C2C2E',
            color: '#FFFFFF',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            cursor: 'pointer',
            padding: 0,
            transition: 'background-color 0.15s ease'
          }}
        >
          <Edit3 size={18} />
          <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.2px' }}>Edit</span>
        </button>

        {/* DELETE ACTION BUTTON */}
        <button
          onClick={handleDeleteClick}
          aria-label={`Delete ${name}`}
          style={{
            flex: 1,
            backgroundColor: '#FF3B30',
            color: '#FFFFFF',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            cursor: 'pointer',
            padding: 0,
            transition: 'background-color 0.15s ease'
          }}
        >
          <Trash2 size={18} />
          <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.2px' }}>Delete</span>
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
          padding: '16px',
          boxSizing: 'border-box',
          boxShadow: isSelected ? '0 0 0 1px var(--color-primary)' : 'var(--shadow-sm)',
          transform: `translateX(${translateX}px) scale(${isPressing ? 0.985 : 1})`,
          transition: isDragging ? 'transform 0.05s ease-out' : 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
          cursor: isSelectionMode ? 'pointer' : 'default'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, minWidth: 0 }}>
            {/* Checkbox (Tap or Long Press selects) */}
            <button
              onClick={handleCheckboxClick}
              aria-label={`Select candidate ${name}`}
              style={{
                background: 'none',
                border: 'none',
                color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                padding: 0,
                flexShrink: 0,
                cursor: 'pointer'
              }}
            >
              {isSelected ? <CheckSquare size={20} className="text-primary" /> : <Square size={20} />}
            </button>

            {/* Avatar Circle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-bg-primary)',
                fontWeight: 700,
                fontSize: '13px',
                flexShrink: 0
              }}
            >
              {getInitials(name)}
            </div>

            {/* Name and Phone */}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: '15px',
                  color: 'var(--color-text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {name}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '1px' }}>
                {phone}
              </div>
            </div>
          </div>

          {/* Quick WhatsApp Button (1-tap direct action) */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
            <button
              onClick={handleWhatsAppClick}
              aria-label={`WhatsApp ${name}`}
              style={{
                background: 'none',
                border: 'none',
                color: '#25D366',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                borderRadius: '50%'
              }}
            >
              <MessageCircle size={22} />
            </button>
          </div>
        </div>

        {/* Tags / Badges container */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            alignItems: 'center',
            borderTop: '1px solid var(--color-border)',
            paddingTop: '12px'
          }}
        >
          <span
            style={{
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              fontWeight: 600,
              color: 'var(--color-text-primary)'
            }}
          >
            {type}
          </span>
          {gender && (
            <span
              style={{
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)'
              }}
            >
              {gender}
            </span>
          )}
          <span
            style={{
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)'
            }}
          >
            📍 {location}
          </span>
        </div>
      </div>
    </div>
  );
};
