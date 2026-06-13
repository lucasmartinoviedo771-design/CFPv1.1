import React from "react";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { ProgramaOferta } from "./types";
import { normalizeText } from "../Preinscripcion/formHelpers";

interface StepOfertaProps {
  ofertaView: ProgramaOferta[];
  selectedProgramaSet: Set<string>;
  expandedProgramaId: string;
  bloquesPorPrograma: Record<string, number[]>;
  openPrograma: (p: ProgramaOferta) => void;
  toggleBloque: (pid: number, bid: number) => void;
  isDark: boolean;
}

function isProgramacionII(bloqueNombre: string): boolean {
  return normalizeText(bloqueNombre).includes("programacion ii");
}

export function StepOferta({
  ofertaView,
  selectedProgramaSet,
  expandedProgramaId,
  bloquesPorPrograma,
  openPrograma,
  toggleBloque,
  isDark,
}: StepOfertaProps) {
  const textTitleCls = isDark ? "text-white" : "text-[#0f172a]";
  const textHelpCls = isDark ? "text-indigo-200" : "text-[#1e3a5f]";

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-8 text-left">
      <div className="space-y-2">
        <h2 className={`text-2xl font-black ${textTitleCls}`}>Oferta Formativa</h2>
        <p className={textHelpCls}>Seleccioná los programas de tu interés.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ofertaView.map((p) => {
          const active = selectedProgramaSet.has(String(p.programa_id));
          const expanded = active && String(p.programa_id) === String(expandedProgramaId);

          const cardCls = active
            ? isDark
              ? "border-emerald-400 bg-emerald-900/20 ring-2 ring-emerald-500 shadow-lg"
              : "border-emerald-600 bg-emerald-100 ring-2 ring-emerald-500 shadow-lg"
            : isDark
            ? "border-white/10 bg-black/30 hover:border-cyan-400/70 hover:shadow-md hover:scale-[1.01]"
            : "border-[#6ba3c7] bg-[#a8cce3] hover:border-cyan-400/70 hover:shadow-md hover:scale-[1.01]";

          return (
            <div
              key={p.programa_id}
              className={`group relative rounded-3xl border-2 p-6 transition-all duration-500 cursor-pointer overflow-hidden ${cardCls}`}
              onClick={() => openPrograma(p)}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1 flex-grow">
                  <h3 className={`font-black text-xl leading-tight ${textTitleCls}`}>{p.programa_nombre}</h3>
                  <p className={`text-xs font-bold ${active ? "text-cyan-400" : textHelpCls}`}>
                    {p.bloques?.length || 0} BLOQUES DISPONIBLES
                  </p>
                </div>
                <div
                  className={`p-2 rounded-xl transition-colors ${
                    active
                      ? "bg-cyan-400 shadow-lg shadow-cyan-400/50 text-white"
                      : "bg-indigo-500/10 text-indigo-400 group-hover:text-cyan-400"
                  }`}
                >
                  {active ? <CheckCircle2 size={24} /> : expanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </div>
              </div>
              {expanded && (
                <div
                  className="mt-6 pt-6 border-t border-white/10 space-y-4 animate-in fade-in zoom-in-95 duration-500"
                  onClick={(e) => e.stopPropagation()}
                >
                  {p.bloquesOrdenados?.map((b) => (
                    <label
                      key={b.bloque_id}
                      className={`flex items-start gap-4 p-4 rounded-2xl transition-all ${
                        isDark ? "bg-white/5 hover:bg-white/10" : "bg-white/40 hover:bg-white/60"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 w-5 h-5 rounded-lg border-2 border-cyan-400 text-cyan-400 focus:ring-0 cursor-pointer"
                        checked={(bloquesPorPrograma[String(p.programa_id)] || []).includes(b.bloque_id)}
                        disabled={isProgramacionII(b.bloque_nombre)}
                        onChange={() => toggleBloque(p.programa_id, b.bloque_id)}
                      />
                      <div className="flex flex-col">
                        <span className="font-bold text-sm tracking-tight">{b.bloque_nombre}</span>
                        <span
                          className={`text-[10px] uppercase font-black tracking-widest ${
                            isDark ? "text-indigo-400" : "text-slate-400"
                          }`}
                        >
                          Inicio: {b.cohorte_nombre}
                        </span>
                        {isProgramacionII(b.bloque_nombre) && (
                          <span className="text-[10px] text-orange-500 mt-1 font-bold">
                            REQUISITO: PROG. I Y BD APROBADA
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
