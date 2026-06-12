import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Search, Plus, Trash2, ShieldAlert, CheckCircle2, 
  Loader, X, Save, Edit2, Gamepad2, FileText, 
  HelpCircle 
} from "lucide-react";
import { apiClientV2 } from "../../api/client";

interface Alumno {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
}

interface Cohorte {
  id: number;
  nombre: string;
  programa_id: number;
  fecha_inicio: string;
  fecha_fin: string;
}

interface Modulo {
  id: number;
  nombre: string;
  bloque_id: number;
  bloque_nombre: string;
}

interface Inscripcion {
  id: number;
  estudiante: Alumno;
  cohorte: Cohorte;
  modulo: Modulo | null;
  estado: string;
  created_at: string;
}

export default function InscripcionesTab() {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [cohortes, setCohortes] = useState<Cohorte[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & Search
  const [search, setSearch] = useState("");
  const [filterCohorte, setFilterCohorte] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  
  // Add modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedCohorte, setSelectedCohorte] = useState("");
  const [selectedModulo, setSelectedModulo] = useState("");
  const [inscStatus, setInscStatus] = useState("CURSANDO");
  
  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingEstado, setEditingEstado] = useState("");
  
  // Actions feedback
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchInscripciones = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClientV2.get("/videojuegos/inscripciones");
      setInscripciones(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las inscripciones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInscripciones();
    
    // Load VJ students & VJ cohortes for forms
    apiClientV2.get("/videojuegos/alumnos").then(({ data }) => {
      setAlumnos(Array.isArray(data) ? data : []);
    }).catch(console.error);

    apiClientV2.get("/videojuegos/cohortes").then(({ data }) => {
      setCohortes(Array.isArray(data) ? data : []);
    }).catch(console.error);
  }, [fetchInscripciones]);

  // Load modules when cohorte changes
  useEffect(() => {
    if (!selectedCohorte) {
      setModulos([]);
      setSelectedModulo("");
      return;
    }
    apiClientV2.get("/videojuegos/modulos", { params: { cohorte_id: selectedCohorte } })
      .then(({ data }) => {
        setModulos(Array.isArray(data) ? data : []);
        setSelectedModulo("");
      }).catch(console.error);
  }, [selectedCohorte]);

  const filteredAlumnos = useMemo(() => {
    const q = studentSearch.toLowerCase().trim();
    if (!q) return alumnos;
    return alumnos.filter(s => 
      s.apellido.toLowerCase().includes(q) || 
      s.nombre.toLowerCase().includes(q) || 
      s.dni.includes(q)
    );
  }, [alumnos, studentSearch]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedCohorte) {
      setError("Por favor, selecciona un alumno y una cohorte.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await apiClientV2.post("/videojuegos/inscripciones", {
        estudiante_id: Number(selectedStudent),
        cohorte_id: Number(selectedCohorte),
        modulo_id: selectedModulo ? Number(selectedModulo) : null,
        estado: inscStatus
      });
      setSuccess("Inscripción registrada con éxito.");
      fetchInscripciones();
      setTimeout(() => {
        setIsAddOpen(false);
        setSelectedStudent("");
        setSelectedCohorte("");
        setSelectedModulo("");
        setStudentSearch("");
        setSuccess("");
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || "Ocurrió un error al registrar la inscripción.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEstado = async (id: number) => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await apiClientV2.patch(`/videojuegos/inscripciones/${id}`, {
        estado: editingEstado
      });
      setSuccess("Estado de inscripción actualizado.");
      setEditingId(null);
      fetchInscripciones();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      console.error(err);
      setError("Error al actualizar la inscripción.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta inscripción?")) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      await apiClientV2.delete(`/videojuegos/inscripciones/${id}`);
      setSuccess("Inscripción eliminada.");
      fetchInscripciones();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      console.error(err);
      setError("Error al eliminar la inscripción.");
    }
  };

  const filteredInscripciones = useMemo(() => {
    return inscripciones.filter((ins) => {
      if (filterCohorte && String(ins.cohorte?.id) !== filterCohorte) return false;
      if (filterEstado && ins.estado !== filterEstado) return false;
      
      const q = search.toLowerCase().trim();
      if (!q) return true;
      
      const fullname = `${ins.estudiante?.apellido || ""} ${ins.estudiante?.nombre || ""}`.toLowerCase();
      const dni = ins.estudiante?.dni || "";
      const email = ins.estudiante?.email?.toLowerCase() || "";
      const modulo = ins.modulo?.nombre?.toLowerCase() || "";
      
      return fullname.includes(q) || dni.includes(q) || email.includes(q) || modulo.includes(q);
    });
  }, [inscripciones, search, filterCohorte, filterEstado]);

  return (
    <div className="space-y-6">
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-grow max-w-3xl">
          <div className="relative flex-grow">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por alumno, DNI o módulo..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#0c122c]/50 border border-indigo-500/10 backdrop-blur-xl text-white placeholder-indigo-400 text-sm font-semibold focus:border-[#00ccff]/70 focus:ring-1 focus:ring-[#00ccff]/20 focus:outline-none transition-all"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterCohorte}
              onChange={(e) => setFilterCohorte(e.target.value)}
              className="px-4 py-3 rounded-2xl bg-[#0c122c]/50 border border-indigo-500/10 backdrop-blur-xl text-white text-sm font-bold focus:border-[#00ccff]/70 focus:outline-none transition-all"
            >
              <option value="" className="bg-[#0c122c] text-white">Todas las Cohortes</option>
              {cohortes.map(c => (
                <option key={c.id} value={c.id} className="bg-[#0c122c] text-white">{c.nombre}</option>
              ))}
            </select>

            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="px-4 py-3 rounded-2xl bg-[#0c122c]/50 border border-indigo-500/10 backdrop-blur-xl text-white text-sm font-bold focus:border-[#00ccff]/70 focus:outline-none transition-all"
            >
              <option value="" className="bg-[#0c122c] text-white">Todos los Estados</option>
              {["PREINSCRIPTO", "CURSANDO", "INACTIVO", "LIBRE", "PAUSADO", "EGRESADO", "APROBADO", "DESAPROBADO"].map(st => (
                <option key={st} value={st} className="bg-[#0c122c] text-white">{st}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex-shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-cyan to-brand-accent text-[#050814] font-black text-xs uppercase tracking-widest transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] hover:scale-[1.02] active:scale-95"
        >
          <Plus size={15} /> Registrar Inscripción
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-[#0c122c]/20 border border-indigo-500/10 backdrop-blur-xl shadow-2xl rounded-[2rem] overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-indigo-300 font-bold uppercase tracking-wider space-y-4">
            <div className="animate-spin text-[#00ccff]"><Gamepad2 size={40} /></div>
            <p className="text-xs">Cargando inscripciones...</p>
          </div>
        ) : filteredInscripciones.length === 0 ? (
          <div className="text-center py-20 text-indigo-400 font-semibold text-sm">
            No se encontraron inscripciones registradas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-[#0c122c]/70 border-b border-indigo-500/10 text-indigo-300 text-xs font-black uppercase tracking-widest">
                  <th className="px-6 py-4.5">Alumno</th>
                  <th className="px-6 py-4.5">DNI</th>
                  <th className="px-6 py-4.5">Cohorte</th>
                  <th className="px-6 py-4.5">Módulo / Trayecto</th>
                  <th className="px-6 py-4.5">Estado</th>
                  <th className="px-6 py-4.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-500/5 bg-transparent">
                {filteredInscripciones.map((ins) => (
                  <tr key={ins.id} className="hover:bg-[#00ccff]/5 transition-all duration-300">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white text-base">
                        {ins.estudiante?.apellido}, {ins.estudiante?.nombre}
                      </div>
                      <div className="text-xs text-indigo-300">{ins.estudiante?.email}</div>
                    </td>
                    <td className="px-6 py-4 text-indigo-200 font-semibold">
                      {ins.estudiante?.dni}
                    </td>
                    <td className="px-6 py-4 text-indigo-200 font-medium">
                      {ins.cohorte?.nombre}
                    </td>
                    <td className="px-6 py-4">
                      {ins.modulo ? (
                        <div>
                          <p className="font-bold text-white">{ins.modulo.nombre}</p>
                          <p className="text-[10px] text-indigo-400 uppercase">{ins.modulo.bloque_nombre}</p>
                        </div>
                      ) : (
                        <span className="text-indigo-400 italic">Cohorte Completa</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === ins.id ? (
                        <select
                          value={editingEstado}
                          onChange={(e) => setEditingEstado(e.target.value)}
                          className="px-2 py-1 rounded bg-[#0c122c] border border-indigo-500/30 text-white text-xs font-bold focus:outline-none"
                        >
                          {["PREINSCRIPTO", "CURSANDO", "INACTIVO", "LIBRE", "PAUSADO", "EGRESADO", "APROBADO", "DESAPROBADO"].map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${
                          ins.estado === "CURSANDO" || ins.estado === "APROBADO" || ins.estado === "EGRESADO"
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                            : ins.estado === "PREINSCRIPTO"
                            ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                            : "border-rose-500/20 bg-rose-500/10 text-rose-400"
                        }`}>
                          {ins.estado}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {editingId === ins.id ? (
                          <>
                            <button
                              onClick={() => handleUpdateEstado(ins.id)}
                              disabled={saving}
                              className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-400 border border-emerald-500/30"
                              title="Guardar"
                            >
                              <Save size={14} />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-2 rounded-lg bg-indigo-500/10 hover:bg-white/5 text-indigo-300"
                              title="Cancelar"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingId(ins.id);
                                setEditingEstado(ins.estado);
                              }}
                              className="p-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-[#00ccff] border border-indigo-500/10 active:scale-95"
                              title="Editar Estado"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(ins.id)}
                              className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/10 active:scale-95"
                              title="Eliminar"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-[#0c122c] border border-indigo-500/20 rounded-[2.5rem] w-full max-w-lg my-8 shadow-2xl relative overflow-hidden">
            <div className="p-6 border-b border-indigo-500/10 flex items-center justify-between">
              <h3 className="text-lg font-black text-white uppercase tracking-wider">Nueva Inscripción</h3>
              <button
                onClick={() => {
                  setIsAddOpen(false);
                  setSelectedStudent("");
                  setSelectedCohorte("");
                  setSelectedModulo("");
                  setStudentSearch("");
                }}
                className="p-2 rounded-xl hover:bg-white/5 text-indigo-300 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-indigo-300">Buscar Alumno</label>
                <input
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="DNI, Apellido o Nombre..."
                  className="w-full rounded-xl px-4 py-2.5 bg-indigo-950/40 border border-indigo-500/25 text-white text-sm focus:border-brand-cyan/70 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-indigo-300">Alumno *</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  required
                  className="w-full rounded-xl px-4 py-2.5 bg-indigo-950/40 border border-indigo-500/25 text-white text-sm focus:outline-none"
                >
                  <option value="" className="bg-[#0c122c]">Seleccionar alumno...</option>
                  {filteredAlumnos.map(s => (
                    <option key={s.id} value={s.id} className="bg-[#0c122c]">
                      {s.apellido}, {s.nombre} ({s.dni})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-indigo-300">Cohorte *</label>
                <select
                  value={selectedCohorte}
                  onChange={(e) => setSelectedCohorte(e.target.value)}
                  required
                  className="w-full rounded-xl px-4 py-2.5 bg-indigo-950/40 border border-indigo-500/25 text-white text-sm focus:outline-none"
                >
                  <option value="" className="bg-[#0c122c]">Seleccionar cohorte...</option>
                  {cohortes.map(c => (
                    <option key={c.id} value={c.id} className="bg-[#0c122c]">{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-indigo-300">Módulo (Opcional)</label>
                <select
                  value={selectedModulo}
                  onChange={(e) => setSelectedModulo(e.target.value)}
                  disabled={!selectedCohorte}
                  className="w-full rounded-xl px-4 py-2.5 bg-indigo-950/40 border border-indigo-500/25 text-white text-sm focus:outline-none disabled:opacity-50"
                >
                  <option value="" className="bg-[#0c122c]">Todos los módulos (Trayecto Completo)</option>
                  {modulos.map(m => (
                    <option key={m.id} value={m.id} className="bg-[#0c122c]">{m.nombre} ({m.bloque_nombre})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-indigo-300">Estado inicial</label>
                <select
                  value={inscStatus}
                  onChange={(e) => setInscStatus(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 bg-indigo-950/40 border border-indigo-500/25 text-white text-sm focus:outline-none"
                >
                  {["PREINSCRIPTO", "CURSANDO", "INACTIVO", "LIBRE", "PAUSADO", "EGRESADO", "APROBADO", "DESAPROBADO"].map(st => (
                    <option key={st} value={st} className="bg-[#0c122c]">{st}</option>
                  ))}
                </select>
              </div>

              <div className="p-6 border-t border-indigo-500/10 flex justify-end gap-3 bg-[#0a0d24] -mx-6 -mb-6 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    setSelectedStudent("");
                    setSelectedCohorte("");
                    setSelectedModulo("");
                    setStudentSearch("");
                  }}
                  className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-accent text-[#050814] font-black text-xs uppercase tracking-widest hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all disabled:opacity-50"
                >
                  {saving ? "Registrando..." : "Inscribir"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
