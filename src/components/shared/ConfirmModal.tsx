import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '../ui/button';
import { ModalOverlay, ModalHeader, ModalBody, ModalFooter } from './ModalOverlay';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  loading = false,
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
          bg: 'bg-red-50',
          btn: 'bg-red-600 hover:bg-red-700 text-white',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
          bg: 'bg-amber-50',
          btn: 'bg-amber-600 hover:bg-amber-700 text-white',
        };
      default:
        return {
          icon: <AlertTriangle className="w-6 h-6 text-blue-600" />,
          bg: 'bg-blue-50',
          btn: 'bg-blue-600 hover:bg-blue-700 text-white',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <ModalOverlay onClose={onClose} maxWidth="max-w-md">
      <div className="relative p-8">
        <button 
          onClick={onClose}
          className="absolute right-3 top-3 p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className={`p-4 rounded-full ${styles.bg} mb-6 animate-in zoom-in duration-300`}>
            {styles.icon}
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed px-2">
            {description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-10">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="font-bold h-11"
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button 
            onClick={onConfirm}
            className={`font-bold h-11 shadow-lg ${styles.btn}`}
            disabled={loading}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : confirmLabel}
          </Button>
        </div>
      </div>
    </ModalOverlay>
  );
};
