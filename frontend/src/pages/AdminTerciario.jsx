import React, { useState, useEffect, useCallback, useMemo, useContext } from "react";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import { apiClientV2 } from "../api/client";
import authService from "../services/authService";
import { UserContext } from "../App";
import {
  Search, Eye, X, CheckCircle2, XCircle, Clock, LogOut,
  Users, BookCheck, AlertCircle, MapPin, BarChart3, CalendarDays,
  ChevronRight, Settings, ToggleLeft, ToggleRight,
  UserCog, Pencil, RefreshCw, Save, Printer, Download, GraduationCap, ExternalLink,
} from "lucide-react";

const P = { navy: "#1a1f4e", yellow: "#f5c518", blue: "#b8ccd8", gray: "#c8c4bc" };

const ESTADOS_FILTER = [
  { value: "", label: "Todos los estados" },
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

function DocRow({ label, url, field, onUpload, uploading }) {
  const ref = React.useRef();
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <span className="font-bold text-[#1a1f4e]/50 text-xs uppercase tracking-wide w-44 flex-shrink-0">{label}</span>
      <div className="flex items-center gap-2 flex-wrap">
        {url
          ? <a href={url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:opacity-80 transition-opacity"
              style={{ background: "#1a1f4e" }}>
              Ver / Descargar
            </a>
          : <span className="text-red-400 text-xs font-semibold">No adjuntado</span>
        }
        <label className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer border-2 border-dashed border-[#b8ccd8] hover:border-[#f5c518] transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          <input ref={ref} type="file" className="hidden" accept=".pdf,.doc,.docx,image/*"
            onChange={(e) => { onUpload(field, e.target.files?.[0]); ref.current.value = ""; }} />
          {uploading ? "Subiendo..." : url ? "Reemplazar" : "Subir"}
        </label>
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

function DetailModal({ p, onClose, onSaved }) {
  const [estado, setEstado] = useState(p.estado);
  const [obs, setObs] = useState(p.observaciones || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [urls, setUrls] = useState({ dni: p.url_dni, titulo: p.url_titulo });
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const handleDocUpload = async (field, file) => {
    if (!file) return;
    setUploadingDoc(true);
    try {
      const fd = new FormData();
      fd.append(field, file);
      const { data } = await apiClientV2.patch(
        `/preinscripciones-terciario/${p.id}/docs`, fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setUrls({ dni: data.url_dni, titulo: data.url_titulo });
      setMsg("Documento actualizado.");
    } catch { setMsg("Error al subir el documento."); }
    finally { setUploadingDoc(false); }
  };

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

          <Section title="Datos Tecnológicos">
            <Row label="Posee PC/notebook" value={<YesNo v={p.posee_pc} />} />
            <Row label="Posee internet" value={<YesNo v={p.posee_internet} />} />
          </Section>

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

          <Section title="Documentación">
            <DocRow label="DNI" url={urls.dni} field="dni_digitalizado" onUpload={handleDocUpload} uploading={uploadingDoc} />
            <DocRow label="Título Secundario" url={urls.titulo} field="titulo_digitalizado" onUpload={handleDocUpload} uploading={uploadingDoc} />
            {msg && msg.includes("Documento") && (
              <p className={`text-xs font-semibold ${msg.includes("Error") ? "text-red-500" : "text-green-600"}`}>{msg}</p>
            )}
          </Section>

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

const HD_ESTADOS_OPCIONES = ["CURSANDO", "APROBADO", "DESAPROBADO", "INACTIVO"];

function CohortePanel({ onGoConfig }) {
  const [cohortes, setCohortes] = useState([]);
  const [cohorte, setCohorte] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingCohorte, setLoadingCohorte] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [filtroAnio, setFiltroAnio] = useState("");
  const [filtroEstadoHD, setFiltroEstadoHD] = useState("");
  const [searchAlumno, setSearchAlumno] = useState("");

  useEffect(() => {
    apiClientV2.get("/preinscripcion-terciario-cohortes-hd")
      .then(({ data }) => {
        setCohortes(data || []);
        if (data?.length) {
          const hoy = new Date().toISOString().slice(0, 10);
          const activa = data.find(c => c.fecha_inicio <= hoy && c.fecha_fin >= hoy) || data[0];
          setSelectedId(activa.id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) { setCohorte(null); return; }
    setCohorte(null);
    setLoadingCohorte(true);
    apiClientV2.get(`/preinscripciones-terciario-cohorte?cohorte_id=${selectedId}`)
      .then(({ data }) => setCohorte(data))
      .catch(() => setCohorte(null))
      .finally(() => setLoadingCohorte(false));
  }, [selectedId]);

  const anios = [...new Set(cohortes.map(c => c.fecha_inicio?.slice(0, 4)).filter(Boolean))].sort().reverse();
  const cohortesFiltradas = filtroAnio
    ? cohortes.filter(c => c.fecha_inicio?.startsWith(filtroAnio))
    : cohortes;

  const alumnosFiltrados = (cohorte?.estudiantes || []).filter(e => {
    const q = searchAlumno.toLowerCase();
    const matchQ = !q || e.apellido?.toLowerCase().includes(q) || e.nombre?.toLowerCase().includes(q) || e.dni?.includes(q);
    const matchEstado = !filtroEstadoHD || e.estado === filtroEstadoHD;
    return matchQ && matchEstado;
  });

  const exportExcel = () => {
    const rows = alumnosFiltrados.map((e, i) => ({
      "#": i + 1,
      Apellido: e.apellido,
      Nombre: e.nombre,
      DNI: e.dni,
      Email: e.email,
      Teléfono: e.telefono || "—",
      "Estado HD": HD_ESTADO_LABELS[e.estado] || e.estado || "—",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inscriptos");
    XLSX.writeFile(wb, `cohorte_HD_${cohorte?.nombre || "terciario"}.xlsx`);
  };

  const imprimir = () => {
    const filas = alumnosFiltrados.map((e, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${e.apellido}, ${e.nombre}</td>
        <td>${e.dni}</td>
        <td>${e.email}</td>
        <td>${e.telefono || "—"}</td>
        <td>${HD_ESTADO_LABELS[e.estado] || e.estado || "—"}</td>
      </tr>`).join("");
    const html = `<html><head><title>Inscriptos — ${cohorte?.nombre}</title>
      <style>body{font-family:sans-serif;font-size:12px}table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #ccc;padding:6px 10px}th{background:#1a1f4e;color:#f5c518}
      h2{color:#1a1f4e}@media print{button{display:none}}</style></head>
      <body><h2>Cohorte: ${cohorte?.nombre}</h2>
      <p>Período: ${cohorte?.fecha_inicio || "—"} → ${cohorte?.fecha_fin || "—"} | Total: ${alumnosFiltrados.length} inscriptos</p>
      <table><thead><tr><th>#</th><th>Apellido y Nombre</th><th>DNI</th><th>Email</th><th>Teléfono</th><th>Estado HD</th></tr></thead>
      <tbody>${filas}</tbody></table>
      <script>window.onload=()=>window.print()</script></body></html>`;
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
  };

  if (loading) return <div className="text-center py-20 text-[#1a1f4e]/40 text-sm">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#1a1f4e]">Cohorte Terciario</h1>
        <p className="text-[#1a1f4e]/50 text-sm mt-1">Habilidades Digitales Módulo 2 — ciclo exclusivo para preinscriptos de la Tecnicatura</p>
      </div>

      {/* Filtros de selección */}
      <div className="bg-white rounded-2xl border border-[#b8ccd8] shadow-sm p-5">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-[#1a1f4e]/50 mb-1 block">Año</label>
            <select value={filtroAnio} onChange={e => { setFiltroAnio(e.target.value); setSelectedId(null); }}
              className="rounded-xl px-3 py-2 border border-[#b8ccd8] text-[#1a1f4e] text-sm focus:outline-none focus:ring-2 focus:ring-[#f5c518]">
              <option value="">Todos los años</option>
              {anios.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-[#1a1f4e]/50 mb-1 block">Cohorte</label>
            <select value={selectedId || ""} onChange={e => setSelectedId(Number(e.target.value))}
              className="rounded-xl px-3 py-2 border border-[#b8ccd8] text-[#1a1f4e] text-sm focus:outline-none focus:ring-2 focus:ring-[#f5c518] min-w-[220px]">
              <option value="">— Seleccionar —</option>
              {cohortesFiltradas.map(c => (
                <option key={c.id} value={c.id}>{c.nombre} ({c.fecha_inicio?.slice(0, 4)})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Info cohorte seleccionada */}
      {selectedId && (
        loadingCohorte ? (
          <div className="text-center py-10 text-[#1a1f4e]/40 text-sm">Cargando cohorte...</div>
        ) : !cohorte?.id ? (
          <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 text-sm font-semibold flex items-center gap-2">
            <AlertCircle size={16} /> No se encontró información para esta cohorte.
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-[#b8ccd8] shadow-sm p-5">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="col-span-3 sm:col-span-1 p-4 rounded-xl text-center font-black text-3xl text-[#1a1f4e] border-2 border-[#f5c518]/50 bg-[#f5c518]/5">
                  {cohorte.inscriptos}
                  <span className="text-xs font-medium text-[#1a1f4e]/50 block mt-1">Inscriptos</span>
                </div>
                <div className="col-span-3 sm:col-span-2 space-y-2 py-1">
                  <div className="flex justify-between py-2 border-b border-[#b8ccd8]/40">
                    <span className="text-[#1a1f4e]/50 font-medium">Nombre</span>
                    <span className="font-semibold text-[#1a1f4e]">{cohorte.nombre}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#b8ccd8]/40">
                    <span className="text-[#1a1f4e]/50 font-medium">Fecha inicio</span>
                    <span className="font-semibold text-[#1a1f4e]">{cohorte.fecha_inicio || "—"}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#1a1f4e]/50 font-medium">Fecha fin</span>
                    <span className="font-semibold text-[#1a1f4e]">{cohorte.fecha_fin || "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla de inscriptos */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3 justify-between">
                <h2 className="font-black text-[#1a1f4e]">Inscriptos en HD Módulo 2</h2>
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1a1f4e]/40" />
                    <input value={searchAlumno} onChange={e => setSearchAlumno(e.target.value)}
                      placeholder="Buscar alumno..."
                      className="pl-8 pr-4 py-2 rounded-xl border border-[#b8ccd8] bg-white text-[#1a1f4e] text-sm focus:outline-none focus:ring-2 focus:ring-[#f5c518] w-44" />
                  </div>
                  <select value={filtroEstadoHD} onChange={e => setFiltroEstadoHD(e.target.value)}
                    className="rounded-xl px-3 py-2 border border-[#b8ccd8] text-[#1a1f4e] text-sm focus:outline-none focus:ring-2 focus:ring-[#f5c518]">
                    <option value="">Todos los estados HD</option>
                    {Object.entries(HD_ESTADO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <button onClick={exportExcel}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#b8ccd8] text-[#1a1f4e] text-xs font-bold hover:bg-[#b8ccd8]/20 transition-colors">
                    <Download size={13} /> Excel
                  </button>
                  <button onClick={imprimir}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold hover:opacity-80 transition-opacity"
                    style={{ background: P.navy, color: P.yellow }}>
                    <Printer size={13} /> Imprimir
                  </button>
                </div>
              </div>

              {alumnosFiltrados.length === 0 ? (
                <div className="text-center py-12 text-[#1a1f4e]/40 text-sm bg-white rounded-2xl border border-[#b8ccd8]">
                  {cohorte.inscriptos === 0 ? "Aún no hay inscriptos. Se agregan automáticamente al aprobar preinscripciones." : "No hay coincidencias."}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-[#b8ccd8] bg-white shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: P.navy }} className="text-[#b8ccd8] text-xs uppercase tracking-wider">
                        <th className="px-4 py-3 text-left font-bold">#</th>
                        <th className="px-4 py-3 text-left font-bold">Apellido y Nombre</th>
                        <th className="px-4 py-3 text-left font-bold">DNI</th>
                        <th className="px-4 py-3 text-left font-bold">Email</th>
                        <th className="px-4 py-3 text-left font-bold">Estado HD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#b8ccd8]/30">
                      {alumnosFiltrados.map((e, i) => (
                        <tr key={e.inscripcion_id} className="hover:bg-[#b8ccd8]/10 transition-colors">
                          <td className="px-4 py-3 text-[#1a1f4e]/40 text-xs">{i + 1}</td>
                          <td className="px-4 py-3 font-semibold text-[#1a1f4e]">{e.apellido}, {e.nombre}</td>
                          <td className="px-4 py-3 text-[#1a1f4e]/70">{e.dni}</td>
                          <td className="px-4 py-3 text-[#1a1f4e]/60 text-xs">{e.email}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${HD_ESTADO_COLORS[e.estado] || "bg-gray-100 text-gray-600"}`}>
                              {HD_ESTADO_LABELS[e.estado] || e.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )
      )}

      {!selectedId && !loading && (
        <div className="text-center py-16 text-[#1a1f4e]/40 text-sm bg-white rounded-2xl border border-[#b8ccd8]">
          Seleccioná una cohorte para ver sus inscriptos.
        </div>
      )}
    </div>
  );
}

const ESTADO_INSCRIPCION_LABELS = {
  PREINSCRIPTO: "Preinscripto", CURSANDO: "Cursando", INACTIVO: "Inactivo",
  LIBRE: "Libre", PAUSADO: "Pausado", EGRESADO: "Egresado",
  APROBADO: "Aprobado", DESAPROBADO: "Desaprobado",
};
const ESTADO_INSCRIPCION_COLORS = {
  CURSANDO: "bg-blue-100 text-blue-700",
  APROBADO: "bg-green-100 text-green-700",
  DESAPROBADO: "bg-red-100 text-red-700",
  INACTIVO: "bg-gray-100 text-gray-500",
  EGRESADO: "bg-purple-100 text-purple-700",
  PAUSADO: "bg-yellow-100 text-yellow-700",
  LIBRE: "bg-orange-100 text-orange-700",
  PREINSCRIPTO: "bg-slate-100 text-slate-600",
};

function AlumnosPanel() {
  const [cohortes, setCohortes] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroCohorte, setFiltroCohorte] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [search, setSearch] = useState("");
  const [expandido, setExpandido] = useState(null);

  useEffect(() => {
    apiClientV2.get("/preinscripcion-terciario-cohortes-hd")
      .then(({ data }) => setCohortes(data || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtroCohorte) params.append("cohorte_id", filtroCohorte);
    if (filtroEstado) params.append("estado", filtroEstado);
    if (search) params.append("q", search);
    apiClientV2.get(`/terciario-alumnos?${params}`)
      .then(({ data }) => setAlumnos(data || []))
      .finally(() => setLoading(false));
  }, [filtroCohorte, filtroEstado, search]);

  const exportExcel = () => {
    const rows = alumnos.map((a, i) => ({
      "#": i + 1,
      Cohorte: a.cohorte_nombre,
      Apellido: a.apellido,
      Nombre: a.nombre,
      DNI: a.dni,
      Email: a.email,
      Teléfono: a.telefono || "—",
      Celular: a.celular_preinsc || "—",
      Sexo: a.sexo || "—",
      "Fecha Nacimiento": a.fecha_nacimiento || "—",
      Domicilio: a.domicilio || "—",
      Barrio: a.barrio || "—",
      Ciudad: a.ciudad || "—",
      Localidad: a.localidad || "—",
      "Loc. Nacimiento": a.localidad_nacimiento || "—",
      "Prov. Nacimiento": a.provincia_nacimiento || "—",
      Nacionalidad: a.nacionalidad || "—",
      "Finalizó Secundaria": a.finalizo_secundaria || "—",
      "Estudios Superiores": a.posee_estudios_superiores ? "Sí" : "No",
      "Carrera Superior": a.carrera_superior || "—",
      "Nivel Educativo": a.nivel_educativo || "—",
      "Posee PC": a.posee_pc ? "Sí" : "No",
      "Posee Internet": a.posee_conectividad ? "Sí" : "No",
      "Pueblo Originario": a.pueblo_originario ? "Sí" : "No",
      "Posee Discapacidad": a.posee_discapacidad ? "Sí" : "No",
      "Tipo Discapacidad": a.tipo_discapacidad || "—",
      "Posee CUD": a.posee_cud === true ? "Sí" : a.posee_cud === false ? "No" : "—",
      "Estado HD": HD_ESTADO_LABELS[a.estado_hd] || a.estado_hd || "—",
      "Estado Inscripción": ESTADO_INSCRIPCION_LABELS[a.estado] || a.estado,
      "Estado Preinscripción": a.estado_preinscripcion || "—",
      Observaciones: a.observaciones || "—",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Alumnos");
    XLSX.writeFile(wb, "alumnos_terciario.xlsx");
  };

  const imprimir = () => {
    const filas = alumnos.map((a, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${a.apellido}, ${a.nombre}</td>
        <td>${a.dni}</td>
        <td>${a.email}</td>
        <td>${a.telefono || "—"}</td>
        <td>${a.cohorte_nombre}</td>
        <td>${ESTADO_INSCRIPCION_LABELS[a.estado] || a.estado}</td>
      </tr>`).join("");
    const cohorteLabel = cohortes.find(c => String(c.id) === String(filtroCohorte))?.nombre || "Todas las cohortes";
    const html = `<html><head><title>Alumnos Terciario</title>
      <style>body{font-family:sans-serif;font-size:11px}table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #ccc;padding:5px 8px}th{background:#1a1f4e;color:#f5c518}
      h2{color:#1a1f4e}@media print{button{display:none}}</style></head>
      <body><h2>Alumnos Inscriptos — Tecnicatura en Ciencias de Datos e IA</h2>
      <p>Cohorte: ${cohorteLabel} | Estado: ${filtroEstado ? ESTADO_INSCRIPCION_LABELS[filtroEstado] : "Todos"} | Total: ${alumnos.length} alumnos</p>
      <table><thead><tr><th>#</th><th>Apellido y Nombre</th><th>DNI</th><th>Email</th><th>Teléfono</th><th>Cohorte</th><th>Estado</th></tr></thead>
      <tbody>${filas}</tbody></table>
      <script>window.onload=()=>window.print()</script></body></html>`;
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#1a1f4e]">Alumnos Inscriptos</h1>
        <p className="text-[#1a1f4e]/50 text-sm mt-1">Listado de alumnos en cohortes de la Tecnicatura en Ciencias de Datos e IA</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-[#b8ccd8] shadow-sm p-5">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-[#1a1f4e]/50 mb-1 block">Cohorte</label>
            <select value={filtroCohorte} onChange={e => setFiltroCohorte(e.target.value)}
              className="rounded-xl px-3 py-2 border border-[#b8ccd8] text-[#1a1f4e] text-sm focus:outline-none focus:ring-2 focus:ring-[#f5c518] min-w-[200px]">
              <option value="">Todas las cohortes</option>
              {cohortes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-[#1a1f4e]/50 mb-1 block">Estado</label>
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
              className="rounded-xl px-3 py-2 border border-[#b8ccd8] text-[#1a1f4e] text-sm focus:outline-none focus:ring-2 focus:ring-[#f5c518]">
              <option value="">Todos los estados</option>
              {Object.entries(ESTADO_INSCRIPCION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs font-bold uppercase tracking-wide text-[#1a1f4e]/50 mb-1 block">Buscar</label>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1a1f4e]/40" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Nombre, apellido, DNI o email..."
                className="pl-8 pr-4 py-2 w-full rounded-xl border border-[#b8ccd8] text-[#1a1f4e] text-sm focus:outline-none focus:ring-2 focus:ring-[#f5c518]" />
            </div>
          </div>
          <div className="flex gap-2 pb-0.5">
            <button onClick={exportExcel}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#b8ccd8] text-[#1a1f4e] text-sm font-bold hover:bg-[#b8ccd8]/20 transition-colors">
              <Download size={14} /> Excel
            </button>
            <button onClick={imprimir}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold hover:opacity-80 transition-opacity"
              style={{ background: P.navy, color: P.yellow }}>
              <Printer size={14} /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-20 text-[#1a1f4e]/40 text-sm">Cargando...</div>
      ) : alumnos.length === 0 ? (
        <div className="text-center py-16 text-[#1a1f4e]/40 text-sm bg-white rounded-2xl border border-[#b8ccd8]">
          No hay alumnos con los filtros seleccionados.
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-[#1a1f4e]/50 font-semibold">{alumnos.length} alumno{alumnos.length !== 1 ? "s" : ""} encontrado{alumnos.length !== 1 ? "s" : ""}</p>
          <div className="overflow-x-auto rounded-2xl border border-[#b8ccd8] bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: P.navy }} className="text-[#b8ccd8] text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left font-bold">#</th>
                  <th className="px-4 py-3 text-left font-bold">Apellido y Nombre</th>
                  <th className="px-4 py-3 text-left font-bold">DNI</th>
                  <th className="px-4 py-3 text-left font-bold">Email</th>
                  <th className="px-4 py-3 text-left font-bold">Teléfono</th>
                  <th className="px-4 py-3 text-left font-bold">Cohorte</th>
                  <th className="px-4 py-3 text-left font-bold">Estado</th>
                  <th className="px-4 py-3 text-left font-bold">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#b8ccd8]/30">
                {alumnos.map((a, i) => (
                  <React.Fragment key={a.inscripcion_id}>
                    <tr className="hover:bg-[#b8ccd8]/10 transition-colors">
                      <td className="px-4 py-3 text-[#1a1f4e]/40 text-xs">{i + 1}</td>
                      <td className="px-4 py-3 font-semibold text-[#1a1f4e]">{a.apellido}, {a.nombre}</td>
                      <td className="px-4 py-3 text-[#1a1f4e]/70">{a.dni}</td>
                      <td className="px-4 py-3 text-[#1a1f4e]/60 text-xs">{a.email}</td>
                      <td className="px-4 py-3 text-[#1a1f4e]/60">{a.telefono || "—"}</td>
                      <td className="px-4 py-3 text-[#1a1f4e]/60 text-xs">{a.cohorte_nombre}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${ESTADO_INSCRIPCION_COLORS[a.estado] || "bg-gray-100 text-gray-500"}`}>
                          {ESTADO_INSCRIPCION_LABELS[a.estado] || a.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setExpandido(expandido === a.inscripcion_id ? null : a.inscripcion_id)}
                          className="text-xs font-bold text-[#1a1f4e]/50 hover:text-[#1a1f4e] transition-colors flex items-center gap-1">
                          <ChevronRight size={13} className={`transition-transform ${expandido === a.inscripcion_id ? "rotate-90" : ""}`} />
                          {expandido === a.inscripcion_id ? "Cerrar" : "Ver más"}
                        </button>
                      </td>
                    </tr>
                    {expandido === a.inscripcion_id && (
                      <tr className="bg-[#f5c518]/5">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            {[
                              ["Sexo", a.sexo],
                              ["Fecha Nacimiento", a.fecha_nacimiento],
                              ["Domicilio", a.domicilio],
                              ["Barrio", a.barrio],
                              ["Ciudad", a.ciudad],
                              ["Nacionalidad", a.nacionalidad],
                              ["Nivel Educativo", a.nivel_educativo],
                              ["Estatus", a.estatus],
                              ["Posee PC", a.posee_pc ? "Sí" : "No"],
                              ["Conectividad", a.posee_conectividad ? "Sí" : "No"],
                            ].map(([label, val]) => (
                              <div key={label} className="bg-white rounded-xl p-3 border border-[#b8ccd8]/50">
                                <p className="text-[#1a1f4e]/40 font-semibold uppercase tracking-wide mb-0.5">{label}</p>
                                <p className="text-[#1a1f4e] font-bold">{val || "—"}</p>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const NAV_ITEMS = [
  { key: "dashboard", icon: BarChart3, label: "Dashboard" },
  { key: "preinscripciones", icon: Users, label: "Preinscripciones" },
  { key: "cohorte", icon: CalendarDays, label: "Cohorte HD" },
  { key: "alumnos", icon: GraduationCap, label: "Alumnos" },
  { key: "usuarios", icon: UserCog, label: "Usuarios" },
  { key: "configuracion", icon: Settings, label: "Configuración" },
];

// Grupos que dan acceso a CFP
// Grupos que dan acceso a CFP (tener cualquiera de estos = puede entrar al panel CFP)
const GRUPOS_CFP = ["Admin", "Secretaría", "Regencia", "Coordinación Docente", "Docente", "Preceptor", "Bedel", "Rector"];
// Grupos que dan acceso a Terciario (Admin/Rector siempre tienen ambos; "Terciario" es el flag para el resto)
const GRUPOS_TERCIARIO = ["Admin", "Terciario", "Rector"];

// Roles funcionales (definen qué puede hacer el usuario, sin determinar el sistema por sí solos)
const ROLES_FUNCIONALES = [
  { nombre: "Admin",                color: "bg-purple-100 text-purple-800" },
  { nombre: "Rector",               color: "bg-blue-100 text-blue-800" },
  { nombre: "Regencia",             color: "bg-indigo-100 text-indigo-800" },
  { nombre: "Secretaría",           color: "bg-cyan-100 text-cyan-800" },
  { nombre: "Coordinación Docente", color: "bg-teal-100 text-teal-800" },
  { nombre: "Docente",              color: "bg-green-100 text-green-800" },
  { nombre: "Preceptor",            color: "bg-orange-100 text-orange-800" },
  { nombre: "Bedel",                color: "bg-rose-100 text-rose-800" },
];

// Compatibilidad con código existente que usa GRUPOS_CONFIG
const GRUPOS_CONFIG = ROLES_FUNCIONALES.map(r => ({
  ...r,
  cfp: GRUPOS_CFP.includes(r.nombre),
  terciario: GRUPOS_TERCIARIO.includes(r.nombre) || r.nombre === "Terciario",
}));

// Roles que Admin/Rector tienen ambos accesos automáticamente
const ROLES_AMBOS_SISTEMAS = ["Admin", "Rector"];
// Dummy entry to satisfy existing references
function ConfiguracionPanel() {
  const [cfg, setCfg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cohorteActiva, setCohorteActiva] = useState(null);
  const [form, setForm] = useState({ fecha_inicio: "", fecha_fin: "", mensaje_cierre: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

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
      const params = {};
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
                ? `El formulario acepta inscripciones hasta el ${cfg.fecha_fin || "—"}.`
                : `Fuera del período configurado. ${cfg.fecha_inicio ? `Abre el ${cfg.fecha_inicio}.` : ""}`
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
              <p className="text-xs font-normal text-green-700 mt-0.5">{cohorteActiva.fecha_inicio} → {cohorteActiva.fecha_fin || "..."}</p>
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

function GrupoBadge({ nombre }) {
  const cfg = GRUPOS_CONFIG.find(g => g.nombre === nombre);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cfg?.color || "bg-gray-100 text-gray-600"}`}>
      {nombre}
    </span>
  );
}

function AccesoBadge({ tieneAcceso, sistema }) {
  return tieneAcceso
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700"><CheckCircle2 size={10} />{sistema}</span>
    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-400"><XCircle size={10} />{sistema}</span>;
}

function tieneAccesoCFP(user) {
  return user.is_superuser || user.is_staff || user.groups.some(g => GRUPOS_CFP.includes(g));
}
function tieneAccesoTerciario(user) {
  return user.is_superuser || user.is_staff || user.groups.some(g => GRUPOS_TERCIARIO.includes(g));
}

// Helper: dado el listado de grupos del usuario, deriva rol y accesos
function derivarEstado(grupos, is_superuser) {
  const rolActual = ROLES_FUNCIONALES.find(r => grupos.includes(r.nombre))?.nombre || "";

  let accCFP = is_superuser;
  let accTerciario = is_superuser;

  if (!is_superuser) {
    if (rolActual === "Admin" || rolActual === "Rector" || rolActual === "Regencia") {
      accCFP = true;
      accTerciario = true;
    } else if (rolActual === "Coordinación Docente" || rolActual === "Docente" || rolActual === "Preceptor" || rolActual === "Bedel") {
      // Uno o el otro, nunca ambos.
      if (grupos.includes("Terciario")) {
        accCFP = false;
        accTerciario = true;
      } else {
        accCFP = true;
        accTerciario = false;
      }
    } else if (rolActual === "Secretaría") {
      // Uno, el otro o ambos
      accCFP = grupos.includes("Secretaría");
      accTerciario = grupos.includes("Terciario");
      if (!accCFP && !accTerciario) {
        accCFP = true; // Fallback por defecto
      }
    } else {
      // Sin rol seleccionado
      accCFP = false;
      accTerciario = false;
    }
  }

  return { rolActual, accCFP, accTerciario };
}

// Helper: construye el array de grupos a guardar desde rol + accesos
function construirGrupos(rol, accCFP, accTerciario, is_superuser) {
  if (is_superuser) return [];
  const grupos = [];

  if (rol) {
    if (rol === "Admin" || rol === "Rector" || rol === "Regencia") {
      grupos.push(rol);
      grupos.push("Terciario");
    } else if (rol === "Coordinación Docente" || rol === "Docente" || rol === "Preceptor" || rol === "Bedel") {
      // Uno o el otro, nunca ambos
      grupos.push(rol);
      if (accTerciario) {
        grupos.push("Terciario");
      }
    } else if (rol === "Secretaría") {
      if (accCFP) {
        grupos.push(rol);
      }
      if (accTerciario) {
        grupos.push("Terciario");
      }
    }
  }

  return grupos;
}

function RolYAccesoForm({ grupos, is_superuser, onChange }) {
  const { rolActual, accCFP, accTerciario } = derivarEstado(grupos, is_superuser);

  const setRol = (nuevoRol) => {
    let nuevoCFP = false;
    let nuevoTer = false;

    if (nuevoRol === "Admin" || nuevoRol === "Rector" || nuevoRol === "Regencia") {
      nuevoCFP = true;
      nuevoTer = true;
    } else if (nuevoRol === "Bedel") {
      nuevoCFP = false;
      nuevoTer = true;
    } else {
      // Secretaría, Coordinación Docente, Docente, Preceptor
      nuevoCFP = true;
      nuevoTer = false;
    }

    const nuevosGrupos = construirGrupos(nuevoRol, nuevoCFP, nuevoTer, is_superuser);
    onChange(nuevosGrupos);
  };

  const toggleAcceso = (sistema) => {
    let nuevoCFP = accCFP;
    let nuevoTer = accTerciario;

    if (rolActual === "Coordinación Docente" || rolActual === "Docente" || rolActual === "Preceptor" || rolActual === "Bedel") {
      // Uno o el otro, nunca ambos, nunca vacío
      if (sistema === "cfp") {
        nuevoCFP = true;
        nuevoTer = false;
      } else {
        nuevoCFP = false;
        nuevoTer = true;
      }
    } else if (rolActual === "Secretaría") {
      // Uno, el otro o ambos, nunca vacío
      if (sistema === "cfp") {
        nuevoCFP = !accCFP;
      } else {
        nuevoTer = !accTerciario;
      }
      if (!nuevoCFP && !nuevoTer) {
        // En lugar de retornar silenciosamente (lo que deja el checkbox desmarcado visualmente en el navegador),
        // forzamos a React a re-renderizar y volver a marcarlo llamando a onChange con el estado original.
        onChange(construirGrupos(rolActual, accCFP, accTerciario, is_superuser));
        return;
      }
    }

    onChange(construirGrupos(rolActual, nuevoCFP, nuevoTer, is_superuser));
  };

  if (is_superuser) {
    return (
      <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold">
        SuperAdmin — acceso total a ambos sistemas, sin restricciones de grupo.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Rol */}
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-[#1a1f4e]/40 mb-2">Rol</p>
        <div className="grid grid-cols-2 gap-2">
          {ROLES_FUNCIONALES.map(({ nombre, color }) => {
            const activo = rolActual === nombre;
            return (
              <label key={nombre} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all border ${activo ? "border-[#f5c518] bg-[#f5c518]/10" : "border-[#b8ccd8] hover:bg-[#b8ccd8]/20"}`}>
                <input type="radio" name="rol" checked={activo} onChange={() => setRol(nombre)} className="accent-[#f5c518]" />
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>{nombre}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Acceso al sistema */}
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-[#1a1f4e]/40 mb-2">Acceso al sistema</p>
        {(rolActual === "Admin" || rolActual === "Rector" || rolActual === "Regencia") ? (
          <p className="text-xs text-[#1a1f4e]/50 italic">El rol seleccionado tiene acceso a ambos sistemas automáticamente.</p>
        ) : (
          <div className="flex gap-3">
            {(() => {
              const deshabilitadoCFP = is_superuser || 
                !rolActual || 
                rolActual === "Secretaría" ||
                ((rolActual === "Coordinación Docente" || rolActual === "Docente" || rolActual === "Preceptor" || rolActual === "Bedel") && accCFP);

              const deshabilitadoTer = is_superuser || 
                !rolActual || 
                ((rolActual === "Coordinación Docente" || rolActual === "Docente" || rolActual === "Preceptor" || rolActual === "Bedel") && accTerciario);

              const tooltipCFP = (!rolActual)
                ? " (Seleccioná un rol)"
                : deshabilitadoCFP
                  ? " (Requerido)"
                  : "";

              const tooltipTer = (!rolActual)
                ? " (Seleccioná un rol)"
                : deshabilitadoTer
                  ? " (Requerido)"
                  : "";

              return (
                <>
                  <label className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all flex-1 ${
                    accCFP ? "border-indigo-400 bg-indigo-50" : "border-[#b8ccd8] hover:bg-[#b8ccd8]/20"
                  } ${deshabilitadoCFP ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}>
                    <input
                      type="checkbox"
                      checked={accCFP}
                      disabled={deshabilitadoCFP}
                      onChange={() => toggleAcceso("cfp")}
                      className="accent-indigo-500"
                    />
                    <span className="text-sm font-bold text-indigo-700">
                      Panel CFP<span className="text-[10px] font-normal text-indigo-500">{tooltipCFP}</span>
                    </span>
                  </label>

                  <label className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all flex-1 ${
                    accTerciario ? "border-[#f5c518] bg-[#f5c518]/10" : "border-[#b8ccd8] hover:bg-[#b8ccd8]/20"
                  } ${deshabilitadoTer ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}>
                    <input
                      type="checkbox"
                      checked={accTerciario}
                      disabled={deshabilitadoTer}
                      onChange={() => toggleAcceso("terciario")}
                      className="accent-[#f5c518]"
                    />
                    <span className="text-sm font-bold text-[#1a1f4e]">
                      Panel Terciario<span className="text-[10px] font-normal text-indigo-500">{tooltipTer}</span>
                    </span>
                  </label>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="flex gap-2">
        <AccesoBadge tieneAcceso={is_superuser || accCFP} sistema="CFP" />
        <AccesoBadge tieneAcceso={is_superuser || accTerciario} sistema="Terciario" />
      </div>
    </div>
  );
}

function EditUserModal({ user, onClose, onSaved }) {
  const [grupos, setGrupos] = useState(user.groups || []);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      await apiClientV2.patch(`/users/${user.id}`, { groups: grupos });
      setMsg("Guardado.");
      onSaved();
    } catch { setMsg("Error al guardar."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-[#b8ccd8] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-[#b8ccd8] rounded-t-3xl" style={{ background: P.navy }}>
          <div>
            <p className="text-white font-black">{user.last_name} {user.first_name}</p>
            <p className="text-[#f5c518] text-xs">{user.username} · {user.email}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <RolYAccesoForm grupos={grupos} is_superuser={user.is_superuser || user.is_staff} onChange={setGrupos} />
          {msg && <p className={`text-xs font-semibold ${msg.includes("Error") ? "text-red-500" : "text-green-600"}`}>{msg}</p>}
        </div>

        <div className="p-5 border-t border-[#b8ccd8] flex gap-3">
          <button onClick={save} disabled={saving}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm disabled:opacity-60 hover:opacity-80 transition-opacity flex items-center justify-center gap-2"
            style={{ background: P.navy, color: P.yellow }}>
            <Save size={15} /> {saving ? "Guardando..." : "Guardar cambios"}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-sm border border-[#b8ccd8] text-[#1a1f4e] hover:bg-[#b8ccd8]/20 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// Grupos que pueden asignar roles en el panel Terciario
const GRUPOS_PUEDEN_ASIGNAR = ["Admin", "Rector", "Regencia", "Terciario", "Secretaría"];

function ModalField({ label, value, onChange, type = "text", placeholder = "", error = "" }) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wide text-[#1a1f4e]/50 mb-1 block">{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        className={`w-full rounded-xl px-3 py-2 border text-[#1a1f4e] text-sm focus:outline-none focus:ring-2 focus:ring-[#f5c518] ${error ? "border-red-400" : "border-[#b8ccd8]"}`} />
      {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
    </div>
  );
}

function NuevoUsuarioModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    username: "", email: "", first_name: "", last_name: "", password: "",
  });
  const [grupos, setGrupos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = "Requerido";
    if (!form.email.trim()) e.email = "Requerido";
    if (!form.first_name.trim()) e.first_name = "Requerido";
    if (!form.last_name.trim()) e.last_name = "Requerido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    setMsg("");
    try {
      await apiClientV2.post("/users", {
        username: form.username.trim(),
        email: form.email.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        password: form.password.trim() || undefined,
        groups: grupos,
      });
      setMsg("Usuario creado. Se enviaron las credenciales por email.");
      setTimeout(() => { onSaved(); onClose(); }, 1500);
    } catch (err) {
      setMsg(err?.response?.data?.detail || "Error al crear el usuario.");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-[#b8ccd8] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-[#b8ccd8] rounded-t-3xl" style={{ background: P.navy }}>
          <div>
            <p className="text-white font-black text-base">Nuevo Usuario</p>
            <p className="text-[#f5c518] text-xs mt-0.5">Se enviará un email con las credenciales generadas</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Apellido" value={form.last_name} onChange={e => set("last_name", e.target.value)} error={errors.last_name} />
            <ModalField label="Nombre" value={form.first_name} onChange={e => set("first_name", e.target.value)} error={errors.first_name} />
          </div>
          <ModalField label="Usuario (DNI)" value={form.username} onChange={e => set("username", e.target.value)} placeholder="ej: 28126358" error={errors.username} />
          <ModalField label="Email" value={form.email} onChange={e => set("email", e.target.value)} type="email" placeholder="docente@institución.edu.ar" error={errors.email} />
          <ModalField label="Contraseña (opcional — se genera automáticamente si se deja vacío)" value={form.password} onChange={e => set("password", e.target.value)} type="password" />
          <RolYAccesoForm grupos={grupos} is_superuser={false} onChange={setGrupos} />
          {msg && (
            <p className={`text-xs font-semibold px-3 py-2 rounded-xl ${msg.includes("Error") || msg.includes("error") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
              {msg}
            </p>
          )}
        </div>

        <div className="p-5 border-t border-[#b8ccd8] flex gap-3">
          <button onClick={save} disabled={saving}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm disabled:opacity-60 hover:opacity-80 transition-opacity flex items-center justify-center gap-2"
            style={{ background: P.navy, color: P.yellow }}>
            <Save size={15} /> {saving ? "Creando..." : "Crear usuario"}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-sm border border-[#b8ccd8] text-[#1a1f4e] hover:bg-[#b8ccd8]/20 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function puedeAsignarRoles(currentUser) {
  if (!currentUser) return false;
  if (currentUser.is_superuser || currentUser.is_staff) return true;
  return (currentUser.groups || []).some(g => GRUPOS_PUEDEN_ASIGNAR.includes(g));
}

function UsuariosPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("terciario"); // terciario | ambos | todos
  const [editUser, setEditUser] = useState(null);
  const [resettingId, setResettingId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [nuevoModal, setNuevoModal] = useState(false);

  useEffect(() => {
    apiClientV2.get("/user").then(({ data }) => setCurrentUser(data)).catch(() => {});
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClientV2.get("/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch { setUsers([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const resetPassword = async (u) => {
    if (!window.confirm(`¿Regenerar contraseña para ${u.username}? Se enviará al email.`)) return;
    setResettingId(u.id);
    try {
      await apiClientV2.post(`/users/${u.id}/regenerate-password`);
    } catch {}
    finally { setResettingId(null); }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchQ = (
      u.username?.includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.first_name?.toLowerCase().includes(q) ||
      u.last_name?.toLowerCase().includes(q)
    );
    if (!matchQ) return false;
    const ter = tieneAccesoTerciario(u);
    const cfp = tieneAccesoCFP(u);
    // Por defecto solo muestra los que tienen acceso a Terciario
    if (filtro === "terciario") return ter;
    if (filtro === "ambos") return cfp && ter;
    if (filtro === "todos") return true;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#1a1f4e]">Usuarios</h1>
          <p className="text-[#1a1f4e]/50 text-sm mt-0.5">Gestioná roles y accesos a CFP y Terciario</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-sm font-bold border" style={{ borderColor: P.navy + "30", color: P.navy }}>
            {filtered.length} usuarios
          </span>
          {puedeAsignarRoles(currentUser) && (
            <button onClick={() => setNuevoModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold hover:opacity-80 transition-opacity"
              style={{ background: P.navy, color: P.yellow }}>
              + Nuevo usuario
            </button>
          )}
        </div>
      </div>
      {nuevoModal && <NuevoUsuarioModal onClose={() => setNuevoModal(false)} onSaved={fetchUsers} />}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1a1f4e]/40" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, usuario o email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#b8ccd8] bg-white text-[#1a1f4e] text-sm focus:outline-none focus:ring-2 focus:ring-[#f5c518]" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "terciario", label: "Con acceso Terciario" },
            { key: "ambos", label: "CFP + Terciario" },
            { key: "todos", label: "Todos los usuarios" },
          ].map(f => (
            <button key={f.key} onClick={() => setFiltro(f.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${filtro === f.key ? "text-[#1a1f4e] border-[#f5c518]" : "border-[#b8ccd8] text-[#1a1f4e]/60 hover:border-[#1a1f4e]/40"}`}
              style={filtro === f.key ? { background: P.yellow } : { background: "white" }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-16 text-[#1a1f4e]/40 text-sm">Cargando...</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#b8ccd8] bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: P.navy }} className="text-[#b8ccd8] text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left font-bold">Usuario</th>
                <th className="px-4 py-3 text-left font-bold">Nombre</th>
                <th className="px-4 py-3 text-left font-bold">Grupos</th>
                <th className="px-4 py-3 text-left font-bold">Acceso</th>
                <th className="px-4 py-3 text-left font-bold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#b8ccd8]/30">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-[#b8ccd8]/10 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#1a1f4e]">{u.username}</p>
                    <p className="text-xs text-[#1a1f4e]/50">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 text-[#1a1f4e]/80">
                    {u.last_name} {u.first_name}
                    {(u.is_superuser || u.is_staff) && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">SuperAdmin</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.groups.length === 0
                        ? <span className="text-[#1a1f4e]/30 text-xs">—</span>
                        : u.groups.map(g => <GrupoBadge key={g} nombre={g} />)
                      }
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      <AccesoBadge tieneAcceso={tieneAccesoCFP(u)} sistema="CFP" />
                      <AccesoBadge tieneAcceso={tieneAccesoTerciario(u)} sistema="Terciario" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {puedeAsignarRoles(currentUser) && (
                        <button onClick={() => setEditUser(u)} title="Editar grupos"
                          className="p-1.5 rounded-lg hover:bg-[#1a1f4e]/10 text-[#1a1f4e]/50 hover:text-[#1a1f4e] transition-colors">
                          <Pencil size={14} />
                        </button>
                      )}
                      <button onClick={() => resetPassword(u)} title="Regenerar contraseña"
                        disabled={resettingId === u.id}
                        className="p-1.5 rounded-lg hover:bg-[#1a1f4e]/10 text-[#1a1f4e]/50 hover:text-[#1a1f4e] transition-colors disabled:opacity-40">
                        <RefreshCw size={14} className={resettingId === u.id ? "animate-spin" : ""} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-[#1a1f4e]/40 text-sm">No hay usuarios que coincidan.</div>
          )}
        </div>
      )}

      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={() => { fetchUsers(); setEditUser(null); }}
        />
      )}
    </div>
  );
}

export default function AdminTerciario() {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [tab, setTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("pendiente");
  const [selected, setSelected] = useState(null);

  const tieneCFP = user && (user.is_superuser || user.is_staff || user.groups?.some(g => GRUPOS_CFP.includes(g)));
  const tieneTerciario = user && (user.is_superuser || user.is_staff || user.groups?.some(g => GRUPOS_TERCIARIO.includes(g)));
  const tieneAmbos = tieneCFP && tieneTerciario;

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
    <div className="min-h-screen bg-[#eef2f7] flex">
      {/* Sidebar */}
      <aside style={{ background: P.navy }} className="flex flex-col w-64 flex-shrink-0 min-h-screen shadow-xl">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black flex-shrink-0"
              style={{ background: P.yellow, color: P.navy }}>P</div>
            <div className="overflow-hidden">
              <p className="text-white font-black text-sm leading-tight truncate">Centro Politécnico</p>
              <p style={{ color: P.yellow }} className="text-[10px] font-semibold">Panel Terciario</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-grow px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === key
                  ? "text-[#1a1f4e] shadow-md"
                  : "text-white/60 hover:text-white hover:bg-white/8"
              }`}
              style={tab === key ? { background: P.yellow } : {}}>
              <Icon size={17} />
              {label}
              {tab === key && <ChevronRight size={14} className="ml-auto" />}
            </button>
          ))}
          <a href="/preinscripcion-terciario" target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white/60 hover:text-white hover:bg-white/8 transition-all">
            <ExternalLink size={17} />
            Ver formulario
          </a>
        </nav>

        {/* Stats quick view */}
        {stats && (
          <div className="px-4 py-4 border-t border-white/10 space-y-2">
            <p className="text-white/30 text-[10px] uppercase font-bold tracking-widest">Resumen</p>
            <div className="flex justify-between text-xs">
              <span className="text-white/50">Total</span>
              <span className="text-white font-bold">{stats.total}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-yellow-400">Pendientes</span>
              <span className="text-yellow-400 font-bold">{stats.pendiente}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-green-400">Aprobados</span>
              <span className="text-green-400 font-bold">{stats.aprobada}</span>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="px-3 pb-4">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-white/40 hover:text-white hover:bg-white/8 text-sm font-semibold transition-all">
            <LogOut size={16} /> Salir
          </button>
        </div>
      </aside>

      {/* Main content container */}
      <div className="flex-grow flex flex-col min-h-screen overflow-hidden">
        {/* Top bar / Header with Switcher */}
        <header className="bg-white border-b border-[#b8ccd8]/50 h-16 flex items-center justify-between px-8 z-20 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-black text-[#1a1f4e]/40 uppercase tracking-widest">
            <span>Tecnicatura en Ciencia de Datos e IA</span>
          </div>

          <div className="flex items-center gap-6">
            {tieneAmbos && (
              <div className="flex items-center bg-[#1a1f4e]/5 p-0.5 rounded-xl border border-[#1a1f4e]/10 mr-2 shadow-inner">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-[#1a1f4e]/60 hover:text-[#1a1f4e] transition-all hover:bg-[#1a1f4e]/5 active:scale-95"
                >
                  CFP
                </button>
                <button
                  className="px-4 py-1.5 rounded-lg text-xs font-black bg-[#1a1f4e] text-[#f5c518] shadow-lg shadow-[#1a1f4e]/20 transition-all cursor-default"
                >
                  Terciario
                </button>
              </div>
            )}

            {/* User Info / Avatar matching the topbar style but light themed */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold text-[#1a1f4e]">
                  {user?.username || 'Usuario'}
                </span>
                <span className="text-[10px] font-bold text-[#1a1f4e]/40 uppercase">
                  {user?.groups?.[0] || 'Terciario'}
                </span>
              </div>
              <div className="h-9 w-9 rounded-xl flex items-center justify-center font-bold text-white shadow-sm transition-all"
                style={{ background: P.navy }}>
                {(user?.username || 'U').charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow overflow-auto p-8 bg-[#eef2f7]">
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

        {/* COHORTE */}
        {tab === "cohorte" && <CohortePanel onGoConfig={() => setTab("configuracion")} />}

        {/* ALUMNOS */}
        {tab === "alumnos" && <AlumnosPanel />}

        {/* USUARIOS */}
        {tab === "usuarios" && <UsuariosPanel />}

        {/* CONFIGURACIÓN */}
        {tab === "configuracion" && <ConfiguracionPanel />}
      </main>
      </div>

      {selected && (
        <DetailModal p={selected} onClose={() => setSelected(null)} onSaved={() => { fetchData(); fetchStats(); setSelected(null); }} />
      )}
    </div>
  );
}
