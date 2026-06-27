import React from "react";
import { Loader, XCircle, FileText, Eye, Trash2, UploadCloud } from "lucide-react";
import { formatDateDisplay } from "../../utils/dateFormat";
import { getMediaUrl } from "../../utils/media";
import { Aspirante, OrderingState } from "./types";

const calculateAge = (birthDate?: string | null): number | null => {
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

export interface PreinscripcionesTableProps {
  isLoading: boolean;
  sortedAndFiltered: Aspirante[];
  selectedIds: Set<number>;
  onToggleSelectAll: () => void;
  onToggleSelect: (id: number) => void;
  onSort: (field: string) => void;
  ordering: OrderingState;
  viewArchived: boolean;
  canDelete: boolean;
  isAdmin: boolean;
  onViewStudent: (s: Aspirante) => void;
  onArchive: (s: Aspirante) => void;
  onDeletePhysical: (s: Aspirante) => void;
  onRestore: (s: Aspirante) => void;
}

export default function PreinscripcionesTable({
  isLoading,
  sortedAndFiltered,
  selectedIds,
  onToggleSelectAll,
  onToggleSelect,
  onSort,
  ordering,
  viewArchived,
  canDelete,
  isAdmin,
  onViewStudent,
  onArchive,
  onDeletePhysical,
  onRestore,
}: PreinscripcionesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-[#1e1b4b] text-indigo-300 uppercase text-xs">
          <tr>
            <th className="px-4 py-3 w-10">
              <input
                type="checkbox"
                className="rounded bg-indigo-900 border-indigo-500"
                checked={sortedAndFiltered.length > 0 && selectedIds.size === sortedAndFiltered.length}
                onChange={onToggleSelectAll}
              />
            </th>
            <th className="px-6 py-3 cursor-pointer hover:text-white group" onClick={() => onSort("dni")}>
              <div className="flex items-center gap-1">
                DNI{" "}
                {ordering.field === "dni" ? (
                  ordering.direction === "asc" ? "↑" : "↓"
                ) : (
                  <span className="opacity-0 group-hover:opacity-50 text-[10px]">⇅</span>
                )}
              </div>
            </th>
            <th className="px-6 py-3 cursor-pointer hover:text-white group" onClick={() => onSort("estudiante")}>
              <div className="flex items-center gap-1">
                Estudiante{" "}
                {ordering.field === "estudiante" ? (
                  ordering.direction === "asc" ? "↑" : "↓"
                ) : (
                  <span className="opacity-0 group-hover:opacity-50 text-[10px]">⇅</span>
                )}
              </div>
            </th>
            <th className="px-6 py-3 cursor-pointer hover:text-white group" onClick={() => onSort("trayectos")}>
              <div className="flex items-center gap-1">
                Trayectos{" "}
                {ordering.field === "trayectos" ? (
                  ordering.direction === "asc" ? "↑" : "↓"
                ) : (
                  <span className="opacity-0 group-hover:opacity-50 text-[10px]">⇅</span>
                )}
              </div>
            </th>
            <th className="px-6 py-3 cursor-pointer hover:text-white group" onClick={() => onSort("created_at")}>
              <div className="flex items-center gap-1">
                Alumno desde{" "}
                {ordering.field === "created_at" ? (
                  ordering.direction === "asc" ? "↑" : "↓"
                ) : (
                  <span className="opacity-0 group-hover:opacity-50 text-[10px]">⇅</span>
                )}
              </div>
            </th>
            <th className="px-6 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-indigo-500/10">
          {isLoading ? (
            <tr>
              <td colSpan={6} className="text-center py-8 text-indigo-300">
                <Loader className="animate-spin inline mr-2" />
                Cargando aspirantes...
              </td>
            </tr>
          ) : (
            sortedAndFiltered.map((s) => (
              <tr
                key={s.id}
                className={`hover:bg-white/5 transition-colors ${selectedIds.has(s.id) ? "bg-indigo-500/10" : ""}`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    className="rounded bg-indigo-900 border-indigo-500 text-brand-accent focus:ring-brand-accent"
                    checked={selectedIds.has(s.id)}
                    onChange={() => onToggleSelect(s.id)}
                  />
                </td>
                <td className="px-6 py-3 font-mono text-indigo-200">{s.dni}</td>
                <td className="px-6 py-3">
                  <div className="flex flex-col">
                    {(() => {
                      const age = calculateAge(s.fecha_nacimiento);
                      const isMinor = age !== null && age < 18;
                      return (
                        <div className="flex items-center gap-2">
                          <span className={isMinor ? "text-orange-400 font-bold" : "text-white font-medium"}>
                            {s.apellido}, {s.nombre}
                          </span>
                          {age !== null && (
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                                isMinor
                                  ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                                  : "bg-indigo-500/20 text-indigo-300"
                              }`}
                            >
                              {age} años
                            </span>
                          )}
                        </div>
                      );
                    })()}
                    <div className="text-xs text-indigo-400">{s.email}</div>
                  </div>
                </td>
                <td className="px-6 py-3">
                  <div className="flex flex-wrap gap-1">
                    {s.trayectos?.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-indigo-500/20 text-indigo-200 px-1.5 py-0.5 rounded border border-indigo-500/30"
                      >
                        {t}
                      </span>
                    ))}
                    {(!s.trayectos || s.trayectos.length === 0) && <span className="text-xs text-gray-500">-</span>}
                  </div>
                </td>
                <td className="px-6 py-3 text-indigo-300">{formatDateDisplay(s.created_at)}</td>
                <td className="px-6 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => onViewStudent(s)}
                      className="p-2 text-brand-cyan hover:text-white transition-colors"
                      title="Ver detalle completo"
                    >
                      <Eye size={18} />
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => onArchive(s)}
                        className="p-2 text-orange-400 hover:text-orange-200 transition-colors"
                        title="Archivar (Borrado lógico)"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => onDeletePhysical(s)}
                        className="p-2 text-red-600 hover:text-red-400 transition-colors"
                        title="ELIMINAR PERMANENTE"
                      >
                        <XCircle size={18} />
                      </button>
                    )}
                    {viewArchived && canDelete && (
                      <button
                        onClick={() => onRestore(s)}
                        className="p-2 text-cyan-400 hover:text-cyan-200 transition-colors"
                        title="Restaurar a la cola"
                      >
                        <UploadCloud size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
          {!isLoading && sortedAndFiltered.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center py-12 text-indigo-300">
                {viewArchived ? "No hay estudiantes en la papelera." : "No hay preinscripciones pendientes."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
