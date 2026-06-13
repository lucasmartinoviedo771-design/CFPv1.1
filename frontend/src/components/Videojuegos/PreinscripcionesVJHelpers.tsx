import React from "react";
import { Clock, CheckCircle2, XCircle, FileText, Download } from "lucide-react";
import { getMediaUrl } from "../../utils/media";

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

export interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  glowClass?: string;
}

export function StatCard({ label, value, icon, glowClass }: StatCardProps) {
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
