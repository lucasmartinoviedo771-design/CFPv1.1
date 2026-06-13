import React from "react";
import { CheckCircle } from "lucide-react";

export interface CheckboxProps {
    checked: boolean;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    label: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ checked, onChange, disabled, label }) => (
    <label className={`flex items-center gap-3 p-2 rounded transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5 cursor-pointer'}`}>
        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${checked ? 'bg-brand-accent border-brand-accent' : 'border-indigo-500/50 bg-indigo-950/30'}`}>
            {checked && <CheckCircle size={14} className="text-white" />}
        </div>
        <input type="checkbox" className="hidden" checked={checked} onChange={onChange} disabled={disabled} />
        <span className={`text-sm ${checked ? 'text-white font-medium' : 'text-indigo-300'}`}>{label}</span>
    </label>
);
