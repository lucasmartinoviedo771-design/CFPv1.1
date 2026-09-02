import React, { useState, useContext } from "react";
import { useQuery } from '@tanstack/react-query';
import { apiClientV2 } from "../api/client";
import { Card, Button } from '../components/UI';
import { Check, AlertCircle, XCircle, ChevronDown, ChevronRight } from 'lucide-react';
import type { Inscripcion, EstudianteDetail } from "../api/types";
import { ActivePanelContext } from "../App";

// Extended type for the pending endpoint
type EstudiantePendiente = EstudianteDetail & {
    inscripciones: Inscripcion[];
};

export default function ConfirmarBloques() {
    const { activePanel } = useContext(ActivePanelContext);
    const [selectedInscripciones, setSelectedInscripciones] = useState<Set<number>>(new Set());
    const [expandedStudents, setExpandedStudents] = useState<Set<number>>(new Set());
    const [confirming, setConfirming] = useState(false);
    const [feedback, setFeedback] = useState({ open: false, message: "", severity: "success" });

    const { data: estudiantes = [], isLoading, refetch } = useQuery<EstudiantePendiente[]>({
        queryKey: ['confirmar-bloques-pendientes', activePanel],
        queryFn: async () => {
            const res = await apiClientV2.get('/confirmar-bloques/pendientes', { params: { panel: activePanel } });
            return res.data;
        }
    });

    const toggleStudentExpansion = (studentId: number) => {
        const next = new Set(expandedStudents);
        if (next.has(studentId)) next.delete(studentId);
        else next.add(studentId);
        setExpandedStudents(next);
    };

    const toggleInscripcion = (inscripcionId: number) => {
        const next = new Set(selectedInscripciones);
        if (next.has(inscripcionId)) next.delete(inscripcionId);
        else next.add(inscripcionId);
        setSelectedInscripciones(next);
    };

    const handleConfirm = async () => {
        if (selectedInscripciones.size === 0) return;
        if (!window.confirm(`¿Confirmar ${selectedInscripciones.size} bloque(s) seleccionado(s)?`)) return;

        setConfirming(true);
        try {
            await apiClientV2.post('/confirmar-bloques/confirmar-seleccion/', {
                inscripciones_ids: Array.from(selectedInscripciones)
            });
            setFeedback({ open: true, message: `Bloques confirmados con éxito.`, severity: "success" });
            setSelectedInscripciones(new Set());
            refetch();
        } catch (error) {
            console.error("Error al confirmar bloques:", error);
            setFeedback({ open: true, message: "Error al confirmar bloques.", severity: "error" });
        } finally {
            setConfirming(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-indigo-200">Cargando...</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Confirmar Bloques / Materias</h1>
                    <p className="text-indigo-200 mt-1">Selecciona qué bloques confirmar para los estudiantes preinscriptos.</p>
                </div>
                
                <Button 
                    onClick={handleConfirm}
                    disabled={selectedInscripciones.size === 0 || confirming}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                    {confirming ? "Confirmando..." : `Confirmar Selección (${selectedInscripciones.size})`}
                </Button>
            </div>

            <Card className="bg-indigo-900/20 border-indigo-500/20">
                <div className="divide-y divide-indigo-500/20">
                    {estudiantes.length === 0 && (
                        <div className="p-8 text-center text-indigo-300">
                            No hay inscripciones pendientes por confirmar.
                        </div>
                    )}
                    {estudiantes.map(estudiante => {
                        const isExpanded = expandedStudents.has(estudiante.id);
                        const pendingInscriptions = estudiante.inscripciones?.filter(i => i.estado === "PREINSCRIPTO") || [];
                        if (pendingInscriptions.length === 0) return null;

                        const allSelected = pendingInscriptions.every(i => selectedInscripciones.has(i.id));
                        const someSelected = pendingInscriptions.some(i => selectedInscripciones.has(i.id));

                        return (
                            <div key={estudiante.id} className="p-4 flex flex-col">
                                <div className="flex items-center gap-4 cursor-pointer" onClick={() => toggleStudentExpansion(estudiante.id)}>
                                    <div className="text-indigo-400">
                                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-white font-medium">{estudiante.apellido}, {estudiante.nombre}</div>
                                        <div className="text-indigo-300 text-sm">DNI: {estudiante.dni} | {pendingInscriptions.length} bloque(s) pendiente(s)</div>
                                    </div>
                                    <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                                        <input 
                                            type="checkbox" 
                                            className="w-5 h-5 rounded border-indigo-500/30 bg-indigo-900/30 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-gray-900"
                                            checked={allSelected}
                                            ref={input => {
                                                if (input) input.indeterminate = !allSelected && someSelected;
                                            }}
                                            onChange={() => {
                                                const next = new Set(selectedInscripciones);
                                                if (allSelected) {
                                                    pendingInscriptions.forEach(i => next.delete(i.id));
                                                } else {
                                                    pendingInscriptions.forEach(i => next.add(i.id));
                                                }
                                                setSelectedInscripciones(next);
                                            }}
                                        />
                                    </div>
                                </div>
                                
                                {isExpanded && (
                                    <div className="mt-4 pl-10 space-y-2">
                                        {pendingInscriptions.map(insc => (
                                            <div key={insc.id} className="flex items-center gap-3 p-2 rounded bg-indigo-900/10 hover:bg-indigo-900/30 border border-indigo-500/10">
                                                <input 
                                                    type="checkbox" 
                                                    className="w-4 h-4 rounded border-indigo-500/30 bg-indigo-900/30 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-gray-900"
                                                    checked={selectedInscripciones.has(insc.id)}
                                                    onChange={() => toggleInscripcion(insc.id)}
                                                />
                                                <div className="text-sm text-indigo-100 flex-1">
                                                    <span className="font-medium">{insc.cohorte?.programa?.nombre || 'S/P'}</span>
                                                    <span className="text-indigo-400 mx-2">|</span>
                                                    <span>{insc.modulo?.nombre || insc.cohorte?.bloque?.nombre || 'Bloque General'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </Card>

            {feedback.open && (
                <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-xl border flex items-center gap-2 animate-fade-in z-[60] ${feedback.severity === 'error' ? 'bg-red-900/90 border-red-500 text-white' : 'bg-green-900/90 border-green-500 text-white'}`}>
                    {feedback.severity === 'error' ? <AlertCircle size={20} /> : <Check size={20} />}
                    {feedback.message}
                    <button onClick={() => setFeedback({ ...feedback, open: false })} className="ml-4 hover:text-gray-300"><XCircle size={14} /></button>
                </div>
            )}
        </div>
    );
}
