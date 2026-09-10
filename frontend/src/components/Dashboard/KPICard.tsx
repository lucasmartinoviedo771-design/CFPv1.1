import React from 'react';
import { ChevronRight } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  borderClass?: string;
  onClick?: () => void;
}

export default function KPICard({
  title,
  value,
  description,
  icon: Icon,
  color,
  borderClass,
  onClick,
}: KPICardProps) {
  const defaultBorder = 'border-indigo-500/30';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left relative overflow-hidden rounded-xl bg-[#0a0033]/80 border ${
        borderClass || defaultBorder
      } backdrop-blur-md p-5 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group shadow-xl ${
        onClick ? 'cursor-pointer hover:border-brand-cyan/60' : 'cursor-default'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider group-hover:text-white transition-colors">
            {title}
          </p>
          <p className="mt-1.5 text-3xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] font-mono">
            {typeof value === 'number' ? value.toLocaleString('es-AR') : value}
          </p>
          {description && (
            <p className="mt-1 text-[11px] text-indigo-300/70 truncate">{description}</p>
          )}
        </div>
        <div
          className={`p-3 rounded-lg bg-white/5 border border-white/10 ${color.replace(
            'text-',
            'text-glow-'
          )} group-hover:border-white/20 transition-all`}
        >
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
      {onClick && (
        <div className="mt-3 flex items-center text-xs font-semibold text-indigo-400 group-hover:text-white transition-colors">
          Ver desglose <ChevronRight size={14} className="ml-1" />
        </div>
      )}
      <div
        className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-20 blur-2xl ${color.replace(
          'text-',
          'bg-'
        )}`}
      ></div>
    </button>
  );
}
