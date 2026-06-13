import React from 'react';
import { ChevronRight } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  onClick?: () => void;
}

export default function KPICard({ title, value, icon: Icon, color, onClick }: KPICardProps) {
  return (
    <button 
      onClick={onClick}
      className={`w-full text-left relative overflow-hidden rounded-xl bg-indigo-900/20 border border-indigo-500/30 backdrop-blur-sm p-6 transition-all hover:bg-indigo-800/30 hover:scale-[1.02] active:scale-95 group ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-300 truncate group-hover:text-white transition-colors">{title}</p>
          <p className="mt-2 text-3xl font-extrabold text-white tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{value}</p>
        </div>
        <div className={`p-3 rounded-lg bg-white/5 border border-white/10 ${color.replace('text-', 'text-glow-')} group-hover:border-white/20 transition-all`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
      {onClick && (
        <div className="mt-4 flex items-center text-xs font-semibold text-indigo-400 group-hover:text-white transition-colors">
          Ver desglose <ChevronRight size={14} className="ml-1" />
        </div>
      )}
      <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-20 blur-2xl ${color.replace('text-', 'bg-')}`}></div>
    </button>
  );
}
