import React from 'react';
import { Users, UserCheck, Sparkles, Filter } from 'lucide-react';
import type { SexDistribution } from './types';

interface SexDistributionWidgetProps {
  data?: SexDistribution;
  selectedSex: string;
  onSelectSex: (sex: string) => void;
}

export default function SexDistributionWidget({
  data,
  selectedSex,
  onSelectSex,
}: SexDistributionWidgetProps) {
  if (!data) return null;

  const {
    mujeres = 0,
    varones = 0,
    otro = 0,
    sin_especificar = 0,
    total = 0,
    mujeres_pct = 0,
    varones_pct = 0,
  } = data;

  const otherTotal = otro + sin_especificar;
  const otherPct = total > 0 ? Number(((otherTotal / total) * 100).toFixed(1)) : 0;

  const handleToggle = (val: string) => {
    if (selectedSex === val) {
      onSelectSex('');
    } else {
      onSelectSex(val);
    }
  };

  return (
    <section className="bg-[#0a0033]/90 border border-indigo-500/30 rounded-2xl p-5 shadow-2xl backdrop-blur-md space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-6 rounded-full bg-gradient-to-b from-pink-500 to-brand-cyan shadow-[0_0_8px_rgba(236,72,153,0.5)]"></span>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
              Distribución por Sexo
              {selectedSex && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 normal-case flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Filtrado por {selectedSex}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-indigo-300/70">
              Personas únicas en la selección actual · Haz clic en cualquier tarjeta para cruzar los datos
            </p>
          </div>
        </div>

        {selectedSex && (
          <button
            type="button"
            onClick={() => onSelectSex('')}
            className="text-xs text-brand-cyan hover:underline font-semibold flex items-center gap-1"
          >
            Ver todos los sexos ×
          </button>
        )}
      </div>

      {/* TARJETAS INTERACTIVAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card: Mujeres */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleToggle('Mujeres')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleToggle('Mujeres');
            }
          }}
          className={`cursor-pointer rounded-xl p-4 transition-all duration-200 border text-left relative overflow-hidden ${
            selectedSex === 'Mujeres'
              ? 'bg-pink-950/60 border-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.35)] ring-2 ring-pink-500/50 scale-[1.02]'
              : 'bg-indigo-950/40 border-indigo-500/30 hover:border-pink-500/60 hover:bg-pink-950/20'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-pink-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              Mujeres
            </span>
            <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40">
              {mujeres_pct}%
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-white tracking-tight">
              {mujeres.toLocaleString('es-AR')}
            </span>
            <span className="text-[10px] text-pink-300/80 font-medium">
              {selectedSex === 'Mujeres' ? '● Filtro activo' : 'Pulsá p/ filtrar'}
            </span>
          </div>
        </div>

        {/* Card: Varones */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleToggle('Varones')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleToggle('Varones');
            }
          }}
          className={`cursor-pointer rounded-xl p-4 transition-all duration-200 border text-left relative overflow-hidden ${
            selectedSex === 'Varones'
              ? 'bg-sky-950/60 border-brand-cyan shadow-[0_0_20px_rgba(0,204,255,0.35)] ring-2 ring-brand-cyan/50 scale-[1.02]'
              : 'bg-indigo-950/40 border-indigo-500/30 hover:border-brand-cyan/60 hover:bg-sky-950/20'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-brand-cyan" />
              Varones
            </span>
            <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-brand-cyan/40">
              {varones_pct}%
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-white tracking-tight">
              {varones.toLocaleString('es-AR')}
            </span>
            <span className="text-[10px] text-cyan-300/80 font-medium">
              {selectedSex === 'Varones' ? '● Filtro activo' : 'Pulsá p/ filtrar'}
            </span>
          </div>
        </div>

        {/* Card: Otro / Sin especificar */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => (otherTotal > 0 ? handleToggle('Otro') : undefined)}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && otherTotal > 0) {
              e.preventDefault();
              handleToggle('Otro');
            }
          }}
          className={`rounded-xl p-4 transition-all duration-200 border text-left relative overflow-hidden ${
            otherTotal > 0 ? 'cursor-pointer' : 'cursor-default opacity-60'
          } ${
            selectedSex === 'Otro'
              ? 'bg-purple-950/60 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.35)] ring-2 ring-purple-500/50 scale-[1.02]'
              : 'bg-indigo-950/40 border-indigo-500/30 hover:border-purple-500/50'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
              Otro / Sin esp.
            </span>
            <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
              {otherPct}%
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-white tracking-tight">
              {otherTotal.toLocaleString('es-AR')}
            </span>
            <span className="text-[10px] text-purple-300/80 font-medium">
              {selectedSex === 'Otro' ? '● Filtro activo' : otherTotal > 0 ? 'Pulsá p/ filtrar' : 'Sin registros'}
            </span>
          </div>
        </div>

        {/* Card: Total Selección */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectSex('')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectSex('');
            }
          }}
          className={`cursor-pointer rounded-xl p-4 transition-all duration-200 border text-left relative overflow-hidden ${
            !selectedSex
              ? 'bg-indigo-900/40 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.25)]'
              : 'bg-indigo-950/40 border-indigo-500/30 hover:border-indigo-400 hover:bg-indigo-900/30'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-300" />
              Total Selección
            </span>
            <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-500/40">
              100%
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-white tracking-tight">
              {total.toLocaleString('es-AR')}
            </span>
            <span className="text-[10px] text-indigo-300/80 font-medium">
              {!selectedSex ? '● Todos los sexos' : 'Click p/ restablecer'}
            </span>
          </div>
        </div>
      </div>

      {/* BARRA PROPORCIONAL DE COMPOSICIÓN (VISUAL SPLIT) */}
      {total > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="h-3 w-full bg-indigo-950/80 rounded-full overflow-hidden flex border border-indigo-500/30 p-0.5">
            {mujeres_pct > 0 && (
              <div
                style={{ width: `${mujeres_pct}%` }}
                className="h-full bg-gradient-to-r from-pink-600 to-pink-400 rounded-l-full transition-all duration-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]"
                title={`Mujeres: ${mujeres.toLocaleString('es-AR')} (${mujeres_pct}%)`}
              />
            )}
            {otherPct > 0 && (
              <div
                style={{ width: `${otherPct}%` }}
                className="h-full bg-purple-500 transition-all duration-500"
                title={`Otro / Sin esp.: ${otherTotal.toLocaleString('es-AR')} (${otherPct}%)`}
              />
            )}
            {varones_pct > 0 && (
              <div
                style={{ width: `${varones_pct}%` }}
                className="h-full bg-gradient-to-r from-sky-500 to-brand-cyan rounded-r-full transition-all duration-500 shadow-[0_0_8px_rgba(0,204,255,0.5)]"
                title={`Varones: ${varones.toLocaleString('es-AR')} (${varones_pct}%)`}
              />
            )}
          </div>
          <div className="flex justify-between items-center text-[10px] text-indigo-300/80 font-mono px-1">
            <span className="flex items-center gap-1 text-pink-300">
              <span className="w-2 h-2 rounded-full bg-pink-500"></span> Mujeres: {mujeres.toLocaleString('es-AR')} ({mujeres_pct}%)
            </span>
            <span className="flex items-center gap-1 text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-brand-cyan"></span> Varones: {varones.toLocaleString('es-AR')} ({varones_pct}%)
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
