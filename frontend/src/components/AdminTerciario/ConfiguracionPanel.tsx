import React, { useState, useEffect, useCallback } from "react";
import { ToggleRight, ToggleLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { apiClientV2 } from "../../api/client";
import { formatDateDisplay } from "../../utils/dateFormat";

interface ConfigData {
  abierta: boolean;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  mensaje_cierre?: string | null;
}

interface CohorteActivaData {
  id: number;
  nombre: string;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
}

interface FormState {
  fecha_inicio: string;
  fecha_fin: string;
  mensaje_cierre: string;
}

export function ConfiguracionPanel() {
  const [cfg, setCfg] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [cohorteActiva, setCohorteActiva] = useState<CohorteActivaData | null>(null);
  const [form, setForm] = useState<FormState>({ fecha_inicio: "", fecha_fin: "", mensaje_cierre: "" });
  const [saving, setSaving] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>("");

  const fetchCfg = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data }, cohRes] = await Promise.all([
        apiClientV2.get("/preinscripcion-terciario-config"),
        apiClientV2.get("/preinscripciones-terciario-cohorte").catch(() => ({ data: null })),
      ]);
      setCfg(data);
      setCohorteActiva(cohRes.data?.id ? cohRes.data : null);
      setForm({
        fecha_inicio: data.fecha_inicio || "",
        fecha_fin: data.fecha_fin || "",
        mensaje_cierre: data.mensaje_cierre || "",
      });
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCfg(); }, [fetchCfg]);

  const toggleAbierta = async () => {
    if (!cfg) return;
    const next = !cfg.abierta;
    try {
      const { data } = await apiClientV2.patch("/preinscripcion-terciario-config", null, {
        params: { abierta: next },
      });
      setCfg(data);
      setMsg(next ? "Preinscripciones habilitadas." : "Preinscripciones cerradas.");
    } catch { setMsg("Error al cambiar estado."); }
  };

  const saveDatos = async () => {
    setSaving(true);
    setMsg("");
    try {
      const params: Record<string, string> = {};
      if (form.fecha_inicio) params.fecha_inicio = form.fecha_inicio;
      if (form.fecha_fin) params.fecha_fin = form.fecha_fin;
      if (form.mensaje_cierre) params.mensaje_cierre = form.mensaje_cierre;
      const { data } = await apiClientV2.patch("/preinscripcion-terciario-config", null, { params });
      setCfg(data);
      setMsg("Guardado correctamente.");
    } catch { setMsg("Error al guardar."); }
    finally { setSaving(false); }
  };

  const hasFechas = cfg?.fecha_inicio || cfg?.fecha_fin;

  if (loading) return <div className="text-center py-20 text-[#1a1f4e]/40 text-sm">Cargando...</div>;
  if (!cfg) return <div className="text-center py-20 text-[#1a1f4e]/40 text-sm">Error al cargar la configuración.</div>;

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-black text-[#1a1f4e]">Configuración</h1>
        <p className="text-[#1a1f4e]/50 text-sm mt-1">Controlá cuándo está habilitado el formulario de preinscripción</p>
      </div>

      {/* Estado actual */}
      <div className={`rounded-2xl border shadow-sm p-6 flex items-center gap-5 ${
        cfg.abierta ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
      }`}>
        <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${
          cfg.abierta ? "bg-green-500" : "bg-red-400"
        }`}>
          {cfg.abierta ? <ToggleRight size={28} className="text-white" /> : <ToggleLeft size={28} className="text-white" />}
        </div>
        <div>
          <p className={`text-xl font-black ${cfg.abierta ? "text-green-800" : "text-red-700"}`}>
            Preinscripciones {cfg.abierta ? "ABIERTAS" : "CERRADAS"}
          </p>
          <p className={`text-sm mt-0.5 ${cfg.abierta ? "text-green-700" : "text-red-600"}`}>
            {hasFechas
              ? cfg.abierta
                ? `El formulario acepta inscripciones hasta el ${formatDateDisplay(cfg.fecha_fin || "")}.`
                : `Fuera del período configurado. ${cfg.fecha_inicio ? `Abre el ${formatDateDisplay(cfg.fecha_inicio)}.` : ""}`
              : cfg.abierta
                ? "Habilitado manualmente — sin período configurado."
                : "Cerrado manualmente — sin período configurado."}
          </p>
        </div>
      </div>

      {/* Período automático */}
      <div className="bg-white rounded-2xl border border-[#b8ccd8] shadow-sm p-6 space-y-4">
        <div>
          <h2 className="font-black text-[#1a1f4e]">Período de preinscripción automático</h2>
          <p className="text-xs text-[#1a1f4e]/50 mt-1">
            El formulario se abre y cierra solo según las fechas. Si no configurás fechas, usá el botón manual.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-[#1a1f4e]/50 mb-1 block">Fecha inicio</label>
            <input type="date" value={form.fecha_inicio}
              onChange={(e) => setForm(f => ({ ...f, fecha_inicio: e.target.value }))}
              className="w-full rounded-xl px-3 py-2 border border-[#b8ccd8] text-[#1a1f4e] text-sm focus:outline-none focus:ring-2 focus:ring-[#f5c518]" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-[#1a1f4e]/50 mb-1 block">Fecha fin</label>
            <input type="date" value={form.fecha_fin}
              onChange={(e) => setForm(f => ({ ...f, fecha_fin: e.target.value }))}
              className="w-full rounded-xl px-3 py-2 border border-[#b8ccd8] text-[#1a1f4e] text-sm focus:outline-none focus:ring-2 focus:ring-[#f5c518]" />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-[#1a1f4e]/50 mb-1 block">
            Mensaje cuando está cerrado
          </label>
          <textarea
            value={form.mensaje_cierre}
            onChange={(e) => setForm(f => ({ ...f, mensaje_cierre: e.target.value }))}
            rows={3}
            placeholder="Ej: Las preinscripciones para 2026 ya están cerradas. Pronto comunicaremos novedades."
            className="w-full rounded-xl px-3 py-2 border border-[#b8ccd8] text-[#1a1f4e] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#f5c518]"
          />
        </div>

        <button onClick={saveDatos} disabled={saving}
          className="w-full py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "#1a1f4e", color: "#f5c518" }}>
          {saving ? "Guardando..." : "Guardar período"}
        </button>
      </div>

      {/* Toggle manual — solo si no hay fechas */}
      <div className="bg-white rounded-2xl border border-[#b8ccd8] shadow-sm p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-black text-[#1a1f4e] text-base">Activación manual</p>
            <p className="text-sm text-[#1a1f4e]/50 mt-0.5">
              {hasFechas
                ? "Desactivado: las fechas configuradas controlan el estado automáticamente."
                : "Sin fechas configuradas, este botón controla el formulario."}
            </p>
          </div>
          <button
            onClick={hasFechas ? undefined : toggleAbierta}
            disabled={!!hasFechas}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${
              hasFechas
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : cfg.abierta
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
          >
            {cfg.abierta ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
            {cfg.abierta ? "Abierto" : "Cerrado"}
          </button>
        </div>
      </div>

      {/* Cohorte HD activa */}
      <div className="bg-white rounded-2xl border border-[#b8ccd8] shadow-sm p-6 space-y-3">
        <div>
          <h2 className="font-black text-[#1a1f4e]">Cohorte HD activa</h2>
          <p className="text-xs text-[#1a1f4e]/50 mt-1">Al aprobar una preinscripción, el sistema inscribe al estudiante automáticamente en la cohorte de HD Módulo 2 activa.</p>
        </div>
        {cohorteActiva ? (
          <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm font-semibold flex items-center gap-3">
            <CheckCircle2 size={18} className="flex-shrink-0" />
            <div>
              <p>{cohorteActiva.nombre}</p>
              <p className="text-xs font-normal text-green-700 mt-0.5">{formatDateDisplay(cohorteActiva.fecha_inicio || "")} → {formatDateDisplay(cohorteActiva.fecha_fin || "")}</p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 text-sm font-semibold flex items-center gap-2">
            <AlertCircle size={16} /> No hay cohorte activa en CFP para HD Módulo 2.
          </div>
        )}
      </div>

      {msg && <p className="text-sm font-semibold text-green-600">{msg}</p>}
    </div>
  );
}
