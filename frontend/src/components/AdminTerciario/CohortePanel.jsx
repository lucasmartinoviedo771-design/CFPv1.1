import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Search, AlertCircle, Download, Printer } from "lucide-react";
import { apiClientV2 } from "../../api/client";
import { P } from "./AdminUI";

const HD_ESTADO_LABELS = { CURSANDO: "Cursando", APROBADO: "Aprobado", DESAPROBADO: "Desaprobado", INACTIVO: "Inactivo" };
const HD_ESTADO_COLORS = {
  CURSANDO: "bg-blue-100 text-blue-800", APROBADO: "bg-green-100 text-green-800",
  DESAPROBADO: "bg-red-100 text-red-800", INACTIVO: "bg-gray-100 text-gray-600",
};

export function CohortePanel({ onGoConfig }) {
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
