import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useEstudiantes, useSaveEstudiante } from "../api/hooks";
import { apiClientV2 } from "../api/client";
import { Card, Button, Input, Select } from '../components/UI';
import {
    CheckCircle, XCircle, Search, Eye, FileText,
    Download, Check, AlertCircle, Loader, UserCheck
} from 'lucide-react';
import { formatDateDisplay } from "../utils/dateFormat";
import { getMediaUrl } from "../utils/media";

const SectionDivider = ({ title, icon: Icon }) => (
    <div className="flex items-center gap-2 text-indigo-300 border-b border-indigo-500/20 pb-2 mb-4 mt-6">
        {Icon && <Icon size={16} />}
        <span className="text-sm font-bold uppercase tracking-wider">{title}</span>
    </div>
);

export default function GestionPreinscripciones() {
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState("");
    const [approving, setApproving] = useState(false);
    const [feedback, setFeedback] = useState({ open: false, message: "", severity: "success" });
    const [viewStudent, setViewStudent] = useState(null);

    // Fetch only students with status 'Preinscripto'
    const { data: preinscriptos = [], isLoading, refetch } = useEstudiantes({
        estatus: 'Preinscripto',
    });

    const filtered = useMemo(() => {
        const needle = searchTerm.toLowerCase();
        return preinscriptos.filter(s =>
            s.apellido.toLowerCase().includes(needle) ||
            s.nombre.toLowerCase().includes(needle) ||
            s.dni.includes(needle)
        );
    }, [preinscriptos, searchTerm]);

    const toggleSelect = (id) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filtered.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filtered.map(s => s.id)));
        }
    };

    const handleBulkApprove = async () => {
        if (selectedIds.size === 0) return;
        if (!window.confirm(`¿Seguro que deseas aprobar a ${selectedIds.size} estudiante(s)?`)) return;

        setApproving(true);
        try {
            await apiClientV2.post('/estudiantes/bulk_approve/', { ids: Array.from(selectedIds) });
            setFeedback({ open: true, message: `${selectedIds.size} estudiante(s) aprobados con éxito.`, severity: "success" });
            setSelectedIds(new Set());
            refetch();
        } catch (error) {
            setFeedback({ open: true, message: "Error al aprobar estudiantes.", severity: "error" });
        } finally {
            setApproving(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Cola de Preinscripciones</h1>
                    <p className="text-indigo-300">Revisión y aprobación masiva de nuevos Estudiantes.</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        onClick={handleBulkApprove}
                        disabled={selectedIds.size === 0 || approving}
                        className="bg-emerald-600 hover:bg-emerald-500 border-none px-6"
                        startIcon={approving ? <Loader className="animate-spin" size={18} /> : <UserCheck size={18} />}
                    >
                        Aprobar Seleccionados ({selectedIds.size})
                    </Button>
                </div>
            </div>

            <Card className="bg-indigo-900/10 border-indigo-500/20">
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-indigo-400">
                            <Search size={18} />
                        </div>
                        <Input
                            placeholder="Buscar por DNI, Nombre o Apellido..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-indigo-950/50 pl-10"
                        />
                    </div>
                    <Button onClick={() => refetch()} variant="ghost" className="text-indigo-300">Actualizar</Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#1e1b4b] text-indigo-300 uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3 w-10">
                                    <input
                                        type="checkbox"
                                        className="rounded bg-indigo-900 border-indigo-500"
                                        checked={filtered.length > 0 && selectedIds.size === filtered.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="px-6 py-3">DNI</th>
                                <th className="px-6 py-3">Estudiante</th>
                                <th className="px-6 py-3">Trayectos</th>
                                <th className="px-6 py-3">Fecha Preins.</th>
                                <th className="px-6 py-3">Archivos</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-500/10">
                            {isLoading ? (
                                <tr><td colSpan={7} className="text-center py-8 text-indigo-300"><Loader className="animate-spin inline mr-2" />Cargando aspirantes...</td></tr>
                            ) : filtered.map(s => (
                                <tr key={s.id} className={`hover:bg-white/5 transition-colors ${selectedIds.has(s.id) ? 'bg-indigo-500/10' : ''}`}>
                                    <td className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            className="rounded bg-indigo-900 border-indigo-500 text-brand-accent focus:ring-brand-accent"
                                            checked={selectedIds.has(s.id)}
                                            onChange={() => toggleSelect(s.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-3 font-mono text-indigo-200">{s.dni}</td>
                                    <td className="px-6 py-3">
                                        <div className="text-white font-medium">{s.apellido}, {s.nombre}</div>
                                        <div className="text-xs text-indigo-400">{s.email}</div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {s.trayectos?.map((t, idx) => (
                                                <span key={idx} className="text-[10px] bg-indigo-500/20 text-indigo-200 px-1.5 py-0.5 rounded border border-indigo-500/30">
                                                    {t}
                                                </span>
                                            ))}
                                            {(!s.trayectos || s.trayectos.length === 0) && <span className="text-xs text-gray-500">-</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-indigo-300">{formatDateDisplay(s.created_at)}</td>
                                    <td className="px-6 py-3">
                                        <div className="flex gap-2">
                                            {s.dni_digitalizado ? (
                                                <a href={getMediaUrl(s.dni_digitalizado)} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 bg-indigo-500/20 hover:bg-indigo-500/40 px-2 py-1 rounded text-cyan-300 transition-colors">
                                                    <FileText size={12} /> DNI
                                                </a>
                                            ) : (
                                                <span className="text-xs text-red-400/60 flex items-center gap-1"><XCircle size={12} /> DNI</span>
                                            )}
                                            {s.titulo_secundario_digitalizado ? (
                                                <a href={getMediaUrl(s.titulo_secundario_digitalizado)} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 bg-indigo-500/20 hover:bg-indigo-500/40 px-2 py-1 rounded text-emerald-300 transition-colors">
                                                    <FileText size={12} /> Título
                                                </a>
                                            ) : (
                                                <span className="text-xs text-gray-500 flex items-center gap-1"><XCircle size={12} /> Título</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <button
                                            onClick={() => setViewStudent(s)}
                                            className="p-2 text-brand-cyan hover:text-white transition-colors"
                                            title="Ver detalle completo"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!isLoading && filtered.length === 0 && (
                                <tr><td colSpan={7} className="text-center py-12 text-indigo-300">No hay preinscripciones pendientes.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {feedback.open && (
                <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-xl border flex items-center gap-2 animate-fade-in z-[60] ${feedback.severity === 'error' ? 'bg-red-900/90 border-red-500 text-white' : 'bg-green-900/90 border-green-500 text-white'}`}>
                    {feedback.severity === 'error' ? <AlertCircle size={20} /> : <Check size={20} />}
                    {feedback.message}
                    <button onClick={() => setFeedback({ ...feedback, open: false })} className="ml-4 hover:text-gray-300"><XCircle size={14} /></button>
                </div>
            )}

            {viewStudent && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/80 backdrop-blur-sm animate-fade-in">
                    <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-indigo-900/90 border-indigo-500/30 shadow-2xl relative">
                        <button
                            onClick={() => setViewStudent(null)}
                            className="absolute top-4 right-4 text-indigo-300 hover:text-white transition-colors"
                        >
                            <XCircle size={24} />
                        </button>

                        <div className="p-2">
                            <h2 className="text-2xl font-bold text-white mb-1">{viewStudent.apellido}, {viewStudent.nombre}</h2>
                            <p className="text-indigo-300 mb-6 font-mono">{viewStudent.dni}</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <SectionDivider title="Datos Personales" icon={Search} />
                                    <div className="space-y-2 text-sm">
                                        <p><span className="text-indigo-400">Email:</span> <span className="text-white">{viewStudent.email}</span></p>
                                        <p><span className="text-indigo-400">Teléfono:</span> <span className="text-white">{viewStudent.telefono || '-'}</span></p>
                                        <p><span className="text-indigo-400">Fecha Nac.:</span> <span className="text-white">{viewStudent.fecha_nacimiento || '-'}</span></p>
                                        <p><span className="text-indigo-400">Domicilio:</span> <span className="text-white">{viewStudent.domicilio || '-'}, {viewStudent.ciudad || '-'}</span></p>
                                    </div>

                                    <SectionDivider title="Trayectos Solicitados" icon={FileText} />
                                    <div className="flex flex-wrap gap-2">
                                        {viewStudent.trayectos?.map((t, idx) => (
                                            <span key={idx} className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30 text-xs">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <SectionDivider title="Documentación" icon={Download} />
                                    <div className="space-y-3">
                                        {viewStudent.dni_digitalizado ? (
                                            <a href={getMediaUrl(viewStudent.dni_digitalizado)} target="_blank" rel="noreferrer" className="flex items-center justify-between bg-indigo-500/20 hover:bg-indigo-500/40 p-3 rounded-lg text-cyan-300 transition-all border border-cyan-500/30">
                                                <span className="flex items-center gap-2"><FileText size={18} /> DNI Digitalizado</span>
                                                <Download size={18} />
                                            </a>
                                        ) : (
                                            <div className="p-3 rounded-lg border border-red-500/30 text-red-400 bg-red-900/20 text-sm">DNI no cargado</div>
                                        )}

                                        {viewStudent.titulo_secundario_digitalizado ? (
                                            <a href={getMediaUrl(viewStudent.titulo_secundario_digitalizado)} target="_blank" rel="noreferrer" className="flex items-center justify-between bg-indigo-500/20 hover:bg-indigo-500/40 p-3 rounded-lg text-emerald-300 transition-all border border-emerald-500/30">
                                                <span className="flex items-center gap-2"><FileText size={18} /> Título Secundario</span>
                                                <Download size={18} />
                                            </a>
                                        ) : (
                                            <div className="p-3 rounded-lg border border-white/10 text-gray-500 bg-white/5 text-sm">Título no cargado</div>
                                        )}
                                    </div>

                                    <SectionDivider title="Información Adicional" icon={AlertCircle} />
                                    <div className="space-y-2 text-sm text-indigo-200">
                                        <p>Posee PC: {viewStudent.posee_pc ? 'Sí' : 'No'}</p>
                                        <p>Conectividad: {viewStudent.posee_conectividad ? 'Sí' : 'No'}</p>
                                        <p>Trabaja: {viewStudent.trabaja ? 'Sí' : 'No'}</p>
                                        <p>Nivel Educativo: {viewStudent.nivel_educativo || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end gap-3">
                                <Button variant="ghost" onClick={() => setViewStudent(null)}>Cerrar</Button>
                                <Button
                                    className="bg-emerald-600 hover:bg-emerald-500"
                                    onClick={async () => {
                                        setApproving(true);
                                        try {
                                            await apiClientV2.post('/estudiantes/bulk_approve/', { ids: [viewStudent.id] });
                                            setFeedback({ open: true, message: `Estudiante aprobado con éxito.`, severity: "success" });
                                            setViewStudent(null);
                                            refetch();
                                        } catch (e) {
                                            setFeedback({ open: true, message: "Error al aprobar.", severity: "error" });
                                        } finally {
                                            setApproving(false);
                                        }
                                    }}
                                >
                                    Aprobar Estudiante
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>,
                document.body
            )}
        </div>
    );
}
