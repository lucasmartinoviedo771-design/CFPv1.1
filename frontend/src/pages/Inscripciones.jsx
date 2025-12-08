import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Trash2, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useCohortes, useDeleteInscripcion, useInscripciones, useProgramas, useSaveInscripcion, useEstudiantes } from "../api/hooks";
import { apiClientV2 } from "../api/client";
import { Card, Select, Button } from '../components/UI';

// Custom Accordion Component
const Accordion = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-indigo-500/30 rounded-lg bg-indigo-950/20 overflow-hidden mb-2">
            <button
                className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
                type="button"
            >
                <span className="font-medium text-indigo-100">{title}</span>
                {isOpen ? <ChevronDown size={18} className="text-indigo-400" /> : <ChevronRight size={18} className="text-indigo-400" />}
            </button>
            {isOpen && <div className="p-4 border-t border-indigo-500/20 bg-black/20">{children}</div>}
        </div>
    );
};

// Custom Checkbox
const Checkbox = ({ checked, onChange, disabled, label }) => (
    <label className={`flex items-center gap-3 p-2 rounded transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5 cursor-pointer'}`}>
        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${checked ? 'bg-brand-accent border-brand-accent' : 'border-indigo-500/50 bg-indigo-950/30'}`}>
            {checked && <CheckCircle size={14} className="text-white" />}
        </div>
        <input type="checkbox" className="hidden" checked={checked} onChange={onChange} disabled={disabled} />
        <span className={`text-sm ${checked ? 'text-white font-medium' : 'text-indigo-300'}`}>{label}</span>
    </label>
);

export default function Inscripciones() {
    const [selectedStudent, setSelectedStudent] = useState("");
    const [selectedCohortes, setSelectedCohortes] = useState([]);
    const [selectedModulos, setSelectedModulos] = useState({});
    const [cohorteBloques, setCohorteBloques] = useState({});
    const [approvedModuleIds, setApprovedModuleIds] = useState(new Set());
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [feedback, setFeedback] = useState({ open: false, message: "", severity: "success" });
    const [loadingBloques, setLoadingBloques] = useState({});

    const { data: estudiantes = [] } = useEstudiantes();
    const { data: cohortes = [] } = useCohortes();
    const { data: programas = [] } = useProgramas();
    const { data: inscripciones = [], isLoading: loadingInscripciones, refetch: refetchInscripciones } = useInscripciones();
    const saveInscripcion = useSaveInscripcion();
    const deleteInscripcion = useDeleteInscripcion();

    const programaMap = useMemo(() => Object.fromEntries(programas.map((p) => [p.id, p])), [programas]);

    const inscripcionesAlumnoSet = useMemo(() => {
        if (!selectedStudent) return new Set();
        const set = new Set();
        inscripciones
            .filter((i) => i.estudiante_id === Number(selectedStudent) && i.modulo_id)
            .forEach((i) => set.add(i.modulo_id));
        return set;
    }, [inscripciones, selectedStudent]);

    useEffect(() => {
        if (!selectedStudent) {
            setApprovedModuleIds(new Set());
            return;
        }
        const fetchApproved = async () => {
            try {
                const { data } = await apiClientV2.get("/examenes/notas", { params: { estudiante_id: selectedStudent, aprobado: true } });
                const modIds = new Set();
                (data || []).forEach((nota) => {
                    if (nota.examen_modulo_id) modIds.add(nota.examen_modulo_id);
                });
                setApprovedModuleIds(modIds);
            } catch (error) {
                const msg = error?.response?.data ? JSON.stringify(error.response.data) : error?.message || "Error";
                setFeedback({ open: true, message: `No se pudieron cargar notas aprobadas: ${msg}`, severity: "error" });
            }
        };
        fetchApproved();
    }, [selectedStudent]);

    const loadBloquesForCohorte = async (cohorteId) => {
        const cohorte = cohortes.find((c) => c.id === cohorteId);
        if (!cohorte) return;
        setLoadingBloques((prev) => ({ ...prev, [cohorteId]: true }));
        try {
            const bloquesRes = await apiClientV2.get("/bloques", { params: { programa_id: cohorte.programa_id } });
            const bloques = bloquesRes.data || [];
            const bloquesConModulos = await Promise.all(
                bloques.map(async (b) => {
                    const modRes = await apiClientV2.get("/modulos", { params: { bloque_id: b.id } });
                    return { ...b, modulos: modRes.data || [] };
                })
            );
            setCohorteBloques((prev) => ({ ...prev, [cohorteId]: bloquesConModulos }));
        } catch (error) {
            const msg = error?.response?.data ? JSON.stringify(error.response.data) : error?.message || "Error";
            setFeedback({ open: true, message: `Error cargando bloques/modulos: ${msg}`, severity: "error" });
        } finally {
            setLoadingBloques((prev) => ({ ...prev, [cohorteId]: false }));
        }
    };

    const handleStudentChange = (e) => {
        const studentId = e.target.value;
        setSelectedStudent(studentId);
        setSelectedCohortes([]);
        setSelectedModulos({});
        setApprovedModuleIds(new Set());
    };

    const handleCohorteToggle = async (cohorteId) => {
        const isSelected = selectedCohortes.includes(cohorteId);
        if (isSelected) {
            setSelectedCohortes((prev) => prev.filter((id) => id !== cohorteId));
            setCohorteBloques((prev) => {
                const copy = { ...prev };
                delete copy[cohorteId];
                return copy;
            });
            setSelectedModulos((prev) => {
                const copy = { ...prev };
                delete copy[cohorteId];
                return copy;
            });
        } else {
            setSelectedCohortes((prev) => [...prev, cohorteId]);
            await loadBloquesForCohorte(cohorteId);
        }
    };

    const handleModuloToggle = (cohorteId, moduloId) => {
        setSelectedModulos((prev) => {
            const cohorteMods = prev[cohorteId] || [];
            const newMods = cohorteMods.includes(moduloId)
                ? cohorteMods.filter((id) => id !== moduloId)
                : [...cohorteMods, moduloId];
            return { ...prev, [cohorteId]: newMods };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedStudent) {
            setFeedback({ open: true, message: "Selecciona un estudiante.", severity: "error" });
            return;
        }
        const inscripcionesACrear = [];
        Object.entries(selectedModulos).forEach(([cohorteIdStr, mods]) => {
            const cohorteId = Number(cohorteIdStr);
            mods.forEach((moduloId) => {
                inscripcionesACrear.push({
                    estudiante_id: Number(selectedStudent),
                    cohorte_id: cohorteId,
                    modulo_id: moduloId,
                    estado: "ACTIVO",
                });
            });
        });
        if (!inscripcionesACrear.length) {
            setFeedback({ open: true, message: "Selecciona al menos un modulo para inscribir.", severity: "error" });
            return;
        }
        try {
            await Promise.all(inscripcionesACrear.map((insc) => saveInscripcion.mutateAsync(insc)));
            setFeedback({ open: true, message: "Inscripcion/es creadas", severity: "success" });
            setSelectedCohortes([]);
            setSelectedModulos({});
            await refetchInscripciones();
        } catch (error) {
            const msg = error?.response?.data ? JSON.stringify(error.response.data) : error?.message || "Error";
            setFeedback({ open: true, message: `Error al inscribir: ${msg}`, severity: "error" });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Seguro que deseas eliminar esta inscripcion?")) return;
        try {
            await deleteInscripcion.mutateAsync(id);
            setFeedback({ open: true, message: "Inscripcion eliminada", severity: "success" });
            refetchInscripciones();
        } catch (error) {
            const msg = error?.response?.data ? JSON.stringify(error.response.data) : error?.message || "Error";
            setFeedback({ open: true, message: `No se pudo eliminar: ${msg}`, severity: "error" });
        }
    };

    const paginatedInscripciones = useMemo(() => {
        const start = page * rowsPerPage;
        const end = start + rowsPerPage;
        return inscripciones.slice(start, end);
    }, [inscripciones, page, rowsPerPage]);

    const studentOptions = estudiantes.map(s => ({ value: s.id, label: `${s.apellido}, ${s.nombre} (${s.dni})` }));

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Gestionar Inscripciones</h1>
                    <p className="text-indigo-300">Asigna módulos a estudiantes por cohorte.</p>
                </div>
            </div>

            <Card className="bg-indigo-900/20 border-indigo-500/30">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="max-w-md">
                        <Select
                            label="Estudiante"
                            value={selectedStudent}
                            onChange={handleStudentChange}
                            options={[{ value: '', label: 'Seleccionar estudiante...' }, ...studentOptions]}
                            className="bg-indigo-950/50 border-indigo-500/30 text-white"
                        />
                    </div>

                    {selectedStudent && (
                        <div className="space-y-4 pt-4 border-t border-indigo-500/20">
                            <h3 className="text-lg font-semibold text-white mb-2">Selecciona Cohortes:</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {cohortes.map((cohorte) => (
                                    <Checkbox
                                        key={cohorte.id}
                                        label={`${programaMap[cohorte.programa_id]?.nombre || "Programa"} - ${cohorte.nombre}`}
                                        checked={selectedCohortes.includes(cohorte.id)}
                                        onChange={() => handleCohorteToggle(cohorte.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {selectedCohortes.map((cohorteId) => (
                        <div key={cohorteId} className="bg-white/5 rounded-xl p-4 border border-indigo-500/10">
                            <div className="flex items-center gap-2 mb-3">
                                <h4 className="text-md font-bold text-brand-cyan">
                                    Módulos para {cohortes.find((c) => c.id === cohorteId)?.nombre}
                                </h4>
                                {loadingBloques[cohorteId] && <Loader size={16} className="animate-spin text-white" />}
                            </div>

                            {cohorteBloques[cohorteId]?.map((bloque) => (
                                <Accordion key={bloque.id} title={bloque.nombre} defaultExpanded>
                                    <div className="space-y-1 pl-2">
                                        {[...bloque.modulos].sort((a, b) => a.orden - b.orden).map((modulo) => {
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
                                                    onChange={() => handleModuloToggle(cohorteId, modulo.id)}
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
                            disabled={!selectedStudent || selectedCohortes.length === 0 || saveInscripcion.isPending}
                        >
                            Inscribir Módulos
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Tabla de Inscripciones */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white">Inscripciones Existentes</h2>

                <Card className="bg-indigo-900/10 border-indigo-500/20 overflow-hidden">
                    <div className="overflow-x-auto">
                        {loadingInscripciones ? (
                            <div className="p-8 flex justify-center"><Loader className="animate-spin text-brand-accent" /></div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-indigo-950/40 text-indigo-300 uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-3">Estudiante</th>
                                        <th className="px-6 py-3">Cohorte</th>
                                        <th className="px-6 py-3">Módulo</th>
                                        <th className="px-6 py-3">Estado</th>
                                        <th className="px-6 py-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-indigo-500/10">
                                    {paginatedInscripciones.map((r) => (
                                        <tr key={r.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-3 font-medium text-white">
                                                {r.estudiante ? `${r.estudiante.apellido}, ${r.estudiante.nombre}` : r.estudiante_id}
                                            </td>
                                            <td className="px-6 py-3 text-gray-400">
                                                {r.cohorte ? `${programaMap[r.cohorte.programa_id]?.nombre || ""} - ${r.cohorte.nombre}` : r.cohorte_id}
                                            </td>
                                            <td className="px-6 py-3 text-gray-300">{r.modulo?.nombre || r.modulo_id || "N/A"}</td>
                                            <td className="px-6 py-3">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${r.estado === 'ACTIVO' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                                                    {r.estado}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-200 transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {!paginatedInscripciones.length && (
                                        <tr><td colSpan={5} className="text-center py-6 text-gray-500">No hay inscripciones cargadas.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </Card>
            </div>

            {feedback.open && (
                <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-xl border flex items-center gap-2 animate-fade-in ${feedback.severity === 'error' ? 'bg-red-900/90 border-red-500 text-white' : 'bg-green-900/90 border-green-500 text-white'}`}>
                    {feedback.severity === 'error' ? <AlertCircle /> : <CheckCircle />}
                    {feedback.message}
                    <button onClick={() => setFeedback({ ...feedback, open: false })} className="ml-4 hover:text-gray-300"><Trash2 size={14} /></button>
                </div>
            )}
        </div>
    );
}
