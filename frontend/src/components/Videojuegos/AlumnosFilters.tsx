import React from "react";
import { Search } from "lucide-react";
import { ESTADOS_ALUMNO } from "./AlumnosTab";

interface AlumnosFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  filtroEstado: string;
  onFiltroEstadoChange: (val: string) => void;
  filtroCohorte: string;
  onFiltroCohorteChange: (val: string) => void;
  cohortes: { id: number; nombre: string }[];
}

export function AlumnosFilters({
  search,
  onSearchChange,
  filtroEstado,
  onFiltroEstadoChange,
  filtroCohorte,
  onFiltroCohorteChange,
  cohortes,
}: AlumnosFiltersProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="relative flex-grow col-span-1 sm:col-span-1">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar alumno..."
          className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#0c122c]/50 border border-indigo-500/10 backdrop-blur-xl text-white placeholder-indigo-400 text-sm font-semibold focus:border-[#00ccff]/70 focus:outline-none transition-all"
        />
      </div>
      <div>
        <select
          value={filtroEstado}
          onChange={(e) => onFiltroEstadoChange(e.target.value)}
          className="w-full px-4 py-3.5 rounded-2xl bg-[#0c122c]/50 border border-indigo-500/10 backdrop-blur-xl text-white text-sm font-bold focus:border-[#00ccff]/70 focus:outline-none transition-all"
        >
          {ESTADOS_ALUMNO.map((e) => (
            <option key={e.value} value={e.value} className="bg-[#0c122c] text-white">
              {e.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <select
          value={filtroCohorte}
          onChange={(e) => onFiltroCohorteChange(e.target.value)}
          className="w-full px-4 py-3.5 rounded-2xl bg-[#0c122c]/50 border border-indigo-500/10 backdrop-blur-xl text-white text-sm font-bold focus:border-[#00ccff]/70 focus:outline-none transition-all"
        >
          <option value="" className="bg-[#0c122c] text-white">Todas las Cohortes</option>
          {cohortes.map((c) => (
            <option key={c.id} value={c.id} className="bg-[#0c122c] text-white">
              {c.nombre}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
