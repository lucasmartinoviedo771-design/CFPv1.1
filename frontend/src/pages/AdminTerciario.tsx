import React, { useState, useEffect, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext, ThemeModeContext } from "../App";
import authService from "../services/authService";
import { apiClientV2 } from "../api/client";
import { PreinscripcionTerciario } from "../api/types";

import {
  Search, Eye, LogOut, Users, BookCheck, MapPin, 
  BarChart3, CalendarDays, ChevronRight, Settings, 
  UserCog, CheckCircle2, Clock, ExternalLink,
  Sun, Moon, KeyRound
} from "lucide-react";

import { P, StatCard, Badge } from "../components/AdminTerciario/AdminUI";
import { DetailModal } from "../components/AdminTerciario/DetailModal";
import { CohortePanel } from "../components/AdminTerciario/CohortePanel";
import { AlumnosPanel } from "../components/AdminTerciario/AlumnosPanel";
import { ConfiguracionPanel } from "../components/AdminTerciario/ConfiguracionPanel";
import { UsuariosPanel } from "../components/AdminTerciario/UsuariosPanel";

interface LocalidadStat {
  localidad: string;
  total: number;
}

interface TerciarioStats {
  total: number;
  pendiente: number;
  aprobada: number;
  con_hd?: number;
  por_localidad?: LocalidadStat[];
  con_discapacidad?: number;
  pueblo_originario?: number;
  rechazada?: number;
}

const ESTADOS_FILTER = [
  { value: "", label: "Todos los estados" },
  { value: "pendiente", label: "Pendientes" },
  { value: "aprobada", label: "Aprobadas" },
  { value: "rechazada", label: "Rechazadas" },
];

const LOCALIDAD_LABELS: Record<string, string> = {
  ushuaia: "Ushuaia", rg_sur: "Río Grande Sur", rg_norte: "Río Grande Norte",
  tolhuin: "Tolhuin", zona_rural: "Zona Rural", otras: "Otras",
};

const SECUNDARIA_LABELS: Record<string, string> = { si: "Sí", no: "No", cursando: "Cursando" };
const HD_ESTADO_LABELS: Record<string, string> = { CURSANDO: "Cursando", APROBADO: "Aprobado", DESAPROBADO: "Desaprobado", INACTIVO: "Inactivo" };
const HD_ESTADO_COLORS: Record<string, string> = {
  CURSANDO: "bg-blue-100 text-blue-800", APROBADO: "bg-green-100 text-green-800",
  DESAPROBADO: "bg-red-100 text-red-800", INACTIVO: "bg-gray-100 text-gray-600",
};

const NAV_ITEMS = [
  { key: "dashboard", icon: BarChart3, label: "Dashboard" },
  { key: "preinscripciones", icon: Users, label: "Preinscripciones" },
  { key: "cohorte", icon: CalendarDays, label: "Cohorte HD" },
  { key: "alumnos", icon: Users, label: "Alumnos" },
  { key: "usuarios", icon: UserCog, label: "Usuarios" },
  { key: "configuracion", icon: Settings, label: "Configuración" },
];

const GRUPOS_CFP = ["Admin", "Secretaría", "Regencia", "Coordinación Docente", "Docente", "Preceptor", "Bedel", "Rector"];
const GRUPOS_TERCIARIO = ["Admin", "Terciario", "Rector"];

export default function AdminTerciario() {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const { mode, toggleMode } = useContext(ThemeModeContext);
  const [tab, setTab] = useState<string>("dashboard");
  const [stats, setStats] = useState<TerciarioStats | null>(null);
  const [data, setData] = useState<PreinscripcionTerciario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [filtroEstado, setFiltroEstado] = useState<string>("pendiente");
  const [selected, setSelected] = useState<PreinscripcionTerciario | null>(null);

  const tieneCFP = user && (user.is_superuser || user.is_staff || user.groups?.some(g => GRUPOS_CFP.includes(g)));
  const tieneTerciario = user && (user.is_superuser || user.is_staff || user.groups?.some(g => GRUPOS_TERCIARIO.includes(g)));
  const tieneVJ = user && (user.is_superuser || user.is_staff || user.groups?.some(g => ['Admin', 'Secretaría', 'Regencia', 'Coordinación Docente', 'Docente', 'Preceptor', 'Bedel', 'Rector', 'Videojuegos'].includes(g)));

  let areas = 0;
  if (tieneCFP) areas++;
  if (tieneTerciario) areas++;
  if (tieneVJ) areas++;
  const mostrarSelector = areas > 1;

  const fetchStats = useCallback(async () => {
    try {
      const { data: s } = await apiClientV2.get<TerciarioStats>("/preinscripciones-terciario-stats");
      setStats(s);
    } catch {}
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filtroEstado) params.estado = filtroEstado;
      const { data: res } = await apiClientV2.get<PreinscripcionTerciario[]>("/preinscripciones-terciario", { params });
      setData(Array.isArray(res) ? res : []);
    } catch { 
      setData([]); 
    } finally { 
      setLoading(false); 
    }
  }, [filtroEstado]);

  useEffect(() => { 
    fetchStats(); 
    fetchData(); 
  }, [fetchStats, fetchData]);

  const filtered = data.filter((p) => {
    const q = search.toLowerCase();
    return p.apellido_nombre?.toLowerCase().includes(q) || p.dni?.includes(q) || p.email?.toLowerCase().includes(q);
  });

  const handleLogout = async () => {
    await authService.logout();
    navigate("/login");
  };

  return (
    <div className={`min-h-screen flex ${mode === 'dark' ? 'theme-dark' : 'bg-[#eef2f7] text-[#1a1f4e]'}`}>
      <aside style={{ background: P.navy }} className="flex flex-col w-64 flex-shrink-0 min-h-screen shadow-xl">
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

        <div className="px-3 pb-4">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-white/40 hover:text-white hover:bg-white/8 text-sm font-semibold transition-all">
            <LogOut size={16} /> Salir
          </button>
        </div>
      </aside>

      <div className="flex-grow flex flex-col min-h-screen overflow-hidden">
        <header className="bg-white border-b border-[#b8ccd8]/50 h-16 flex items-center justify-between px-8 z-20 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-black text-[#1a1f4e]/40 uppercase tracking-widest">
            <span>Tecnicatura en Ciencia de Datos e IA</span>
          </div>

          <div className="flex items-center gap-6">
            {mostrarSelector && (
              <div className="flex items-center bg-[#1a1f4e]/5 p-0.5 rounded-xl border border-[#1a1f4e]/10 mr-2 shadow-inner">
                {tieneCFP && (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold text-[#1a1f4e]/60 hover:text-[#1a1f4e] transition-all hover:bg-[#1a1f4e]/5 active:scale-95"
                  >
                    CFP
                  </button>
                )}
                {tieneTerciario && (
                  <button
                    className="px-4 py-1.5 rounded-lg text-xs font-black bg-[#1a1f4e] text-[#f5c518] shadow-lg shadow-[#1a1f4e]/20 transition-all cursor-default"
                  >
                    Terciario
                  </button>
                )}
                {tieneVJ && (
                  <button
                    onClick={() => navigate('/admin-videojuegos')}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold text-[#1a1f4e]/60 hover:text-[#1a1f4e] transition-all hover:bg-[#1a1f4e]/5 active:scale-95"
                  >
                    VJ
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold text-[#1a1f4e]">
                  {user?.username || 'Usuario'}
                </span>
                <span className="text-[10px] font-bold text-[#1a1f4e]/40 uppercase">
                  {user?.groups?.[0] || 'Terciario'}
                </span>
              </div>

              {/* Theme toggle */}
              <button
                onClick={toggleMode}
                className="p-2 text-[#1a1f4e]/60 hover:text-[#1a1f4e] hover:bg-[#1a1f4e]/5 rounded-full transition-colors"
                title={mode === 'dark' ? 'Cambiar a vista clara' : 'Cambiar a vista oscura'}
              >
                {mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* Change Password */}
              <button
                onClick={() => navigate('/set-password')}
                className="p-2 text-[#1a1f4e]/60 hover:text-[#1a1f4e] hover:bg-[#1a1f4e]/5 rounded-full transition-colors"
                title="Cambiar contraseña"
              >
                <KeyRound size={20} />
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-500/10 rounded-full transition-colors"
                title="Cerrar Sessión"
              >
                <LogOut size={20} />
              </button>

              <div className="h-9 w-9 rounded-xl flex items-center justify-center font-bold text-white shadow-sm transition-all"
                style={{ background: P.navy }}>
                {(user?.username || 'U').charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow overflow-auto p-8 bg-[#eef2f7]">
        {tab === "dashboard" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h1 className="text-2xl font-black text-[#1a1f4e]">Dashboard</h1>
            {stats ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Total preinscriptos" value={stats.total} icon={<Users />} color={P.navy} />
                  <StatCard label="Pendientes" value={stats.pendiente} icon={<Clock />} color="#d97706" />
                  <StatCard label="Aprobados" value={stats.aprobada} icon={<CheckCircle2 />} color="#16a34a" />
                  <StatCard label="Con HD Módulo 2" value={stats.con_hd || 0} icon={<BookCheck />} color="#7c3aed" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#b8ccd8]/50">
                    <h3 className="font-black text-[#1a1f4e] text-sm mb-3 flex items-center gap-2"><MapPin size={15} /> Por Localidad</h3>
                    <div className="space-y-2">
                      {(stats.por_localidad || []).map((l) => (
                        <div key={l.localidad} className="flex items-center justify-between">
                          <span className="text-sm text-[#1a1f4e]/70">{LOCALIDAD_LABELS[l.localidad || ''] || l.localidad}</span>
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
                        <span className="font-bold text-[#1a1f4e]">{stats.con_discapacidad || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#1a1f4e]/70">Pueblo originario</span>
                        <span className="font-bold text-[#1a1f4e]">{stats.pueblo_originario || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#1a1f4e]/70">Rechazados</span>
                        <span className="font-bold text-red-600">{stats.rechazada || 0}</span>
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
                        <td className="px-4 py-3 text-[#1a1f4e]/70">{LOCALIDAD_LABELS[p.localidad || ''] || p.localidad}</td>
                        <td className="px-4 py-3 text-[#1a1f4e]/70">{SECUNDARIA_LABELS[p.finalizo_secundaria || ''] || p.finalizo_secundaria}</td>
                        <td className="px-4 py-3">
                          {p.hd_estado ? (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${HD_ESTADO_COLORS[p.hd_estado || ''] || "bg-gray-100"}`}>
                              {HD_ESTADO_LABELS[p.hd_estado || ''] || p.hd_estado}
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

        {tab === "cohorte" && <CohortePanel onGoConfig={() => setTab("configuracion")} />}
        {tab === "alumnos" && <AlumnosPanel />}
        {tab === "usuarios" && <UsuariosPanel />}
        {tab === "configuracion" && <ConfiguracionPanel />}
      </main>
      </div>

      {selected && (
        <DetailModal p={selected} onClose={() => setSelected(null)} onSaved={() => { fetchData(); fetchStats(); setSelected(null); }} />
      )}
    </div>
  );
}
