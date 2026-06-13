import React from "react";
import { FormState } from "./types";
import { NIVEL_EDUCATIVO_OPTIONS } from "../Preinscripcion/formHelpers";

interface StepContactoProps {
  form: FormState;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export function StepContacto({ form, onChange }: StepContactoProps) {
  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-8 text-left">
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-white">Contacto y Situación</h2>
        <p className="text-indigo-300">Medios de comunicación y perfil sociodemográfico.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2 space-y-2">
          <label className="text-xs font-black uppercase tracking-widest ml-1 text-cyan-400">
            Email (Correo Electrónico)
          </label>
          <input
            type="email"
            className="w-full rounded-2xl px-5 py-4 bg-indigo-950/40 border border-indigo-500/30 text-white focus:outline-none focus:ring-1"
            name="email"
            placeholder="usuario@ejemplo.com"
            value={form.email}
            onChange={onChange}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest ml-1 text-indigo-400">Celular / Teléfono</label>
          <input
            className="w-full rounded-2xl px-5 py-4 bg-indigo-950/40 border border-indigo-500/30 text-white focus:outline-none"
            name="telefono"
            placeholder="2964 XXXXXX"
            value={form.telefono}
            onChange={onChange}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest ml-1 text-indigo-400">Nivel Educativo</label>
          <select
            className="w-full rounded-2xl px-5 py-4 bg-indigo-950/40 border border-indigo-500/30 text-white focus:outline-none"
            name="nivel_educativo"
            value={form.nivel_educativo}
            onChange={onChange}
          >
            {NIVEL_EDUCATIVO_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest ml-1 text-indigo-400">Ciudad</label>
          <input
            className="w-full rounded-2xl px-5 py-4 bg-indigo-950/40 border border-indigo-500/30 text-white focus:outline-none"
            name="ciudad"
            placeholder="Ej: Río Grande"
            value={form.ciudad}
            onChange={onChange}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest ml-1 text-indigo-400">Barrio</label>
          <input
            className="w-full rounded-2xl px-5 py-4 bg-indigo-950/40 border border-indigo-500/30 text-white focus:outline-none"
            name="barrio"
            placeholder="Ej: Chacra IV"
            value={form.barrio}
            onChange={onChange}
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-xs font-black uppercase tracking-widest ml-1 text-indigo-400">Domicilio Particular</label>
          <input
            className="w-full rounded-2xl px-5 py-4 bg-indigo-950/40 border border-indigo-500/30 text-white focus:outline-none"
            name="domicilio"
            placeholder="Calle y número"
            value={form.domicilio}
            onChange={onChange}
          />
        </div>

        <div className="md:col-span-2 p-6 rounded-[2rem] bg-indigo-950/20 border border-indigo-500/20 space-y-4">
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
                className="w-full rounded-2xl px-5 py-4 mt-1 bg-indigo-950/40 border border-orange-500/35 text-white focus:outline-none"
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
