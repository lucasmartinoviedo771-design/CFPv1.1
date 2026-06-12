import React, { useState, useEffect, useCallback, useMemo, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  Settings,
  ClipboardList,
  CheckSquare
} from "lucide-react";

import AlumnosTab from "../components/Videojuegos/AlumnosTab";
import ConfigTab from "../components/Videojuegos/ConfigTab";
import UsuariosTab from "../components/Videojuegos/UsuariosTab";
import InscripcionesTab from "../components/Videojuegos/InscripcionesTab";
import AsistenciaTab from "../components/Videojuegos/AsistenciaTab";
import CalificacionesTab from "../components/Videojuegos/CalificacionesTab";
import type { UserDetails } from "../api/types";
import { PreinscripcionesVJDetailModal } from "../components/Videojuegos/PreinscripcionesVJDetailModal";
import { PreinscripcionesVJTable } from "../components/Videojuegos/PreinscripcionesVJTable";
import { PreinscripcionesVJFilters } from "../components/Videojuegos/PreinscripcionesVJFilters";

// States mapping
const ESTADOS = [
  { value: "", label: "Todos los Estados" },
  { value: "pendiente", label: "Pendiente" },
  { value: "aprobado", label: "Aprobado" },
  { value: "rechazado", label: "Rechazado" },
];

const BADGE_CLASSES: Record<string, string> = {
  pendiente: "border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]",
  aprobado: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
  rechazado: "border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.1)]",
};

const BADGE_ICONS: Record<string, React.ReactNode> = {
  pendiente: <Clock size={12} className="animate-pulse" />,
  aprobado: <CheckCircle2 size={12} />,
  rechazado: <XCircle size={12} />,
};

export interface StateBadgeProps {
  estado: string;
}

export function StateBadge({ estado }: StateBadgeProps) {
  const norm = estado?.toLowerCase() || "pendiente";
  const label = norm === "aprobado" ? "Aprobado" : norm === "rechazado" ? "Rechazado" : "Pendiente";
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black uppercase tracking-wider ${BADGE_CLASSES[norm] || BADGE_CLASSES.pendiente}`}>
      {BADGE_ICONS[norm] || BADGE_ICONS.pendiente}
      {label}
    </span>
  );
}

export interface YesNoIconProps {
  value?: boolean;
  trueIcon: React.ReactNode;
  falseIcon: React.ReactNode;
}

export function YesNoIcon({ value, trueIcon, falseIcon }: YesNoIconProps) {
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

export interface DetailRowProps {
  label: string;
  value?: string | null;
  icon?: React.ReactNode;
}

export function DetailRow({ label, value, icon }: DetailRowProps) {
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

export interface DocumentLinkProps {
  url?: string | null;
  label: string;
  colorClass: string;
}

export function DocumentLink({ url, label, colorClass }: DocumentLinkProps) {
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

export interface PreinscripcionVJ {
  id: number;
  apellido: string;
  nombre: string;
  dni: string;
  email: string;
  sexo?: string | null;
  fecha_nacimiento?: string | null;
  nacionalidad?: string | null;
  lugar_nacimiento?: string | null;
  cuit?: string | null;
  nivel_educativo?: string | null;
  telefono?: string | null;
  ciudad?: string | null;
  barrio?: string | null;
  domicilio?: string | null;
  posee_pc?: boolean;
  posee_conectividad?: boolean;
  trabaja?: boolean;
  lugar_trabajo?: string | null;
  tutor_nombre?: string | null;
  tutor_dni?: string | null;
  tutor_telefono?: string | null;
  autorizacion_status?: string | null;
  dni_digitalizado?: string | null;
  titulo_secundario_digitalizado?: string | null;
  dni_tutor_digitalizado?: string | null;
  nota_parental_firmada?: string | null;
  estado_vj: string;
  bloques_vj?: string[];
}



interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  glowClass?: string;
}

function StatCard({ label, value, icon, glowClass }: StatCardProps) {
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

interface GeograficCity {
  label: string;
  value: number;
}

interface VideojuegosStats {
  total: number;
  pendiente: number;
  aprobado: number;
  rechazado: number;
  conPC: number;
  conInternet: number;
  trabaja: number;
  porCiudad: GeograficCity[];
  menores: number;
  mayores: number;
}

export default function GestionPreinscripcionesVideojuegos() {
  const navigate = useNavigate();
  const { user } = useContext(UserContext) as { user: UserDetails | null };
  const { mode, toggleMode } = useContext(ThemeModeContext) as { mode: 'light' | 'dark'; toggleMode: () => void };
  
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tab = queryParams.get("tab") || "dashboard";
  const setTab = (newTab: string) => {
    navigate(`/admin-videojuegos?tab=${newTab}`);
  };
  const [data, setData] = useState<PreinscripcionVJ[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [selected, setSelected] = useState<PreinscripcionVJ | null>(null);
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
      const { data: res } = await apiClientV2.get<PreinscripcionVJ[]>("/videojuegos/preinscripciones");
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
  const stats = useMemo<VideojuegosStats>(() => {
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
    <div className={`min-h-screen flex font-sans selection:bg-[#00ccff]/30 relative overflow-hidden ${mode === 'light' ? 'app-shell theme-light' : 'bg-[#050814] text-white'}`}>
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
            onClick={() => setTab("inscripciones")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
              tab === "inscripciones"
                ? "bg-gradient-to-r from-[#00ccff]/20 to-[#FF6600]/20 text-[#00ccff] border border-[#00ccff]/30 shadow-[0_0_15px_rgba(0,255,255,0.1)]"
                : "text-indigo-300 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <FileText size={16} />
            <span>Inscripciones VJ</span>
            {tab === "inscripciones" && <ChevronRight size={14} className="ml-auto text-[#00ccff]" />}
          </button>

          <button
            onClick={() => setTab("asistencia")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
              tab === "asistencia"
                ? "bg-gradient-to-r from-[#00ccff]/20 to-[#FF6600]/20 text-[#00ccff] border border-[#00ccff]/30 shadow-[0_0_15px_rgba(0,255,255,0.1)]"
                : "text-indigo-300 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <CheckSquare size={16} />
            <span>Asistencia VJ</span>
            {tab === "asistencia" && <ChevronRight size={14} className="ml-auto text-[#00ccff]" />}
          </button>

          <button
            onClick={() => setTab("calificaciones")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
              tab === "calificaciones"
                ? "bg-gradient-to-r from-[#00ccff]/20 to-[#FF6600]/20 text-[#00ccff] border border-[#00ccff]/30 shadow-[0_0_15px_rgba(0,255,255,0.1)]"
                : "text-indigo-300 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <ClipboardList size={16} />
            <span>Calificaciones VJ</span>
            {tab === "calificaciones" && <ChevronRight size={14} className="ml-auto text-[#00ccff]" />}
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
              {tab === "inscripciones" && <FileText size={18} />}
              {tab === "asistencia" && <CheckSquare size={18} />}
              {tab === "calificaciones" && <ClipboardList size={18} />}
              {tab === "configuracion" && <Settings size={18} />}
              {tab === "usuarios" && <KeyRound size={18} />}
            </span>
            {tab === "dashboard" && "Estadísticas"}
            {tab === "preinscripciones" && "Preinscripciones VJ"}
            {tab === "alumnos" && "Alumnos VJ"}
            {tab === "inscripciones" && "Inscripciones VJ"}
            {tab === "asistencia" && "Asistencia VJ"}
            {tab === "calificaciones" && "Calificaciones VJ"}
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

              {/* Theme toggle */}
              <button
                onClick={toggleMode}
                className="p-2 text-indigo-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                title={mode === 'dark' ? 'Cambiar a vista clara' : 'Cambiar a vista oscura'}
              >
                {mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* Change Password */}
              <button
                onClick={() => navigate('/set-password')}
                className="p-2 text-indigo-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                title="Cambiar contraseña"
              >
                <KeyRound size={20} />
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 text-red-400 hover:text-red-200 hover:bg-red-500/10 rounded-full transition-colors"
                title="Cerrar Sessión"
              >
                <LogOut size={20} />
              </button>

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
              <PreinscripcionesVJFilters
                search={search}
                onSearchChange={setSearch}
                filtroEstado={filtroEstado}
                onFiltroEstadoChange={setFiltroEstado}
                estados={ESTADOS}
              />

              {/* Main Table */}
              <PreinscripcionesVJTable
                rows={filtered}
                isLoading={loading}
                onView={setSelected}
              />
            </div>
          )}

          {/* INSCRIPCIONES TAB CONTENT */}
          {tab === "inscripciones" && (
            <InscripcionesTab />
          )}

          {/* ASISTENCIA TAB CONTENT */}
          {tab === "asistencia" && (
            <AsistenciaTab />
          )}

          {/* CALIFICACIONES TAB CONTENT */}
          {tab === "calificaciones" && (
            <CalificacionesTab />
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
        <PreinscripcionesVJDetailModal
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
