import React, { createContext, useContext, ReactNode, useCallback } from 'react';

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
  // Auto-resolve without popping up disruptive modal dialogs
  const confirm = useCallback((_options: DialogOptions) => {
    return Promise.resolve(true);
  }, []);

  return (
    <DialogContext.Provider value={{ confirm }}>
      {children}
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) throw new Error('useDialog must be used within DialogProvider');
  return context;
};
