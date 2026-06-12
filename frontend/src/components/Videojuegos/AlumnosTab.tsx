import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Eye,
  X,
  Pencil,
  Save,
  Laptop,
  Wifi,
  Smartphone,
  FileText,
  ShieldAlert,
  Download,
  Calendar,
  MapPin,
  Check,
  Briefcase,
  Users,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  Gamepad2
} from "lucide-react";
import { apiClientV2 } from "../../api/client";
import { getMediaUrl } from "../../utils/media";
import { EstudianteDetail, Inscripcion, Cohorte, Programa } from "../../api/types";
import { AlumnoDetailModal } from "./AlumnoDetailModal";
import { EditAlumnoModal } from "./EditAlumnoModal";
import { AlumnosTable } from "./AlumnosTable";
import { AlumnosFilters } from "./AlumnosFilters";

export const ESTADOS_ALUMNO = [
  { value: "", label: "Todos los Estados" },
  { value: "Regular", label: "Regular" },
  { value: "Baja", label: "Baja" },
  { value: "Egresado", label: "Egresado" },
  { value: "Libre", label: "Libre" },
];

export interface ExtendedInscripcion extends Omit<Inscripcion, 'cohorte'> {
  cohorte?: Cohorte & {
    programa?: Programa;
    bloque_fechas?: { id: number; nombre: string; descripcion?: string | null };
    bloque?: { id: number; nombre: string };
  };
}

export interface VideojuegosAlumnoDetail extends EstudianteDetail {
  inscripciones?: ExtendedInscripcion[];
}

export interface YesNoIconProps {
  value?: boolean | null;
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
  value?: string | number | null;
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
      className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 border hover:scale-[1.01] ${colorClass}`}
    >
      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
        <FileText size={16} /> {label}
      </span>
      <Download size={14} />
    </a>
  );
}



interface OfertaItem {
  bloques?: {
    cohorte_id?: number;
    cohorte_nombre?: string;
  }[];
}

interface OfertaResponse {
  items?: OfertaItem[];
}

export default function AlumnosTab() {
  const [data, setData] = useState<VideojuegosAlumnoDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [filtroEstado, setFiltroEstado] = useState<string>("");
  const [filtroCohorte, setFiltroCohorte] = useState<string>("");
  const [cohortes, setCohortes] = useState<{ id: number; nombre: string }[]>([]);
  const [selected, setSelected] = useState<VideojuegosAlumnoDetail | null>(null);
  const [editStudent, setEditStudent] = useState<VideojuegosAlumnoDetail | null>(null);

  const fetchAlumnos = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await apiClientV2.get<VideojuegosAlumnoDetail[]>("/videojuegos/alumnos");
      setData(Array.isArray(res) ? res : []);
    } catch (err: unknown) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlumnos();
    
    // Cargar cohortes para el filtro
    apiClientV2.get<OfertaResponse>("/preinscripcion/oferta", { params: { programa_codigo: "VJ" } })
      .then(({ data: res }) => {
        const prog = res?.items?.[0] || null;
        if (prog) {
          const list: { id: number; nombre: string }[] = [];
          const seen = new Set<number>();
          (prog.bloques || []).forEach(b => {
            if (b.cohorte_id && !seen.has(b.cohorte_id)) {
              seen.add(b.cohorte_id);
              list.push({ id: b.cohorte_id, nombre: b.cohorte_nombre || "" });
            }
          });
          setCohortes(list);
        }
      }).catch(err => console.error(err));
  }, [fetchAlumnos]);

  const filtered = useMemo(() => {
    return data.filter((p) => {
      if (p.estatus === "Preinscripto") return false;
      if (filtroEstado && p.estatus !== filtroEstado) return false;
      if (filtroCohorte) {
        const insCohortes = (p.inscripciones || []).map(i => i.cohorte_id);
        if (!insCohortes.includes(parseInt(filtroCohorte))) return false;
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
  }, [data, search, filtroEstado, filtroCohorte]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Search and Filters */}
      <AlumnosFilters
        search={search}
        onSearchChange={setSearch}
        filtroEstado={filtroEstado}
        onFiltroEstadoChange={setFiltroEstado}
        filtroCohorte={filtroCohorte}
        onFiltroCohorteChange={setFiltroCohorte}
        cohortes={cohortes}
      />

      {/* Main Table */}
      <AlumnosTable
        rows={filtered}
        isLoading={loading}
        onView={setSelected}
      />

      {/* Detail Modal */}
      {selected && (
        <AlumnoDetailModal
          student={selected}
          onClose={() => setSelected(null)}
          onEdit={() => {
            setEditStudent(selected);
            setSelected(null);
          }}
        />
      )}

      {/* Edit Modal */}
      {editStudent && (
        <EditAlumnoModal
          student={editStudent}
          onClose={() => setEditStudent(null)}
          onSave={() => {
            fetchAlumnos();
            setEditStudent(null);
          }}
        />
      )}
    </div>
  );
}
