import React from 'react';
import dayjs from 'dayjs';
import { Edit2, Trash2, Check, X } from 'lucide-react';
import { HistorialNota } from './types';

export interface HistorialAcademicoTableProps {
  filteredHistorial: HistorialNota[];
  editingNotaId: number | null;
  editFormData: { calificacion?: number | string; fecha_calificacion?: string };
  readOnly: boolean;
  onEditClick: (row: HistorialNota) => void;
  onCancelClick: () => void;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpdate: (notaId: number) => void;
  onDelete: (notaId: number) => void;
}

export default function HistorialAcademicoTable({
  filteredHistorial,
  editingNotaId,
  editFormData,
  readOnly,
  onEditClick,
  onCancelClick,
  onFormChange,
  onUpdate,
  onDelete,
}: HistorialAcademicoTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-indigo-300 bg-indigo-950/50 uppercase text-xs font-semibold">
          <tr>
            <th className="px-4 py-3">Programa</th>
            <th className="px-4 py-3">Bloque / Módulo</th>
            <th className="px-4 py-3">Examen</th>
            <th className="px-4 py-3 text-center">Nota</th>
            <th className="px-4 py-3">Fecha</th>
            {!readOnly && <th className="px-4 py-3 text-right">Acciones</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-indigo-500/10">
          {filteredHistorial.length > 0 ? (
            filteredHistorial.map(row => (
              <tr key={row.id} className="hover:bg-white/5 transition-colors group">
                {editingNotaId === row.id ? (
                  <>
                    <td colSpan={3} className="px-4 py-3 text-gray-400">Editando...</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        name="calificacion"
                        value={editFormData.calificacion}
                        onChange={onFormChange}
                        className="w-16 bg-indigo-900 border border-indigo-500 rounded text-white px-1"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        name="fecha_calificacion"
                        value={editFormData.fecha_calificacion}
                        onChange={onFormChange}
                        className="bg-indigo-900 border border-indigo-500 rounded text-white px-1"
                      />
                    </td>
                    <td className="px-4 py-3 text-right flex justify-end gap-2">
                      <button onClick={() => onUpdate(row.id)} className="p-1 text-green-400 hover:text-green-300">
                        <Check size={16} />
                      </button>
                      <button onClick={onCancelClick} className="p-1 text-red-400 hover:text-red-300">
                        <X size={16} />
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 font-medium text-white">{row.examen_programa_nombre}</td>
                    <td className="px-4 py-3 text-gray-300">
                      {row.examen_bloque_nombre} / <span className="text-indigo-300">{row.examen_modulo_nombre}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {row.examen_tipo_examen}
                      {(row.intento ?? 0) > 1 && (
                        <span className="ml-2 text-[10px] text-indigo-400 font-normal px-1 border border-indigo-500/20 rounded">
                          Intento {row.intento}
                        </span>
                      )}
                      {row.es_nota_definitiva && (
                        <span className="ml-2 px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                          PROMEDIO/FINAL
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${row.aprobado ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {row.calificacion}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {row.fecha_calificacion ? dayjs.utc(row.fecha_calificacion).format('DD/MM/YYYY') : '-'}
                    </td>
                    {!readOnly && (
                      <td className="px-4 py-3 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEditClick(row)} className="p-1 text-indigo-400 hover:text-white mr-2">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => onDelete(row.id)} className="p-1 text-red-400 hover:text-red-300">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                No hay registros académicos.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
