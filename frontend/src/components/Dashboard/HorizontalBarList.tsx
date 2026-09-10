import React from 'react';
import type { DistributionItem } from './types';

interface HorizontalBarListProps {
  items: DistributionItem[];
  selectedValue?: string;
  onSelect?: (value: string) => void;
  colorScheme?: 'cyan' | 'orange' | 'purple' | 'indigo' | 'emerald';
  scrollable?: boolean;
  maxHeight?: string;
  emptyMessage?: string;
}

export default function HorizontalBarList({
  items = [],
  selectedValue,
  onSelect,
  colorScheme = 'cyan',
  scrollable = false,
  maxHeight = 'max-h-80',
  emptyMessage = 'Sin datos para esta selección.',
}: HorizontalBarListProps) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-indigo-300/60 italic py-3">{emptyMessage}</p>;
  }

  const maxVal = Math.max(1, ...items.map((it) => it.count));

  const getGradient = () => {
    switch (colorScheme) {
      case 'orange':
        return 'from-[#FF6600] to-orange-400';
      case 'purple':
        return 'from-[#aa00ff] to-fuchsia-400';
      case 'indigo':
        return 'from-[#4f46e5] to-indigo-400';
      case 'emerald':
        return 'from-emerald-500 to-teal-400';
      case 'cyan':
      default:
        return 'from-[#00ccff] to-cyan-300';
    }
  };

  const getGlow = () => {
    switch (colorScheme) {
      case 'orange':
        return 'shadow-[0_0_10px_rgba(255,102,0,0.5)]';
      case 'purple':
        return 'shadow-[0_0_10px_rgba(170,0,255,0.5)]';
      case 'indigo':
        return 'shadow-[0_0_10px_rgba(79,70,229,0.5)]';
      case 'emerald':
        return 'shadow-[0_0_10px_rgba(16,185,129,0.5)]';
      case 'cyan':
      default:
        return 'shadow-[0_0_10px_rgba(0,204,255,0.5)]';
    }
  };

  return (
    <div className={`space-y-1.5 ${scrollable ? `overflow-y-auto pr-1 ${maxHeight} custom-scrollbar` : ''}`}>
      {items.map((item) => {
        const isSelected = selectedValue === item.name;
        const pct = Math.min(100, Math.max(2, (item.count / maxVal) * 100));

        return (
          <button
            key={item.name}
            type="button"
            onClick={() => onSelect && onSelect(item.name)}
            className={`w-full text-left rounded-lg px-2.5 py-1.5 transition-all flex flex-col gap-1 group ${
              isSelected
                ? 'bg-indigo-950/80 border border-brand-cyan/70 shadow-[0_0_12px_rgba(0,204,255,0.25)]'
                : 'hover:bg-indigo-900/40 border border-transparent'
            }`}
          >
            <div className="flex justify-between items-center text-xs">
              <span
                className={`truncate max-w-[75%] font-medium transition-colors ${
                  isSelected ? 'text-brand-cyan font-bold' : 'text-indigo-100 group-hover:text-white'
                }`}
                title={item.name}
              >
                {item.name}
              </span>
              <span className={`font-mono text-xs ${isSelected ? 'text-brand-cyan font-bold' : 'text-indigo-300'}`}>
                {item.count.toLocaleString('es-AR')}
              </span>
            </div>

            {/* Barra de progreso interactiva */}
            <div className="w-full h-2 bg-indigo-950/80 rounded-full overflow-hidden border border-indigo-800/40">
              <div
                style={{ width: `${pct}%` }}
                className={`h-full rounded-full bg-gradient-to-r ${getGradient()} transition-all duration-500 ${
                  isSelected ? getGlow() : ''
                }`}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
