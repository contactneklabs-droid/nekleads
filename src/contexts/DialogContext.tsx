import React, { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';

export interface AlertOptions {
  title: string;
  message: string;
  buttonText?: string;
}

export interface DialogOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface DialogContextType {
  showAlert: (options: AlertOptions) => Promise<void>;
  confirm: (options: DialogOptions) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

interface AlertState extends AlertOptions {
  resolve: () => void;
}

interface ConfirmState extends DialogOptions {
  resolve: (value: boolean) => void;
}

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alertState, setAlertState] = useState<AlertState | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const showAlert = useCallback((options: AlertOptions): Promise<void> => {
    // Native haptic feedback if supported on device
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(20); } catch (_) {}
    }
    return new Promise((resolve) => {
      setAlertState({
        ...options,
        buttonText: options.buttonText || 'OK',
        resolve,
      });
    });
  }, []);

  const confirm = useCallback((options: DialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        ...options,
        resolve,
      });
    });
  }, []);

  const closeAlert = useCallback(() => {
    if (alertState) {
      alertState.resolve();
      setAlertState(null);
    }
  }, [alertState]);

  const handleConfirmResult = useCallback((val: boolean) => {
    if (confirmState) {
      confirmState.resolve(val);
      setConfirmState(null);
    }
  }, [confirmState]);

  // Handle Enter / Escape keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (alertState && (e.key === 'Enter' || e.key === 'Escape')) {
        e.preventDefault();
        closeAlert();
      } else if (confirmState) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleConfirmResult(true);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          handleConfirmResult(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [alertState, confirmState, closeAlert, handleConfirmResult]);

  return (
    <DialogContext.Provider value={{ showAlert, confirm }}>
      {children}

      {/* Apple iOS Native Alert Modal */}
      {alertState && (
        <div className="apple-alert-overlay" onClick={closeAlert} role="dialog" aria-modal="true">
          <div className="apple-alert-card" onClick={(e) => e.stopPropagation()}>
            <div className="apple-alert-content">
              <h3 className="apple-alert-title">{alertState.title}</h3>
              <p className="apple-alert-message">{alertState.message}</p>
            </div>
            <div className="apple-alert-actions">
              <button 
                type="button" 
                className="apple-alert-btn apple-alert-btn-default"
                onClick={closeAlert}
                autoFocus
              >
                {alertState.buttonText || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apple iOS Native Confirm Dialog */}
      {confirmState && (
        <div className="apple-alert-overlay" onClick={() => handleConfirmResult(false)} role="dialog" aria-modal="true">
          <div className="apple-alert-card" onClick={(e) => e.stopPropagation()}>
            <div className="apple-alert-content">
              <h3 className="apple-alert-title">{confirmState.title}</h3>
              <p className="apple-alert-message">{confirmState.description}</p>
            </div>
            <div className="apple-alert-actions apple-alert-actions-split">
              <button 
                type="button" 
                className="apple-alert-btn apple-alert-btn-cancel"
                onClick={() => handleConfirmResult(false)}
              >
                {confirmState.cancelLabel || 'Cancel'}
              </button>
              <button 
                type="button" 
                className={`apple-alert-btn ${confirmState.destructive ? 'apple-alert-btn-destructive' : 'apple-alert-btn-confirm'}`}
                onClick={() => handleConfirmResult(true)}
                autoFocus
              >
                {confirmState.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) throw new Error('useDialog must be used within DialogProvider');
  return context;
};
