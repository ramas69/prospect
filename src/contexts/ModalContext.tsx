import { createContext, useContext, useState, ReactNode } from 'react';
import ConfirmModal from '../components/ConfirmModal';

interface ModalContextType {
  showAlert: (title: string, message: string, variant?: 'danger' | 'warning' | 'info') => void;
  showConfirm: (
    title: string, 
    message: string, 
    onConfirm: () => void, 
    variant?: 'danger' | 'warning' | 'info',
    confirmText?: string
  ) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'danger' | 'warning' | 'info';
    confirmText: string;
    showCancel: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'info',
    confirmText: 'OK',
    showCancel: true
  });

  const showAlert = (title: string, message: string, variant: 'danger' | 'warning' | 'info' = 'info') => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })),
      variant,
      confirmText: 'Compris',
      showCancel: false
    });
  };

  const showConfirm = (
    title: string, 
    message: string, 
    onConfirm: () => void, 
    variant: 'danger' | 'warning' | 'info' = 'info',
    confirmText: string = 'Confirmer'
  ) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      },
      variant,
      confirmText,
      showCancel: true
    });
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.showCancel ? 'Annuler' : undefined}
        variant={modalConfig.variant}
      />
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

