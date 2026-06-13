import React from "react";
import { FormState } from "./types";
import { NIVEL_EDUCATIVO_OPTIONS } from "../Preinscripcion/formHelpers";

interface StepContactoProps {
  form: FormState;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  isDark: boolean;
}

export function StepContacto({ form, onChange, isDark }: StepContactoProps) {
  const textTitleCls = isDark ? "text-white" : "text-[#0f172a]";
  const textHelpCls = isDark ? "text-indigo-200" : "text-[#1e3a5f]";

  const inputCls = `w-full rounded-2xl px-5 py-4 focus:outline-none focus:ring-1 focus:ring-cyan-400/20 transition-all ${
    isDark
      ? "bg-indigo-950/40 border border-indigo-500/30 text-white placeholder-indigo-300 focus:border-cyan-400/70"
      : "bg-[#a8cce3] border border-[#6ba3c7] text-[#0f172a] placeholder-[#355a78] focus:border-sky-600"
  }`;

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-8 text-left">
      <div className="space-y-2">
        <h2 className={`text-2xl font-black ${textTitleCls}`}>Contacto y Situación</h2>
        <p className={textHelpCls}>¿Cómo te contactamos y cuál es tu perfil?</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2 space-y-2">
          <label className="text-xs font-black uppercase tracking-widest ml-1 text-cyan-400">Email</label>
          <input
            type="email"
            className={inputCls}
            name="email"
            placeholder="usuario@ejemplo.com"
            value={form.email}
            onChange={onChange}
            required
          />
        </div>
        <div className="space-y-2">
          <label className={`text-xs font-black uppercase tracking-widest ml-1 ${isDark ? "text-indigo-400" : "text-[#1e3a5f]"}`}>
            Teléfono
          </label>
          <input className={inputCls} name="telefono" value={form.telefono} onChange={onChange} />
        </div>
        <div className="space-y-2">
          <label className={`text-xs font-black uppercase tracking-widest ml-1 ${isDark ? "text-indigo-400" : "text-[#1e3a5f]"}`}>
            Nivel Educativo
          </label>
          <select className={inputCls} name="nivel_educativo" value={form.nivel_educativo} onChange={onChange}>
            {NIVEL_EDUCATIVO_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className={`text-xs font-black uppercase tracking-widest ml-1 ${isDark ? "text-indigo-400" : "text-[#1e3a5f]"}`}>
            Ciudad
          </label>
          <input className={inputCls} name="ciudad" placeholder="Ej: Río Grande" value={form.ciudad} onChange={onChange} />
        </div>
        <div className="space-y-2">
          <label className={`text-xs font-black uppercase tracking-widest ml-1 ${isDark ? "text-indigo-400" : "text-[#1e3a5f]"}`}>
            Barrio
          </label>
          <input className={inputCls} name="barrio" placeholder="Ej: Chacra II" value={form.barrio} onChange={onChange} />
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className={`text-xs font-black uppercase tracking-widest ml-1 ${isDark ? "text-indigo-400" : "text-[#1e3a5f]"}`}>
            Domicilio Particular
          </label>
          <input className={inputCls} name="domicilio" placeholder="Calle y número" value={form.domicilio} onChange={onChange} />
        </div>

        <div className="md:col-span-2 p-6 rounded-[2rem] bg-cyan-400/5 border border-cyan-400/10 space-y-4">
          <p className="text-xs font-black uppercase tracking-tighter text-cyan-400">Equipamiento y Trabajo</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-indigo-500/30 text-cyan-400"
                name="posee_pc"
                checked={form.posee_pc}
                onChange={onChange}
              />
              <span className="text-sm font-bold">Poseo PC</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-indigo-500/30 text-cyan-400"
                name="posee_conectividad"
                checked={form.posee_conectividad}
                onChange={onChange}
              />
              <span className="text-sm font-bold">Tengo Internet</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-indigo-500/30 text-orange-500"
                name="trabaja"
                checked={form.trabaja}
                onChange={onChange}
              />
              <span className="text-sm font-bold">Actualmente Trabajo</span>
            </label>
          </div>
          {form.trabaja && (
            <div className="mt-4 animate-in fade-in slide-in-from-top-2">
              <label className="text-xs font-black uppercase tracking-widest ml-1 text-orange-500">Lugar de Trabajo</label>
              <input
                className={`w-full rounded-2xl px-5 py-4 mt-1 focus:outline-none focus:ring-1 focus:ring-cyan-400/20 transition-all ${
                  isDark ? "bg-indigo-950/40 border border-orange-500/30 text-white" : "bg-[#a8cce3] border border-[#6ba3c7] text-[#0f172a]"
                }`}
                name="lugar_trabajo"
                placeholder="Nombre de la empresa o institución"
                value={form.lugar_trabajo}
                onChange={onChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
