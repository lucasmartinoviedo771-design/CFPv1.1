import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export interface AccordionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

export const Accordion: React.FC<AccordionProps> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-indigo-500/30 rounded-lg bg-indigo-950/20 overflow-hidden mb-2">
            <button
                className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
                type="button"
            >
                <span className="font-medium text-indigo-100">{title}</span>
                {isOpen ? <ChevronDown size={18} className="text-indigo-400" /> : <ChevronRight size={18} className="text-indigo-400" />}
            </button>
            {isOpen && <div className="p-4 border-t border-indigo-500/20 bg-black/20">{children}</div>}
        </div>
    );
};
