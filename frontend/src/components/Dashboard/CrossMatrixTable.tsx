import React from 'react';
import type { CrossMatrixItem } from './types';

interface CrossMatrixTableProps {
  data: CrossMatrixItem[];
  selectedYear?: string;
  selectedProgram?: string;
  onSelectCell?: (year: string, program: string) => void;
}

export default function CrossMatrixTable({
  data = [],
  selectedYear,
  selectedProgram,
  onSelectCell,
}: CrossMatrixTableProps) {
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto max-h-72 custom-scrollbar border border-indigo-500/20 rounded-lg">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-indigo-950/80 sticky top-0 z-10 text-indigo-300 font-semibold border-b border-indigo-500/30">
            <tr>
              <th className="py-2.5 px-3">Año</th>
              <th className="py-2.5 px-3">Programa / Carrera</th>
              <th className="py-2.5 px-3 text-right">Alumnos únicos</th>
              <th className="py-2.5 px-3 text-right">Egresados*</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-indigo-900/40 text-indigo-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 px-3 text-center text-indigo-300/60 italic">
                  Sin registros para cruzar
                </td>
              </tr>
            ) : (
              data.map((item, idx) => {
                const isMatch =
                  (selectedYear ? selectedYear === item.year : true) &&
                  (selectedProgram ? selectedProgram === item.program : true);
                const isSelected = (selectedYear === item.year && selectedProgram === item.program);

                return (
                  <tr
                    key={`${item.year}-${item.program}-${idx}`}
                    onClick={() => onSelectCell && onSelectCell(item.year, item.program)}
                    className={`transition-colors cursor-pointer hover:bg-indigo-900/40 ${
                      isSelected
                        ? 'bg-indigo-900/60 font-semibold text-white'
                        : isMatch && (selectedYear || selectedProgram)
                        ? 'bg-indigo-950/40'
                        : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono">{item.year}</td>
                    <td className="py-2.5 px-3 font-medium text-white truncate max-w-[200px]" title={item.program}>
                      {item.program}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-brand-cyan">
                      {item.unique_students.toLocaleString('es-AR')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-brand-accent font-semibold">
                      {item.graduated.toLocaleString('es-AR')}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-indigo-300/60 italic">
        * Egresados según el histórico completo, entre quienes tienen registros en ese año. No es el número de egresos ocurridos estrictamente en ese año calendario.
      </p>
    </div>
  );
}
