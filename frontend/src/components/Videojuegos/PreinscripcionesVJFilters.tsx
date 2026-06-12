import React from "react";
import { Search } from "lucide-react";

interface PreinscripcionesVJFiltersProps {
    search: string;
    onSearchChange: (val: string) => void;
    filtroEstado: string;
    onFiltroEstadoChange: (val: string) => void;
    estados: { value: string; label: string }[];
}

export const PreinscripcionesVJFilters: React.FC<PreinscripcionesVJFiltersProps> = ({
    search,
    onSearchChange,
    filtroEstado,
    onFiltroEstadoChange,
    estados,
}) => {
    return (
        <div className="flex flex-col sm:flex-row gap-4 relative z-10">
            <div className="relative flex-grow">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
                <input
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Buscar aspirante por nombre, DNI o email..."
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#0c122c]/50 border border-indigo-500/10 backdrop-blur-xl text-white placeholder-indigo-400 text-sm font-semibold focus:border-[#00ccff]/70 focus:ring-1 focus:ring-[#00ccff]/20 focus:outline-none transition-all"
                />
            </div>
            <div className="flex-shrink-0">
                <select
                    value={filtroEstado}
                    onChange={(e) => onFiltroEstadoChange(e.target.value)}
                    className="w-full sm:w-48 px-4 py-3.5 rounded-2xl bg-[#0c122c]/50 border border-indigo-500/10 backdrop-blur-xl text-white text-sm font-bold focus:border-[#00ccff]/70 focus:outline-none transition-all"
                >
                    {estados.map((e) => (
                        <option key={e.value} value={e.value} className="bg-[#0c122c] text-white">
                            {e.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};
