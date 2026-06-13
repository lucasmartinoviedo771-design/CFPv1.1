import React from "react";
import { Gamepad2, Save, X, Edit2, Trash2 } from "lucide-react";
import { Inscripcion } from "./InscripcionesTabTypes";

export interface InscripcionesTabTableProps {
  loading: boolean;
  filteredInscripciones: Inscripcion[];
  editingId: number | null;
  editingEstado: string;
  onEditingEstadoChange: (val: string) => void;
  saving: boolean;
  onUpdateEstado: (id: number) => void;
  onCancelEdit: () => void;
  onStartEdit: (id: number, estado: string) => void;
  onDelete: (id: number) => void;
}

export default function InscripcionesTabTable({
  loading,
  filteredInscripciones,
  editingId,
  editingEstado,
  onEditingEstadoChange,
  saving,
  onUpdateEstado,
  onCancelEdit,
  onStartEdit,
  onDelete,
}: InscripcionesTabTableProps) {
  return (
    <div className="bg-[#0c122c]/20 border border-indigo-500/10 backdrop-blur-xl shadow-2xl rounded-[2rem] overflow-hidden">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-indigo-300 font-bold uppercase tracking-wider space-y-4">
          <div className="animate-spin text-[#00ccff]">
            <Gamepad2 size={40} />
          </div>
          <p className="text-xs">Cargando inscripciones...</p>
        </div>
      ) : filteredInscripciones.length === 0 ? (
        <div className="text-center py-20 text-indigo-400 font-semibold text-sm">
          No se encontraron inscripciones registradas.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-[#0c122c]/70 border-b border-indigo-500/10 text-indigo-300 text-xs font-black uppercase tracking-widest">
                <th className="px-6 py-4.5">Alumno</th>
                <th className="px-6 py-4.5">DNI</th>
                <th className="px-6 py-4.5">Cohorte</th>
                <th className="px-6 py-4.5">Módulo / Trayecto</th>
                <th className="px-6 py-4.5">Estado</th>
                <th className="px-6 py-4.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-500/5 bg-transparent">
              {filteredInscripciones.map((ins) => (
                <tr key={ins.id} className="hover:bg-[#00ccff]/5 transition-all duration-300">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white text-base">
                      {ins.estudiante?.apellido}, {ins.estudiante?.nombre}
                    </div>
                    <div className="text-xs text-indigo-300">{ins.estudiante?.email}</div>
                  </td>
                  <td className="px-6 py-4 text-indigo-200 font-semibold">{ins.estudiante?.dni}</td>
                  <td className="px-6 py-4 text-indigo-200 font-medium">{ins.cohorte?.nombre}</td>
                  <td className="px-6 py-4">
                    {ins.modulo ? (
                      <div>
                        <p className="font-bold text-white">{ins.modulo.nombre}</p>
                        <p className="text-[10px] text-indigo-400 uppercase">{ins.modulo.bloque_nombre}</p>
                      </div>
                    ) : (
                      <span className="text-indigo-400 italic">Cohorte Completa</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === ins.id ? (
                      <select
                        value={editingEstado}
                        onChange={(e) => onEditingEstadoChange(e.target.value)}
                        className="px-2 py-1 rounded bg-[#0c122c] border border-indigo-500/30 text-white text-xs font-bold focus:outline-none"
                      >
                        {["PREINSCRIPTO", "CURSANDO", "INACTIVO", "LIBRE", "PAUSADO", "EGRESADO", "APROBADO", "DESAPROBADO"].map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${
                          ins.estado === "CURSANDO" || ins.estado === "APROBADO" || ins.estado === "EGRESADO"
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                            : ins.estado === "PREINSCRIPTO"
                            ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                            : "border-rose-500/20 bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {ins.estado}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {editingId === ins.id ? (
                        <>
                          <button
                            onClick={() => onUpdateEstado(ins.id)}
                            disabled={saving}
                            className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-400 border border-emerald-500/30"
                            title="Guardar"
                          >
                            <Save size={14} />
                          </button>
                          <button
                            onClick={onCancelEdit}
                            className="p-2 rounded-lg bg-indigo-500/10 hover:bg-white/5 text-indigo-300"
                            title="Cancelar"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => onStartEdit(ins.id, ins.estado)}
                            className="p-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-[#00ccff] border border-indigo-500/10 active:scale-95"
                            title="Editar Estado"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => onDelete(ins.id)}
                            className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/10 active:scale-95"
                            title="Eliminar"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
