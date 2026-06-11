import React, { useState, useEffect } from "react";
import { Save, ShieldAlert, CheckCircle2, Gamepad2, Clock } from "lucide-react";
import { apiClientV2 } from "../../api/client";

export default function ConfigTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cohortes, setCohortes] = useState([]);
  const [config, setConfig] = useState({
    preinscripcion_abierta: false,
    fecha_inicio: "",
    fecha_fin: "",
    mensaje_cierre: "",
    cohorte_activa_id: "",
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        // 1. Cargar Configuración actual
        const { data: cfg } = await apiClientV2.get("/videojuegos/config");
        setConfig({
          preinscripcion_abierta: cfg.preinscripcion_abierta ?? false,
          fecha_inicio: cfg.fecha_inicio ?? "",
          fecha_fin: cfg.fecha_fin ?? "",
          mensaje_cierre: cfg.mensaje_cierre ?? "",
          cohorte_activa_id: cfg.cohorte_activa_id ?? "",
        });

        // 2. Cargar Cohortes de Videojuegos
        const { data: oferta } = await apiClientV2.get("/preinscripcion/oferta", {
          params: { programa_codigo: "VJ" },
        });
        const program = oferta?.items?.[0] || null;
        if (program) {
          // Obtener cohortes únicas
          const cohList = [];
          const seen = new Set();
          (program.bloques || []).forEach((b) => {
            if (b.cohorte_id && !seen.has(b.cohorte_id)) {
              seen.add(b.cohorte_id);
              cohList.push({
                id: b.cohorte_id,
                nombre: b.cohorte_nombre || `Cohorte ${b.cohorte_id}`,
              });
            }
          });
          setCohortes(cohList);
        }
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar la configuración de videojuegos.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        preinscripcion_abierta: config.preinscripcion_abierta,
        fecha_inicio: config.fecha_inicio || "",
        fecha_fin: config.fecha_fin || "",
        mensaje_cierre: config.mensaje_cierre || "",
        cohorte_activa_id: config.cohorte_activa_id ? parseInt(config.cohorte_activa_id) : 0,
      };
      await apiClientV2.patch("/videojuegos/config", payload);
      setSuccess("Configuración guardada correctamente.");
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al guardar la configuración.");
    } finally {
      setSaving(false);
    }
  };

  const set = (k, v) => setConfig((prev) => ({ ...prev, [k]: v }));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-indigo-300 font-bold uppercase tracking-wider space-y-4">
        <div className="animate-spin text-[#00ccff]"><Gamepad2 size={40} /></div>
        <p className="text-xs">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-semibold flex items-center gap-2">
          <ShieldAlert size={16} /> {error}
        </div>
      )}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} /> {success}
        </div>
      )}

      <div className="bg-[#0c122c]/50 border border-indigo-500/10 backdrop-blur-xl rounded-[2rem] p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#00ccff]/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#FF6600]/5 rounded-full blur-2xl pointer-events-none" />

        <h3 className="text-lg font-black text-white uppercase tracking-widest border-b border-indigo-500/10 pb-4 mb-6 flex items-center gap-2">
          <Gamepad2 size={20} className="text-[#00ccff]" /> Configuración de Inscripción VJ
        </h3>

        <form onSubmit={save} className="space-y-6">
          {/* Switch Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-indigo-500/5">
            <div>
              <p className="font-bold text-sm text-white">Estado de Preinscripción</p>
              <p className="text-xs text-indigo-300 mt-0.5">Habilita o deshabilita el formulario de Videojuegos.</p>
            </div>
            <button
              type="button"
              onClick={() => set("preinscripcion_abierta", !config.preinscripcion_abierta)}
              className={`w-14 h-8 rounded-full transition-all duration-300 relative ${
                config.preinscripcion_abierta
                  ? "bg-gradient-to-r from-[#00ccff] to-cyan-500 shadow-[0_0_10px_rgba(0,255,255,0.4)]"
                  : "bg-indigo-950 border border-indigo-500/20"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-all duration-300 ${
                  config.preinscripcion_abierta ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-[#00ccff]">Fecha Inicio (Opcional)</label>
              <input
                type="date"
                value={config.fecha_inicio}
                onChange={(e) => set("fecha_inicio", e.target.value)}
                className="w-full rounded-2xl px-4 py-3 bg-indigo-950/40 border border-indigo-500/25 text-white focus:border-[#00ccff]/70 focus:outline-none transition-all text-sm font-semibold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-[#00ccff]">Fecha Fin (Opcional)</label>
              <input
                type="date"
                value={config.fecha_fin}
                onChange={(e) => set("fecha_fin", e.target.value)}
                className="w-full rounded-2xl px-4 py-3 bg-indigo-950/40 border border-indigo-500/25 text-white focus:border-[#00ccff]/70 focus:outline-none transition-all text-sm font-semibold"
              />
            </div>
          </div>

          {/* Cohorte Activa */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-[#00ccff]">Cohorte Activa</label>
            <select
              value={config.cohorte_activa_id}
              onChange={(e) => set("cohorte_activa_id", e.target.value)}
              className="w-full rounded-2xl px-4 py-3.5 bg-indigo-950/40 border border-indigo-500/25 text-white focus:border-[#00ccff]/70 focus:outline-none transition-all text-sm font-bold"
            >
              <option value="" className="bg-[#0c122c] text-white">Seleccione una cohorte...</option>
              {cohortes.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0c122c] text-white">
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Mensaje Cierre */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-[#FF6600]">Mensaje cuando esté Cerrado</label>
            <textarea
              rows={3}
              value={config.mensaje_cierre}
              onChange={(e) => set("mensaje_cierre", e.target.value)}
              placeholder="Las preinscripciones están cerradas en este momento."
              className="w-full rounded-2xl px-4 py-3 bg-indigo-950/40 border border-indigo-500/25 text-white focus:border-[#FF6600]/70 focus:outline-none transition-all text-sm font-semibold"
            />
          </div>

          {/* Submit */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-brand-cyan to-brand-accent text-[#050814] font-black text-xs uppercase tracking-widest transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={15} /> {saving ? "Guardando..." : "Guardar Configuración"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
