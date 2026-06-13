import React from "react";
import { Gamepad2, Users, Clock, CheckCircle2, XCircle, Laptop, MapPin } from "lucide-react";
import { StatCard } from "./PreinscripcionesVJHelpers";

export interface GeograficCity {
  label: string;
  value: number;
}

export interface VideojuegosStats {
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

export interface PreinscripcionesVJDashboardTabProps {
  loading: boolean;
  stats: VideojuegosStats;
}

export default function PreinscripcionesVJDashboardTab({
  loading,
  stats,
}: PreinscripcionesVJDashboardTabProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-indigo-300 font-bold uppercase tracking-wider space-y-4">
          <div className="animate-spin text-[#00ccff]">
            <Gamepad2 size={40} />
          </div>
          <p className="text-xs">Cargando estadísticas del panel...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard
              label="Total Inscriptos"
              value={stats.total}
              icon={<Users size={20} />}
              glowClass="hover:shadow-[0_0_20px_rgba(0,255,255,0.05)] transition-shadow"
            />
            <StatCard
              label="Pendientes"
              value={stats.pendiente}
              icon={<Clock size={20} />}
              glowClass="hover:shadow-[0_0_20px_rgba(245,158,11,0.05)] border-amber-500/10"
            />
            <StatCard
              label="Aprobados"
              value={stats.aprobado}
              icon={<CheckCircle2 size={20} />}
              glowClass="hover:shadow-[0_0_20px_rgba(16,185,129,0.05)] border-emerald-500/10"
            />
            <StatCard
              label="Rechazados"
              value={stats.rechazado}
              icon={<XCircle size={20} />}
              glowClass="hover:shadow-[0_0_20px_rgba(244,63,94,0.05)] border-rose-500/10"
            />
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
                  <span className="text-sm font-black text-white">
                    {stats.conPC} / {stats.total}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-indigo-950">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-[#00ccff] to-cyan-500"
                    style={{ width: `${stats.total > 0 ? (stats.conPC / stats.total) * 100 : 0}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-indigo-200">Tienen Acceso a Internet</span>
                  <span className="text-sm font-black text-white">
                    {stats.conInternet} / {stats.total}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-indigo-950">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-[#00ccff] to-cyan-500"
                    style={{ width: `${stats.total > 0 ? (stats.conInternet / stats.total) * 100 : 0}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-indigo-200">Trabaja Actualmente</span>
                  <span className="text-sm font-black text-white">
                    {stats.trabaja} / {stats.total}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-indigo-950">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-[#FF6600] to-orange-500"
                    style={{ width: `${stats.total > 0 ? (stats.trabaja / stats.total) * 100 : 0}%` }}
                  />
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
                    <p className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">
                      Menores de edad
                    </p>
                    <p className="text-xl font-black text-white mt-1">{stats.menores}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/5 text-center">
                    <p className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">
                      Adultos
                    </p>
                    <p className="text-xl font-black text-white mt-1">{stats.mayores}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
