import React, { useMemo, useState, useContext } from "react";
import { UserContext } from "../App";
import { useEstudiantes } from "../api/hooks";
import { apiClientV2 } from "../api/client";
import { Card } from '../components/UI';
import { Check, AlertCircle, XCircle } from 'lucide-react';
import { Aspirante, FeedbackState, OrderingState } from "../components/GestionPreinscripciones/types";
import PreinscripcionesHeader from "../components/GestionPreinscripciones/PreinscripcionesHeader";
import PreinscripcionesTable from "../components/GestionPreinscripciones/PreinscripcionesTable";
import AspiranteDetailModal from "../components/GestionPreinscripciones/AspiranteDetailModal";

export default function GestionPreinscripciones() {
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [approving, setApproving] = useState<boolean>(false);
    const [feedback, setFeedback] = useState<FeedbackState>({ open: false, message: "", severity: "success" });
    const [viewStudent, setViewStudent] = useState<Aspirante | null>(null);
    const { user } = useContext(UserContext);
    const isAdmin = user?.groups?.includes('Admin');
    const isPreceptor = user?.groups?.includes('Preceptor');
    const canDelete = isAdmin || isPreceptor;
    const [ordering, setOrdering] = useState<OrderingState>({ field: "created_at", direction: "desc" });
    const [viewArchived, setViewArchived] = useState<boolean>(false);

    // Fetch only students with status 'Preinscripto'
    const { data, isLoading, refetch } = useEstudiantes({
        estatus: 'Preinscripto',
        archived: viewArchived,
        excluir_terciario: true
    });

    const preinscriptos = (data as Aspirante[]) || [];

    const handleSort = (field: string) => {
        setOrdering(prev => ({
            field,
            direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc"
        }));
    };

    const sortedAndFiltered = useMemo(() => {
        const needle = searchTerm.toLowerCase();
        const result = preinscriptos.filter(s =>
            (s.apellido || '').toLowerCase().includes(needle) ||
            (s.nombre || '').toLowerCase().includes(needle) ||
            (s.dni || '').includes(needle)
        );

        return result.sort((a, b) => {
            const dir = ordering.direction === "asc" ? 1 : -1;
            let valA: string | number = "";
            let valB: string | number = "";

            switch (ordering.field) {
                case 'dni':
                    valA = a.dni || "";
                    valB = b.dni || "";
                    break;
                case 'estudiante':
                    valA = `${a.apellido || ''} ${a.nombre || ''}`.toLowerCase();
                    valB = `${b.apellido || ''} ${b.nombre || ''}`.toLowerCase();
                    break;
                case 'trayectos':
                    valA = (a.trayectos?.[0] || "").toLowerCase();
                    valB = (b.trayectos?.[0] || "").toLowerCase();
                    break;
                case 'created_at':
                    valA = a.created_at || "";
                    valB = b.created_at || "";
                    break;
                case 'archivos':
                    valA = (a.dni_digitalizado ? 1 : 0) + (a.titulo_secundario_digitalizado ? 1 : 0);
                    valB = (b.dni_digitalizado ? 1 : 0) + (b.titulo_secundario_digitalizado ? 1 : 0);
                    break;
                default:
                    return 0;
            }

            if (valA < valB) return -1 * dir;
            if (valA > valB) return 1 * dir;
            return 0;
        });
    }, [preinscriptos, searchTerm, ordering]);

    const toggleSelect = (id: number) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === sortedAndFiltered.length) {
            setSelectedIds(new Set<number>());
        } else {
            setSelectedIds(new Set<number>(sortedAndFiltered.map(s => s.id)));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        
        // Si es Admin, puede elegir entre archivado (lógico) o borrado (físico)
        const isPhysical = isAdmin && window.confirm(`¿Deseas ELIMINAR COMPLETAMENTE a ${selectedIds.size} estudiante(s)?\n\n- Aceptar: Borrado Físico (Irreversible)\n- Cancelar: Volver`);
        
        if (!isPhysical) return;

        setApproving(true);
        try {
            await apiClientV2.post('/estudiantes/bulk_delete/', { ids: Array.from(selectedIds) });
            setFeedback({ open: true, message: `${selectedIds.size} estudiante(s) eliminados físicamente.`, severity: "success" });
            setSelectedIds(new Set<number>());
            refetch();
        } catch (error: unknown) {
            console.error("Error al eliminar físicamente:", error);
            setFeedback({ open: true, message: "Error al eliminar estudiantes.", severity: "error" });
        } finally {
            setApproving(false);
        }
    };

    const handleBulkArchive = async () => {
        if (selectedIds.size === 0) return;
        if (!window.confirm(`¿Seguro que deseas quitar/archivar a ${selectedIds.size} estudiante(s) de esta lista? El registro se mantendrá en la base de datos pero no figurará más en las colas.`)) return;

        setApproving(true);
        try {
            await apiClientV2.post('/estudiantes/bulk_archive/', { ids: Array.from(selectedIds) });
            setFeedback({ open: true, message: `${selectedIds.size} estudiante(s) archivados con éxito.`, severity: "success" });
            setSelectedIds(new Set<number>());
            refetch();
        } catch (error: unknown) {
            console.error("Error al archivar estudiantes:", error);
            setFeedback({ open: true, message: "Error al archivar estudiantes.", severity: "error" });
        } finally {
            setApproving(false);
        }
    };

    const handleBulkApprove = async () => {
        if (selectedIds.size === 0) return;
        if (!window.confirm(`¿Seguro que deseas aprobar a ${selectedIds.size} estudiante(s)?`)) return;

        setApproving(true);
        try {
            await apiClientV2.post('/estudiantes/bulk_approve/', { ids: Array.from(selectedIds) });
            setFeedback({ open: true, message: `${selectedIds.size} estudiante(s) aprobados con éxito.`, severity: "success" });
            setSelectedIds(new Set<number>());
            refetch();
        } catch (error: unknown) {
            console.error("Error al aprobar estudiantes:", error);
            setFeedback({ open: true, message: "Error al aprobar estudiantes.", severity: "error" });
        } finally {
            setApproving(false);
        }
    };

    const handleBulkRestore = async () => {
        if (selectedIds.size === 0) return;
        if (!window.confirm(`¿Restaurar a ${selectedIds.size} estudiante(s)? Volverán a figurar en la cola principal.`)) return;

        setApproving(true);
        try {
            await apiClientV2.post('/estudiantes/bulk_restore/', { ids: Array.from(selectedIds) });
            setFeedback({ open: true, message: `${selectedIds.size} estudiante(s) restaurados con éxito.`, severity: "success" });
            setSelectedIds(new Set<number>());
            refetch();
        } catch (error: unknown) {
            console.error("Error al restaurar estudiantes:", error);
            setFeedback({ open: true, message: "Error al restaurar estudiantes.", severity: "error" });
        } finally {
            setApproving(false);
        }
    };

    const handleSingleArchive = async (s: Aspirante) => {
        if (window.confirm(`¿Archivar a ${s.apellido}, ${s.nombre}? No figurará más en las colas pero el registro se mantiene.`)) {
            try {
                await apiClientV2.post('/estudiantes/bulk_archive/', { ids: [s.id] });
                setFeedback({ open: true, message: "Estudiante archivado correctamente.", severity: "success" });
                refetch();
            } catch (e: unknown) {
                console.error("Error al archivar:", e);
                setFeedback({ open: true, message: "Error al archivar.", severity: "error" });
            }
        }
    };

    const handleSingleDeletePhysical = async (s: Aspirante) => {
        if (window.confirm(`¿ELIMINAR PERMANENTEMENTE a ${s.apellido}, ${s.nombre}? ESTA ACCIÓN ES IRREVERSIBLE.`)) {
            try {
                await apiClientV2.post('/estudiantes/bulk_delete/', { ids: [s.id] });
                setFeedback({ open: true, message: "Estudiante eliminado físicamente.", severity: "success" });
                refetch();
            } catch (e: unknown) {
                console.error("Error al eliminar físicamente:", e);
                setFeedback({ open: true, message: "Error al eliminar físicamente.", severity: "error" });
            }
        }
    };

    const handleSingleRestore = async (s: Aspirante) => {
        try {
            await apiClientV2.post('/estudiantes/bulk_restore/', { ids: [s.id] });
            setFeedback({ open: true, message: "Estudiante restaurado.", severity: "success" });
            refetch();
        } catch (e: unknown) {
            console.error("Error al restaurar:", e);
            setFeedback({ open: true, message: "Error al restaurar.", severity: "error" });
        }
    };

    const handleApproveSingleFromModal = async () => {
        if (!viewStudent) return;
        setApproving(true);
        try {
            await apiClientV2.post('/estudiantes/bulk_approve/', { ids: [viewStudent.id] });
            setFeedback({ open: true, message: `Estudiante aprobado con éxito.`, severity: "success" });
            setViewStudent(null);
            refetch();
        } catch (e: unknown) {
            console.error("Error al aprobar:", e);
            setFeedback({ open: true, message: "Error al aprobar.", severity: "error" });
        } finally {
            setApproving(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <PreinscripcionesHeader
                selectedCount={selectedIds.size}
                approving={approving}
                canDelete={!!canDelete}
                isAdmin={!!isAdmin}
                viewArchived={viewArchived}
                onBulkArchive={handleBulkArchive}
                onBulkDelete={handleBulkDelete}
                onBulkApprove={handleBulkApprove}
                onBulkRestore={handleBulkRestore}
                onViewArchivedChange={(val) => {
                    setViewArchived(val);
                    setSelectedIds(new Set<number>());
                }}
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                onRefetch={refetch}
            />

            <Card className="bg-indigo-900/10 border-indigo-500/20">
                <PreinscripcionesTable
                    isLoading={isLoading}
                    sortedAndFiltered={sortedAndFiltered}
                    selectedIds={selectedIds}
                    onToggleSelectAll={toggleSelectAll}
                    onToggleSelect={toggleSelect}
                    onSort={handleSort}
                    ordering={ordering}
                    viewArchived={viewArchived}
                    canDelete={!!canDelete}
                    isAdmin={!!isAdmin}
                    onViewStudent={setViewStudent}
                    onArchive={handleSingleArchive}
                    onDeletePhysical={handleSingleDeletePhysical}
                    onRestore={handleSingleRestore}
                />
            </Card>

            {feedback.open && (
                <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-xl border flex items-center gap-2 animate-fade-in z-[60] ${feedback.severity === 'error' ? 'bg-red-900/90 border-red-500 text-white' : 'bg-green-900/90 border-green-500 text-white'}`}>
                    {feedback.severity === 'error' ? <AlertCircle size={20} /> : <Check size={20} />}
                    {feedback.message}
                    <button onClick={() => setFeedback({ ...feedback, open: false })} className="ml-4 hover:text-gray-300"><XCircle size={14} /></button>
                </div>
            )}

            {viewStudent && (
                <AspiranteDetailModal
                    viewStudent={viewStudent}
                    onClose={() => setViewStudent(null)}
                    onApprove={handleApproveSingleFromModal}
                />
            )}
        </div>
    );
}
