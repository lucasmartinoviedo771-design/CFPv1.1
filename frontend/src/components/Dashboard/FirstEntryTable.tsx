import React from 'react';
import type { FirstEntryItem } from './types';
import { Download } from 'lucide-react';

interface FirstEntryTableProps {
  data: FirstEntryItem[];
  selectedYear?: string;
  onSelectYear: (year: string) => void;
  onExportFirstEntries: () => void;
}

export default function FirstEntryTable({
  data = [],
  selectedYear,
  onSelectYear,
  onExportFirstEntries,
}: FirstEntryTableProps) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto max-h-72 custom-scrollbar border border-indigo-500/20 rounded-lg">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-indigo-950/80 sticky top-0 z-10 text-indigo-300 font-semibold border-b border-indigo-500/30">
            <tr>
              <th className="py-2.5 px-3">Año del primer ingreso histórico</th>
              <th className="py-2.5 px-3 text-right">Personas únicas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-indigo-900/40 text-indigo-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={2} className="py-4 px-3 text-center text-indigo-300/60 italic">
                  Sin registros históricos disponibles
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const isSelected = selectedYear === item.year;
                return (
                  <tr
                    key={item.year}
                    className={`transition-colors hover:bg-indigo-900/30 ${
                      isSelected ? 'bg-indigo-900/50 text-white font-semibold' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <button
                        type="button"
                        onClick={() => onSelectYear(item.year)}
                        className={`px-2.5 py-0.5 rounded text-xs transition-all ${
                          isSelected
                            ? 'bg-brand-cyan text-slate-900 font-bold shadow-[0_0_8px_#00ccff]'
                            : 'bg-indigo-900/70 text-indigo-200 hover:bg-brand-cyan/20 hover:text-white border border-indigo-500/30'
                        }`}
                      >
                        {item.year}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-xs">
                      {item.count.toLocaleString('es-AR')}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center text-xs text-indigo-300/60">
        <span>* Mínimo histórico de fecha de inscripción por persona.</span>
        <button
          type="button"
          onClick={onExportFirstEntries}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-900/50 hover:bg-indigo-800/60 text-indigo-200 hover:text-white border border-indigo-500/30 transition-all font-medium"
        >
          <Download className="w-3.5 h-3.5 text-brand-cyan" />
          Descargar primeras inscripciones (CSV)
        </button>
      </div>
    </div>
  );
}
