import React from "react";
import { Smartphone } from "lucide-react";
import { FormState } from "./types";

interface StepIdentidadProps {
  form: FormState;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  edad: number;
  esMenor: boolean;
}

export function StepIdentidad({ form, onChange, edad, esMenor }: StepIdentidadProps) {
  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-8 text-left">
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-white">Identidad del Aspirante</h2>
        <p className="text-indigo-300">Completá tus datos personales básicos tal cual figuran en tu documento.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest ml-1 text-cyan-400">Apellido</label>
          <input
            className="w-full rounded-2xl px-5 py-4 bg-indigo-950/40 border border-indigo-500/30 text-white placeholder-indigo-300 focus:border-cyan-400/70 focus:ring-1 focus:ring-cyan-400/20 focus:outline-none transition-all"
            name="apellido"
            placeholder="Pérez"
            value={form.apellido}
            onChange={onChange}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest ml-1 text-cyan-400">Nombre</label>
          <input
            className="w-full rounded-2xl px-5 py-4 bg-indigo-950/40 border border-indigo-500/30 text-white placeholder-indigo-300 focus:border-cyan-400/70 focus:ring-1 focus:ring-cyan-400/20 focus:outline-none transition-all"
            name="nombre"
            placeholder="Juan"
            value={form.nombre}
            onChange={onChange}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest ml-1 text-cyan-400">DNI (Documento)</label>
          <input
            className="w-full rounded-2xl px-5 py-4 bg-indigo-950/40 border border-indigo-500/30 text-white placeholder-indigo-300 focus:border-cyan-400/70 focus:ring-1 focus:ring-cyan-400/20 focus:outline-none transition-all"
            name="DNI"
            placeholder="Sin puntos ni espacios"
            value={form.DNI}
            onChange={onChange}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest ml-1 text-indigo-400">CUIT (Opcional)</label>
          <input
            className="w-full rounded-2xl px-5 py-4 bg-indigo-950/40 border border-indigo-500/30 text-white placeholder-indigo-300 focus:border-cyan-400/70 focus:ring-1 focus:ring-cyan-400/20 focus:outline-none transition-all"
            name="cuit"
            placeholder="20XXXXXXXXX"
            value={form.cuit}
            onChange={onChange}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest ml-1 text-indigo-400">Sexo</label>
          <select
            className="w-full rounded-2xl px-5 py-4 bg-indigo-950/40 border border-indigo-500/30 text-white focus:border-cyan-400/70 focus:ring-1 focus:ring-cyan-400/20 focus:outline-none transition-all"
            name="sexo"
            value={form.sexo}
            onChange={onChange}
          >
            <option value="">Seleccione...</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
            <option value="O">Otro/X</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest ml-1 text-indigo-400">Fecha de Nacimiento *</label>
          <input
            type="date"
            className="w-full rounded-2xl px-5 py-4 bg-indigo-950/40 border border-indigo-500/30 text-white focus:border-cyan-400/70 focus:ring-1 focus:ring-cyan-400/20 focus:outline-none transition-all"
            name="fecha_nacimiento"
            value={form.fecha_nacimiento}
            onChange={onChange}
            required
          />
          {form.fecha_nacimiento && (
            <div className="flex items-center justify-between mt-2 text-[10px] font-bold">
              <p className="text-cyan-400">EDAD: {edad} AÑOS</p>
              {esMenor && <p className="text-orange-500 animate-pulse">⚠️ REQUIERE AUTORIZACIÓN DEL TUTOR</p>}
            </div>
          )}
        </div>

        {esMenor && (
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 p-6 rounded-[2rem] bg-orange-500/5 border border-orange-500/20 animate-in zoom-in-95 duration-300">
            <div className="md:col-span-2 flex items-start gap-3 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 mb-2">
              <Smartphone className="text-orange-500 mt-1 flex-none" size={18} />
              <div>
                <p className="text-xs font-bold uppercase tracking-tight text-orange-500">Autorización Parental Requerida</p>
                <p className="text-[11px] leading-relaxed text-indigo-200">
                  Al ser menor de edad, el tutor responsable recibirá un enlace por WhatsApp para firmar y validar tu inscripción mediante firma digital.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-orange-500">Nombre del Tutor responsable *</label>
              <input
                className="w-full rounded-xl px-4 py-3 bg-indigo-950/40 border border-orange-500/30 text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                name="tutor_nombre"
                placeholder="Nombre completo"
                value={form.tutor_nombre}
                onChange={onChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-orange-500">DNI del Tutor *</label>
              <input
                className="w-full rounded-xl px-4 py-3 bg-indigo-950/40 border border-orange-500/30 text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                name="tutor_dni"
                placeholder="DNI del tutor"
                value={form.tutor_dni}
                onChange={onChange}
                required
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-semibold text-orange-500">WhatsApp del Tutor (Celular) *</label>
              <input
                className="w-full rounded-xl px-4 py-3 bg-indigo-950/40 border border-orange-500/30 text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                name="tutor_telefono"
                placeholder="2964 XXXXXX (Sin 0 ni 15)"
                value={form.tutor_telefono}
                onChange={onChange}
                required
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest ml-1 text-indigo-400">Nacionalidad</label>
          <input
            className="w-full rounded-2xl px-5 py-4 bg-indigo-950/40 border border-indigo-500/30 text-white focus:outline-none"
            name="nacionalidad"
            value={form.nacionalidad}
            onChange={onChange}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest ml-1 text-indigo-400">Provincia de Nacimiento</label>
          <input
            className="w-full rounded-2xl px-5 py-4 bg-indigo-950/40 border border-indigo-500/30 text-white focus:outline-none"
            name="lugar_nacimiento"
            placeholder="Ej: Tierra del Fuego"
            value={form.lugar_nacimiento}
            onChange={onChange}
          />
        </div>
      </div>
    </div>
  );
}
