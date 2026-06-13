import React, { useState } from "react";
import { ExtendedInscripcion, ExtendedEstudiante, calculateAge } from "./types";
import { Button } from "../UI";
import { Trash2, Edit2, X, Save, MessageCircle, Baby, Loader } from "lucide-react";
import { formatDateDisplay } from "../../utils/dateFormat";

interface InscripcionesTableProps {
    rows: ExtendedInscripcion[];
    isLoading: boolean;
    page: number;
    rowsPerPage: number;
    totalRows: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onRowsPerPageChange: (rows: number) => void;
    onUpdateEstado: (r: ExtendedInscripcion, nuevoEstado: string) => Promise<void>;
    onSendWhatsApp: (student: ExtendedEstudiante) => void;
    onDelete: (insc: ExtendedInscripcion) => void;
}

export const InscripcionesTable: React.FC<InscripcionesTableProps> = ({
    rows,
    isLoading,
    page,
    rowsPerPage,
    totalRows,
    totalPages,
    onPageChange,
    onRowsPerPageChange,
    onUpdateEstado,
    onSendWhatsApp,
    onDelete,
}) => {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingEstado, setEditingEstado] = useState<string>("CURSANDO");
    const [isSaving, setIsSaving] = useState<boolean>(false);

    const handleSave = async (r: ExtendedInscripcion) => {
        setIsSaving(true);
        try {
            await onUpdateEstado(r, editingEstado);
            setEditingId(null);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="overflow-x-auto">
            {isLoading ? (
                <div className="p-8 flex justify-center">
                    <Loader className="animate-spin text-brand-accent" />
                </div>
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
                            {rows.map((r) => (
                                <tr key={r.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-3 font-medium">
                                        {r.estudiante ? (
                                            (() => {
                                                const age = calculateAge(r.estudiante.fecha_nacimiento);
                                                const isMinor = age !== null && age < 18;
                                                return (
                                                    <div className="flex items-center gap-2">
                                                        <span className={isMinor ? "text-orange-400 font-bold" : "text-white"}>
                                                            {r.estudiante.apellido}, {r.estudiante.nombre}
                                                        </span>
                                                        {age !== null && (
                                                            <span
                                                                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                                                    isMinor
                                                                        ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                                                                        : "bg-indigo-500/20 text-indigo-300"
                                                                }`}
                                                            >
                                                                {age} {isMinor && <Baby size={10} className="inline ml-0.5" />}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })()
                                        ) : (
                                            <span className="text-white">{r.estudiante_id}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 text-gray-300">
                                        {r.cohorte ? (
                                            <div className="space-y-1">
                                                <div>
                                                    <span className="text-indigo-200">Programa:</span> {r.cohorte.programa?.nombre || "-"}
                                                </div>
                                                <div>
                                                    <span className="text-indigo-200">Bloque:</span> {r.cohorte.bloque?.nombre || "-"}
                                                </div>
                                                <div>
                                                    <span className="text-indigo-200">Cohorte:</span> {r.cohorte.nombre || "-"}
                                                </div>
                                                <div>
                                                    <span className="text-indigo-200">Periodo:</span>{" "}
                                                    {formatDateDisplay(r.cohorte.fecha_inicio)} a {formatDateDisplay(r.cohorte.fecha_fin)}
                                                </div>
                                            </div>
                                        ) : (
                                            r.cohorte_id
                                        )}
                                    </td>
                                    <td className="px-6 py-3 text-gray-300">{r.modulo?.nombre || r.modulo_id || "N/A"}</td>
                                    <td className="px-6 py-3">
                                        {editingId === r.id ? (
                                            <select
                                                value={editingEstado}
                                                onChange={(e) => setEditingEstado(e.target.value)}
                                                className="bg-indigo-900 border border-indigo-500/50 text-white text-sm rounded px-2 py-1 w-full outline-none"
                                                disabled={isSaving}
                                            >
                                                <option value="PREINSCRIPTO">PREINSCRIPTO</option>
                                                <option value="CURSANDO">CURSANDO</option>
                                                <option value="INACTIVO">INACTIVO</option>
                                                <option value="LIBRE">LIBRE</option>
                                                <option value="PAUSADO">PAUSADO</option>
                                                <option value="EGRESADO">EGRESADO</option>
                                                <option value="APROBADO">APROBADO</option>
                                                <option value="DESAPROBADO">DESAPROBADO</option>
                                            </select>
                                        ) : (
                                            <span
                                                className={`px-2 py-1 rounded text-xs font-bold ${
                                                    r.estado === "CURSANDO"
                                                        ? "bg-green-500/20 text-green-400"
                                                        : r.estado === "INACTIVO"
                                                        ? "bg-red-500/20 text-red-400"
                                                        : r.estado === "LIBRE"
                                                        ? "bg-yellow-500/20 text-yellow-500"
                                                        : r.estado === "PREINSCRIPTO"
                                                        ? "bg-blue-500/20 text-blue-400"
                                                        : r.estado === "EGRESADO"
                                                        ? "bg-purple-500/20 text-purple-400"
                                                        : r.estado === "PAUSADO"
                                                        ? "bg-orange-500/20 text-orange-400"
                                                        : r.estado === "APROBADO"
                                                        ? "bg-teal-500/20 text-teal-400"
                                                        : r.estado === "DESAPROBADO"
                                                        ? "bg-rose-500/20 text-rose-400"
                                                        : "bg-indigo-500/20 text-indigo-400"
                                                }`}
                                            >
                                                {r.estado}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <div className="flex justify-end gap-3 text-indigo-300">
                                            {editingId === r.id ? (
                                                <>
                                                    <button
                                                        onClick={() => handleSave(r)}
                                                        disabled={isSaving}
                                                        className="text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
                                                        title="Guardar"
                                                    >
                                                        {isSaving ? <Loader size={18} className="animate-spin text-green-400" /> : <Save size={18} />}
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        disabled={isSaving}
                                                        className="text-gray-400 hover:text-gray-300 transition-colors disabled:opacity-50"
                                                        title="Cancelar"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="flex justify-end gap-2">
                                                    {r.estudiante &&
                                                        (() => {
                                                            const age = calculateAge(r.estudiante.fecha_nacimiento);
                                                            return age !== null && age < 18;
                                                        })() && (
                                                            <button
                                                                onClick={() => onSendWhatsApp(r.estudiante!)}
                                                                title="Enviar Autorización WhatsApp"
                                                                className={`p-1 transition-colors ${
                                                                    r.estudiante.autorizacion_status === "DIGITAL"
                                                                        ? "text-emerald-400"
                                                                        : "text-orange-400 hover:text-orange-300"
                                                                }`}
                                                            >
                                                                <MessageCircle size={18} />
                                                            </button>
                                                        )}
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(r.id);
                                                            setEditingEstado(r.estado || "CURSANDO");
                                                        }}
                                                        className="p-1 hover:text-blue-400 transition-colors"
                                                        title="Editar estado"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => onDelete(r)}
                                                        className="p-1 text-red-500 hover:text-red-400 transition-colors"
                                                        title="Eliminar inscripción"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!rows.length && (
                                <tr>
                                    <td colSpan={5} className="text-center py-6 text-gray-500">
                                        No hay inscripciones para mostrar.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    {totalRows > 0 && (
                        <div className="p-4 border-t border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 bg-indigo-950/20">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-indigo-300">Mostrar</span>
                                <select
                                    value={rowsPerPage}
                                    onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
                                    className="bg-indigo-900 border border-indigo-500/30 text-white text-sm rounded px-2 py-1 outline-none"
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                                <span className="text-sm text-indigo-300">por página (Total: {totalRows})</span>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    onClick={() => onPageChange(Math.max(0, page - 1))}
                                    disabled={page === 0}
                                    className={`text-xs px-3 py-1 ${
                                        page === 0
                                            ? "bg-indigo-900 text-gray-500 opacity-50 cursor-not-allowed border-none"
                                            : "bg-indigo-800 hover:bg-indigo-700 border-none"
                                    }`}
                                >
                                    Anterior
                                </Button>
                                <span className="text-sm text-white py-1 px-3 border border-indigo-500/30 rounded bg-indigo-950">
                                    {page + 1} de {totalPages || 1}
                                </span>
                                <Button
                                    type="button"
                                    onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
                                    disabled={page >= totalPages - 1}
                                    className={`text-xs px-3 py-1 ${
                                        page >= totalPages - 1
                                            ? "bg-indigo-900 text-gray-500 opacity-50 cursor-not-allowed border-none"
                                            : "bg-indigo-800 hover:bg-indigo-700 border-none"
                                    }`}
                                >
                                    Siguiente
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
