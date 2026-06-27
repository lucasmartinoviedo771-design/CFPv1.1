import React, { useState, useEffect, useCallback, useMemo, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiClientV2 } from "../api/client";
import authService from "../services/authService";
import { UserContext, ThemeModeContext } from "../App";
import {
  Users,
  Gamepad2,
  FileText,
  ShieldAlert,
  Sun,
  Moon,
  KeyRound,
  ExternalLink,
  Settings,
  ClipboardList,
  CheckSquare,
  BarChart3,
  LogOut,
  ChevronRight
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
import { PreinscripcionVJ } from "../components/Videojuegos/PreinscripcionesVJHelpers";
import PreinscripcionesVJDashboardTab, { VideojuegosStats } from "../components/Videojuegos/PreinscripcionesVJDashboardTab";

// States mapping
const ESTADOS = [
  { value: "", label: "Todos los Estados" },
  { value: "pendiente", label: "Pendiente" },
  { value: "aprobado", label: "Aprobado" },
  { value: "rechazado", label: "Rechazado" },
];

export type { PreinscripcionVJ };

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
  const tieneVJ = user && (user.is_superuser || user.is_staff || user.groups?.some(g => ['Admin', 'Secretaría', 'Regencia', 'Coordinación Docente', 'Docente', 'Preceptor', 'Bedel', 'Rector', 'Videojuegos'].includes(g)));

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
            <PreinscripcionesVJDashboardTab
              loading={loading}
              stats={stats}
            />
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
