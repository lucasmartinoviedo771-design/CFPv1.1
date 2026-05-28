import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Search, Download, Printer, ChevronRight } from "lucide-react";
import { apiClientV2 } from "../../api/client";
import { P } from "./AdminUI";

const HD_ESTADO_LABELS = { CURSANDO: "Cursando", APROBADO: "Aprobado", DESAPROBADO: "Desaprobado", INACTIVO: "Inactivo" };

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

export function AlumnosPanel() {
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
