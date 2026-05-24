import React from 'react';

interface ModalOverlayProps {
  children: React.ReactNode;
  onClose?: () => void;
  maxWidth?: string;
}

/**
 * Overlay de modal con fondo oscuro y animación de entrada.
 * Centraliza el patrón de overlay+card usado en CRUD y ComercialDashboard.
 */
export const ModalOverlay: React.FC<ModalOverlayProps> = ({
  children,
  onClose,
  maxWidth = 'max-w-lg',
}) => {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl ${maxWidth} w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95`}
      >
        {children}
      </div>
    </div>
  );
};

/* Subcomponentes para estructura interna del modal */

export const ModalHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-6 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10">
    {children}
  </div>
);

export const ModalBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`p-6 space-y-5 ${className}`}>{children}</div>;

export const ModalFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-4 sm:p-6 border-t border-gray-100 bg-white flex flex-wrap justify-end gap-2 sm:gap-3 sticky bottom-0">
    {children}
  </div>
);
