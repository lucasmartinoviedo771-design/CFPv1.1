import React, { useState } from "react";
import { X, ShieldAlert, Save } from "lucide-react";
import { apiClientV2 } from "../../api/client";
import { VideojuegosAlumnoDetail, ESTADOS_ALUMNO } from "./AlumnosTab";

interface EditAlumnoModalProps {
  student: VideojuegosAlumnoDetail;
  onClose: () => void;
  onSave: () => void;
}

export function EditAlumnoModal({ student, onClose, onSave }: EditAlumnoModalProps) {
  const [form, setForm] = useState<VideojuegosAlumnoDetail>({ ...student });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target;
    const name = target.name;
    const value = target.type === "checkbox" ? (target as HTMLInputElement).checked : target.value;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiClientV2.patch(`/videojuegos/alumnos/${student.id}`, form);
      onSave();
    } catch (err: unknown) {
      console.error(err);
      setError("Error al actualizar la ficha del alumno.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-start justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-[#0c122c] border border-indigo-500/20 rounded-[2.5rem] w-full max-w-2xl my-8 shadow-2xl relative overflow-hidden flex flex-col">
        <div className="p-6 border-b border-indigo-500/10 flex items-center justify-between">
          <h3 className="text-lg font-black text-white uppercase tracking-wider">Editar Ficha Académica</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-indigo-300 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-semibold flex items-center gap-2">
              <ShieldAlert size={16} /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-indigo-300">Apellido</label>
              <input name="apellido" value={form.apellido || ""} onChange={handleChange} required className="w-full rounded-xl px-4 py-2.5 bg-indigo-950/40 border border-indigo-500/25 text-white text-sm focus:border-brand-cyan/70 focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-indigo-300">Nombre</label>
              <input name="nombre" value={form.nombre || ""} onChange={handleChange} required className="w-full rounded-xl px-4 py-2.5 bg-indigo-950/40 border border-indigo-500/25 text-white text-sm focus:border-brand-cyan/70 focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-indigo-300">DNI</label>
              <input name="dni" value={form.dni || ""} onChange={handleChange} required className="w-full rounded-xl px-4 py-2.5 bg-indigo-950/40 border border-indigo-500/25 text-white text-sm focus:border-brand-cyan/70 focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-indigo-300">Email</label>
              <input type="email" name="email" value={form.email || ""} onChange={handleChange} required className="w-full rounded-xl px-4 py-2.5 bg-indigo-950/40 border border-indigo-500/25 text-white text-sm focus:border-brand-cyan/70 focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-indigo-300">Teléfono</label>
              <input name="telefono" value={form.telefono || ""} onChange={handleChange} className="w-full rounded-xl px-4 py-2.5 bg-indigo-950/40 border border-indigo-500/25 text-white text-sm focus:border-brand-cyan/70 focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-indigo-300">Estado Académico</label>
              <select name="estatus" value={form.estatus || ""} onChange={handleChange} className="w-full rounded-xl px-4 py-2.5 bg-indigo-950/40 border border-indigo-500/25 text-white text-sm focus:outline-none">
                {ESTADOS_ALUMNO.filter(e => e.value !== "").map(e => (
                  <option key={e.value} value={e.value} className="bg-[#0c122c]">{e.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-950/25 border border-indigo-500/10 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-brand-cyan">Recursos y Situación Laboral</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="posee_pc" checked={form.posee_pc || false} onChange={handleChange} className="w-4 h-4 rounded text-brand-cyan focus:ring-0 accent-brand-cyan" />
                <span className="text-xs font-bold text-indigo-200">Posee PC</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="posee_conectividad" checked={form.posee_conectividad || false} onChange={handleChange} className="w-4 h-4 rounded text-brand-cyan focus:ring-0 accent-brand-cyan" />
                <span className="text-xs font-bold text-indigo-200">Tiene Internet</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="trabaja" checked={form.trabaja || false} onChange={handleChange} className="w-4 h-4 rounded text-brand-cyan focus:ring-0 accent-brand-cyan" />
                <span className="text-xs font-bold text-indigo-200">Trabaja</span>
              </label>
            </div>
            {form.trabaja && (
              <div className="space-y-1 pt-2">
                <label className="text-[10px] font-black uppercase text-indigo-300">Lugar de Trabajo</label>
                <input name="lugar_trabajo" value={form.lugar_trabajo || ""} onChange={handleChange} className="w-full rounded-xl px-4 py-2 bg-indigo-950/40 border border-indigo-500/25 text-white text-sm focus:outline-none" />
              </div>
            )}
          </div>
        </form>

        <div className="p-6 border-t border-indigo-500/10 flex justify-end gap-3 bg-[#0a0d24]">
          <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest">
            Cancelar
          </button>
          <button type="button" onClick={submit} disabled={saving} className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-accent text-[#050814] font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all">
            <Save size={14} /> {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
