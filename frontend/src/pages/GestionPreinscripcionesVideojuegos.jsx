import React, { useState, useEffect, useCallback, useMemo } from "react";
import { apiClientV2 } from "../api/client";
import { getMediaUrl } from "../utils/media";
import {
  Search,
  Eye,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Gamepad2,
  Laptop,
  Wifi,
  User,
  Smartphone,
  FileText,
  ShieldAlert,
  Download,
  Calendar,
  MapPin,
  Check,
  Briefcase
} from "lucide-react";

const ESTADOS = [
  { value: "", label: "Todos los estados" },
  { value: "pendiente", label: "Pendiente" },
  { value: "aprobado", label: "Aprobado" },
  { value: "rechazado", label: "Rechazado" },
];

const BADGE_CLASSES = {
  pendiente: "border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]",
  aprobado: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
  rechazado: "border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.1)]",
};

const BADGE_ICONS = {
  pendiente: <Clock size={12} className="animate-pulse" />,
  aprobado: <CheckCircle2 size={12} />,
  rechazado: <XCircle size={12} />,
};

function StateBadge({ estado }) {
  const norm = estado?.toLowerCase() || "pendiente";
  const label = norm === "aprobado" ? "Aprobado" : norm === "rechazado" ? "Rechazado" : "Pendiente";
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black uppercase tracking-wider ${BADGE_CLASSES[norm] || BADGE_CLASSES.pendiente}`}>
      {BADGE_ICONS[norm] || BADGE_ICONS.pendiente}
      {label}
    </span>
  );
}

function YesNoIcon({ value, trueIcon, falseIcon }) {
  if (value) {
    return (
      <span className="text-emerald-400 flex items-center gap-1 font-bold text-xs" title="Sí">
        {trueIcon} <span className="hidden sm:inline">Sí</span>
      </span>
    );
  }
  return (
    <span className="text-rose-400 flex items-center gap-1 font-bold text-xs" title="No">
      {falseIcon} <span className="hidden sm:inline">No</span>
    </span>
  );
}

function DetailRow({ label, value, icon }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 py-2 border-b border-indigo-500/5 last:border-b-0">
      <span className="text-xs font-black uppercase tracking-widest text-indigo-300 sm:w-48 flex-shrink-0 flex items-center gap-1.5">
        {icon && <span className="text-brand-cyan">{icon}</span>}
        {label}
      </span>
      <span className="text-sm font-semibold text-white/90">{value ?? "—"}</span>
    </div>
  );
}

function DocumentLink({ url, label, colorClass }) {
  if (!url) return null;
  const fullUrl = getMediaUrl(url);
  return (
    <a
      href={fullUrl}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center justify-between p-3.5 rounded-2xl transition-all duration-300 border hover:scale-[1.01] ${colorClass}`}
    >
      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
        <FileText size={18} /> {label}
      </span>
      <Download size={16} />
    </a>
  );
}

function DetailModal({ student, onClose, onSave }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleStatusChange = async (newEstado) => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await apiClientV2.patch(`/videojuegos/preinscripciones/${student.id}`, {
        estado: newEstado,
      });
      setSuccess(`Postulación ${newEstado === "aprobado" ? "aprobada" : "rechazada"} con éxito.`);
      setTimeout(() => {
        onSave();
      }, 1000);
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al actualizar el estado de la postulación.");
    } finally {
      setSaving(false);
    }
  };

  const edad = useMemo(() => {
    if (!student.fecha_nacimiento) return null;
    try {
      const nac = new Date(student.fecha_nacimiento);
      const hoy = new Date();
      let e = hoy.getFullYear() - nac.getFullYear();
      const m = hoy.getMonth() - nac.getMonth();
      if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) e--;
      return e;
    } catch {
      return null;
    }
  }, [student.fecha_nacimiento]);

  const esMenor = edad !== null && edad < 18;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-[#0c122c] border border-indigo-500/20 rounded-[2.5rem] w-full max-w-3xl my-8 shadow-2xl shadow-black relative overflow-hidden">
        {/* Background ambient light */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-cyan/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-accent/10 rounded-full blur-2xl" />

        {/* Modal Header */}
        <div className="relative flex items-center justify-between p-8 border-b border-indigo-500/10">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black tracking-tight text-white">
                {student.apellido}, {student.nombre}
              </h2>
              <StateBadge estado={student.estado_vj} />
              {esMenor && (
                <span className="px-2 py-0.5 rounded-md bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-wider">
                  Menor de Edad
                </span>
              )}
            </div>
            <p className="text-indigo-300 text-sm font-semibold mt-1">
              DNI: {student.dni} · {student.email}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-2xl hover:bg-white/5 text-indigo-300 hover:text-white transition-all duration-300 active:scale-95 border border-indigo-500/10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-950">
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

          {/* Trayecto / Bloques VJ */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-cyan border-b border-indigo-500/10 pb-2 flex items-center gap-2">
              <Gamepad2 size={14} /> Especialidad Elegida
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {(student.bloques_vj || []).map((b, idx) => (
                <span
                  key={idx}
                  className="px-4 py-2 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 text-xs font-black text-indigo-200 flex items-center gap-2"
                >
                  <Check size={12} className="text-brand-cyan" />
                  {b}
                </span>
              ))}
              {(student.bloques_vj || []).length === 0 && (
                <span className="text-sm text-indigo-400 italic">No se especificaron bloques.</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personales */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-brand-cyan border-b border-indigo-500/10 pb-2 flex items-center gap-2">
                <User size={14} /> Datos Personales
              </h3>
              <div className="space-y-1">
                <DetailRow label="Sexo" value={student.sexo === "M" ? "Masculino" : student.sexo === "F" ? "Femenino" : "Otro/X"} />
                <DetailRow label="Nacimiento" value={`${student.fecha_nacimiento} (${edad ? `${edad} años` : "—"})`} />
                <DetailRow label="Nacionalidad" value={student.nacionalidad} />
                <DetailRow label="Provincia Nac." value={student.lugar_nacimiento} />
                <DetailRow label="CUIT" value={student.cuit} />
                <DetailRow label="Nivel Educativo" value={student.nivel_educativo} />
              </div>
            </div>

            {/* Domicilio / Contacto */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-brand-cyan border-b border-indigo-500/10 pb-2 flex items-center gap-2">
                <Smartphone size={14} /> Contacto & Residencia
              </h3>
              <div className="space-y-1">
                <DetailRow label="Teléfono" value={student.telefono} icon={<Smartphone size={12} />} />
                <DetailRow label="Ciudad" value={student.ciudad} icon={<MapPin size={12} />} />
                <DetailRow label="Barrio" value={student.barrio} />
                <DetailRow label="Domicilio" value={student.domicilio} />
                <DetailRow label="Email" value={student.email} />
              </div>
            </div>
          </div>

          {/* PC, Internet y Trabajo */}
          <div className="p-6 rounded-[2rem] bg-indigo-950/20 border border-indigo-500/10 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-cyan flex items-center gap-2">
              <Laptop size={14} /> Recursos e Información Laboral
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-black/20 border border-indigo-500/5">
                <span className="text-xs font-bold text-indigo-300">Posee PC</span>
                <YesNoIcon value={student.posee_pc} trueIcon={<Laptop size={14} />} falseIcon={<Laptop size={14} />} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-black/20 border border-indigo-500/5">
                <span className="text-xs font-bold text-indigo-300">Tiene Conectividad</span>
                <YesNoIcon value={student.posee_conectividad} trueIcon={<Wifi size={14} />} falseIcon={<Wifi size={14} />} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-black/20 border border-indigo-500/5">
                <span className="text-xs font-bold text-indigo-300">Trabaja</span>
                <YesNoIcon value={student.trabaja} trueIcon={<Briefcase size={14} />} falseIcon={<Briefcase size={14} />} />
              </div>
            </div>
            {student.trabaja && student.lugar_trabajo && (
              <div className="pt-2">
                <p className="text-xs font-black uppercase tracking-widest text-indigo-400">Lugar de Trabajo</p>
                <p className="text-sm font-semibold text-white/90 mt-1">{student.lugar_trabajo}</p>
              </div>
            )}
          </div>

          {/* Tutor info for minors */}
          {esMenor && (
            <div className="p-6 rounded-[2rem] bg-brand-accent/5 border border-brand-accent/25 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-brand-accent flex items-center gap-2">
                <ShieldAlert size={14} /> Tutor Responsable (Menor de Edad)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Nombre</p>
                  <p className="font-bold text-white mt-0.5">{student.tutor_nombre || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">DNI Tutor</p>
                  <p className="font-bold text-white mt-0.5">{student.tutor_dni || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Teléfono Tutor</p>
                  <p className="font-bold text-white mt-0.5">{student.tutor_telefono || "—"}</p>
                </div>
              </div>
              {student.autorizacion_status && (
                <div className="pt-2 border-t border-brand-accent/15 flex items-center gap-4 text-xs font-bold">
                  <span className="text-indigo-300 uppercase tracking-wider">Estado Autorización Parental:</span>
                  <span className={`px-2 py-0.5 rounded uppercase ${
                    student.autorizacion_status === "SIGNED" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  }`}>
                    {student.autorizacion_status === "SIGNED" ? "Firmada" : "Pendiente"}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Documentación */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-cyan border-b border-indigo-500/10 pb-2 flex items-center gap-2">
              <FileText size={14} /> Documentos Adjuntos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DocumentLink
                url={student.dni_digitalizado}
                label="Frente / Dorso DNI"
                colorClass="border-cyan-500/20 bg-cyan-500/5 text-cyan-300 hover:border-cyan-500/40"
              />
              {!esMenor && (
                <DocumentLink
                  url={student.titulo_secundario_digitalizado}
                  label="Título Secundario"
                  colorClass="border-emerald-500/20 bg-emerald-500/5 text-emerald-300 hover:border-emerald-500/40"
                />
              )}
              {esMenor && (
                <DocumentLink
                  url={student.dni_tutor_digitalizado}
                  label="DNI Tutor"
                  colorClass="border-orange-500/20 bg-orange-500/5 text-orange-200 hover:border-orange-500/40"
                />
              )}
              {student.nota_parental_firmada && (
                <DocumentLink
                  url={student.nota_parental_firmada}
                  label="Nota Parental Firmada"
                  colorClass="border-emerald-500/20 bg-emerald-500/5 text-emerald-300 hover:border-emerald-500/40"
                />
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer / Actions */}
        <div className="relative p-8 border-t border-indigo-500/10 flex flex-col sm:flex-row justify-end gap-3 bg-[#0a0d24]">
          <button
            onClick={onClose}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest transition-all duration-300 disabled:opacity-50"
          >
            Cerrar
          </button>
          
          {student.estado_vj === "pendiente" && (
            <>
              <button
                onClick={() => handleStatusChange("rechazado")}
                disabled={saving}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/35 text-rose-400 hover:bg-rose-500/20 font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <XCircle size={15} /> Rechazar Postulación
              </button>
              <button
                onClick={() => handleStatusChange("aprobado")}
                disabled={saving}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-brand-cyan to-brand-accent text-[#050814] font-black text-xs uppercase tracking-widest transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] hover:scale-[1.02] flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 size={15} /> Aprobar Postulación
              </button>
            </>
          )}

          {student.estado_vj === "aprobado" && (
            <button
              onClick={() => handleStatusChange("rechazado")}
              disabled={saving}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/35 text-rose-400 hover:bg-rose-500/20 font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <XCircle size={15} /> Cambiar a Rechazado
            </button>
          )}

          {student.estado_vj === "rechazado" && (
            <button
              onClick={() => handleStatusChange("aprobado")}
              disabled={saving}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-brand-cyan to-brand-accent text-[#050814] font-black text-xs uppercase tracking-widest transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] hover:scale-[1.02] flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 size={15} /> Cambiar a Aprobado
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GestionPreinscripcionesVideojuegos() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [selected, setSelected] = useState(null);
  const [actionError, setActionError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setActionError("");
    try {
      const { data: res } = await apiClientV2.get("/videojuegos/preinscripciones");
      setData(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
      setActionError("No se pudieron cargar los datos de preinscripción de videojuegos.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    return data.filter((p) => {
      // 1. Filtro de Estado VJ
      if (filtroEstado && p.estado_vj !== filtroEstado) {
        return false;
      }
      // 2. Filtro de búsqueda textual
      const q = search.toLowerCase().trim();
      if (!q) return true;

      const fullname = `${p.apellido || ""} ${p.nombre || ""}`.toLowerCase();
      return (
        fullname.includes(q) ||
        p.dni?.includes(q) ||
        p.email?.toLowerCase().includes(q)
      );
    });
  }, [data, search, filtroEstado]);

  return (
    <div className="space-y-8 bg-[#050814] text-white p-2 min-h-screen font-sans relative">
      {/* Background visual glows */}
      <div className="absolute top-10 right-10 w-80 h-80 bg-brand-cyan/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-brand-accent/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-accent/30 bg-brand-accent/10 text-brand-accent text-[10px] font-black uppercase tracking-widest">
            <Gamepad2 size={12} className="animate-pulse" /> Panel de Gestión
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight leading-none">
            Preinscripciones <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent via-amber-500 to-brand-cyan">Videojuegos</span>
          </h1>
          <p className="text-indigo-300 text-sm font-semibold">
            Revisión, aprobación y alta de legajos para la cohorte actual.
          </p>
        </div>
        <div className="flex-shrink-0">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-950/40 border border-indigo-500/10 text-xs font-black uppercase tracking-wider text-brand-cyan">
            {filtered.length} aspirantes filtrados
          </span>
        </div>
      </div>

      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-semibold flex items-center gap-2">
          <ShieldAlert size={16} /> {actionError}
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 relative z-10">
        <div className="relative flex-grow">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar aspirante por nombre, DNI o email..."
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#0c122c]/50 border border-indigo-500/10 backdrop-blur-xl text-white placeholder-indigo-400 text-sm font-semibold focus:border-brand-cyan/70 focus:ring-1 focus:ring-brand-cyan/20 focus:outline-none transition-all"
          />
        </div>
        <div className="flex-shrink-0">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="w-full sm:w-48 px-4 py-3.5 rounded-2xl bg-[#0c122c]/50 border border-indigo-500/10 backdrop-blur-xl text-white text-sm font-bold focus:border-brand-cyan/70 focus:outline-none transition-all"
          >
            {ESTADOS.map((e) => (
              <option key={e.value} value={e.value} className="bg-[#0c122c] text-white">
                {e.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="relative z-10 bg-[#0c122c]/20 border border-indigo-500/10 backdrop-blur-xl shadow-2xl rounded-[2rem] overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-indigo-300 font-bold uppercase tracking-wider space-y-4">
            <div className="animate-spin text-brand-cyan"><Gamepad2 size={40} /></div>
            <p className="text-xs">Cargando legajos de Videojuegos...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-indigo-400 font-semibold text-sm">
            No se encontraron preinscripciones con los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-[#0c122c]/70 border-b border-indigo-500/10 text-indigo-300 text-xs font-black uppercase tracking-widest">
                  <th className="px-6 py-4.5">Aspirante</th>
                  <th className="px-6 py-4.5">Contacto</th>
                  <th className="px-6 py-4.5">Especialidad</th>
                  <th className="px-6 py-4.5 text-center">Recursos PC</th>
                  <th className="px-6 py-4.5">Estado</th>
                  <th className="px-6 py-4.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-500/5 bg-transparent">
                {filtered.map((p) => {
                  const edad = p.fecha_nacimiento ? new Date().getFullYear() - new Date(p.fecha_nacimiento).getFullYear() : 18;
                  const esMenor = edad < 18;
                  return (
                    <tr key={p.id} className="hover:bg-[#00ccff]/5 transition-all duration-300">
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="font-bold text-white text-base">
                            {p.apellido}, {p.nombre}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-indigo-300 font-semibold">{p.email}</span>
                            {esMenor && (
                              <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[9px] font-black uppercase">
                                Menor
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5 font-semibold text-indigo-200">
                          <p className="text-xs">DNI: {p.dni}</p>
                          {p.telefono && <p className="text-xs text-indigo-300">Tel: {p.telefono}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {(p.bloques_vj || []).map((b, idx) => (
                            <span key={idx} className="text-xs text-indigo-200 font-medium">
                              • {b}
                            </span>
                          ))}
                          {(p.bloques_vj || []).length === 0 && (
                            <span className="text-xs text-indigo-400 italic">Sin bloques</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-4">
                          <div className="flex flex-col items-center">
                            <Laptop size={15} className={p.posee_pc ? "text-brand-cyan" : "text-indigo-950"} />
                            <span className="text-[9px] font-bold text-indigo-400 mt-1 uppercase">PC</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <Wifi size={15} className={p.posee_conectividad ? "text-brand-cyan" : "text-indigo-950"} />
                            <span className="text-[9px] font-bold text-indigo-400 mt-1 uppercase">Wifi</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StateBadge estado={p.estado_vj} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelected(p)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500/10 hover:bg-brand-cyan hover:text-[#050814] text-brand-cyan text-xs font-black uppercase tracking-wider transition-all duration-300 active:scale-95 border border-brand-cyan/20 hover:shadow-[0_0_15px_rgba(0,255,255,0.3)]"
                        >
                          <Eye size={13} /> Detalle
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <DetailModal
          student={selected}
          onClose={() => setSelected(null)}
          onSave={() => {
            fetchData();
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}
