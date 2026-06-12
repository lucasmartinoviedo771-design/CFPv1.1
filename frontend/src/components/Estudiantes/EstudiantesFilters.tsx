import React from "react";
import { FiltersState } from "../../pages/Estudiantes";
import { Programa, Bloque, Modulo, Cohorte } from "../../api/types";
import { Input, Select, Button } from "../UI";
import { Search, Briefcase, Download, Plus } from "lucide-react";

interface EstudiantesFiltersProps {
    filters: FiltersState;
    onFilterChange: (updates: Partial<FiltersState>) => void;
    programas: Programa[];
    bloques: Bloque[];
    modulos: Modulo[];
    cohortes: Cohorte[];
    onRefetch: () => void;
    onExport: () => void;
    onNewStudent: () => void;
}

export const EstudiantesFilters: React.FC<EstudiantesFiltersProps> = ({
    filters,
    onFilterChange,
    programas,
    bloques,
    modulos,
    cohortes,
    onRefetch,
    onExport,
    onNewStudent,
}) => {
    return (
        <div className="space-y-4 mb-6">
            {/* Panel de Búsqueda de Estudiante */}
            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Search size={14} /> Búsqueda de Estudiante
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="col-span-1 md:col-span-1">
                        <Input
                            placeholder="Nombre/Apellido"
                            value={filters.nombre_apellido}
                            name="nombre_apellido"
                            onChange={(e) => onFilterChange({ nombre_apellido: e.target.value })}
                            className="bg-indigo-950/30"
                        />
                    </div>
                    <Input
                        placeholder="DNI"
                        value={filters.dni}
                        name="dni"
                        onChange={(e) => onFilterChange({ dni: e.target.value })}
                        className="bg-indigo-950/30"
                    />
                    <Input
                        placeholder="Teléfono"
                        value={filters.telefono}
                        name="telefono"
                        onChange={(e) => onFilterChange({ telefono: e.target.value })}
                        className="bg-indigo-950/30"
                    />
                    <Select
                        value={filters.anio}
                        onChange={(e) => onFilterChange({ anio: e.target.value })}
                        options={[
                            { value: "", label: "Cualquier Año" },
                            { value: "2023", label: "2023" },
                            { value: "2024", label: "2024" },
                            { value: "2025", label: "2025" },
                            { value: "2026", label: "2026" },
                        ]}
                        className="bg-indigo-950/30"
                    />
                </div>
            </div>

            {/* Panel de Filtros Académicos / Reportes */}
            <div className="bg-brand-accent/5 border border-brand-accent/20 p-4 rounded-2xl shadow-lg shadow-brand-accent/5">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-3">
                    <p className="text-[10px] font-bold text-brand-accent uppercase tracking-widest flex items-center gap-2">
                        <Briefcase size={14} /> Filtros de Cursada / Reportes
                    </p>
                    <div className="flex gap-2">
                        <Button
                            onClick={onRefetch}
                            size="sm"
                            startIcon={<Search size={16} />}
                            className="bg-indigo-600 hover:bg-indigo-500 border-none px-4"
                        >
                            Filtrar
                        </Button>
                        <Button
                            onClick={onExport}
                            size="sm"
                            startIcon={<Download size={16} />}
                            variant="outline"
                            className="border-brand-accent/50 text-brand-accent hover:bg-brand-accent/10 px-4"
                        >
                            Exportar Listado
                        </Button>
                        <Button
                            onClick={onNewStudent}
                            size="sm"
                            startIcon={<Plus size={16} />}
                            className="bg-brand-accent hover:bg-orange-600 border-none px-4"
                        >
                            Nuevo Estudiante
                        </Button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    <Select
                        value={filters.estatus}
                        onChange={(e) => onFilterChange({ estatus: e.target.value })}
                        options={[
                            { value: "", label: "Estatus: Todos" },
                            { value: "Regular", label: "Regular" },
                            { value: "Baja", label: "Baja" },
                            { value: "Condicional", label: "Condicional" },
                            { value: "Preinscripto", label: "Preinscripto" },
                        ]}
                        className="bg-indigo-950/40 border-brand-accent/20 text-xs"
                    />
                    <Select
                        value={filters.rango_edad}
                        onChange={(e) => onFilterChange({ rango_edad: e.target.value })}
                        options={[
                            { value: "", label: "Cualquier Edad" },
                            { value: "MENORES", label: "Menores (< 18 años)" },
                            { value: "MAYORES", label: "Adultos (>= 18 años)" },
                        ]}
                        className="bg-indigo-950/40 border-brand-accent/20 text-xs"
                    />
                    <Select
                        value={filters.programa_id}
                        onChange={(e) =>
                            onFilterChange({
                                programa_id: e.target.value,
                                bloque_id: "",
                                modulo_id: "",
                                cohorte_id: "",
                            })
                        }
                        options={[
                            { value: "", label: "Cualquier Trayecto" },
                            ...programas.map((p) => ({ value: p.id, label: p.nombre })),
                        ]}
                        className="bg-indigo-950/40 border-brand-accent/20 text-xs"
                    />
                    <Select
                        value={filters.bloque_id}
                        onChange={(e) =>
                            onFilterChange({
                                bloque_id: e.target.value,
                                modulo_id: "",
                                cohorte_id: "",
                            })
                        }
                        options={[
                            { value: "", label: "Cualquier Módulo" },
                            ...bloques.map((b) => ({ value: b.id, label: b.nombre })),
                        ]}
                        disabled={!filters.programa_id}
                        className="bg-indigo-950/40 border-brand-accent/20 text-xs"
                    />
                    <Select
                        value={filters.modulo_id}
                        onChange={(e) => onFilterChange({ modulo_id: e.target.value })}
                        options={[
                            { value: "", label: "Cualquier Materia" },
                            ...modulos.map((m) => ({ value: m.id, label: m.nombre })),
                        ]}
                        disabled={!filters.bloque_id}
                        className="bg-indigo-950/40 border-brand-accent/20 text-xs"
                    />
                    <Select
                        value={filters.cohorte_id}
                        onChange={(e) => onFilterChange({ cohorte_id: e.target.value })}
                        options={[
                            { value: "", label: "Cualquier Cohorte" },
                            ...cohortes.map((c) => ({ value: c.id, label: c.nombre })),
                        ]}
                        disabled={!filters.programa_id}
                        className="bg-indigo-950/40 border-brand-accent/20 text-xs"
                    />
                </div>
            </div>
        </div>
    );
};
