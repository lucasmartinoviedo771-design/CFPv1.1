import React from 'react';
import type { AuditRecordItem, PaginatedRecords } from './types';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';

interface AuditableRecordsTableProps {
  records?: PaginatedRecords;
  page: number;
  onPageChange: (newPage: number) => void;
  onExportCsv: () => void;
  isLoading?: boolean;
}

export default function AuditableRecordsTable({
  records,
  page,
  onPageChange,
  onExportCsv,
  isLoading = false,
}: AuditableRecordsTableProps) {
  const items = records?.items || [];
  const total = records?.total || 0;
  const totalPages = records?.total_pages || 1;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Egresado':
        return 'bg-brand-accent/20 text-brand-accent border-brand-accent/40';
      case 'En curso con materias aprobadas':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      case 'Cursando':
        return 'bg-brand-cyan/20 text-brand-cyan border-brand-cyan/40';
      case 'Preinscripto':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  const getSexBadge = (sexo?: string) => {
    switch (sexo) {
      case 'Mujeres':
        return 'bg-pink-500/20 text-pink-300 border-pink-500/40';
      case 'Varones':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      case 'Otro':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/40';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="text-xs text-indigo-300">
          Mostrando <span className="font-bold text-white font-mono">{items.length}</span> de{' '}
          <span className="font-bold text-white font-mono">{total.toLocaleString('es-AR')}</span> registros
          auditables seleccionados
        </div>
        <button
          type="button"
          onClick={onExportCsv}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-accent hover:bg-orange-600 text-white shadow-[0_0_12px_rgba(255,102,0,0.3)] transition-all text-xs font-semibold"
        >
          <Download className="w-3.5 h-3.5" />
          Exportar Selección CSV
        </button>
      </div>

      {/* TABLA CON SCROLL HORIZONTAL Y VERTICAL */}
      <div className="overflow-x-auto max-h-[520px] custom-scrollbar border border-indigo-500/20 rounded-xl bg-[#0a0033]/60 backdrop-blur-sm">
        <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
          <thead className="bg-[#1e1b4b] text-indigo-200 font-semibold sticky top-0 z-20 border-b border-indigo-500/30">
            <tr>
              <th className="py-3 px-3">Apellido y Nombres</th>
              <th className="py-3 px-3 font-mono">DNI</th>
              <th className="py-3 px-3">Sexo</th>
              <th className="py-3 px-3">Localidad</th>
              <th className="py-3 px-3">Regularidad</th>
              <th className="py-3 px-3">Programa / Carrera</th>
              <th className="py-3 px-3">Bloque</th>
              <th className="py-3 px-3">Módulo</th>
              <th className="py-3 px-3">Cohorte</th>
              <th className="py-3 px-3">Año</th>
              <th className="py-3 px-3">Mes</th>
              <th className="py-3 px-3">Estado Original</th>
              <th className="py-3 px-3">Estado Calculado</th>
              <th className="py-3 px-3">Motivo</th>
              <th className="py-3 px-3">Nivel de Estudio</th>
              <th className="py-3 px-3 font-mono">1° Inscripción</th>
              <th className="py-3 px-3 font-mono text-center">Nota</th>
              <th className="py-3 px-3 font-mono">Fecha Calificación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-indigo-900/30 text-indigo-100">
            {isLoading ? (
              <tr>
                <td colSpan={18} className="py-8 text-center text-indigo-300">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-brand-accent"></div>
                  <p className="mt-2 text-xs">Cargando registros...</p>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={18} className="py-8 text-center text-indigo-300/60 italic">
                  No se encontraron registros que coincidan con los filtros aplicados.
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.id} className="hover:bg-indigo-900/30 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-white">{row.name}</td>
                  <td className="py-2.5 px-3 font-mono text-indigo-300">{row.dni || 'Sin DNI'}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${getSexBadge(
                        row.sexo
                      )}`}
                    >
                      {row.sexo || '-'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-indigo-200">{row.city}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[11px] bg-indigo-900/50 border border-indigo-500/30">
                      {row.regular}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 max-w-[220px] truncate" title={row.program}>
                    {row.program}
                  </td>
                  <td className="py-2.5 px-3">{row.block}</td>
                  <td className="py-2.5 px-3">{row.module}</td>
                  <td className="py-2.5 px-3">{row.cohort}</td>
                  <td className="py-2.5 px-3 font-mono">{row.year}</td>
                  <td className="py-2.5 px-3 capitalize">{row.month}</td>
                  <td className="py-2.5 px-3 text-indigo-300">{row.state}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(
                        row.status
                      )}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-indigo-300/80 text-[11px]">{row.reason}</td>
                  <td className="py-2.5 px-3">{row.education}</td>
                  <td className="py-2.5 px-3 font-mono text-indigo-300">{row.enroll || 'Sin fecha'}</td>
                  <td className="py-2.5 px-3 font-mono text-center font-bold text-brand-cyan">
                    {row.grade || '-'}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-indigo-300">{row.qualified || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CONTROLES DE PAGINACIÓN */}
      <div className="flex justify-between items-center pt-2">
        <div className="text-xs text-indigo-300">
          Página <span className="font-bold text-white font-mono">{page}</span> de{' '}
          <span className="font-bold text-white font-mono">{totalPages}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1 || isLoading}
            onClick={() => onPageChange(page - 1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-900/40 hover:bg-indigo-800/60 disabled:opacity-40 disabled:cursor-not-allowed text-indigo-200 border border-indigo-500/30 text-xs font-medium transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>
          <button
            type="button"
            disabled={page >= totalPages || isLoading}
            onClick={() => onPageChange(page + 1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-900/40 hover:bg-indigo-800/60 disabled:opacity-40 disabled:cursor-not-allowed text-indigo-200 border border-indigo-500/30 text-xs font-medium transition-all"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
