import React from "react";
import { Smartphone } from "lucide-react";
import { FormState } from "./types";

interface StepIdentidadProps {
  form: FormState;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  edad: number;
  esMenor: boolean;
  isDark: boolean;
}

export function StepIdentidad({ form, onChange, edad, esMenor, isDark }: StepIdentidadProps) {
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
        <h2 className={`text-2xl font-black ${textTitleCls}`}>Identidad</h2>
        <p className={textHelpCls}>Tus datos personales básicos.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest ml-1 text-cyan-400">Apellido</label>
          <input
            className={inputCls}
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
            className={inputCls}
            name="nombre"
            placeholder="Juan"
            value={form.nombre}
            onChange={onChange}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest ml-1 text-cyan-400">DNI</label>
          <input
            className={inputCls}
            name="dni"
            placeholder="Sin puntos ni espacios"
            value={form.dni}
            onChange={onChange}
            required
          />
        </div>
        <div className="space-y-2">
          <label className={`text-xs font-black uppercase tracking-widest ml-1 ${isDark ? "text-indigo-400" : "text-[#1e3a5f]"}`}>
            CUIT (Opcional)
          </label>
          <input className={inputCls} name="cuit" placeholder="20XXXXXXXXX" value={form.cuit} onChange={onChange} />
        </div>
        <div className="space-y-2">
          <label className={`text-xs font-black uppercase tracking-widest ml-1 ${isDark ? "text-indigo-400" : "text-[#1e3a5f]"}`}>
            Sexo
          </label>
          <select className={inputCls} name="sexo" value={form.sexo} onChange={onChange}>
            <option value="">Seleccione...</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
            <option value="O">Otro/X</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className={`text-xs font-black uppercase tracking-widest ml-1 ${isDark ? "text-indigo-400" : "text-[#1e3a5f]"}`}>
            Fecha de Nacimiento *
          </label>
          <input
            type="date"
            className={inputCls}
            name="fecha_nacimiento"
            value={form.fecha_nacimiento}
            onChange={onChange}
            required
          />
          {form.fecha_nacimiento && (
            <div className="flex items-center justify-between mt-2">
              <p
                className={`text-[10px] font-bold ${
                  esMenor ? (isDark ? "text-orange-400" : "text-orange-700") : "text-cyan-400"
                }`}
              >
                EDAD CALCULADA: {edad} AÑOS
              </p>
              {esMenor && (
                <p className={`text-[10px] font-black animate-pulse ${isDark ? "text-orange-400" : "text-orange-600"}`}>
                  ⚠️ REQUIERE TUTOR (CODE 3)
                </p>
              )}
            </div>
          )}
        </div>
        {esMenor && (
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 p-6 rounded-[2rem] bg-orange-500/5 border border-orange-500/20 animate-in zoom-in-95 duration-300">
            <div className="md:col-span-2 flex items-start gap-4 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 mb-2">
              <Smartphone className={`${isDark ? "text-orange-400" : "text-orange-600"} mt-1 flex-none`} size={20} />
              <div>
                <p className={`text-xs font-bold uppercase tracking-tight ${isDark ? "text-orange-200" : "text-orange-700"}`}>
                  Autorización del Padre/Madre o Tutor vía WhatsApp
                </p>
                <p className={`text-[11px] leading-relaxed ${isDark ? "text-orange-300/80" : "text-orange-900"}`}>
                  Al ser menor de edad, el padre, madre o tutor responsable recibirá un enlace por <b>WhatsApp</b> para
                  autorizar la cursada mediante una <b>firma digital (selfie de conformidad)</b>.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest ml-1 text-orange-500">
                Nombre del Padre/Madre o Tutor *
              </label>
              <input
                className={`${inputCls} border-orange-500/30`}
                name="tutor_nombre"
                placeholder="Nombre completo"
                value={form.tutor_nombre}
                onChange={onChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest ml-1 text-orange-500">
                DNI del Padre/Madre o Tutor *
              </label>
              <input
                className={`${inputCls} border-orange-500/30`}
                name="tutor_dni"
                placeholder="DNI del responsable"
                value={form.tutor_dni}
                onChange={onChange}
                required
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-black uppercase tracking-widest ml-1 text-orange-500">
                WhatsApp del Padre/Madre o Tutor (Celular) *
              </label>
              <input
                className={`${inputCls} border-orange-500/30`}
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
          <label className={`text-xs font-black uppercase tracking-widest ml-1 ${isDark ? "text-indigo-400" : "text-[#1e3a5f]"}`}>
            Nacionalidad
          </label>
          <input className={inputCls} name="nacionalidad" value={form.nacionalidad} onChange={onChange} />
        </div>
        <div className="space-y-2">
          <label className={`text-xs font-black uppercase tracking-widest ml-1 ${isDark ? "text-indigo-400" : "text-[#1e3a5f]"}`}>
            Lugar de Nacim. (Provincia)
          </label>
          <input
            className={inputCls}
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
