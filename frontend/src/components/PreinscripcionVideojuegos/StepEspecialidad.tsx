import React from "react";
import { CheckCircle2, Sparkles } from "lucide-react";
import { Bloque } from "./types";

interface StepEspecialidadProps {
  bloquesSeleccionados: number[];
  optativeBlocks: Bloque[];
  obligatoryBlocks: Bloque[];
  onToggleBloqueOptativo: (bid: number) => void;
}

export function StepEspecialidad({
  bloquesSeleccionados,
  optativeBlocks,
  obligatoryBlocks,
  onToggleBloqueOptativo,
}: StepEspecialidadProps) {
  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-8 text-left">
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-white">Especialización de Trayecto</h2>
        <p className="text-indigo-300">Seleccioná qué rama optativa querés cursar. Podés elegir una o ambas.</p>
      </div>

      {/* Especialidades optativas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {optativeBlocks.map((b) => {
          const active = bloquesSeleccionados.includes(b.bloque_id);
          return (
            <div
              key={b.bloque_id}
              className={`group relative rounded-3xl border-2 p-6 transition-all duration-500 cursor-pointer overflow-hidden ${
                active
                  ? "border-cyan-400 bg-[#00ccff]/5 shadow-lg shadow-cyan-400/5"
                  : "border-indigo-500/20 bg-black/20 hover:border-cyan-400/50 hover:scale-[1.01]"
              }`}
              onClick={() => onToggleBloqueOptativo(b.bloque_id)}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                    MÓDULO OPTATIVO
                  </span>
                  <h3 className="font-black text-xl leading-tight text-white">{b.bloque_nombre}</h3>
                  <p className="text-xs text-indigo-300">Ingreso habilitado para la cohorte {b.cohorte_nombre}.</p>
                </div>
                <div
                  className={`p-2 rounded-xl transition-colors ${
                    active ? "bg-cyan-400 text-[#050814]" : "bg-indigo-500/10 text-indigo-400 group-hover:text-cyan-400"
                  }`}
                >
                  <CheckCircle2 size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Materias Obligatorias Informativas */}
      <div className="p-6 rounded-[2rem] bg-indigo-950/20 border border-indigo-500/20 space-y-4">
        <div className="flex items-center gap-2 text-orange-500">
          <Sparkles size={16} />
          <h4 className="text-xs font-black uppercase tracking-widest leading-none">Materias Comunes Obligatorias</h4>
        </div>
        <p className="text-xs text-indigo-300">
          Independientemente de la especialidad elegida, cursarás y te inscribirás automáticamente en las siguientes asignaturas transversales:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {obligatoryBlocks.map((b) => (
            <div key={b.bloque_id} className="p-4 rounded-xl bg-black/40 border border-indigo-500/10 flex items-center gap-3">
              <CheckCircle2 size={16} className="text-[#a855f7] flex-none" />
              <span className="font-bold text-xs text-indigo-100">{b.bloque_nombre}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
