import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle, AlertCircle, X } from 'lucide-react';

import { useCohortes, useDeleteInscripcion, useInscripciones, useProgramas, useSaveInscripcion, useEstudiantes } from "../api/hooks";
import { apiClientV2 } from "../api/client";
import { Card } from '../components/UI';
import { formatDateDisplay } from '../utils/dateFormat';
import type { Cohorte, Programa, Bloque, Modulo, Estudiante } from "../api/types";
import { ModalConfirmDelete } from "../components/Inscripciones/ModalConfirmDelete";
import { InscripcionesTable } from "../components/Inscripciones/InscripcionesTable";
import { InscripcionesFilters } from "../components/Inscripciones/InscripcionesFilters";
import { AddInscripcionForm } from "../components/Inscripciones/AddInscripcionForm";
import {
    ExtendedEstudiante,
    ExtendedCohorte,
    ExtendedInscripcion,
    LocalModulo,
    LocalBloque,
    calculateAge
} from "../components/Inscripciones/types";

export type { ExtendedEstudiante, ExtendedCohorte, ExtendedInscripcion };
export { calculateAge };

export default function Inscripciones() {
    const [selectedStudent, setSelectedStudent] = useState<string>("");
    const [studentSearch, setStudentSearch] = useState<string>("");
    const [selectedCohortes, setSelectedCohortes] = useState<number[]>([]);
    const [selectedModulos, setSelectedModulos] = useState<Record<number, number[]>>({});
    const [cohorteBloques, setCohorteBloques] = useState<Record<number, LocalBloque[]>>({});
    const [approvedModuleIds, setApprovedModuleIds] = useState<Set<number>>(new Set());
    const [page, setPage] = useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = useState<number>(25);
    const [inscripcionSearch, setInscripcionSearch] = useState<string>("");
    const [inscToDelete, setInscToDelete] = useState<ExtendedInscripcion | null>(null);
    const [feedback, setFeedback] = useState<{ open: boolean; message: string; severity: "success" | "warning" | "error" }>({ open: false, message: "", severity: "success" });
    const [loadingBloques, setLoadingBloques] = useState<Record<number, boolean>>({});
    const [allBloques, setAllBloques] = useState<Bloque[]>([]);
    const [filterProgramaId, setFilterProgramaId] = useState<string>("");
    const [filterBloqueId, setFilterBloqueId] = useState<string>("");
    const [filterCohorteId, setFilterCohorteId] = useState<string>("");
    const [filterInicio, setFilterInicio] = useState<string>("");
    const [filterPeriodo, setFilterPeriodo] = useState<string>("ACTUAL_O_PROXIMO");
    
    // Filtros para la tabla de Inscripciones Existentes
    const [filterListProgramaName, setFilterListProgramaName] = useState<string>("");
    const [filterListBloqueName, setFilterListBloqueName] = useState<string>("");
    const [filterListModuloName, setFilterListModuloName] = useState<string>("");
    const [filterListCohorteName, setFilterListCohorteName] = useState<string>("");
    const [filterListEstado, setFilterListEstado] = useState<string>("");

    const { data: rawEstudiantes = [] } = useEstudiantes();
    const estudiantes = useMemo(() => rawEstudiantes as ExtendedEstudiante[], [rawEstudiantes]);

    const { data: cohortes = [] } = useCohortes();
    const { data: programas = [] } = useProgramas();
    
    const { data: rawInscripciones = [], isLoading: loadingInscripciones, refetch: refetchInscripciones } = useInscripciones();
    const inscripciones = useMemo(() => rawInscripciones as ExtendedInscripcion[], [rawInscripciones]);

    const saveInscripcion = useSaveInscripcion();
    const deleteInscripcion = useDeleteInscripcion();

    const programaMap = useMemo(() => Object.fromEntries(programas.map((p) => [p.id, p])), [programas]);
    const bloquesMap = useMemo(() => Object.fromEntries(allBloques.map((b) => [b.id, b])), [allBloques]);

    const inscripcionesAlumnoSet = useMemo(() => {
        if (!selectedStudent) return new Set<number>();
        const set = new Set<number>();
        inscripciones
            .filter((i) => i.estudiante_id === Number(selectedStudent) && i.modulo_id)
            .forEach((i) => {
                if (i.modulo_id) set.add(i.modulo_id);
            });
        return set;
    }, [inscripciones, selectedStudent]);

    useEffect(() => {
        if (!selectedStudent) {
            setApprovedModuleIds(new Set());
            return;
        }
        const fetchApproved = async () => {
            try {
                const { data } = await apiClientV2.get<{ examen_modulo_id?: number; aprobado: boolean }[]>("/examenes/notas", { params: { estudiante_id: selectedStudent, aprobado: true } });
                const modIds = new Set<number>();
                (data || []).forEach((nota) => {
                    if (nota.examen_modulo_id) modIds.add(nota.examen_modulo_id);
                });
                setApprovedModuleIds(modIds);
            } catch (error) {
                const errObj = error as { response?: { data?: unknown }; message?: string };
                const msg = errObj.response?.data ? JSON.stringify(errObj.response.data) : errObj.message || "Error";
                setFeedback({ open: true, message: `No se pudieron cargar notas aprobadas: ${msg}`, severity: "error" });
            }
        };
        fetchApproved();
    }, [selectedStudent]);

    useEffect(() => {
        const loadBloques = async () => {
            try {
                const { data } = await apiClientV2.get<Bloque[]>("/bloques");
                setAllBloques(Array.isArray(data) ? data : []);
            } catch (error) {
                setAllBloques([]);
            }
        };
        loadBloques();
    }, []);

    const loadBloquesForCohorte = async (cohorteId: number) => {
        const cohorte = cohortes.find((c) => c.id === cohorteId);
        if (!cohorte) return;
        setLoadingBloques((prev) => ({ ...prev, [cohorteId]: true }));
        try {
            // Optimización: Usar endpoint de estructura completa
            const { data } = await apiClientV2.get<{ bloques?: LocalBloque[] }>("/estructura", { params: { programa: cohorte.programa_id } });

            let bloques = data.bloques || [];

            // Si la cohorte es de un bloque especifico, filtrar
            if (cohorte.bloque_id) {
                bloques = bloques.filter((b) => String(b.id) === String(cohorte.bloque_id));
            }

            // Los modulos ya vienen anidados en data.bloques
            setCohorteBloques((prev) => ({ ...prev, [cohorteId]: bloques }));
        } catch (error) {
            const errObj = error as { response?: { data?: unknown }; message?: string };
            const msg = errObj.response?.data ? JSON.stringify(errObj.response.data) : errObj.message || "Error";
            setFeedback({ open: true, message: `Error cargando estructura: ${msg}`, severity: "error" });
        } finally {
            setLoadingBloques((prev) => ({ ...prev, [cohorteId]: false }));
        }
    };

    const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
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

    const handleSendWhatsApp = async (estudiante: Estudiante) => {
        const est = estudiante as ExtendedEstudiante;
        if (!est.tutor_telefono) {
            setFeedback({ open: true, message: "El estudiante no tiene registrado el teléfono del padre, madre o tutor.", severity: "warning" });
            return;
        }

        if (est.autorizacion_status === 'DIGITAL') {
            if (!window.confirm("Este estudiante ya tiene una autorización digital válida. ¿Deseas enviar el link de WhatsApp nuevamente?")) {
                return;
            }
        }

        try {
            let token = est.autorizacion_token;
            if (!token) {
                const { data } = await apiClientV2.post<{ token: string }>(`/autorizaciones/generate/${est.id}`);
                token = data.token;
            }

            const tutorName = est.tutor_nombre || "Tutor";
            const studentName = `${est.nombre} ${est.apellido}`;
            const telefono = est.tutor_telefono.replace(/\D/g, ''); // Limpiar no numéricos

            // Si el teléfono no tiene código de país, asumimos Argentina +54 9
            const fullPhone = telefono.startsWith('54') ? telefono : `549${telefono}`;

            const link = `https://politecnico.ar/cfp/autorizar.html?token=${token}`;
            const message = `Hola ${tutorName}, te enviamos el link para autorizar la cursada de ${studentName} en el CFP: ${link}. Recordá que debés sacarte una selfie con tu DNI para validar la firma.`;

            window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, '_blank');
        } catch (error) {
            console.error(error);
            setFeedback({ open: true, message: "Error al generar el link de autorización.", severity: "error" });
        }
    };

    const handleCohorteToggle = async (cohorteId: number) => {
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

    const handleModuloToggle = (cohorteId: number, moduloId: number) => {
        setSelectedModulos((prev) => {
            const cohorteMods = prev[cohorteId] || [];
            const newMods = cohorteMods.includes(moduloId)
                ? cohorteMods.filter((id) => id !== moduloId)
                : [...cohorteMods, moduloId];
            return { ...prev, [cohorteId]: newMods };
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedStudent) {
            setFeedback({ open: true, message: "Selecciona un estudiante.", severity: "error" });
            return;
        }
        interface NewInscripcion {
            estudiante_id: number;
            cohorte_id: number;
            modulo_id: number;
            estado: string;
        }
        const inscripcionesACrear: NewInscripcion[] = [];
        Object.entries(selectedModulos).forEach(([cohorteIdStr, mods]) => {
            const cohorteId = Number(cohorteIdStr);
            mods.forEach((moduloId) => {
                inscripcionesACrear.push({
                    estudiante_id: Number(selectedStudent),
                    cohorte_id: cohorteId,
                    modulo_id: moduloId,
                    estado: "CURSANDO",
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
            const errObj = error as { response?: { data?: unknown }; message?: string };
            const msg = errObj.response?.data ? JSON.stringify(errObj.response.data) : errObj.message || "Error";
            setFeedback({ open: true, message: `Error al inscribir: ${msg}`, severity: "error" });
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteInscripcion.mutateAsync(id);
            setFeedback({ open: true, message: "Inscripcion eliminada", severity: "success" });
            refetchInscripciones();
            setInscToDelete(null); // Close confirmation dialog
        } catch (error) {
            const errObj = error as { response?: { data?: unknown }; message?: string };
            const msg = errObj.response?.data ? JSON.stringify(errObj.response.data) : errObj.message || "Error";
            setFeedback({ open: true, message: `No se pudo eliminar: ${msg}`, severity: "error" });
        }
    };

    const handleUpdateEstado = async (r: ExtendedInscripcion, nuevoEstado: string) => {
        try {
            await saveInscripcion.mutateAsync({
                id: r.id,
                estado: nuevoEstado,
                estudiante_id: r.estudiante?.id ?? r.estudiante_id,
                cohorte_id: r.cohorte?.id ?? r.cohorte_id,
                modulo_id: r.modulo?.id ?? r.modulo_id,
            });
            setFeedback({ open: true, message: "Estado actualizado", severity: "success" });
            refetchInscripciones();
        } catch (err) {
            setFeedback({ open: true, message: "Error al actualizar estado", severity: "error" });
            throw err;
        }
    };

    const handleListFilterChange = (updates: Partial<{
        filterListProgramaName: string;
        filterListBloqueName: string;
        filterListModuloName: string;
        filterListCohorteName: string;
        filterListEstado: string;
        inscripcionSearch: string;
    }>) => {
        if (updates.hasOwnProperty("filterListProgramaName")) {
            setFilterListProgramaName(updates.filterListProgramaName!);
            setFilterListBloqueName("");
            setFilterListModuloName("");
            setFilterListCohorteName("");
        } else if (updates.hasOwnProperty("filterListBloqueName")) {
            setFilterListBloqueName(updates.filterListBloqueName!);
            setFilterListModuloName("");
            setFilterListCohorteName("");
        } else if (updates.hasOwnProperty("filterListModuloName")) {
            setFilterListModuloName(updates.filterListModuloName!);
            setFilterListCohorteName("");
        } else {
            if (updates.hasOwnProperty("filterListCohorteName")) setFilterListCohorteName(updates.filterListCohorteName!);
            if (updates.hasOwnProperty("filterListEstado")) setFilterListEstado(updates.filterListEstado!);
            if (updates.hasOwnProperty("inscripcionSearch")) setInscripcionSearch(updates.inscripcionSearch!);
        }
        setPage(0);
    };

    const filteredInscripciones = useMemo(() => {
        const needle = inscripcionSearch.trim().toLowerCase();
        return inscripciones.filter((r) => {
            if (filterListProgramaName && r.cohorte?.programa?.nombre !== filterListProgramaName) return false;
            if (filterListBloqueName && r.cohorte?.bloque?.nombre !== filterListBloqueName) return false;
            if (filterListModuloName && r.modulo?.nombre !== filterListModuloName) return false;
            if (filterListCohorteName && r.cohorte?.nombre !== filterListCohorteName) return false;
            if (filterListEstado && r.estado !== filterListEstado) return false;

            if (!needle) return true;

            const apellido = (r.estudiante?.apellido || "").toLowerCase();
            const nombre = (r.estudiante?.nombre || "").toLowerCase();
            const dni = String(r.estudiante?.dni || "").toLowerCase();
            const full = `${apellido} ${nombre}`;
            const modulo = (r.modulo?.nombre || "").toLowerCase();
            const cohorte = (r.cohorte?.nombre || "").toLowerCase();
            return apellido.includes(needle) || nombre.includes(needle) || full.includes(needle) || dni.includes(needle) || modulo.includes(needle) || cohorte.includes(needle);
        });
    }, [inscripciones, inscripcionSearch, filterListProgramaName, filterListBloqueName, filterListModuloName, filterListCohorteName, filterListEstado]);

    const tableProgramaOpts = useMemo(() => {
        const set = new Set<string>();
        inscripciones.forEach(i => { if (i.cohorte?.programa?.nombre) set.add(i.cohorte.programa.nombre); });
        return Array.from(set).sort((a,b) => a.localeCompare(b));
    }, [inscripciones]);

    const tableBloqueOpts = useMemo(() => {
        const set = new Set<string>();
        inscripciones.forEach(i => { 
            if (filterListProgramaName && i.cohorte?.programa?.nombre !== filterListProgramaName) return;
            if (i.cohorte?.bloque?.nombre) set.add(i.cohorte.bloque.nombre); 
        });
        return Array.from(set).sort((a,b) => a.localeCompare(b));
    }, [inscripciones, filterListProgramaName]);

    const tableModuloOpts = useMemo(() => {
        const set = new Set<string>();
        inscripciones.forEach(i => { 
            if (filterListProgramaName && i.cohorte?.programa?.nombre !== filterListProgramaName) return;
            if (filterListBloqueName && i.cohorte?.bloque?.nombre !== filterListBloqueName) return;
            if (i.modulo?.nombre) set.add(i.modulo.nombre); 
        });
        return Array.from(set).sort((a,b) => a.localeCompare(b));
    }, [inscripciones, filterListProgramaName, filterListBloqueName]);

    const tableCohorteOpts = useMemo(() => {
        const set = new Set<string>();
        inscripciones.forEach(i => { 
            if (filterListProgramaName && i.cohorte?.programa?.nombre !== filterListProgramaName) return;
            if (filterListBloqueName && i.cohorte?.bloque?.nombre !== filterListBloqueName) return;
            if (filterListModuloName && i.modulo?.nombre !== filterListModuloName) return;
            if (i.cohorte?.nombre) set.add(i.cohorte.nombre); 
        });
        
        return Array.from(set).sort((a, b) => {
            const regex = /(\d+)(?:º|°|rta|era|da|ra|\s)?\s*Cohorte\s*(\d{4})/i;
            const matchA = a.match(regex);
            const matchB = b.match(regex);
            
            if (matchA && matchB) {
                const numA = parseInt(matchA[1], 10);
                const yearA = parseInt(matchA[2], 10);
                const numB = parseInt(matchB[1], 10);
                const yearB = parseInt(matchB[2], 10);
                
                if (yearA !== yearB) {
                    return yearB - yearA; // Año descendente (2026, 2025, ...)
                }
                return numA - numB; // Número ascendente (1, 2, 3, ...)
            }
            return a.localeCompare(b);
        });
    }, [inscripciones, filterListProgramaName, filterListBloqueName, filterListModuloName]);

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

    const studentOptions = useMemo(() => filteredEstudiantes.map(s => {
        const age = calculateAge(s.fecha_nacimiento);
        const ageLabel = age !== null ? (age < 18 ? ` - ${age} años 👶` : ` - ${age} años`) : "";
        return { value: s.id, label: `${s.apellido}, ${s.nombre} (${s.dni})${ageLabel}` };
    }), [filteredEstudiantes]);

    const todayIso = useMemo(() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    }, []);

    const isVigenteHoy = (c: Cohorte) => {
        if (!c?.fecha_inicio || !c?.fecha_fin) return false;
        return c.fecha_inicio <= todayIso && c.fecha_fin >= todayIso;
    };

    const applyPeriodoFilter = (items: Cohorte[]) => {
        if (filterPeriodo === "TODAS") return items;
        if (filterPeriodo === "VIGENTE_HOY") return items.filter(isVigenteHoy);

        const vigentes = items.filter(isVigenteHoy);
        if (vigentes.length > 0) return vigentes;

        const futuras = items.filter((c) => c?.fecha_inicio && c.fecha_inicio > todayIso);
        if (futuras.length === 0) return [];
        const proximaFecha = futuras.reduce((min, c) => {
            const start = c.fecha_inicio || "";
            return (start < min ? start : min);
        }, futuras[0].fecha_inicio || "");
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
        const uniq = Array.from(
            new Set(
                base.map((c) => c.fecha_inicio).filter((x): x is string => !!x)
            )
        ).sort((a, b) => (a < b ? 1 : -1));
        return [{ value: "", label: "Todos" }, ...uniq.map((d) => ({ value: d, label: formatDateDisplay(d) }))];
    }, [cohortes, filterPeriodo, filterProgramaId, filterBloqueId, filterCohorteId, todayIso]);

    const getModuloNivel = (modulo: { id: number; nombre: string }, all: { id: number; nombre: string }[] = []) => {
        const nombre = String(modulo?.nombre || "").toUpperCase();
        const match = nombre.match(/M[ÓO]DULO\s*([0-9]+|[IVXLCDM]+)/i);
        if (match?.[1]) {
            const token = match[1].toUpperCase();
            if (/^\d+$/.test(token)) return Number(token);
            const vals: { [key: string]: number } = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
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

    const visibleModulosByProgression = (modulos: LocalModulo[]) => {
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

            <AddInscripcionForm
                studentSearch={studentSearch}
                onStudentSearchChange={setStudentSearch}
                selectedStudent={selectedStudent}
                onStudentChange={handleStudentChange}
                studentOptions={studentOptions}
                filteredEstudiantesCount={filteredEstudiantes.length}
                filterPeriodo={filterPeriodo}
                onFilterPeriodoChange={setFilterPeriodo}
                filterProgramaId={filterProgramaId}
                onFilterProgramaIdChange={setFilterProgramaId}
                filterBloqueId={filterBloqueId}
                onFilterBloqueIdChange={setFilterBloqueId}
                filterCohorteId={filterCohorteId}
                onFilterCohorteIdChange={setFilterCohorteId}
                filterInicio={filterInicio}
                onFilterInicioChange={setFilterInicio}
                programas={programas}
                bloquesOptions={bloquesOptions}
                cohortesOptions={cohortesOptions}
                inicioOptions={inicioOptions}
                cohortesFiltered={cohortesFiltered}
                selectedCohortes={selectedCohortes}
                onCohorteToggle={handleCohorteToggle}
                programaMap={programaMap}
                bloquesMap={bloquesMap}
                cohorteBloques={cohorteBloques}
                loadingBloques={loadingBloques}
                approvedModuleIds={approvedModuleIds}
                inscripcionesAlumnoSet={inscripcionesAlumnoSet}
                selectedModulos={selectedModulos}
                onModuloToggle={handleModuloToggle}
                onModuloProgressionFilter={visibleModulosByProgression}
                onSubmit={handleSubmit}
                isSaving={saveInscripcion.isPending}
            />

            {/* Tabla de Inscripciones */}
            <div className="space-y-4 pt-4 border-t border-indigo-500/20">
                <InscripcionesFilters
                    filterListProgramaName={filterListProgramaName}
                    filterListBloqueName={filterListBloqueName}
                    filterListModuloName={filterListModuloName}
                    filterListCohorteName={filterListCohorteName}
                    filterListEstado={filterListEstado}
                    inscripcionSearch={inscripcionSearch}
                    tableProgramaOpts={tableProgramaOpts}
                    tableBloqueOpts={tableBloqueOpts}
                    tableModuloOpts={tableModuloOpts}
                    tableCohorteOpts={tableCohorteOpts}
                    onFilterChange={handleListFilterChange}
                />

                <Card className="bg-indigo-900/10 border-indigo-500/20 overflow-hidden">
                    <InscripcionesTable
                        rows={paginatedInscripciones}
                        isLoading={loadingInscripciones}
                        page={page}
                        rowsPerPage={rowsPerPage}
                        totalRows={filteredInscripciones.length}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        onRowsPerPageChange={(rows) => { setRowsPerPage(rows); setPage(0); }}
                        onUpdateEstado={handleUpdateEstado}
                        onSendWhatsApp={handleSendWhatsApp}
                        onDelete={setInscToDelete}
                    />
                </Card>
            </div >

            {feedback.open && (
                <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-xl border flex items-center gap-2 animate-fade-in ${feedback.severity === 'error' ? 'bg-red-900/90 border-red-500 text-white' :
                    feedback.severity === 'warning' ? 'bg-amber-600/90 border-amber-400 text-white' :
                        'bg-green-900/90 border-green-500 text-white'
                    }`}>
                    {feedback.severity === 'error' ? <AlertCircle /> : <CheckCircle />}
                    {feedback.message}
                    <button onClick={() => setFeedback({ ...feedback, open: false })} className="ml-4 hover:text-gray-300"><X size={14} /></button>
                </div>
            )}

            <ModalConfirmDelete
                isOpen={!!inscToDelete}
                onClose={() => setInscToDelete(null)}
                inscToDelete={inscToDelete}
                onConfirm={handleDelete}
            />
        </div >
    );
}
