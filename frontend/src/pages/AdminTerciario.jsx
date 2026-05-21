import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiClientV2 } from "../api/client";
import authService from "../services/authService";
import {
  Search, Eye, X, CheckCircle2, XCircle, Clock, LogOut,
  Users, BookCheck, AlertCircle, MapPin, BarChart3,
} from "lucide-react";

const P = { navy: "#1a1f4e", yellow: "#f5c518", blue: "#b8ccd8", gray: "#c8c4bc" };

const ESTADOS_FILTER = [
  { value: "", label: "Todos" },
  { value: "pendiente", label: "Pendientes" },
  { value: "aprobada", label: "Aprobadas" },
  { value: "rechazada", label: "Rechazadas" },
];

const LOCALIDAD_LABELS = {
  ushuaia: "Ushuaia", rg_sur: "Río Grande Sur", rg_norte: "Río Grande Norte",
  tolhuin: "Tolhuin", zona_rural: "Zona Rural", otras: "Otras",
};

const SECUNDARIA_LABELS = { si: "Sí", no: "No", cursando: "Cursando" };
const HD_ESTADO_LABELS = { CURSANDO: "Cursando", APROBADO: "Aprobado", DESAPROBADO: "Desaprobado", INACTIVO: "Inactivo" };
const HD_ESTADO_COLORS = {
  CURSANDO: "bg-blue-100 text-blue-800", APROBADO: "bg-green-100 text-green-800",
  DESAPROBADO: "bg-red-100 text-red-800", INACTIVO: "bg-gray-100 text-gray-600",
};

const BADGE = {
  pendiente: "bg-yellow-100 text-yellow-800 border-yellow-200",
  aprobada: "bg-green-100 text-green-800 border-green-200",
  rechazada: "bg-red-100 text-red-800 border-red-200",
};
const BADGE_ICON = {
  pendiente: <Clock size={11} />, aprobada: <CheckCircle2 size={11} />, rechazada: <XCircle size={11} />,
};

function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#b8ccd8]/50 flex items-center gap-4">
      <div className="p-3 rounded-xl flex-shrink-0" style={{ background: color + "20" }}>
        {React.cloneElement(icon, { size: 22, color })}
      </div>
      <div>
        <p className="text-2xl font-black text-[#1a1f4e]">{value}</p>
        <p className="text-xs text-[#1a1f4e]/60 font-medium">{label}</p>
      </div>
    </div>
  );
}

function Badge({ estado }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${BADGE[estado] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {BADGE_ICON[estado]} {estado?.charAt(0).toUpperCase() + estado?.slice(1)}
    </span>
  );
}

function YesNo({ v }) {
  if (v === true) return <span className="text-green-600 font-semibold text-xs">Sí</span>;
  if (v === false) return <span className="text-red-500 font-semibold text-xs">No</span>;
  return <span className="text-gray-400 text-xs">—</span>;
}

function Row({ label, value }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="font-bold text-[#1a1f4e]/50 text-xs uppercase tracking-wide w-44 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-[#1a1f4e]">{value ?? "—"}</span>
    </div>
  );
}

function DetailModal({ p, onClose, onSaved }) {
  const [estado, setEstado] = useState(p.estado);
  const [obs, setObs] = useState(p.observaciones || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const save = async () => {
    setSaving(true);
    try {
      await apiClientV2.patch(`/preinscripciones-terciario/${p.id}`, null, { params: { estado, observaciones: obs } });
      setMsg("Guardado.");
      onSaved();
    } catch { setMsg("Error al guardar."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl my-8 shadow-2xl border border-[#b8ccd8]">
        <div className="flex items-center justify-between p-6 border-b border-[#b8ccd8]" style={{ background: P.navy }}>
          <div>
            <h2 className="text-lg font-black text-white">{p.apellido_nombre}</h2>
            <p className="text-[#f5c518] text-xs mt-0.5">DNI: {p.dni} · {p.email}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* HD Status */}
          {p.hd_estado && (
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold ${HD_ESTADO_COLORS[p.hd_estado] || "bg-gray-100"}`}>
              <BookCheck size={18} /> Habilidades Digitales Módulo 2: {HD_ESTADO_LABELS[p.hd_estado] || p.hd_estado}
            </div>
          )}
          {!p.hd_estado && p.estado === "aprobada" && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-orange-200 bg-orange-50 text-orange-700 text-sm font-semibold">
              <AlertCircle size={18} /> HD Módulo 2: pendiente de inscripción
            </div>
          )}

          {/* Datos personales */}
          <Section title="Datos Personales">
            <Row label="Celular" value={p.celular} />
            <Row label="Sexo" value={p.sexo === "F" ? "Femenino" : p.sexo === "M" ? "Masculino" : "Otro"} />
            <Row label="Fecha nacimiento" value={p.fecha_nacimiento} />
            <Row label="Localidad nacimiento" value={p.localidad_nacimiento} />
            <Row label="Provincia nacimiento" value={p.provincia_nacimiento} />
            <Row label="Nacionalidad" value={p.nacionalidad} />
            <Row label="CUIL" value={p.cuil} />
            <Row label="Domicilio" value={p.domicilio} />
            <Row label="Localidad residencia" value={LOCALIDAD_LABELS[p.localidad] || p.localidad} />
          </Section>

          {/* Datos académicos */}
          <Section title="Datos Académicos">
            <Row label="Finalizó secundaria" value={SECUNDARIA_LABELS[p.finalizo_secundaria] || p.finalizo_secundaria} />
            <Row label="Estudios superiores" value={<YesNo v={p.posee_estudios_superiores} />} />
            {p.posee_estudios_superiores && (
              <>
                <Row label="Finalizó superiores" value={<YesNo v={p.estudios_superiores_finalizado} />} />
                <Row label="Carrera" value={p.estudios_superiores_carrera} />
              </>
            )}
          </Section>

          {/* Datos tecnológicos */}
          <Section title="Datos Tecnológicos">
            <Row label="Posee PC/notebook" value={<YesNo v={p.posee_pc} />} />
            <Row label="Posee internet" value={<YesNo v={p.posee_internet} />} />
          </Section>

          {/* Datos complementarios */}
          <Section title="Datos Complementarios">
            <Row label="Pueblo originario" value={<YesNo v={p.pueblo_originario} />} />
            <Row label="Posee discapacidad" value={<YesNo v={p.posee_discapacidad} />} />
            {p.posee_discapacidad && (
              <>
                <Row label="Tipo discapacidad" value={p.tipo_discapacidad} />
                <Row label="Posee CUD" value={<YesNo v={p.posee_cud} />} />
                <Row label="Apoyo inclusión" value={p.apoyo_inclusion} />
                <Row label="Apoyo específico" value={<YesNo v={p.requiere_apoyo_especifico} />} />
                {p.requiere_apoyo_especifico && <Row label="Descripción apoyo" value={p.descripcion_apoyo} />}
              </>
            )}
          </Section>

          {/* Documentación */}
          <Section title="Documentación">
            <Row label="DNI adjunto" value={<YesNo v={p.tiene_dni} />} />
            <Row label="Título adjunto" value={<YesNo v={p.tiene_titulo} />} />
          </Section>

          {/* Gestión */}
          <Section title="Gestión">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-[#1a1f4e]/50 mb-1 block">Estado</label>
                <select value={estado} onChange={(e) => setEstado(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 border border-[#b8ccd8] text-[#1a1f4e] text-sm focus:outline-none focus:ring-2 focus:ring-[#f5c518]">
                  <option value="pendiente">Pendiente</option>
                  <option value="aprobada">Aprobada</option>
                  <option value="rechazada">Rechazada</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-[#1a1f4e]/50 mb-1 block">Observaciones</label>
                <textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2}
                  className="w-full rounded-xl px-3 py-2 border border-[#b8ccd8] text-[#1a1f4e] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#f5c518]"
                  placeholder="Agregar observaciones..." />
              </div>
            </div>
            {msg && <p className={`text-xs font-semibold mt-1 ${msg.includes("Error") ? "text-red-500" : "text-green-600"}`}>{msg}</p>}
            <button onClick={save} disabled={saving}
              className="px-6 py-2 rounded-xl font-bold text-sm transition-colors disabled:opacity-60"
              style={{ background: P.navy, color: P.yellow }}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-widest text-[#1a1f4e]/40 border-b border-[#b8ccd8] pb-1 mb-3">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export default function AdminTerciario() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [selected, setSelected] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const { data: s } = await apiClientV2.get("/preinscripciones-terciario-stats");
      setStats(s);
    } catch {}
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtroEstado) params.estado = filtroEstado;
      const { data: res } = await apiClientV2.get("/preinscripciones-terciario", { params });
      setData(Array.isArray(res) ? res : []);
    } catch { setData([]); }
    finally { setLoading(false); }
  }, [filtroEstado]);

  useEffect(() => { fetchStats(); fetchData(); }, [fetchStats, fetchData]);

  const filtered = data.filter((p) => {
    const q = search.toLowerCase();
    return p.apellido_nombre?.toLowerCase().includes(q) || p.dni?.includes(q) || p.email?.toLowerCase().includes(q);
  });

  const handleLogout = async () => {
    await authService.logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#eef2f7] flex flex-col">
      {/* Header */}
      <header style={{ background: P.navy }} className="px-6 py-4 shadow-lg flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black" style={{ background: P.yellow, color: P.navy }}>P</div>
            <div>
              <p className="text-white font-black text-sm leading-tight">Centro Politécnico Superior</p>
              <p style={{ color: P.yellow }} className="text-[10px] font-semibold">Panel Administrativo — Terciario</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-white/60 hover:text-white text-xs font-semibold transition-colors">
            <LogOut size={15} /> Salir
          </button>
        </div>
      </header>

      {/* Nav tabs */}
      <div style={{ background: P.navy }} className="border-t border-white/10 px-6">
        <div className="max-w-6xl mx-auto flex gap-1">
          {[["dashboard", <BarChart3 size={14} />, "Dashboard"], ["preinscripciones", <Users size={14} />, "Preinscripciones"]].map(([key, icon, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors ${
                tab === key ? "border-[#f5c518] text-[#f5c518]" : "border-transparent text-white/50 hover:text-white/80"
              }`}>
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-grow max-w-6xl mx-auto w-full px-4 py-8">
        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h1 className="text-2xl font-black text-[#1a1f4e]">Dashboard</h1>
            {stats ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Total preinscriptos" value={stats.total} icon={<Users />} color={P.navy} />
                  <StatCard label="Pendientes" value={stats.pendiente} icon={<Clock />} color="#d97706" />
                  <StatCard label="Aprobados" value={stats.aprobada} icon={<CheckCircle2 />} color="#16a34a" />
                  <StatCard label="Con HD Módulo 2" value={stats.con_hd} icon={<BookCheck />} color="#7c3aed" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#b8ccd8]/50">
                    <h3 className="font-black text-[#1a1f4e] text-sm mb-3 flex items-center gap-2"><MapPin size={15} /> Por Localidad</h3>
                    <div className="space-y-2">
                      {(stats.por_localidad || []).map((l) => (
                        <div key={l.localidad} className="flex items-center justify-between">
                          <span className="text-sm text-[#1a1f4e]/70">{LOCALIDAD_LABELS[l.localidad] || l.localidad}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 rounded-full bg-[#b8ccd8]">
                              <div className="h-2 rounded-full bg-[#f5c518]" style={{ width: `${Math.min((l.total / (stats.total || 1)) * 100, 100)}%` }} />
                            </div>
                            <span className="text-sm font-bold text-[#1a1f4e]">{l.total}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#b8ccd8]/50">
                    <h3 className="font-black text-[#1a1f4e] text-sm mb-3">Inclusión</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#1a1f4e]/70">Con discapacidad</span>
                        <span className="font-bold text-[#1a1f4e]">{stats.con_discapacidad}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#1a1f4e]/70">Pueblo originario</span>
                        <span className="font-bold text-[#1a1f4e]">{stats.pueblo_originario}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#1a1f4e]/70">Rechazados</span>
                        <span className="font-bold text-red-600">{stats.rechazada}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-10 text-[#1a1f4e]/40">Cargando estadísticas...</div>
            )}
          </div>
        )}

        {/* PREINSCRIPCIONES */}
        {tab === "preinscripciones" && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h1 className="text-2xl font-black text-[#1a1f4e]">Preinscripciones</h1>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border" style={{ borderColor: P.navy + "30", color: P.navy }}>
                {filtered.length} registros
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1a1f4e]/40" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre, DNI o email..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#b8ccd8] bg-white text-[#1a1f4e] text-sm focus:outline-none focus:ring-2 focus:ring-[#f5c518]" />
              </div>
              <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
                className="rounded-xl px-3 py-2.5 border border-[#b8ccd8] bg-white text-[#1a1f4e] text-sm focus:outline-none focus:ring-2 focus:ring-[#f5c518]">
                {ESTADOS_FILTER.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>

            {loading ? (
              <div className="text-center py-16 text-[#1a1f4e]/40 text-sm">Cargando...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-[#1a1f4e]/40 text-sm">No hay registros.</div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[#b8ccd8] bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: P.navy }} className="text-[#b8ccd8] text-xs uppercase tracking-wider">
                      <th className="px-4 py-3 text-left font-bold">Apellido y Nombre</th>
                      <th className="px-4 py-3 text-left font-bold">DNI</th>
                      <th className="px-4 py-3 text-left font-bold">Localidad</th>
                      <th className="px-4 py-3 text-left font-bold">Secundaria</th>
                      <th className="px-4 py-3 text-left font-bold">HD Módulo 2</th>
                      <th className="px-4 py-3 text-left font-bold">Estado</th>
                      <th className="px-4 py-3 text-left font-bold">Fecha</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#b8ccd8]/30">
                    {filtered.map((p) => (
                      <tr key={p.id} className="hover:bg-[#b8ccd8]/10 transition-colors">
                        <td className="px-4 py-3 font-semibold text-[#1a1f4e]">{p.apellido_nombre}</td>
                        <td className="px-4 py-3 text-[#1a1f4e]/70">{p.dni}</td>
                        <td className="px-4 py-3 text-[#1a1f4e]/70">{LOCALIDAD_LABELS[p.localidad] || p.localidad}</td>
                        <td className="px-4 py-3 text-[#1a1f4e]/70">{SECUNDARIA_LABELS[p.finalizo_secundaria] || p.finalizo_secundaria}</td>
                        <td className="px-4 py-3">
                          {p.hd_estado ? (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${HD_ESTADO_COLORS[p.hd_estado] || "bg-gray-100"}`}>
                              {HD_ESTADO_LABELS[p.hd_estado] || p.hd_estado}
                            </span>
                          ) : (
                            <span className="text-[#1a1f4e]/30 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3"><Badge estado={p.estado} /></td>
                        <td className="px-4 py-3 text-[#1a1f4e]/50 text-xs">{p.created_at}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => setSelected(p)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:opacity-80"
                            style={{ background: P.navy + "15", color: P.navy }}>
                            <Eye size={12} /> Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {selected && (
        <DetailModal p={selected} onClose={() => setSelected(null)} onSaved={() => { fetchData(); fetchStats(); setSelected(null); }} />
      )}
    </div>
  );
}
