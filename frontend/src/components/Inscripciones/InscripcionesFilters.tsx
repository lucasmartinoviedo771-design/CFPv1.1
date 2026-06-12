import React from "react";
import { Search } from "lucide-react";

interface InscripcionesFiltersProps {
    filterListProgramaName: string;
    filterListBloqueName: string;
    filterListModuloName: string;
    filterListCohorteName: string;
    filterListEstado: string;
    inscripcionSearch: string;
    tableProgramaOpts: string[];
    tableBloqueOpts: string[];
    tableModuloOpts: string[];
    tableCohorteOpts: string[];
    onFilterChange: (updates: {
        filterListProgramaName?: string;
        filterListBloqueName?: string;
        filterListModuloName?: string;
        filterListCohorteName?: string;
        filterListEstado?: string;
        inscripcionSearch?: string;
    }) => void;
}

export const InscripcionesFilters: React.FC<InscripcionesFiltersProps> = ({
    filterListProgramaName,
    filterListBloqueName,
    filterListModuloName,
    filterListCohorteName,
    filterListEstado,
    inscripcionSearch,
    tableProgramaOpts,
    tableBloqueOpts,
    tableModuloOpts,
    tableCohorteOpts,
    onFilterChange,
}) => {
    return (
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <h2 className="text-xl font-bold text-white whitespace-nowrap">Inscripciones Existentes</h2>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto overflow-x-auto text-sm">
                <select
                    value={filterListProgramaName}
                    onChange={(e) => {
                        onFilterChange({
                            filterListProgramaName: e.target.value,
                            filterListBloqueName: "",
                            filterListModuloName: "",
                            filterListCohorteName: "",
                        });
                    }}
                    className="bg-indigo-950/50 border border-indigo-500/30 text-white rounded px-2 py-1.5 focus:outline-none focus:border-brand-accent transition-colors min-w-[120px]"
                >
                    <option value="">Todos los Programas</option>
                    {tableProgramaOpts.map((name) => (
                        <option key={name} value={name}>
                            {name}
                        </option>
                    ))}
                </select>
                <select
                    value={filterListBloqueName}
                    onChange={(e) => {
                        onFilterChange({
                            filterListBloqueName: e.target.value,
                            filterListModuloName: "",
                            filterListCohorteName: "",
                        });
                    }}
                    className="bg-indigo-950/50 border border-indigo-500/30 text-white rounded px-2 py-1.5 focus:outline-none focus:border-brand-accent transition-colors min-w-[120px]"
                >
                    <option value="">Todos los Bloques</option>
                    {tableBloqueOpts.map((name) => (
                        <option key={name} value={name}>
                            {name}
                        </option>
                    ))}
                </select>
                <select
                    value={filterListModuloName}
                    onChange={(e) => {
                        onFilterChange({
                            filterListModuloName: e.target.value,
                            filterListCohorteName: "",
                        });
                    }}
                    className="bg-indigo-950/50 border border-indigo-500/30 text-white rounded px-2 py-1.5 focus:outline-none focus:border-brand-accent transition-colors min-w-[120px]"
                >
                    <option value="">Todos los Módulos</option>
                    {tableModuloOpts.map((name) => (
                        <option key={name} value={name}>
                            {name}
                        </option>
                    ))}
                </select>
                <select
                    value={filterListCohorteName}
                    onChange={(e) => {
                        onFilterChange({
                            filterListCohorteName: e.target.value,
                        });
                    }}
                    className="bg-indigo-950/50 border border-indigo-500/30 text-white rounded px-2 py-1.5 focus:outline-none focus:border-brand-accent transition-colors min-w-[120px]"
                >
                    <option value="">Todas las Cohortes</option>
                    {tableCohorteOpts.map((name) => (
                        <option key={name} value={name}>
                            {name}
                        </option>
                    ))}
                </select>
                <select
                    value={filterListEstado}
                    onChange={(e) => {
                        onFilterChange({
                            filterListEstado: e.target.value,
                        });
                    }}
                    className="bg-indigo-950/50 border border-indigo-500/30 text-white rounded px-2 py-1.5 focus:outline-none focus:border-brand-accent transition-colors min-w-[120px]"
                >
                    <option value="">Todos los Estados</option>
                    {["PREINSCRIPTO", "CURSANDO", "INACTIVO", "LIBRE", "PAUSADO", "EGRESADO", "APROBADO", "DESAPROBADO"].map((e) => (
                        <option key={e} value={e}>
                            {e}
                        </option>
                    ))}
                </select>
                <div className="relative min-w-[150px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-indigo-400">
                        <Search size={16} />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar inscripción..."
                        value={inscripcionSearch}
                        onChange={(e) => {
                            onFilterChange({
                                inscripcionSearch: e.target.value,
                            });
                        }}
                        className="bg-indigo-950/50 border border-indigo-500/30 text-white rounded w-full pl-9 pr-3 py-1.5 focus:outline-none focus:border-brand-accent transition-colors"
                    />
                </div>
            </div>
        </div>
    );
};
