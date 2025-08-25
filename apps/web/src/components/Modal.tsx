"use client";
import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative bg-neutral-900 rounded-lg border border-neutral-700 shadow-xl ${sizeClasses[size]} w-full mx-4`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-700">
          <h2 className="text-lg font-semibold text-neutral-100">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-800 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

// Alert Modal Component
interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

export function AlertModal({ isOpen, onClose, title, message, type = 'info' }: AlertModalProps) {
  const typeStyles = {
    success: 'text-green-400',
    error: 'text-red-400',
    info: 'text-blue-400'
  };

  const typeIcons = {
    success: '✓',
    error: '✕',
    info: 'ℹ'
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex items-start gap-3">
        <div className={`text-xl ${typeStyles[type]}`}>
          {typeIcons[type]}
        </div>
        <div className="flex-1">
          <p className="text-neutral-300">{message}</p>
        </div>
      </div>
      <div className="flex justify-end mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-md font-medium transition-colors"
        >
          OK
        </button>
      </div>
    </Modal>
  );
}

// Confirm Modal Component
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info'
}: ConfirmModalProps) {
  const typeStyles = {
    danger: 'bg-red-600 hover:bg-red-500',
    warning: 'bg-amber-600 hover:bg-amber-500',
    info: 'bg-blue-600 hover:bg-blue-500'
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="mb-6">
        <p className="text-neutral-300">{message}</p>
      </div>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-neutral-100 rounded-md font-medium transition-colors"
        >
          {cancelText}
        </button>
        <button
          onClick={handleConfirm}
          className={`px-4 py-2 text-white rounded-md font-medium transition-colors ${typeStyles[type]}`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
