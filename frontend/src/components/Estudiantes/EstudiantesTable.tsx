import React from "react";
import { LocalEstudiante, calculateAge } from "../../pages/Estudiantes";
import { formatDateDisplay } from "../../utils/dateFormat";
import { Card } from "../UI";
import { Baby, Eye, Edit2, Trash2 } from "lucide-react";

interface EstudiantesTableProps {
    rows: LocalEstudiante[];
    isLoading: boolean;
    ordering: { field: string; direction: "asc" | "desc" };
    onSort: (field: string) => void;
    onView: (estudiante: LocalEstudiante) => void;
    onStartEdit: (estudiante: LocalEstudiante) => void;
    onDelete: (estudiante: LocalEstudiante) => void;
    loadingEditId: number | null;
    page: number;
    rowsPerPage: number;
    totalRows: number;
    onPageChange: (newPage: number) => void;
}

export const EstudiantesTable: React.FC<EstudiantesTableProps> = ({
    rows,
    isLoading,
    ordering,
    onSort,
    onView,
    onStartEdit,
    onDelete,
    loadingEditId,
    page,
    rowsPerPage,
    totalRows,
    onPageChange,
}) => {
    return (
        <Card className="bg-indigo-900/10 border-indigo-500/20 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-indigo-950/40 text-indigo-300 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3 cursor-pointer select-none hover:text-white" onClick={() => onSort("apellido")}>
                                Apellido, Nombre {ordering.field === "apellido" && (ordering.direction === "asc" ? "▲" : "▼")}
                            </th>
                            <th className="px-6 py-3 cursor-pointer select-none hover:text-white" onClick={() => onSort("dni")}>
                                DNI {ordering.field === "dni" && (ordering.direction === "asc" ? "▲" : "▼")}
                            </th>
                            <th className="px-6 py-3 cursor-pointer select-none hover:text-white flex items-center gap-1">
                                Fecha Nac. / Edad
                            </th>
                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3 cursor-pointer select-none hover:text-white" onClick={() => onSort("estatus")}>
                                Estatus {ordering.field === "estatus" && (ordering.direction === "asc" ? "▲" : "▼")}
                            </th>
                            <th className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-indigo-500/10">
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="text-center py-8 text-white">
                                    Cargando estudiantes...
                                </td>
                            </tr>
                        ) : (
                            rows.map((r) => (
                                <tr key={r.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-3 font-medium text-white">
                                        {r.apellido}, {r.nombre}
                                    </td>
                                    <td className="px-6 py-3">{r.dni}</td>
                                    <td className="px-6 py-3">
                                        {(() => {
                                            const age = calculateAge(r.fecha_nacimiento);
                                            const isMinor = age !== null && age < 18;
                                            return (
                                                <div className="flex items-center gap-1.5">
                                                    <span className={isMinor ? "text-orange-400 font-bold" : ""}>
                                                        {formatDateDisplay(r.fecha_nacimiento)}
                                                    </span>
                                                    {age !== null && (
                                                        <span
                                                            className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                                                isMinor
                                                                    ? "bg-orange-500/20 text-orange-300 border border-orange-500/30 font-bold"
                                                                    : "bg-indigo-500/20 text-indigo-300"
                                                            }`}
                                                        >
                                                            {age} años {isMinor && <Baby size={10} className="inline ml-0.5" />}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-6 py-3 text-gray-300">{r.email}</td>
                                    <td className="px-6 py-3">
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                r.estatus === "Regular"
                                                    ? "bg-emerald-500/20 text-emerald-400"
                                                    : r.estatus === "Baja"
                                                    ? "bg-red-500/20 text-red-400"
                                                    : r.estatus === "Condicional"
                                                    ? "bg-yellow-500/20 text-yellow-500"
                                                    : "bg-indigo-500/20 text-indigo-300"
                                            }`}
                                        >
                                            {r.estatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right flex justify-end gap-2">
                                        <button onClick={() => onView(r)} className="p-1 text-cyan-400 hover:text-cyan-200" title="Ver detalle">
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            onClick={() => onStartEdit(r)}
                                            className="p-1 text-indigo-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={loadingEditId === r.id}
                                            title={loadingEditId === r.id ? "Cargando datos completos..." : "Editar"}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => onDelete(r)} className="p-1 text-red-400 hover:text-red-200" title="Dar de baja">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                        {!isLoading && rows.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center py-8 text-white">
                                    No se encontraron estudiantes.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {/* Paginación simple manual */}
            <div className="p-4 border-t border-indigo-500/20 flex items-center justify-between text-indigo-300 text-sm">
                <span>
                    Mostrando {totalRows === 0 ? 0 : page * rowsPerPage + 1} - {Math.min((page + 1) * rowsPerPage, totalRows)} de {totalRows}
                </span>
                <div className="flex gap-2">
                    <button
                        disabled={page === 0}
                        onClick={() => onPageChange(page - 1)}
                        className="px-3 py-1 bg-indigo-950 hover:bg-indigo-900 rounded disabled:opacity-50"
                    >
                        Anterior
                    </button>
                    <button
                        disabled={(page + 1) * rowsPerPage >= totalRows}
                        onClick={() => onPageChange(page + 1)}
                        className="px-3 py-1 bg-indigo-950 hover:bg-indigo-900 rounded disabled:opacity-50"
                    >
                        Siguiente
                    </button>
                </div>
            </div>
        </Card>
    );
};
