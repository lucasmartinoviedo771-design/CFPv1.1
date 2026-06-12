import React from "react";
import { Search } from "lucide-react";
import { P } from "./AdminUI";

interface UsuariosFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  filtro: string;
  onFiltroChange: (val: string) => void;
}

export function UsuariosFilters({
  search,
  onSearchChange,
  filtro,
  onFiltroChange,
}: UsuariosFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-grow">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1a1f4e]/40" />
        <input value={search} onChange={e => onSearchChange(e.target.value)}
          placeholder="Buscar por nombre, usuario o email..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#b8ccd8] bg-white text-[#1a1f4e] text-sm focus:outline-none focus:ring-2 focus:ring-[#f5c518]" />
      </div>
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "terciario", label: "Con acceso Terciario" },
          { key: "ambos", label: "CFP + Terciario" },
          { key: "todos", label: "Todos los usuarios" },
        ].map(f => (
          <button key={f.key} onClick={() => onFiltroChange(f.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${filtro === f.key ? "text-[#1a1f4e] border-[#f5c518]" : "border-[#b8ccd8] text-[#1a1f4e]/60 hover:border-[#1a1f4e]/40"}`}
            style={filtro === f.key ? { background: P.yellow } : { background: "white" }}>
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
