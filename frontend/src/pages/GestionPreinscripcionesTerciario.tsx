import React, { useState, useEffect, useCallback } from "react";
import { apiClientV2 } from "../api/client";
import { Search, Eye, X, CheckCircle2, XCircle, Clock } from "lucide-react";
import { PreinscripcionTerciario } from "../api/types";

const ESTADOS = [
  { value: "", label: "Todos los estados" },
  { value: "pendiente", label: "Pendiente" },
  { value: "aprobada", label: "Aprobada" },
  { value: "rechazada", label: "Rechazada" },
];

const LOCALIDAD_LABELS: Record<string, string> = {
  ushuaia: "Ushuaia", rg_sur: "Río Grande Sur", rg_norte: "Río Grande Norte",
  tolhuin: "Tolhuin", zona_rural: "Zona Rural", otras: "Otras",
};

const LOCALIDADES = [
  { value: "", label: "Todas las localidades" },
  { value: "ushuaia", label: "Ushuaia" },
  { value: "rg_sur", label: "Río Grande Sur" },
  { value: "rg_norte", label: "Río Grande Norte" },
  { value: "tolhuin", label: "Tolhuin" },
  { value: "zona_rural", label: "Zona Rural" },
];

const BADGE: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800 border-yellow-200",
  aprobada: "bg-green-100 text-green-800 border-green-200",
  rechazada: "bg-red-100 text-red-800 border-red-200",
};

const BADGE_ICON: Record<string, React.ReactNode> = {
  pendiente: <Clock size={12} />,
  aprobada: <CheckCircle2 size={12} />,
  rechazada: <XCircle size={12} />,
};

function StateBadge({ estado }: { estado: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${BADGE[estado] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
      {BADGE_ICON[estado]}
      {estado.charAt(0).toUpperCase() + estado.slice(1)}
    </span>
  );
}

function YesNo({ value }: { value: boolean | string | null | undefined }) {
  if (value === true || value === "si") return <span className="text-green-600 font-semibold">Sí</span>;
  if (value === false || value === "no") return <span className="text-red-500 font-semibold">No</span>;
  return <span className="text-gray-400">—</span>;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4">
      <span className="text-xs font-bold uppercase tracking-wide text-indigo-400 sm:w-48 flex-shrink-0">{label}</span>
      <span className="text-sm text-white/90">{value ?? "—"}</span>
    </div>
  );
}

interface DetailModalProps {
  p: PreinscripcionTerciario;
  onClose: () => void;
  onSave: () => void;
}

function DetailModal({ p, onClose, onSave }: DetailModalProps) {
  const [estado, setEstado] = useState<string>(p.estado);
  const [obs, setObs] = useState<string>(p.observaciones || "");
  const [saving, setSaving] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>("");

  const save = async () => {
    setSaving(true);
    try {
      await apiClientV2.patch(`/preinscripciones-terciario/${p.id}`, null, {
        params: { estado, observaciones: obs },
      });
      setMsg("Guardado correctamente.");
      onSave();
    } catch {
      setMsg("Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0f1133] border border-indigo-500/20 rounded-3xl w-full max-w-2xl my-8 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-indigo-500/20">
          <div>
            <h2 className="text-lg font-black text-white">{p.apellido_nombre}</h2>
            <p className="text-indigo-400 text-sm">DNI: {p.dni} · {p.email}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-indigo-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Datos personales */}
          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-indigo-500 border-b border-indigo-500/20 pb-1 mb-3">Datos Personales</p>
            <Row label="CUIL" value={p.cuil} />
            <Row label="Sexo" value={p.sexo} />
            <Row label="Celular" value={p.celular} />
            <Row label="Fecha nacimiento" value={p.fecha_nacimiento} />
            <Row label="Localidad nacimiento" value={p.localidad_nacimiento} />
            <Row label="Provincia nacimiento" value={p.provincia_nacimiento} />
            <Row label="Nacionalidad" value={p.nacionalidad} />
            <Row label="Domicilio" value={p.domicilio} />
            <Row label="Localidad residencia" value={p.localidad} />
          </div>

          {/* Datos académicos */}
          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-indigo-500 border-b border-indigo-500/20 pb-1 mb-3">Datos Académicos</p>
            <Row label="Finalizó secundaria" value={
              p.finalizo_secundaria === "si" ? "Sí" :
              p.finalizo_secundaria === "no" ? "No" :
              p.finalizo_secundaria === "cursando" ? "Cursando último año" : p.finalizo_secundaria
            } />
            <Row label="Estudios superiores" value={<YesNo value={p.posee_estudios_superiores} />} />
            {p.posee_estudios_superiores && (
              <>
                <Row label="Estudios finalizados" value={<YesNo value={p.estudios_superiores_finalizado} />} />
                <Row label="Carrera" value={p.estudios_superiores_carrera} />
              </>
            )}
          </div>

          {/* Datos tecnológicos */}
          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-indigo-500 border-b border-indigo-500/20 pb-1 mb-3">Datos Tecnológicos</p>
            <Row label="Posee PC/notebook" value={<YesNo value={p.posee_pc} />} />
            <Row label="Posee internet" value={<YesNo value={p.posee_internet} />} />
          </div>

          {/* Datos complementarios */}
          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-indigo-500 border-b border-indigo-500/20 pb-1 mb-3">Datos Complementarios</p>
            <Row label="Pueblo originario" value={<YesNo value={p.pueblo_originario} />} />
            <Row label="Posee discapacidad" value={<YesNo value={p.posee_discapacidad} />} />
            {p.posee_discapacidad && (
              <>
                <Row label="Tipo discapacidad" value={p.tipo_discapacidad} />
                <Row label="Posee CUD" value={<YesNo value={p.posee_cud} />} />
                <Row label="Apoyo inclusión" value={p.apoyo_inclusion} />
                <Row label="Requiere apoyo específico" value={<YesNo value={p.requiere_apoyo_especifico} />} />
                {p.requiere_apoyo_especifico && <Row label="Descripción apoyo" value={p.descripcion_apoyo} />}
              </>
            )}
          </div>

          {/* Gestión */}
          <div className="space-y-3 pt-2 border-t border-indigo-500/20">
            <p className="text-xs font-black uppercase tracking-widest text-indigo-500">Gestión</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-indigo-300 mb-1 block">Estado</label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 bg-indigo-950/50 border border-indigo-500/30 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="aprobada">Aprobada</option>
                  <option value="rechazada">Rechazada</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-indigo-300 mb-1 block">Observaciones</label>
                <textarea
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl px-3 py-2 bg-indigo-950/50 border border-indigo-500/30 text-white text-sm resize-none focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  placeholder="Agregar observaciones..."
                />
              </div>
            </div>
            {msg && <p className={`text-xs font-semibold ${msg.includes("Error") ? "text-red-400" : "text-green-400"}`}>{msg}</p>}
            <button
              onClick={save}
              disabled={saving}
              className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GestionPreinscripcionesTerciario() {
  const [data, setData] = useState<PreinscripcionTerciario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [filtroEstado, setFiltroEstado] = useState<string>("");
  const [filtroLocalidad, setFiltroLocalidad] = useState<string>("");
  const [selected, setSelected] = useState<PreinscripcionTerciario | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroLocalidad) params.localidad = filtroLocalidad;
      const { data: res } = await apiClientV2.get("/preinscripciones-terciario", { params });
      setData(Array.isArray(res) ? res : []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, filtroLocalidad]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = data.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.apellido_nombre?.toLowerCase().includes(q) ||
      p.dni?.includes(q) ||
      p.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Preinscripciones Terciario</h1>
          <p className="text-indigo-400 text-sm mt-0.5">Tecnicatura en Ciencias de Datos e IA</p>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-bold">
          {filtered.length} registros
        </span>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, DNI o email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-white placeholder-indigo-400 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="rounded-xl px-3 py-2.5 bg-indigo-950/40 border border-indigo-500/20 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
        >
          {ESTADOS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
        <select
          value={filtroLocalidad}
          onChange={(e) => setFiltroLocalidad(e.target.value)}
          className="rounded-xl px-3 py-2.5 bg-indigo-950/40 border border-indigo-500/20 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
        >
          {LOCALIDADES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-16 text-indigo-400 text-sm">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-indigo-400 text-sm">No hay registros.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-indigo-500/20">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-indigo-950/60 text-indigo-400 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left font-bold">Apellido y Nombre</th>
                <th className="px-4 py-3 text-left font-bold">DNI</th>
                <th className="px-4 py-3 text-left font-bold">Localidad</th>
                <th className="px-4 py-3 text-left font-bold">Secundaria</th>
                <th className="px-4 py-3 text-left font-bold">Estado</th>
                <th className="px-4 py-3 text-left font-bold">Fecha</th>
                <th className="px-4 py-3 text-left font-bold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-500/10">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-indigo-500/5 transition-colors">
                  <td className="px-4 py-3 font-semibold text-white">{p.apellido_nombre}</td>
                  <td className="px-4 py-3 text-indigo-200">{p.dni}</td>
                  <td className="px-4 py-3 text-indigo-200">{(p.localidad && LOCALIDAD_LABELS[p.localidad]) || p.localidad || ""}</td>
                  <td className="px-4 py-3 text-indigo-200">
                    {p.finalizo_secundaria === "si" ? "Sí" :
                     p.finalizo_secundaria === "no" ? "No" :
                     "Cursando"}
                  </td>
                  <td className="px-4 py-3"><StateBadge estado={p.estado} /></td>
                  <td className="px-4 py-3 text-indigo-300 text-xs">{p.created_at}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelected(p)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-semibold transition-colors"
                    >
                      <Eye size={13} /> Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <DetailModal
          p={selected}
          onClose={() => setSelected(null)}
          onSave={() => { fetchData(); setSelected(null); }}
        />
      )}
    </div>
  );
}
