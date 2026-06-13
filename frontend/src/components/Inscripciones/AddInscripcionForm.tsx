import React from "react";
import { Loader } from "lucide-react";
import { Card, Select, Button, Input } from "../UI";
import { Accordion } from "./Accordion";
import { Checkbox } from "./Checkbox";
import { LocalBloque, LocalModulo } from "./types";
import type { Programa, Cohorte, Bloque } from "../../api/types";

export interface AddInscripcionFormProps {
    studentSearch: string;
    onStudentSearchChange: (val: string) => void;
    selectedStudent: string;
    onStudentChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    studentOptions: { value: string | number; label: string }[];
    filteredEstudiantesCount: number;
    filterPeriodo: string;
    onFilterPeriodoChange: (val: string) => void;
    filterProgramaId: string;
    onFilterProgramaIdChange: (val: string) => void;
    filterBloqueId: string;
    onFilterBloqueIdChange: (val: string) => void;
    filterCohorteId: string;
    onFilterCohorteIdChange: (val: string) => void;
    filterInicio: string;
    onFilterInicioChange: (val: string) => void;
    programas: Programa[];
    bloquesOptions: { value: string | number; label: string }[];
    cohortesOptions: { value: string | number; label: string }[];
    inicioOptions: { value: string | number; label: string }[];
    cohortesFiltered: Cohorte[];
    selectedCohortes: number[];
    onCohorteToggle: (cohorteId: number) => void;
    programaMap: Record<number, Programa>;
    bloquesMap: Record<number, Bloque>;
    cohorteBloques: Record<number, LocalBloque[]>;
    loadingBloques: Record<number, boolean>;
    approvedModuleIds: Set<number>;
    inscripcionesAlumnoSet: Set<number>;
    selectedModulos: Record<number, number[]>;
    onModuloToggle: (cohorteId: number, moduloId: number) => void;
    onModuloProgressionFilter: (modulos: LocalModulo[]) => LocalModulo[];
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    isSaving: boolean;
}

export const AddInscripcionForm: React.FC<AddInscripcionFormProps> = ({
    studentSearch,
    onStudentSearchChange,
    selectedStudent,
    onStudentChange,
    studentOptions,
    filteredEstudiantesCount,
    filterPeriodo,
    onFilterPeriodoChange,
    filterProgramaId,
    onFilterProgramaIdChange,
    filterBloqueId,
    onFilterBloqueIdChange,
    filterCohorteId,
    onFilterCohorteIdChange,
    filterInicio,
    onFilterInicioChange,
    programas,
    bloquesOptions,
    cohortesOptions,
    inicioOptions,
    cohortesFiltered,
    selectedCohortes,
    onCohorteToggle,
    programaMap,
    bloquesMap,
    cohorteBloques,
    loadingBloques,
    approvedModuleIds,
    inscripcionesAlumnoSet,
    selectedModulos,
    onModuloToggle,
    onModuloProgressionFilter,
    onSubmit,
    isSaving,
}) => {
    return (
        <Card className="bg-indigo-900/20 border-indigo-500/30">
            <form onSubmit={onSubmit} className="space-y-6">
                <div className="max-w-md">
                    <Input
                        label="Buscar estudiante (DNI / Apellido / Nombre)"
                        value={studentSearch}
                        onChange={(e) => onStudentSearchChange(e.target.value)}
                        placeholder="Ej: 3497, andrade, martin..."
                        className="mb-2 bg-indigo-950/50 border-indigo-500/30 text-white"
                    />
                    <Select
                        label="Estudiante"
                        value={selectedStudent}
                        onChange={onStudentChange}
                        options={[{ value: "", label: "Seleccionar estudiante..." }, ...studentOptions]}
                        className="bg-indigo-950/50 border-indigo-500/30 text-white"
                    />
                    <p className="mt-2 text-xs text-indigo-300">
                        {filteredEstudiantesCount} resultado(s)
                    </p>
                </div>

                {selectedStudent && (
                    <div className="space-y-4 pt-4 border-t border-indigo-500/20">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                            <Select
                                label="Periodo"
                                value={filterPeriodo}
                                onChange={(e) => onFilterPeriodoChange(e.target.value)}
                                options={[
                                    { value: "ACTUAL_O_PROXIMO", label: "Periodo vigente" },
                                    { value: "TODAS", label: "Todas las cohortes" },
                                ]}
                                className="bg-indigo-950/50 border-indigo-500/30 text-white"
                            />
                            <Select
                                label="Programa"
                                value={filterProgramaId}
                                onChange={(e) => onFilterProgramaIdChange(e.target.value)}
                                options={[{ value: "", label: "Todos" }, ...programas.map((p) => ({ value: p.id, label: p.nombre }))]}
                                className="bg-indigo-950/50 border-indigo-500/30 text-white"
                            />
                            <Select
                                label="Bloque"
                                value={filterBloqueId}
                                onChange={(e) => onFilterBloqueIdChange(e.target.value)}
                                options={bloquesOptions}
                                className="bg-indigo-950/50 border-indigo-500/30 text-white"
                            />
                            <Select
                                label="Cohorte"
                                value={filterCohorteId}
                                onChange={(e) => onFilterCohorteIdChange(e.target.value)}
                                options={cohortesOptions}
                                className="bg-indigo-950/50 border-indigo-500/30 text-white"
                            />
                            <Select
                                label="Inicio"
                                value={filterInicio}
                                onChange={(e) => onFilterInicioChange(e.target.value)}
                                options={inicioOptions}
                                className="bg-indigo-950/50 border-indigo-500/30 text-white"
                            />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Selecciona Cohortes:</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {cohortesFiltered.map((cohorte) => (
                                <Checkbox
                                    key={cohorte.id}
                                    label={`${programaMap[cohorte.programa_id]?.nombre || "Programa"} - ${bloquesMap[cohorte.bloque_id || 0]?.nombre || "Bloque"} - ${cohorte.nombre}`}
                                    checked={selectedCohortes.includes(cohorte.id)}
                                    onChange={() => onCohorteToggle(cohorte.id)}
                                />
                            ))}
                        </div>
                        <p className="text-xs text-indigo-300">{cohortesFiltered.length} cohorte(s) visibles</p>
                    </div>
                )}

                {selectedCohortes.map((cohorteId) => (
                    <div key={cohorteId} className="bg-white/5 rounded-xl p-4 border border-indigo-500/10">
                        <div className="flex items-center gap-2 mb-3">
                            <h4 className="text-md font-bold text-brand-cyan">
                                Módulos para {cohortesFiltered.find((c) => c.id === cohorteId)?.nombre}
                            </h4>
                            {loadingBloques[cohorteId] && <Loader size={16} className="animate-spin text-white" />}
                        </div>

                        {cohorteBloques[cohorteId]?.map((bloque) => (
                            <Accordion key={bloque.id} title={bloque.nombre} defaultOpen>
                                <div className="space-y-1 pl-2">
                                    {onModuloProgressionFilter(bloque.modulos).map((modulo) => {
                                        const isApproved = approvedModuleIds.has(modulo.id);
                                        const alreadyEnrolled = inscripcionesAlumnoSet.has(modulo.id);
                                        const checked = isApproved || alreadyEnrolled || (selectedModulos[cohorteId]?.includes(modulo.id) ?? false);

                                        let label = modulo.nombre;
                                        if (isApproved) label += " (Aprobado)";
                                        else if (alreadyEnrolled) label += " (Inscripto)";

                                        return (
                                            <Checkbox
                                                key={modulo.id}
                                                label={label}
                                                checked={checked}
                                                onChange={() => onModuloToggle(cohorteId, modulo.id)}
                                                disabled={isApproved || alreadyEnrolled}
                                            />
                                        );
                                    })}
                                </div>
                            </Accordion>
                        ))}
                    </div>
                ))}

                <div className="flex justify-end pt-4">
                    <Button
                        type="submit"
                        className="bg-brand-accent hover:bg-orange-600 border-none px-8"
                        disabled={!selectedStudent || selectedCohortes.length === 0 || isSaving}
                    >
                        Inscribir Módulos
                    </Button>
                </div>
            </form>
        </Card>
    );
};
