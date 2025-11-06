import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
  title?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-cream dark:bg-gray-blue rounded-lg shadow-xl p-6 w-full max-w-md m-4 text-gray-blue dark:text-cream relative"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className="text-2xl font-bold mb-4 font-serif">{title}</h2>}
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 text-2xl hover:text-gold dark:hover:text-gold-dark">&times;</button>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
};
