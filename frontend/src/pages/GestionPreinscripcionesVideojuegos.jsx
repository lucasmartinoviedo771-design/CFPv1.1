import React, { useState, useEffect, useCallback, useMemo, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { apiClientV2 } from "../api/client";
import { getMediaUrl } from "../utils/media";
import authService from "../services/authService";
import { UserContext, ThemeModeContext } from "../App";
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
  Briefcase,
  BarChart3,
  Users,
  LogOut,
  ChevronRight,
  Sun,
  Moon,
  KeyRound,
  ExternalLink,
  Settings
} from "lucide-react";

import AlumnosTab from "../components/Videojuegos/AlumnosTab";
import ConfigTab from "../components/Videojuegos/ConfigTab";
import UsuariosTab from "../components/Videojuegos/UsuariosTab";

// States mapping
const ESTADOS = [
  { value: "", label: "Todos los Estados" },
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
        {icon && <span className="text-[#00ccff]">{icon}</span>}
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
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#00ccff]/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#FF6600]/10 rounded-full blur-2xl" />

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
            <h3 className="text-xs font-black uppercase tracking-widest text-[#00ccff] border-b border-indigo-500/10 pb-2 flex items-center gap-2">
              <Gamepad2 size={14} /> Especialidad Elegida
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {(student.bloques_vj || []).map((b, idx) => (
                <span
                  key={idx}
                  className="px-4 py-2 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 text-xs font-black text-indigo-200 flex items-center gap-2"
                >
                  <Check size={12} className="text-[#00ccff]" />
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
              <h3 className="text-xs font-black uppercase tracking-widest text-[#00ccff] border-b border-indigo-500/10 pb-2 flex items-center gap-2">
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
              <h3 className="text-xs font-black uppercase tracking-widest text-[#00ccff] border-b border-indigo-500/10 pb-2 flex items-center gap-2">
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
            <h3 className="text-xs font-black uppercase tracking-widest text-[#00ccff] flex items-center gap-2">
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
            <div className="p-6 rounded-[2rem] bg-[#FF6600]/5 border border-[#FF6600]/25 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#FF6600] flex items-center gap-2">
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
                <div className="pt-2 border-t border-[#FF6600]/15 flex items-center gap-4 text-xs font-bold">
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
            <h3 className="text-xs font-black uppercase tracking-widest text-[#00ccff] border-b border-indigo-500/10 pb-2 flex items-center gap-2">
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

function StatCard({ label, value, icon, glowClass }) {
  return (
    <div className={`p-6 rounded-[2rem] bg-[#0c122c]/50 border border-indigo-500/10 backdrop-blur-xl relative overflow-hidden shadow-lg ${glowClass}`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-x-8 -translate-y-8" />
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <p className="text-indigo-300 text-xs font-black uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-black text-white">{value}</p>
        </div>
        <div className="p-3 rounded-2xl bg-indigo-950/60 text-[#00ccff]">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function GestionPreinscripcionesVideojuegos() {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const { mode, toggleMode } = useContext(ThemeModeContext);
  
  const [tab, setTab] = useState("dashboard");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [selected, setSelected] = useState(null);
  const [actionError, setActionError] = useState("");

  const esAdmin = user && (user.is_superuser || user.is_staff || user.groups?.includes("Admin"));
  const GRUPOS_CFP = ["Admin", "Secretaría", "Regencia", "Coordinación Docente", "Docente", "Preceptor", "Bedel", "Rector"];
  const tieneCFP = user && (user.is_superuser || user.is_staff || user.groups?.some(g => GRUPOS_CFP.includes(g)));
  const GRUPOS_TERCIARIO = ["Admin", "Terciario", "Rector"];
  const tieneTerciario = user && (user.is_superuser || user.is_staff || user.groups?.some(g => GRUPOS_TERCIARIO.includes(g)));
  const tieneVJ = user && (user.is_superuser || user.is_staff || user.groups?.includes("Videojuegos"));

  let areas = 0;
  if (tieneCFP) areas++;
  if (tieneTerciario) areas++;
  if (tieneVJ) areas++;
  const mostrarSelector = areas > 1;

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

  // Aggregate stats dynamically in the frontend
  const stats = useMemo(() => {
    const total = data.length;
    const pendiente = data.filter((s) => s.estado_vj === "pendiente").length;
    const aprobado = data.filter((s) => s.estado_vj === "aprobado").length;
    const rechazado = data.filter((s) => s.estado_vj === "rechazado").length;
    
    const conPC = data.filter((s) => s.posee_pc).length;
    const conInternet = data.filter((s) => s.posee_conectividad).length;
    const trabaja = data.filter((s) => s.trabaja).length;

    let ushuaia = 0;
    let rioGrande = 0;
    let tolhuin = 0;
    let otras = 0;

    data.forEach((s) => {
      const c = (s.ciudad || "").toLowerCase();
      if (c.includes("ushuaia")) ushuaia++;
      else if (c.includes("grande") || c.includes("rg")) rioGrande++;
      else if (c.includes("tolhuin")) tolhuin++;
      else otras++;
    });

    // Minors vs Adults check (under 18)
    let menores = 0;
    let mayores = 0;
    data.forEach((s) => {
      if (!s.fecha_nacimiento) {
        mayores++;
        return;
      }
      try {
        const nac = new Date(s.fecha_nacimiento);
        const hoy = new Date();
        let e = hoy.getFullYear() - nac.getFullYear();
        const m = hoy.getMonth() - nac.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) e--;
        if (e < 18) menores++;
        else mayores++;
      } catch {
        mayores++;
      }
    });

    return {
      total,
      pendiente,
      aprobado,
      rechazado,
      conPC,
      conInternet,
      trabaja,
      porCiudad: [
        { label: "Río Grande", value: rioGrande },
        { label: "Ushuaia", value: ushuaia },
        { label: "Tolhuin", value: tolhuin },
        { label: "Otras/S.D.", value: otras },
      ],
      menores,
      mayores,
    };
  }, [data]);

  const filtered = useMemo(() => {
    return data.filter((p) => {
      if (filtroEstado && p.estado_vj !== filtroEstado) {
        return false;
      }
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

  const handleLogout = async () => {
    await authService.logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#050814] flex text-white font-sans selection:bg-[#00ccff]/30 relative overflow-hidden">
      {/* Background visual glows */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-[#00ccff]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#FF6600]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Standalone Sidebar for Videojuegos Panel */}
      <aside className="w-64 flex flex-col h-screen flex-shrink-0 bg-[#0c122c]/50 backdrop-blur-xl border-r border-indigo-500/10 relative z-25">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-indigo-500/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#00ccff] to-[#FF6600] rounded-xl flex items-center justify-center shadow-lg shadow-[#00ccff]/20">
              <Gamepad2 size={24} className="text-[#050814]" />
            </div>
            <div>
              <h1 className="text-base font-black text-white leading-tight uppercase tracking-wider">Videojuegos</h1>
              <p className="text-[10px] font-black text-[#00ccff] leading-none uppercase tracking-widest mt-1">Panel de Control</p>
            </div>
          </div>
        </div>

        {/* Navigation tabs list */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-950">
          <button
            onClick={() => setTab("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
              tab === "dashboard"
                ? "bg-gradient-to-r from-[#00ccff]/20 to-[#FF6600]/20 text-[#00ccff] border border-[#00ccff]/30 shadow-[0_0_15px_rgba(0,255,255,0.1)]"
                : "text-indigo-300 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <BarChart3 size={16} />
            <span>Dashboard</span>
            {tab === "dashboard" && <ChevronRight size={14} className="ml-auto text-[#00ccff]" />}
          </button>

          <button
            onClick={() => setTab("preinscripciones")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
              tab === "preinscripciones"
                ? "bg-gradient-to-r from-[#00ccff]/20 to-[#FF6600]/20 text-[#00ccff] border border-[#00ccff]/30 shadow-[0_0_15px_rgba(0,255,255,0.1)]"
                : "text-indigo-300 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <Users size={16} />
            <span>Preinscripciones</span>
            {tab === "preinscripciones" && <ChevronRight size={14} className="ml-auto text-[#00ccff]" />}
          </button>

          <button
            onClick={() => setTab("alumnos")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
              tab === "alumnos"
                ? "bg-gradient-to-r from-[#00ccff]/20 to-[#FF6600]/20 text-[#00ccff] border border-[#00ccff]/30 shadow-[0_0_15px_rgba(0,255,255,0.1)]"
                : "text-indigo-300 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <Users size={16} />
            <span>Alumnos VJ</span>
            {tab === "alumnos" && <ChevronRight size={14} className="ml-auto text-[#00ccff]" />}
          </button>

          <button
            onClick={() => setTab("configuracion")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
              tab === "configuracion"
                ? "bg-gradient-to-r from-[#00ccff]/20 to-[#FF6600]/20 text-[#00ccff] border border-[#00ccff]/30 shadow-[0_0_15px_rgba(0,255,255,0.1)]"
                : "text-indigo-300 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <Settings size={16} />
            <span>Configuración</span>
            {tab === "configuracion" && <ChevronRight size={14} className="ml-auto text-[#00ccff]" />}
          </button>

          {esAdmin && (
            <button
              onClick={() => setTab("usuarios")}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                tab === "usuarios"
                  ? "bg-gradient-to-r from-[#00ccff]/20 to-[#FF6600]/20 text-[#00ccff] border border-[#00ccff]/30 shadow-[0_0_15px_rgba(0,255,255,0.1)]"
                  : "text-indigo-300 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <KeyRound size={16} />
              <span>Usuarios VJ</span>
              {tab === "usuarios" && <ChevronRight size={14} className="ml-auto text-[#00ccff]" />}
            </button>
          )}

          <a
            href="/preinscripcion-videojuegos"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest text-indigo-300 hover:text-white hover:bg-white/5 border border-transparent transition-all"
          >
            <span className="flex items-center gap-3">
              <ExternalLink size={16} />
              <span>Ver Formulario</span>
            </span>
          </a>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-indigo-500/10 space-y-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-xs font-black uppercase tracking-widest transition-all duration-300"
          >
            <LogOut size={14} /> Salir
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-h-screen overflow-hidden relative z-10">
        {/* Standalone Topbar for Videojuegos Panel */}
        <header className="bg-transparent border-b border-indigo-500/10 backdrop-blur-sm h-16 flex items-center justify-between px-8 z-20 flex-shrink-0">
          <h2 className="text-lg font-black tracking-widest text-white uppercase flex items-center gap-2">
            <span className="text-[#00ccff]">
              {tab === "dashboard" && <BarChart3 size={18} />}
              {tab === "preinscripciones" && <Users size={18} />}
              {tab === "alumnos" && <Users size={18} />}
              {tab === "configuracion" && <Settings size={18} />}
              {tab === "usuarios" && <KeyRound size={18} />}
            </span>
            {tab === "dashboard" && "Estadísticas"}
            {tab === "preinscripciones" && "Preinscripciones VJ"}
            {tab === "alumnos" && "Alumnos VJ"}
            {tab === "configuracion" && "Configuración VJ"}
            {tab === "usuarios" && "Usuarios VJ"}
          </h2>

          <div className="flex items-center gap-6">
            {mostrarSelector && (
              <div className="flex items-center bg-indigo-950/60 p-0.5 rounded-xl border border-indigo-500/20 mr-2 shadow-inner">
                {tieneCFP && (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold text-indigo-300 hover:text-white transition-all hover:bg-white/5 active:scale-95"
                  >
                    CFP
                  </button>
                )}
                {tieneTerciario && (
                  <button
                    onClick={() => navigate('/admin-terciario')}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold text-indigo-300 hover:text-white transition-all hover:bg-white/5 active:scale-95"
                  >
                    Terciario
                  </button>
                )}
                {tieneVJ && (
                  <button
                    className="px-4 py-1.5 rounded-lg text-xs font-black bg-[#00ccff]/25 text-[#00ccff] border border-[#00ccff]/30 shadow-lg shadow-[#00ccff]/10 transition-all cursor-default"
                  >
                    VJ
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center gap-4">
              {/* User details */}
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-semibold text-white">
                  {user?.username || 'Usuario'}
                </span>
                <span className="text-[10px] font-black text-[#00ccff] uppercase tracking-wider">
                  {user?.groups?.[0] || 'Coordinador'}
                </span>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#00ccff] to-[#FF6600] flex items-center justify-center text-[#050814] font-black shadow-lg">
                {(user?.username || 'C').charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Standalone Tab Content Body */}
        <main className="flex-grow overflow-auto p-8 relative z-10">
          {actionError && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-semibold flex items-center gap-2">
              <ShieldAlert size={16} /> {actionError}
            </div>
          )}

          {/* DASHBOARD TAB CONTENT */}
          {tab === "dashboard" && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-32 text-indigo-300 font-bold uppercase tracking-wider space-y-4">
                  <div className="animate-spin text-[#00ccff]"><Gamepad2 size={40} /></div>
                  <p className="text-xs">Cargando estadísticas del panel...</p>
                </div>
              ) : (
                <>
                  {/* Stats Cards Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <StatCard label="Total Inscriptos" value={stats.total} icon={<Users size={20} />} glowClass="hover:shadow-[0_0_20px_rgba(0,255,255,0.05)] transition-shadow" />
                    <StatCard label="Pendientes" value={stats.pendiente} icon={<Clock size={20} />} glowClass="hover:shadow-[0_0_20px_rgba(245,158,11,0.05)] border-amber-500/10" />
                    <StatCard label="Aprobados" value={stats.aprobado} icon={<CheckCircle2 size={20} />} glowClass="hover:shadow-[0_0_20px_rgba(16,185,129,0.05)] border-emerald-500/10" />
                    <StatCard label="Rechazados" value={stats.rechazado} icon={<XCircle size={20} />} glowClass="hover:shadow-[0_0_20px_rgba(244,63,94,0.05)] border-rose-500/10" />
                  </div>

                  {/* Breakdown details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* PC/Internet Resources */}
                    <div className="bg-[#0c122c]/40 border border-indigo-500/10 backdrop-blur-xl rounded-[2rem] p-6 space-y-4 shadow-xl">
                      <h3 className="font-black text-white text-sm uppercase tracking-widest border-b border-indigo-500/10 pb-3 flex items-center gap-2">
                        <Laptop size={16} className="text-[#00ccff]" /> Recursos de Alumnos
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-indigo-200">Poseen Computadora (PC)</span>
                          <span className="text-sm font-black text-white">{stats.conPC} / {stats.total}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-indigo-950">
                          <div className="h-2 rounded-full bg-gradient-to-r from-[#00ccff] to-cyan-500" style={{ width: `${stats.total > 0 ? (stats.conPC / stats.total) * 100 : 0}%` }} />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <span className="text-sm text-indigo-200">Tienen Acceso a Internet</span>
                          <span className="text-sm font-black text-white">{stats.conInternet} / {stats.total}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-indigo-950">
                          <div className="h-2 rounded-full bg-gradient-to-r from-[#00ccff] to-cyan-500" style={{ width: `${stats.total > 0 ? (stats.conInternet / stats.total) * 100 : 0}%` }} />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <span className="text-sm text-indigo-200">Trabajan Actualmente</span>
                          <span className="text-sm font-black text-white">{stats.trabaja} / {stats.total}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-indigo-950">
                          <div className="h-2 rounded-full bg-gradient-to-r from-[#FF6600] to-orange-500" style={{ width: `${stats.total > 0 ? (stats.trabaja / stats.total) * 100 : 0}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Breakdown by City / minors */}
                    <div className="bg-[#0c122c]/40 border border-indigo-500/10 backdrop-blur-xl rounded-[2rem] p-6 space-y-4 shadow-xl">
                      <h3 className="font-black text-white text-sm uppercase tracking-widest border-b border-indigo-500/10 pb-3 flex items-center gap-2">
                        <MapPin size={16} className="text-[#FF6600]" /> Distribución Geográfica y Edad
                      </h3>
                      <div className="space-y-4">
                        {stats.porCiudad.map((c, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="text-indigo-200">{c.label}</span>
                            <span className="font-black text-white">{c.value}</span>
                          </div>
                        ))}

                        <div className="pt-3 border-t border-indigo-500/10 grid grid-cols-2 gap-4">
                          <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/5 text-center">
                            <p className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">Menores de edad</p>
                            <p className="text-xl font-black text-white mt-1">{stats.menores}</p>
                          </div>
                          <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/5 text-center">
                            <p className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">Adultos</p>
                            <p className="text-xl font-black text-white mt-1">{stats.mayores}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TABLE TAB CONTENT */}
          {tab === "preinscripciones" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                <div className="relative flex-grow">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar aspirante por nombre, DNI o email..."
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#0c122c]/50 border border-indigo-500/10 backdrop-blur-xl text-white placeholder-indigo-400 text-sm font-semibold focus:border-[#00ccff]/70 focus:ring-1 focus:ring-[#00ccff]/20 focus:outline-none transition-all"
                  />
                </div>
                <div className="flex-shrink-0">
                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="w-full sm:w-48 px-4 py-3.5 rounded-2xl bg-[#0c122c]/50 border border-indigo-500/10 backdrop-blur-xl text-white text-sm font-bold focus:border-[#00ccff]/70 focus:outline-none transition-all"
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
              <div className="bg-[#0c122c]/20 border border-indigo-500/10 backdrop-blur-xl shadow-2xl rounded-[2rem] overflow-hidden">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-24 text-indigo-300 font-bold uppercase tracking-wider space-y-4">
                    <div className="animate-spin text-[#00ccff]"><Gamepad2 size={40} /></div>
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
                                    <Laptop size={15} className={p.posee_pc ? "text-[#00ccff]" : "text-indigo-950"} />
                                    <span className="text-[9px] font-bold text-indigo-400 mt-1 uppercase">PC</span>
                                  </div>
                                  <div className="flex flex-col items-center">
                                    <Wifi size={15} className={p.posee_conectividad ? "text-[#00ccff]" : "text-indigo-950"} />
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
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500/10 hover:bg-[#00ccff] hover:text-[#050814] text-[#00ccff] text-xs font-black uppercase tracking-wider transition-all duration-300 active:scale-95 border border-[#00ccff]/20 hover:shadow-[0_0_15px_rgba(0,255,255,0.3)]"
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
            </div>
          )}

          {/* ALUMNOS TAB CONTENT */}
          {tab === "alumnos" && (
            <AlumnosTab />
          )}

          {/* CONFIG TAB CONTENT */}
          {tab === "configuracion" && (
            <ConfigTab />
          )}

          {/* USUARIOS TAB CONTENT */}
          {tab === "usuarios" && esAdmin && (
            <UsuariosTab />
          )}
        </main>
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
