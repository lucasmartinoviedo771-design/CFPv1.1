import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function DashboardModal({ isOpen, onClose, title, children }: DashboardModalProps) {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0f172a] border border-indigo-500/30 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-indigo-500/20 flex justify-between items-center bg-indigo-950/40">
          <h3 className="text-2xl font-bold text-white">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-indigo-300 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <div className="p-8 overflow-y-auto custom-scrollbar bg-gradient-to-b from-indigo-950/20 to-transparent">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
