
import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-500" 
        onClick={onClose}
      />
      <div className="relative bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] w-full max-w-3xl transform transition-all animate-in fade-in zoom-in duration-300">
        <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-white">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h3>
            <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-widest">Formulário de Entrada de Dados</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-900"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Overflow configurado como visible para não cortar portais se houver algum erro de cálculo */}
        <div className="px-10 pt-10 pb-6 max-h-[85vh] overflow-y-visible">
          {children}
        </div>
      </div>
    </div>
  );
};
