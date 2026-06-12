import React from "react";
import { createPortal } from "react-dom";

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    actions: React.ReactNode;
    maxWidthClass?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, actions, maxWidthClass = "max-w-lg" }) => {
    if (!isOpen) return null;
    if (typeof document === "undefined") return null;
    return createPortal((
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className={`bg-[#1e1b4b] border border-indigo-500/30 rounded-xl shadow-2xl w-full ${maxWidthClass}`}>
                <div className="p-6 border-b border-indigo-500/20"><h3 className="text-xl font-bold text-white">{title}</h3></div>
                <div className="p-6 text-gray-200 max-h-[75vh] overflow-y-auto">{children}</div>
                <div className="p-4 border-t border-indigo-500/20 flex justify-end gap-3 bg-indigo-950/30 rounded-b-xl">{actions}</div>
            </div>
        </div>
    ), document.body);
};
