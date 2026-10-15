import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface DialogOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface DialogContextType {
  confirm: (options: DialogOptions) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    options: DialogOptions | null;
    resolve: ((value: boolean) => void) | null;
  }>({ isOpen: false, options: null, resolve: null });

  const confirm = useCallback((options: DialogOptions) => {
    return new Promise<boolean>((resolve) => {
      setDialogState({ isOpen: true, options, resolve });
    });
  }, []);

  const handleClose = (value: boolean) => {
    if (dialogState.resolve) {
      dialogState.resolve(value);
    }
    setDialogState({ isOpen: false, options: null, resolve: null });
  };

  return (
    <DialogContext.Provider value={{ confirm }}>
      {children}
      {dialogState.isOpen && dialogState.options && (
        <div 
          className="modal-overlay" 
          onClick={(e) => { if (e.target === e.currentTarget && !dialogState.options?.destructive) handleClose(false); }}
          onKeyDown={(e) => { if (e.key === 'Escape' && !dialogState.options?.destructive) handleClose(false); }}
        >
          <div className="modal-content" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2 className="page-title" style={{ marginBottom: '12px' }}>{dialogState.options.title}</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
              {dialogState.options.description}
            </p>
            <div className="flex justify-between items-center">
              <button 
                className="btn btn-secondary" 
                onClick={() => handleClose(false)}
              >
                {dialogState.options.cancelLabel || 'Cancel'}
              </button>
              <button 
                className={`btn ${dialogState.options.destructive ? 'btn-danger' : 'btn-primary'}`} 
                onClick={() => handleClose(true)}
              >
                {dialogState.options.confirmLabel || 'Confirm'}
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
