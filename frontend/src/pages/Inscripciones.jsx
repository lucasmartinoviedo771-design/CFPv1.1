import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Trash2, CheckCircle, AlertCircle, Loader, Edit2, X, Save, Search, Baby } from 'lucide-react';

import { useCohortes, useDeleteInscripcion, useInscripciones, useProgramas, useSaveInscripcion, useEstudiantes } from "../api/hooks";
import { apiClientV2 } from "../api/client";
import { Card, Select, Button, Input } from '../components/UI';
import { formatDateDisplay } from '../utils/dateFormat';

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

const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};

export default function Inscripciones() {
    const [selectedStudent, setSelectedStudent] = useState("");
    const [studentSearch, setStudentSearch] = useState("");
    const [selectedCohortes, setSelectedCohortes] = useState([]);
    const [selectedModulos, setSelectedModulos] = useState({});
    const [cohorteBloques, setCohorteBloques] = useState({});
    const [approvedModuleIds, setApprovedModuleIds] = useState(new Set());
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [inscripcionSearch, setInscripcionSearch] = useState("");
    const [editingInscripcionId, setEditingInscripcionId] = useState(null);
    const [editingEstado, setEditingEstado] = useState("");
    const [feedback, setFeedback] = useState({ open: false, message: "", severity: "success" });
    const [loadingBloques, setLoadingBloques] = useState({});
    const [allBloques, setAllBloques] = useState([]);
    const [filterProgramaId, setFilterProgramaId] = useState("");
    const [filterBloqueId, setFilterBloqueId] = useState("");
    const [filterCohorteId, setFilterCohorteId] = useState("");
    const [filterInicio, setFilterInicio] = useState("");
    const [filterPeriodo, setFilterPeriodo] = useState("ACTUAL_O_PROXIMO");

    const { data: estudiantes = [] } = useEstudiantes();
    const { data: cohortes = [] } = useCohortes();
    const { data: programas = [] } = useProgramas();
    const { data: inscripciones = [], isLoading: loadingInscripciones, refetch: refetchInscripciones } = useInscripciones();
    const saveInscripcion = useSaveInscripcion();
    const deleteInscripcion = useDeleteInscripcion();

    const programaMap = useMemo(() => Object.fromEntries(programas.map((p) => [p.id, p])), [programas]);
    const bloquesMap = useMemo(() => Object.fromEntries(allBloques.map((b) => [b.id, b])), [allBloques]);

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

    useEffect(() => {
        const loadBloques = async () => {
            try {
                const { data } = await apiClientV2.get("/bloques");
                setAllBloques(Array.isArray(data) ? data : []);
            } catch (error) {
                setAllBloques([]);
            }
        };
        loadBloques();
    }, []);

    const loadBloquesForCohorte = async (cohorteId) => {
        const cohorte = cohortes.find((c) => c.id === cohorteId);
        if (!cohorte) return;
        setLoadingBloques((prev) => ({ ...prev, [cohorteId]: true }));
        try {
            // Optimización: Usar endpoint de estructura completa
            const { data } = await apiClientV2.get("/estructura", { params: { programa: cohorte.programa_id } });

            let bloques = data.bloques || [];

            // Si la cohorte es de un bloque especifico, filtrar
            if (cohorte.bloque_id) {
                bloques = bloques.filter((b) => String(b.id) === String(cohorte.bloque_id));
            }

            // Los modulos ya vienen anidados en data.bloques
            setCohorteBloques((prev) => ({ ...prev, [cohorteId]: bloques }));
        } catch (error) {
            const msg = error?.response?.data ? JSON.stringify(error.response.data) : error?.message || "Error";
            setFeedback({ open: true, message: `Error cargando estructura: ${msg}`, severity: "error" });
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
        setFilterProgramaId("");
        setFilterBloqueId("");
        setFilterCohorteId("");
        setFilterInicio("");
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

    const filteredInscripciones = useMemo(() => {
        const needle = inscripcionSearch.trim().toLowerCase();
        if (!needle) return inscripciones;
        return inscripciones.filter((r) => {
            const apellido = (r.estudiante?.apellido || "").toLowerCase();
            const nombre = (r.estudiante?.nombre || "").toLowerCase();
            const dni = String(r.estudiante?.dni || "").toLowerCase();
            const full = `${apellido} ${nombre}`;
            const modulo = (r.modulo?.nombre || "").toLowerCase();
            const cohorte = (r.cohorte?.nombre || "").toLowerCase();
            return apellido.includes(needle) || nombre.includes(needle) || full.includes(needle) || dni.includes(needle) || modulo.includes(needle) || cohorte.includes(needle);
        });
    }, [inscripciones, inscripcionSearch]);

    const totalPages = Math.ceil(filteredInscripciones.length / rowsPerPage);

    const paginatedInscripciones = useMemo(() => {
        const start = page * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredInscripciones.slice(start, end);
    }, [filteredInscripciones, page, rowsPerPage]);

    useEffect(() => {
        if (page > 0 && page >= totalPages) {
            setPage(Math.max(0, totalPages - 1));
        }
    }, [totalPages, page]);

    const filteredEstudiantes = useMemo(() => {
        const needle = studentSearch.trim().toLowerCase();
        if (!needle) return estudiantes;
        return estudiantes.filter((s) => {
            const apellido = (s.apellido || "").toLowerCase();
            const nombre = (s.nombre || "").toLowerCase();
            const dni = String(s.dni || "").toLowerCase();
            const full = `${apellido} ${nombre}`;
            return apellido.includes(needle) || nombre.includes(needle) || full.includes(needle) || dni.includes(needle);
        });
    }, [estudiantes, studentSearch]);

    const studentOptions = filteredEstudiantes.map(s => {
        const age = calculateAge(s.fecha_nacimiento);
        const ageLabel = age !== null ? (age < 18 ? ` - ${age} años 👶` : ` - ${age} años`) : "";
        return { value: s.id, label: `${s.apellido}, ${s.nombre} (${s.dni})${ageLabel}` };
    });

    const todayIso = useMemo(() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    }, []);

    const isVigenteHoy = (c) => {
        if (!c?.fecha_inicio || !c?.fecha_fin) return false;
        return c.fecha_inicio <= todayIso && c.fecha_fin >= todayIso;
    };

    const applyPeriodoFilter = (items) => {
        if (filterPeriodo === "TODAS") return items;
        if (filterPeriodo === "VIGENTE_HOY") return items.filter(isVigenteHoy);

        // ACTUAL_O_PROXIMO (default):
        // 1) si hay vigentes hoy, mostrar esas
        // 2) si no hay vigentes, mostrar la/s cohorte/s del próximo inicio más cercano
        const vigentes = items.filter(isVigenteHoy);
        if (vigentes.length > 0) return vigentes;

        const futuras = items.filter((c) => c?.fecha_inicio && c.fecha_inicio > todayIso);
        if (futuras.length === 0) return [];
        const proximaFecha = futuras.reduce((min, c) => (c.fecha_inicio < min ? c.fecha_inicio : min), futuras[0].fecha_inicio);
        return futuras.filter((c) => c.fecha_inicio === proximaFecha);
    };

    const cohortesFiltered = useMemo(() => {
        const base = applyPeriodoFilter(cohortes);
        return base.filter((c) => {
            if (filterProgramaId && String(c.programa_id) !== String(filterProgramaId)) return false;
            if (filterBloqueId && String(c.bloque_id || "") !== String(filterBloqueId)) return false;
            if (filterCohorteId && String(c.id) !== String(filterCohorteId)) return false;
            if (filterInicio && String(c.fecha_inicio || "") !== String(filterInicio)) return false;
            return true;
        });
    }, [cohortes, filterPeriodo, filterProgramaId, filterBloqueId, filterCohorteId, filterInicio, todayIso]);

    const bloquesOptions = useMemo(() => {
        const cohortesBase = applyPeriodoFilter(cohortes).filter((c) => {
            if (filterProgramaId && String(c.programa_id) !== String(filterProgramaId)) return false;
            return true;
        });
        const allowedBloqueIds = new Set(cohortesBase.map((c) => c.bloque_id).filter(Boolean));
        const arr = (filterProgramaId
            ? allBloques.filter((b) => String(b.programa_id) === String(filterProgramaId))
            : allBloques
        ).filter((b) => allowedBloqueIds.has(b.id));
        return [{ value: "", label: "Todos" }, ...arr.map((b) => ({ value: b.id, label: b.nombre }))];
    }, [allBloques, cohortes, filterPeriodo, filterProgramaId, todayIso]);

    const cohortesOptions = useMemo(() => {
        const base = applyPeriodoFilter(cohortes).filter((c) => {
            if (filterProgramaId && String(c.programa_id) !== String(filterProgramaId)) return false;
            if (filterBloqueId && String(c.bloque_id || "") !== String(filterBloqueId)) return false;
            return true;
        });
        return [{ value: "", label: "Todas" }, ...base.map((c) => ({ value: c.id, label: c.nombre }))];
    }, [cohortes, filterPeriodo, filterProgramaId, filterBloqueId, todayIso]);

    const inicioOptions = useMemo(() => {
        const base = applyPeriodoFilter(cohortes).filter((c) => {
            if (filterProgramaId && String(c.programa_id) !== String(filterProgramaId)) return false;
            if (filterBloqueId && String(c.bloque_id || "") !== String(filterBloqueId)) return false;
            if (filterCohorteId && String(c.id) !== String(filterCohorteId)) return false;
            return true;
        });
        const uniq = Array.from(new Set(base.map((c) => c.fecha_inicio).filter(Boolean))).sort((a, b) => (a < b ? 1 : -1));
        return [{ value: "", label: "Todos" }, ...uniq.map((d) => ({ value: d, label: formatDateDisplay(d) }))];
    }, [cohortes, filterPeriodo, filterProgramaId, filterBloqueId, filterCohorteId, todayIso]);

    const getModuloNivel = (modulo, all = []) => {
        const nombre = String(modulo?.nombre || "").toUpperCase();
        const match = nombre.match(/M[ÓO]DULO\s*([0-9]+|[IVXLCDM]+)/i);
        if (match?.[1]) {
            const token = match[1].toUpperCase();
            if (/^\d+$/.test(token)) return Number(token);
            const vals = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
            let total = 0;
            let prev = 0;
            for (let i = token.length - 1; i >= 0; i -= 1) {
                const v = vals[token[i]] || 0;
                if (v < prev) total -= v;
                else {
                    total += v;
                    prev = v;
                }
            }
            if (total > 0) return total;
        }
        const ids = all.map((m) => m.id);
        const idx = ids.indexOf(modulo.id);
        return idx >= 0 ? idx + 1 : 1;
    };

    const visibleModulosByProgression = (modulos) => {
        const base = [...(modulos || [])];
        const sorted = base.sort((a, b) => {
            const na = getModuloNivel(a, base);
            const nb = getModuloNivel(b, base);
            if (na !== nb) return na - nb;
            return (a.id || 0) - (b.id || 0);
        });
        return sorted.filter((modulo, index) => {
            const alreadyEnrolled = inscripcionesAlumnoSet.has(modulo.id);
            const isApproved = approvedModuleIds.has(modulo.id);
            if (alreadyEnrolled || isApproved) return true;
            if (index === 0) return true;
            const prevs = sorted.slice(0, index);
            return prevs.every((p) => approvedModuleIds.has(p.id));
        });
    };

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
                        <Input
                            label="Buscar estudiante (DNI / Apellido / Nombre)"
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                            placeholder="Ej: 3497, andrade, martin..."
                            className="mb-2 bg-indigo-950/50 border-indigo-500/30 text-white"
                        />
                        <Select
                            label="Estudiante"
                            value={selectedStudent}
                            onChange={handleStudentChange}
                            options={[{ value: '', label: 'Seleccionar estudiante...' }, ...studentOptions]}
                            className="bg-indigo-950/50 border-indigo-500/30 text-white"
                        />
                        <p className="mt-2 text-xs text-indigo-300">
                            {filteredEstudiantes.length} resultado(s)
                        </p>
                    </div>

                    {selectedStudent && (
                        <div className="space-y-4 pt-4 border-t border-indigo-500/20">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                <Select
                                    label="Periodo"
                                    value={filterPeriodo}
                                    onChange={(e) => {
                                        setFilterPeriodo(e.target.value);
                                        setFilterProgramaId("");
                                        setFilterBloqueId("");
                                        setFilterCohorteId("");
                                        setFilterInicio("");
                                    }}
                                    options={[
                                        { value: "ACTUAL_O_PROXIMO", label: "Periodo vigente" },
                                        { value: "TODAS", label: "Todas las cohortes" },
                                    ]}
                                    className="bg-indigo-950/50 border-indigo-500/30 text-white"
                                />
                                <Select
                                    label="Programa"
                                    value={filterProgramaId}
                                    onChange={(e) => {
                                        setFilterProgramaId(e.target.value);
                                        setFilterBloqueId("");
                                        setFilterCohorteId("");
                                        setFilterInicio("");
                                    }}
                                    options={[{ value: "", label: "Todos" }, ...programas.map((p) => ({ value: p.id, label: p.nombre }))]}
                                    className="bg-indigo-950/50 border-indigo-500/30 text-white"
                                />
                                <Select
                                    label="Bloque"
                                    value={filterBloqueId}
                                    onChange={(e) => {
                                        setFilterBloqueId(e.target.value);
                                        setFilterCohorteId("");
                                        setFilterInicio("");
                                    }}
                                    options={bloquesOptions}
                                    className="bg-indigo-950/50 border-indigo-500/30 text-white"
                                />
                                <Select
                                    label="Cohorte"
                                    value={filterCohorteId}
                                    onChange={(e) => {
                                        setFilterCohorteId(e.target.value);
                                        setFilterInicio("");
                                    }}
                                    options={cohortesOptions}
                                    className="bg-indigo-950/50 border-indigo-500/30 text-white"
                                />
                                <Select
                                    label="Inicio"
                                    value={filterInicio}
                                    onChange={(e) => setFilterInicio(e.target.value)}
                                    options={inicioOptions}
                                    className="bg-indigo-950/50 border-indigo-500/30 text-white"
                                />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Selecciona Cohortes:</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {cohortesFiltered.map((cohorte) => (
                                    <Checkbox
                                        key={cohorte.id}
                                        label={`${programaMap[cohorte.programa_id]?.nombre || "Programa"} - ${bloquesMap[cohorte.bloque_id]?.nombre || "Bloque"} - ${cohorte.nombre}`}
                                        checked={selectedCohortes.includes(cohorte.id)}
                                        onChange={() => handleCohorteToggle(cohorte.id)}
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
                                    Módulos para {cohortes.find((c) => c.id === cohorteId)?.nombre}
                                </h4>
                                {loadingBloques[cohorteId] && <Loader size={16} className="animate-spin text-white" />}
                            </div>

                            {cohorteBloques[cohorteId]?.map((bloque) => (
                                <Accordion key={bloque.id} title={bloque.nombre} defaultExpanded>
                                    <div className="space-y-1 pl-2">
                                        {visibleModulosByProgression(bloque.modulos).map((modulo) => {
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
            <div className="space-y-4 pt-4 border-t border-indigo-500/20">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h2 className="text-xl font-bold text-white">Inscripciones Existentes</h2>
                    <div className="relative w-full sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-indigo-400">
                            <Search size={16} />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar inscripción..."
                            value={inscripcionSearch}
                            onChange={(e) => setInscripcionSearch(e.target.value)}
                            className="bg-indigo-950/50 border border-indigo-500/30 text-white rounded w-full pl-9 pr-3 py-1.5 focus:outline-none focus:border-brand-accent transition-colors"
                        />
                    </div>
                </div>

                <Card className="bg-indigo-900/10 border-indigo-500/20 overflow-hidden">
                    <div className="overflow-x-auto">
                        {loadingInscripciones ? (
                            <div className="p-8 flex justify-center"><Loader className="animate-spin text-brand-accent" /></div>
                        ) : (
                            <>
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-indigo-950/40 text-indigo-300 uppercase text-xs">
                                        <tr>
                                            <th className="px-6 py-3">Estudiante</th>
                                            <th className="px-6 py-3">Detalle Inscripción</th>
                                            <th className="px-6 py-3">Módulo</th>
                                            <th className="px-6 py-3">Estado</th>
                                            <th className="px-6 py-3 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-indigo-500/10">
                                        {paginatedInscripciones.map((r) => (
                                            <tr key={r.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-3 font-medium">
                                                    {r.estudiante ? (() => {
                                                        const age = calculateAge(r.estudiante.fecha_nacimiento);
                                                        const isMinor = age !== null && age < 18;
                                                        return (
                                                            <div className="flex items-center gap-2">
                                                                <span className={isMinor ? "text-orange-400 font-bold" : "text-white"}>
                                                                    {r.estudiante.apellido}, {r.estudiante.nombre}
                                                                </span>
                                                                {age !== null && (
                                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isMinor ? "bg-orange-500/20 text-orange-300 border border-orange-500/30" : "bg-indigo-500/20 text-indigo-300"}`}>
                                                                        {age} {isMinor && <Baby size={10} className="inline ml-0.5" />}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    })() : (
                                                        <span className="text-white">{r.estudiante_id}</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3 text-gray-300">
                                                    {r.cohorte ? (
                                                        <div className="space-y-1">
                                                            <div>
                                                                <span className="text-indigo-200">Programa:</span>{" "}
                                                                <span>{r.cohorte.programa?.nombre || "-"}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-indigo-200">Bloque:</span>{" "}
                                                                <span>{r.cohorte.bloque?.nombre || "-"}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-indigo-200">Cohorte:</span>{" "}
                                                                <span>{r.cohorte.nombre || "-"}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-indigo-200">Periodo:</span>{" "}
                                                                <span>{formatDateDisplay(r.cohorte.fecha_inicio)} a {formatDateDisplay(r.cohorte.fecha_fin)}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        r.cohorte_id
                                                    )}
                                                </td>
                                                <td className="px-6 py-3 text-gray-300">{r.modulo?.nombre || r.modulo_id || "N/A"}</td>
                                                <td className="px-6 py-3">
                                                    {editingInscripcionId === r.id ? (
                                                        <select
                                                            value={editingEstado}
                                                            onChange={(e) => setEditingEstado(e.target.value)}
                                                            className="bg-indigo-900 border border-indigo-500/50 text-white text-sm rounded px-2 py-1 w-full"
                                                        >
                                                            <option value="INSCRIPTO">INSCRIPTO</option>
                                                            <option value="ACTIVO">ACTIVO</option>
                                                            <option value="INACTIVO">INACTIVO</option>
                                                            <option value="LIBRE">LIBRE</option>
                                                        </select>
                                                    ) : (
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${r.estado === 'ACTIVO' ? 'bg-green-500/20 text-green-400' :
                                                            r.estado === 'INACTIVO' ? 'bg-red-500/20 text-red-400' :
                                                                r.estado === 'LIBRE' ? 'bg-yellow-500/20 text-yellow-500' :
                                                                    r.estado === 'INSCRIPTO' ? 'bg-blue-500/20 text-blue-400' :
                                                                        'bg-gray-700 text-gray-400'
                                                            }`}>
                                                            {r.estado}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <div className="flex justify-end gap-3 text-indigo-300">
                                                        {editingInscripcionId === r.id ? (
                                                            <>
                                                                <button
                                                                    onClick={async () => {
                                                                        try {
                                                                            await saveInscripcion.mutateAsync({ id: r.id, estado: editingEstado, estudiante_id: r.estudiante?.id ?? r.estudiante_id, cohorte_id: r.cohorte?.id ?? r.cohorte_id, modulo_id: r.modulo?.id ?? r.modulo_id });
                                                                            setEditingInscripcionId(null);
                                                                            setFeedback({ open: true, message: "Estado actualizado", severity: "success" });
                                                                            refetchInscripciones();
                                                                        } catch (err) {
                                                                            setFeedback({ open: true, message: "Error al actualizar estado", severity: "error" });
                                                                        }
                                                                    }}
                                                                    className="text-green-400 hover:text-green-300 transition-colors"
                                                                    title="Guardar"
                                                                >
                                                                    <Save size={18} />
                                                                </button>
                                                                <button onClick={() => setEditingInscripcionId(null)} className="text-gray-400 hover:text-gray-300 transition-colors" title="Cancelar">
                                                                    <X size={18} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => { setEditingInscripcionId(r.id); setEditingEstado(r.estado || 'ACTIVO'); }}
                                                                    className="hover:text-blue-400 transition-colors"
                                                                    title="Editar estado"
                                                                >
                                                                    <Edit2 size={18} />
                                                                </button>
                                                                <button onClick={() => handleDelete(r.id)} className="hover:text-red-400 transition-colors" title="Eliminar">
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {!paginatedInscripciones.length && (
                                            <tr><td colSpan={5} className="text-center py-6 text-gray-500">No hay inscripciones para mostrar.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                                {filteredInscripciones.length > 0 && (
                                    <div className="p-4 border-t border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 bg-indigo-950/20">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-indigo-300">Mostrar</span>
                                            <select
                                                value={rowsPerPage}
                                                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
                                                className="bg-indigo-900 border border-indigo-500/30 text-white text-sm rounded px-2 py-1 outline-none"
                                            >
                                                <option value={10}>10</option>
                                                <option value={25}>25</option>
                                                <option value={50}>50</option>
                                                <option value={100}>100</option>
                                            </select>
                                            <span className="text-sm text-indigo-300">por página (Total: {filteredInscripciones.length})</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                                disabled={page === 0}
                                                className={`text-xs px-3 py-1 ${page === 0 ? 'bg-indigo-900 text-gray-500 opacity-50 cursor-not-allowed border-none' : 'bg-indigo-800 hover:bg-indigo-700 border-none'}`}
                                            >
                                                Anterior
                                            </Button>
                                            <span className="text-sm text-white py-1 px-3 border border-indigo-500/30 rounded bg-indigo-950">
                                                {page + 1} de {totalPages || 1}
                                            </span>
                                            <Button
                                                type="button"
                                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                                disabled={page >= totalPages - 1}
                                                className={`text-xs px-3 py-1 ${page >= totalPages - 1 ? 'bg-indigo-900 text-gray-500 opacity-50 cursor-not-allowed border-none' : 'bg-indigo-800 hover:bg-indigo-700 border-none'}`}
                                            >
                                                Siguiente
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </Card>
            </div >

            {
                feedback.open && (
                    <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-xl border flex items-center gap-2 animate-fade-in ${feedback.severity === 'error' ? 'bg-red-900/90 border-red-500 text-white' : 'bg-green-900/90 border-green-500 text-white'}`}>
                        {feedback.severity === 'error' ? <AlertCircle /> : <CheckCircle />}
                        {feedback.message}
                        <button onClick={() => setFeedback({ ...feedback, open: false })} className="ml-4 hover:text-gray-300"><Trash2 size={14} /></button>
                    </div>
                )
            }
        </div >
    );
}
