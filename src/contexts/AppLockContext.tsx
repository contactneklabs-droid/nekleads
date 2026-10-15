import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Lock, Delete, AlertCircle } from 'lucide-react';

interface AppLockContextType {
  isEnabled: boolean;
  isLocked: boolean;
  enableLock: (pin: string) => boolean;
  disableLock: (currentPin: string) => boolean;
  changePin: (oldPin: string, newPin: string) => boolean;
  lockNow: () => void;
  unlock: (pin: string) => boolean;
}

const AppLockContext = createContext<AppLockContextType | undefined>(undefined);

const STORAGE_KEY_ENABLED = 'nek_app_lock_enabled';
const STORAGE_KEY_PIN = 'nek_app_lock_pin';
const SESSION_KEY_UNLOCKED = 'nek_app_lock_session_unlocked';

export const AppLockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY_ENABLED) === 'true';
  });

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const enabled = localStorage.getItem(STORAGE_KEY_ENABLED) === 'true';
    const unlocked = sessionStorage.getItem(SESSION_KEY_UNLOCKED) === 'true';
    return enabled && !unlocked;
  });

  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const enableLock = useCallback((pin: string): boolean => {
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) return false;
    localStorage.setItem(STORAGE_KEY_PIN, pin);
    localStorage.setItem(STORAGE_KEY_ENABLED, 'true');
    sessionStorage.setItem(SESSION_KEY_UNLOCKED, 'true');
    setIsEnabled(true);
    setIsLocked(false);
    return true;
  }, []);

  const disableLock = useCallback((currentPin: string): boolean => {
    const savedPin = localStorage.getItem(STORAGE_KEY_PIN);
    if (savedPin !== currentPin) return false;
    localStorage.removeItem(STORAGE_KEY_PIN);
    localStorage.setItem(STORAGE_KEY_ENABLED, 'false');
    sessionStorage.removeItem(SESSION_KEY_UNLOCKED);
    setIsEnabled(false);
    setIsLocked(false);
    return true;
  }, []);

  const changePin = useCallback((oldPin: string, newPin: string): boolean => {
    const savedPin = localStorage.getItem(STORAGE_KEY_PIN);
    if (savedPin !== oldPin) return false;
    if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) return false;
    localStorage.setItem(STORAGE_KEY_PIN, newPin);
    return true;
  }, []);

  const lockNow = useCallback(() => {
    if (!isEnabled) return;
    sessionStorage.removeItem(SESSION_KEY_UNLOCKED);
    setEnteredPin('');
    setPinError(false);
    setIsLocked(true);
  }, [isEnabled]);

  const unlock = useCallback((pin: string): boolean => {
    const savedPin = localStorage.getItem(STORAGE_KEY_PIN);
    if (savedPin && pin === savedPin) {
      sessionStorage.setItem(SESSION_KEY_UNLOCKED, 'true');
      setIsLocked(false);
      setEnteredPin('');
      setPinError(false);
      return true;
    }
    return false;
  }, []);

  // Handle keypad digit input on Lock Screen
  const handleDigitPress = useCallback((digit: string) => {
    if (enteredPin.length >= 4) return;
    const nextPin = enteredPin + digit;
    setEnteredPin(nextPin);
    setPinError(false);

    if (nextPin.length === 4) {
      const savedPin = localStorage.getItem(STORAGE_KEY_PIN);
      if (savedPin === nextPin) {
        sessionStorage.setItem(SESSION_KEY_UNLOCKED, 'true');
        setTimeout(() => {
          setIsLocked(false);
          setEnteredPin('');
        }, 150);
      } else {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([60, 40, 60]);
        }
        setPinError(true);
        setIsShaking(true);
        setTimeout(() => {
          setIsShaking(false);
          setEnteredPin('');
        }, 600);
      }
    }
  }, [enteredPin]);

  const handleDeletePress = useCallback(() => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setPinError(false);
  }, []);

  // Physical keyboard support for PIN entry
  useEffect(() => {
    if (!isLocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDeletePress();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, handleDigitPress, handleDeletePress]);

  return (
    <AppLockContext.Provider
      value={{
        isEnabled,
        isLocked,
        enableLock,
        disableLock,
        changePin,
        lockNow,
        unlock
      }}
    >
      {children}

      {/* FULL-SCREEN LOCK SCREEN OVERLAY */}
      {isLocked && (
        <div
          id="app-lock-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)',
            zIndex: 99990,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '48px 24px calc(36px + env(safe-area-inset-bottom)) 24px',
            boxSizing: 'border-box',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            fontFamily: "'Inter', sans-serif"
          }}
        >
          {/* Header branding */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '13px',
                fontWeight: 800,
                letterSpacing: '3px',
                textTransform: 'uppercase',
                color: 'var(--color-text-secondary)',
                marginBottom: '4px'
              }}
            >
              NEK LEADS
            </div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: 'var(--color-text-secondary)',
                opacity: 0.7
              }}
            >
              SECURITY LOCK
            </div>
          </div>

          {/* Center: Passcode prompt and dots */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              maxWidth: '320px'
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <Lock size={24} strokeWidth={2} style={{ color: 'var(--color-text-primary)' }} />
            </div>

            <h1
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '22px',
                fontWeight: 800,
                letterSpacing: '-0.5px',
                color: 'var(--color-text-primary)',
                marginBottom: '6px'
              }}
            >
              Enter Passcode
            </h1>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--color-text-secondary)',
                textAlign: 'center',
                marginBottom: '28px'
              }}
            >
              Your event database is secured
            </p>

            {/* 4 PIN Dots */}
            <div
              style={{
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                transform: isShaking ? 'translateX(-8px)' : 'none',
                transition: 'transform 0.08s ease'
              }}
            >
              {[0, 1, 2, 3].map((index) => {
                const isFilled = enteredPin.length > index;
                return (
                  <div
                    key={index}
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: isFilled ? 'var(--color-primary)' : 'transparent',
                      border: `2px solid ${isFilled ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                      transform: isFilled ? 'scale(1.15)' : 'scale(1)'
                    }}
                  />
                );
              })}
            </div>

            {/* Error Message */}
            <div
              style={{
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                color: 'var(--color-danger)',
                fontSize: '12px',
                fontWeight: 600,
                opacity: pinError ? 1 : 0,
                transition: 'opacity 0.2s ease'
              }}
            >
              <AlertCircle size={14} /> Incorrect Passcode
            </div>
          </div>

          {/* Bottom: Numeric Touch Keypad */}
          <div
            style={{
              width: '100%',
              maxWidth: '300px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '14px',
              justifyItems: 'center'
            }}
          >
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleDigitPress(num)}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                  fontSize: '24px',
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background-color 0.1s, transform 0.1s',
                  boxShadow: 'var(--shadow-sm)'
                }}
                onPointerDown={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-border)';
                  e.currentTarget.style.transform = 'scale(0.94)';
                }}
                onPointerUp={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                onPointerLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {num}
              </button>
            ))}

            {/* Bottom row: Empty, 0, Backspace */}
            <div style={{ width: '64px', height: '64px' }} />

            <button
              type="button"
              onClick={() => handleDigitPress('0')}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                fontSize: '24px',
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.1s, transform 0.1s',
                boxShadow: 'var(--shadow-sm)'
              }}
              onPointerDown={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-border)';
                e.currentTarget.style.transform = 'scale(0.94)';
              }}
              onPointerUp={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onPointerLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              0
            </button>

            <button
              type="button"
              onClick={handleDeletePress}
              aria-label="Delete digit"
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'transform 0.1s'
              }}
              onPointerDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.9)';
              }}
              onPointerUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onPointerLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Delete size={22} />
            </button>
          </div>
        </div>
      )}
    </AppLockContext.Provider>
  );
};

export const useAppLock = (): AppLockContextType => {
  const context = useContext(AppLockContext);
  if (!context) {
    throw new Error('useAppLock must be used within AppLockProvider');
  }
  return context;
};
