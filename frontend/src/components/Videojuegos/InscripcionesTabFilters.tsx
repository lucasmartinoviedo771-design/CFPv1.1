import React from "react";
import { Search, Plus } from "lucide-react";
import { Cohorte } from "./InscripcionesTabTypes";

export interface InscripcionesTabFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  filterCohorte: string;
  onFilterCohorteChange: (val: string) => void;
  filterEstado: string;
  onFilterEstadoChange: (val: string) => void;
  cohortes: Cohorte[];
  onAddClick: () => void;
}

export default function InscripcionesTabFilters({
  search,
  onSearchChange,
  filterCohorte,
  onFilterCohorteChange,
  filterEstado,
  onFilterEstadoChange,
  cohortes,
  onAddClick,
}: InscripcionesTabFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex flex-col sm:flex-row gap-3 flex-grow max-w-3xl">
        <div className="relative flex-grow">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por alumno, DNI o módulo..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#0c122c]/50 border border-indigo-500/10 backdrop-blur-xl text-white placeholder-indigo-400 text-sm font-semibold focus:border-[#00ccff]/70 focus:ring-1 focus:ring-[#00ccff]/20 focus:outline-none transition-all"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterCohorte}
            onChange={(e) => onFilterCohorteChange(e.target.value)}
            className="px-4 py-3 rounded-2xl bg-[#0c122c]/50 border border-indigo-500/10 backdrop-blur-xl text-white text-sm font-bold focus:border-[#00ccff]/70 focus:outline-none transition-all"
          >
            <option value="" className="bg-[#0c122c] text-white">Todas las Cohortes</option>
            {cohortes.map(c => (
              <option key={c.id} value={c.id} className="bg-[#0c122c] text-white">{c.nombre}</option>
            ))}
          </select>

          <select
            value={filterEstado}
            onChange={(e) => onFilterEstadoChange(e.target.value)}
            className="px-4 py-3 rounded-2xl bg-[#0c122c]/50 border border-indigo-500/10 backdrop-blur-xl text-white text-sm font-bold focus:border-[#00ccff]/70 focus:outline-none transition-all"
          >
            <option value="" className="bg-[#0c122c] text-white">Todos los Estados</option>
            {["PREINSCRIPTO", "CURSANDO", "INACTIVO", "LIBRE", "PAUSADO", "EGRESADO", "APROBADO", "DESAPROBADO"].map(st => (
              <option key={st} value={st} className="bg-[#0c122c] text-white">{st}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={onAddClick}
        className="flex-shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-cyan to-brand-accent text-[#050814] font-black text-xs uppercase tracking-widest transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] hover:scale-[1.02] active:scale-95"
      >
        <Plus size={15} /> Registrar Inscripción
      </button>
    </div>
  );
}
