import React from "react";
import { X } from "lucide-react";
import { Alumno, Cohorte, Modulo } from "./InscripcionesTabTypes";

export interface AddInscripcionModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentSearch: string;
  onStudentSearchChange: (val: string) => void;
  selectedStudent: string;
  onSelectedStudentChange: (val: string) => void;
  filteredAlumnos: Alumno[];
  cohortes: Cohorte[];
  selectedCohorte: string;
  onSelectedCohorteChange: (val: string) => void;
  modulos: Modulo[];
  selectedModulo: string;
  onSelectedModuloChange: (val: string) => void;
  inscStatus: string;
  onInscStatusChange: (val: string) => void;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function AddInscripcionModal({
  isOpen,
  onClose,
  studentSearch,
  onStudentSearchChange,
  selectedStudent,
  onSelectedStudentChange,
  filteredAlumnos,
  cohortes,
  selectedCohorte,
  onSelectedCohorteChange,
  modulos,
  selectedModulo,
  onSelectedModuloChange,
  inscStatus,
  onInscStatusChange,
  saving,
  onSubmit,
}: AddInscripcionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-[#0c122c] border border-indigo-500/20 rounded-[2.5rem] w-full max-w-lg my-8 shadow-2xl relative overflow-hidden">
        <div className="p-6 border-b border-indigo-500/10 flex items-center justify-between">
          <h3 className="text-lg font-black text-white uppercase tracking-wider">Nueva Inscripción</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/5 text-indigo-300 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-indigo-300">Buscar Alumno</label>
            <input
              value={studentSearch}
              onChange={(e) => onStudentSearchChange(e.target.value)}
              placeholder="DNI, Apellido o Nombre..."
              className="w-full rounded-xl px-4 py-2.5 bg-indigo-950/40 border border-indigo-500/25 text-white text-sm focus:border-brand-cyan/70 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-indigo-300">Alumno *</label>
            <select
              value={selectedStudent}
              onChange={(e) => onSelectedStudentChange(e.target.value)}
              required
              className="w-full rounded-xl px-4 py-2.5 bg-indigo-950/40 border border-indigo-500/25 text-white text-sm focus:outline-none"
            >
              <option value="" className="bg-[#0c122c]">Seleccionar alumno...</option>
              {filteredAlumnos.map(s => (
                <option key={s.id} value={s.id} className="bg-[#0c122c]">
                  {s.apellido}, {s.nombre} ({s.dni})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-indigo-300">Cohorte *</label>
            <select
              value={selectedCohorte}
              onChange={(e) => onSelectedCohorteChange(e.target.value)}
              required
              className="w-full rounded-xl px-4 py-2.5 bg-indigo-950/40 border border-indigo-500/25 text-white text-sm focus:outline-none"
            >
              <option value="" className="bg-[#0c122c]">Seleccionar cohorte...</option>
              {cohortes.map(c => (
                <option key={c.id} value={c.id} className="bg-[#0c122c]">{c.nombre}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-indigo-300">Módulo (Opcional)</label>
            <select
              value={selectedModulo}
              onChange={(e) => onSelectedModuloChange(e.target.value)}
              disabled={!selectedCohorte}
              className="w-full rounded-xl px-4 py-2.5 bg-indigo-950/40 border border-indigo-500/25 text-white text-sm focus:outline-none disabled:opacity-50"
            >
              <option value="" className="bg-[#0c122c]">Todos los módulos (Trayecto Completo)</option>
              {modulos.map(m => (
                <option key={m.id} value={m.id} className="bg-[#0c122c]">{m.nombre} ({m.bloque_nombre})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-indigo-300">Estado inicial</label>
            <select
              value={inscStatus}
              onChange={(e) => onInscStatusChange(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 bg-indigo-950/40 border border-indigo-500/25 text-white text-sm focus:outline-none"
            >
              {["PREINSCRIPTO", "CURSANDO", "INACTIVO", "LIBRE", "PAUSADO", "EGRESADO", "APROBADO", "DESAPROBADO"].map(st => (
                <option key={st} value={st} className="bg-[#0c122c]">{st}</option>
              ))}
            </select>
          </div>

          <div className="p-6 border-t border-indigo-500/10 flex justify-end gap-3 bg-[#0a0d24] -mx-6 -mb-6 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-accent text-[#050814] font-black text-xs uppercase tracking-widest hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all disabled:opacity-50"
            >
              {saving ? "Registrando..." : "Inscribir"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
