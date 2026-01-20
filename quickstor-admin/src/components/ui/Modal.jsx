import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

const Modal = ({ isOpen, onClose, title, children, className = '' }) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Render to body using Portal to avoid z-index/overflow issues from parent containers
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden relative animate-in zoom-in-95 duration-200 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white z-10">
          <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
          <button 
            onClick={onClose}
            // UPDATED: Added bg-gray-100 for light mode styling and adjusted hover states
            className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-0 relative">
          {children}
        </div>
      </div>
      
      {/* Backdrop click to close */}
      <div className="absolute inset-0 -z-10 cursor-pointer" onClick={onClose} />
    </div>,
    document.body
  );
};

export default Modal;