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

const ESTADOS_ALUMNO = [
  { value: "", label: "Todos los Estados" },
  { value: "Regular", label: "Regular" },
  { value: "Baja", label: "Baja" },
  { value: "Egresado", label: "Egresado" },
  { value: "Libre", label: "Libre" },
];

interface ExtendedInscripcion extends Omit<Inscripcion, 'cohorte'> {
  cohorte?: Cohorte & {
    programa?: Programa;
    bloque_fechas?: { id: number; nombre: string; descripcion?: string | null };
    bloque?: { id: number; nombre: string };
  };
}

interface VideojuegosAlumnoDetail extends EstudianteDetail {
  inscripciones?: ExtendedInscripcion[];
}

interface YesNoIconProps {
  value?: boolean | null;
  trueIcon: React.ReactNode;
  falseIcon: React.ReactNode;
}

function YesNoIcon({ value, trueIcon, falseIcon }: YesNoIconProps) {
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

interface DetailRowProps {
  label: string;
  value?: string | number | null;
  icon?: React.ReactNode;
}

function DetailRow({ label, value, icon }: DetailRowProps) {
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

interface DocumentLinkProps {
  url?: string | null;
  label: string;
  colorClass: string;
}

function DocumentLink({ url, label, colorClass }: DocumentLinkProps) {
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

interface EditAlumnoModalProps {
  student: VideojuegosAlumnoDetail;
  onClose: () => void;
  onSave: () => void;
}

// Modal para editar datos personales del alumno
function EditAlumnoModal({ student, onClose, onSave }: EditAlumnoModalProps) {
  const [form, setForm] = useState<VideojuegosAlumnoDetail>({ ...student });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target;
    const name = target.name;
    const value = target.type === "checkbox" ? (target as HTMLInputElement).checked : target.value;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiClientV2.patch(`/videojuegos/alumnos/${student.id}`, form);
      onSave();
    } catch (err: unknown) {
      console.error(err);
      setError("Error al actualizar la ficha del alumno.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-start justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-[#0c122c] border border-indigo-500/20 rounded-[2.5rem] w-full max-w-2xl my-8 shadow-2xl relative overflow-hidden flex flex-col">
        <div className="p-6 border-b border-indigo-500/10 flex items-center justify-between">
          <h3 className="text-lg font-black text-white uppercase tracking-wider">Editar Ficha Académica</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-indigo-300 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-semibold flex items-center gap-2">
              <ShieldAlert size={16} /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-indigo-300">Apellido</label>
              <input name="apellido" value={form.apellido || ""} onChange={handleChange} required className="w-full rounded-xl px-4 py-2.5 bg-indigo-950/40 border border-indigo-500/25 text-white text-sm focus:border-brand-cyan/70 focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-indigo-300">Nombre</label>
              <input name="nombre" value={form.nombre || ""} onChange={handleChange} required className="w-full rounded-xl px-4 py-2.5 bg-indigo-950/40 border border-indigo-500/25 text-white text-sm focus:border-brand-cyan/70 focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-indigo-300">DNI</label>
              <input name="dni" value={form.dni || ""} onChange={handleChange} required className="w-full rounded-xl px-4 py-2.5 bg-indigo-950/40 border border-indigo-500/25 text-white text-sm focus:border-brand-cyan/70 focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-indigo-300">Email</label>
              <input type="email" name="email" value={form.email || ""} onChange={handleChange} required className="w-full rounded-xl px-4 py-2.5 bg-indigo-950/40 border border-indigo-500/25 text-white text-sm focus:border-brand-cyan/70 focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-indigo-300">Teléfono</label>
              <input name="telefono" value={form.telefono || ""} onChange={handleChange} className="w-full rounded-xl px-4 py-2.5 bg-indigo-950/40 border border-indigo-500/25 text-white text-sm focus:border-brand-cyan/70 focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-indigo-300">Estado Académico</label>
              <select name="estatus" value={form.estatus || ""} onChange={handleChange} className="w-full rounded-xl px-4 py-2.5 bg-indigo-950/40 border border-indigo-500/25 text-white text-sm focus:outline-none">
                {ESTADOS_ALUMNO.filter(e => e.value !== "").map(e => (
                  <option key={e.value} value={e.value} className="bg-[#0c122c]">{e.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-950/25 border border-indigo-500/10 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-brand-cyan">Recursos y Situación Laboral</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="posee_pc" checked={form.posee_pc || false} onChange={handleChange} className="w-4 h-4 rounded text-brand-cyan focus:ring-0 accent-brand-cyan" />
                <span className="text-xs font-bold text-indigo-200">Posee PC</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="posee_conectividad" checked={form.posee_conectividad || false} onChange={handleChange} className="w-4 h-4 rounded text-brand-cyan focus:ring-0 accent-brand-cyan" />
                <span className="text-xs font-bold text-indigo-200">Tiene Internet</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="trabaja" checked={form.trabaja || false} onChange={handleChange} className="w-4 h-4 rounded text-brand-cyan focus:ring-0 accent-brand-cyan" />
                <span className="text-xs font-bold text-indigo-200">Trabaja</span>
              </label>
            </div>
            {form.trabaja && (
              <div className="space-y-1 pt-2">
                <label className="text-[10px] font-black uppercase text-indigo-300">Lugar de Trabajo</label>
                <input name="lugar_trabajo" value={form.lugar_trabajo || ""} onChange={handleChange} className="w-full rounded-xl px-4 py-2 bg-indigo-950/40 border border-indigo-500/25 text-white text-sm focus:outline-none" />
              </div>
            )}
          </div>
        </form>

        <div className="p-6 border-t border-indigo-500/10 flex justify-end gap-3 bg-[#0a0d24]">
          <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest">
            Cancelar
          </button>
          <button type="button" onClick={submit} disabled={saving} className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-accent text-[#050814] font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all">
            <Save size={14} /> {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface AlumnoDetailModalProps {
  student: VideojuegosAlumnoDetail;
  onClose: () => void;
  onEdit: () => void;
}

// Modal Detalle del legajo del Alumno
function AlumnoDetailModal({ student, onClose, onEdit }: AlumnoDetailModalProps) {
  const edad = useMemo(() => {
    if (!student.fecha_nacimiento) return null;
    try {
      const nac = new Date(student.fecha_nacimiento);
      const hoy = new Date();
      let e = hoy.getFullYear() - nac.getFullYear();
      const m = hoy.getMonth() - nac.getMonth();
      if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) e--;
      return e;
    } catch { return null; }
  }, [student.fecha_nacimiento]);

  const esMenor = edad !== null && edad < 18;

  // Filtrar inscripciones del programa VJ
  const vjInscriptions = (student.inscripciones || []).filter(
    (ins) => ins.cohorte?.programa?.codigo === "VJ"
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-[#0c122c] border border-indigo-500/20 rounded-[2.5rem] w-full max-w-3xl my-8 shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="relative flex items-center justify-between p-8 border-b border-indigo-500/10">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-white">
                {student.apellido}, {student.nombre}
              </h2>
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                student.estatus === "Regular" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-indigo-950 text-indigo-300 border border-indigo-500/25"
              }`}>
                {student.estatus || "Preinscripto"}
              </span>
              {esMenor && (
                <span className="px-2 py-0.5 rounded-md bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-black uppercase">
                  Menor de Edad
                </span>
              )}
            </div>
            <p className="text-indigo-300 text-sm font-semibold mt-1">
              DNI: {student.dni} · {student.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="p-3 rounded-2xl bg-[#00ccff]/10 hover:bg-[#00ccff]/20 text-[#00ccff] hover:text-white transition-all border border-[#00ccff]/20 active:scale-95"
              title="Editar legajo"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-3 rounded-2xl hover:bg-white/5 text-indigo-300 hover:text-white transition-all border border-indigo-500/10"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-950">
          {/* Cursando (Inscripciones de VJ) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#00ccff] border-b border-indigo-500/10 pb-2 flex items-center gap-2">
              <Gamepad2 size={14} /> Legajo Académico Videojuegos
            </h3>
            <div className="space-y-2">
              {vjInscriptions.map((ins, idx) => {
                const bloqueNombre = ins.modulo?.bloque?.nombre || ins.cohorte?.bloque?.nombre || "General";
                const moduloNombre = ins.modulo?.nombre || "Trayecto Completo";
                return (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/10 text-xs">
                    <div>
                      <p className="font-bold text-white">{moduloNombre}</p>
                      <p className="text-[10px] text-indigo-300 uppercase mt-0.5">{bloqueNombre} · {ins.cohorte?.nombre}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded uppercase font-black tracking-wider text-[9px] ${
                      ins.estado === "CURSANDO" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-indigo-950 text-indigo-400 border border-indigo-500/10"
                    }`}>
                      {ins.estado}
                    </span>
                  </div>
                );
              })}
              {vjInscriptions.length === 0 && (
                <p className="text-sm text-indigo-400 italic">No registra inscripciones asociadas a VJ.</p>
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

            {/* Domicilio */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#00ccff] border-b border-indigo-500/10 pb-2 flex items-center gap-2">
                <Smartphone size={14} /> Contacto & Domicilio
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

          {/* Computadora */}
          <div className="p-6 rounded-[2rem] bg-indigo-950/20 border border-indigo-500/10 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#00ccff] flex items-center gap-2">
              <Laptop size={14} /> Equipamiento y Empleo
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-indigo-500/5">
                <span className="text-xs font-bold text-indigo-300">Posee PC</span>
                <YesNoIcon value={student.posee_pc} trueIcon={<Laptop size={14} />} falseIcon={<Laptop size={14} />} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-indigo-500/5">
                <span className="text-xs font-bold text-indigo-300">Conectividad</span>
                <YesNoIcon value={student.posee_conectividad} trueIcon={<Wifi size={14} />} falseIcon={<Wifi size={14} />} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-indigo-500/5">
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

          {/* Documentación */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#00ccff] border-b border-indigo-500/10 pb-2 flex items-center gap-2">
              <FileText size={14} /> Documentación Adjunta
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DocumentLink url={student.dni_digitalizado} label="DNI Digitalizado" colorClass="border-cyan-500/20 bg-cyan-500/5 text-cyan-300" />
              <DocumentLink url={student.titulo_secundario_digitalizado} label="Título Secundario" colorClass="border-emerald-500/20 bg-emerald-500/5 text-emerald-300" />
              {esMenor && <DocumentLink url={student.dni_tutor_digitalizado} label="DNI Tutor" colorClass="border-orange-500/20 bg-orange-500/5 text-orange-200" />}
              {student.nota_parental_firmada && <DocumentLink url={student.nota_parental_firmada} label="Nota Parental Firmada" colorClass="border-emerald-500/20 bg-emerald-500/5 text-emerald-300" />}
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-indigo-500/10 flex justify-end bg-[#0a0d24]">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest">
            Cerrar
          </button>
        </div>
      </div>
    </div>
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative flex-grow col-span-1 sm:col-span-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar alumno..."
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#0c122c]/50 border border-indigo-500/10 backdrop-blur-xl text-white placeholder-indigo-400 text-sm font-semibold focus:border-[#00ccff]/70 focus:outline-none transition-all"
          />
        </div>
        <div>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="w-full px-4 py-3.5 rounded-2xl bg-[#0c122c]/50 border border-indigo-500/10 backdrop-blur-xl text-white text-sm font-bold focus:border-[#00ccff]/70 focus:outline-none transition-all"
          >
            {ESTADOS_ALUMNO.map((e) => (
              <option key={e.value} value={e.value} className="bg-[#0c122c] text-white">
                {e.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={filtroCohorte}
            onChange={(e) => setFiltroCohorte(e.target.value)}
            className="w-full px-4 py-3.5 rounded-2xl bg-[#0c122c]/50 border border-indigo-500/10 backdrop-blur-xl text-white text-sm font-bold focus:border-[#00ccff]/70 focus:outline-none transition-all"
          >
            <option value="" className="bg-[#0c122c] text-white">Todas las Cohortes</option>
            {cohortes.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#0c122c] text-white">
                {c.nombre}
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
            <p className="text-xs">Cargando legajos de Alumnos...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-indigo-400 font-semibold text-sm">
            No se encontraron alumnos con los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-[#0c122c]/70 border-b border-indigo-500/10 text-indigo-300 text-xs font-black uppercase tracking-widest">
                  <th className="px-6 py-4.5">Alumno</th>
                  <th className="px-6 py-4.5">DNI / Contacto</th>
                  <th className="px-6 py-4.5 text-center">Recursos</th>
                  <th className="px-6 py-4.5">Estatus</th>
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
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-black uppercase tracking-wider ${
                          p.estatus === "Regular"
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                            : "border-indigo-500/20 bg-indigo-950 text-indigo-300"
                        }`}>
                          {p.estatus || "Preinscripto"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelected(p)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500/10 hover:bg-[#00ccff] hover:text-[#050814] text-[#00ccff] text-xs font-black uppercase tracking-wider transition-all duration-300 active:scale-95 border border-[#00ccff]/20 hover:shadow-[0_0_15px_rgba(0,255,255,0.3)]"
                        >
                          <Eye size={13} /> Legajo
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
