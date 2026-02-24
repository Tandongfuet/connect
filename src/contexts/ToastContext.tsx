
import React, { createContext, useState, useContext, useCallback, useMemo } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
  className?: string;
}

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
  actions?: ToastAction[];
}

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (message: string, type: ToastType, actions?: ToastAction[]) => void;
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  const addToast = useCallback((message: string, type: ToastType, actions?: ToastAction[]) => {
    const id = Date.now() + Math.random(); // Add random to prevent key collision on rapid calls
    setToasts(prevToasts => [...prevToasts, { id, message, type, actions }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const value = useMemo(() => ({
    toasts,
    addToast,
    removeToast,
  }), [toasts, addToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
