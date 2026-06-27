import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Search, ShieldAlert, CheckCircle2, Loader, Save, 
  X, Check, Gamepad2, FileText, Sparkles 
} from "lucide-react";
import { apiClientV2 } from "../../api/client";

interface Alumno {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
}

interface Modulo {
  id: number;
  nombre: string;
  bloque_id: number;
  bloque_nombre: string;
}

interface Examen {
  id: number;
  tipo_examen: string;
  fecha: string | null;
  modulo_id: number | null;
  modulo_nombre?: string;
  bloque_id: number | null;
  bloque_nombre?: string;
}

interface NotaRecord {
  id: number | null;
  studentId: number;
  calificacion: string; // Float as string for inputs
  aprobado: boolean;
}

export default function CalificacionesTab() {
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [examenes, setExamenes] = useState<Examen[]>([]);
  const [students, setStudents] = useState<Alumno[]>([]);
  const [notas, setNotas] = useState<Record<number, NotaRecord>>({});
  
  // Selections
  const [selectedModulo, setSelectedModulo] = useState("");
  const [selectedExamen, setSelectedExamen] = useState("");

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load modules on mount
  useEffect(() => {
    apiClientV2.get("/videojuegos/modulos")
      .then(({ data }) => setModulos(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  // Load VJ examenes when modulo changes
  useEffect(() => {
    const params = selectedModulo ? { modulo_id: selectedModulo } : {};
    apiClientV2.get("/videojuegos/examenes", { params })
      .then(({ data }) => {
        setExamenes(Array.isArray(data) ? data : []);
        setSelectedExamen("");
        setStudents([]);
        setNotas({});
      }).catch(console.error);
  }, [selectedModulo]);

  // Load students and grades when examen changes
  const loadData = useCallback(async () => {
    if (!selectedExamen) {
      setStudents([]);
      setNotas({});
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      // Find selected examen detail
      const exObj = examenes.find(e => String(e.id) === selectedExamen);
      if (!exObj) return;

      // 1. Fetch students eligible for this examen — solo CURSANDO (excluye preinscriptos)
      const params: Record<string, string | number> = { estado: "CURSANDO" };
      if (exObj.modulo_id) {
        params.modulo_id = exObj.modulo_id;
      } else if (exObj.bloque_id) {
        params.bloque_id = exObj.bloque_id;
      }

      const { data: inscs } = await apiClientV2.get("/videojuegos/inscripciones", { params });
      const listInscs = Array.isArray(inscs) ? inscs : [];
      
      // Extract unique students
      const studentMap = new Map<number, Alumno>();
      listInscs.forEach(i => {
        if (i.estudiante) {
          studentMap.set(i.estudiante.id, i.estudiante);
        }
      });
      const studentList = Array.from(studentMap.values()).sort((a, b) => 
        a.apellido.localeCompare(b.apellido)
      );

      // 2. Fetch existing grades for this examen
      const { data: grades } = await apiClientV2.get("/videojuegos/notas", {
        params: { examen_id: selectedExamen }
      });
      const existingGrades = Array.isArray(grades) ? grades : [];

      // Build grid state
      const initialGrid: Record<number, NotaRecord> = {};
      studentList.forEach(s => {
        initialGrid[s.id] = {
          id: null,
          studentId: s.id,
          calificacion: "",
          aprobado: false
        };
      });

      existingGrades.forEach(g => {
        const studentId = g.estudiante?.id || g.estudiante;
        if (studentId && initialGrid[studentId]) {
          initialGrid[studentId] = {
            id: g.id,
            studentId: studentId,
            calificacion: g.calificacion ? String(g.calificacion) : "",
            aprobado: g.aprobado
          };
        }
      });

      setSearch("");
      setStudents(studentList);
      setNotas(initialGrid);
    } catch (err) {
      console.error(err);
      setError("Error al cargar planilla de calificaciones.");
    } finally {
      setLoading(false);
    }
  }, [selectedExamen, examenes]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGradeChange = (studentId: number, value: string) => {
    // Basic sanitization
    let cleanVal = value.replace(/[^0-9.]/g, "");
    const numVal = parseFloat(cleanVal);
    
    // Auto-calculate aprobado
    const isApproved = !isNaN(numVal) && numVal >= 6.0;

    setNotas(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        calificacion: cleanVal,
        aprobado: isApproved
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      let created = 0;
      let updated = 0;
      let deleted = 0;

      for (const record of Object.values(notas)) {
        const { id, studentId, calificacion, aprobado } = record;
        
        if (calificacion === "" && id) {
          // If grade cleared, delete record
          await apiClientV2.delete(`/videojuegos/notas/${id}`);
          deleted++;
        } else if (calificacion !== "") {
          const numVal = parseFloat(calificacion);
          if (isNaN(numVal) || numVal < 0 || numVal > 10) {
            throw new Error(`La calificación de algún alumno es inválida (debe estar entre 0 y 10).`);
          }

          const payload = {
            examen: Number(selectedExamen),
            estudiante: studentId,
            calificacion: numVal,
            aprobado: aprobado,
            fecha_calificacion: new Date().toISOString()
          };

          if (id) {
            await apiClientV2.patch(`/videojuegos/notas/${id}`, payload);
            updated++;
          } else {
            await apiClientV2.post("/videojuegos/notas", payload);
            created++;
          }
        }
      }
      setSuccess("Calificaciones guardadas correctamente.");
      loadData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      const errorObj = err as { message?: string };
      setError(errorObj.message || "Error al guardar planilla de calificaciones.");
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase().trim();
    return students.filter(s =>
      `${s.apellido} ${s.nombre}`.toLowerCase().includes(q) ||
      s.dni.includes(q)
    );
  }, [students, search]);

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

      {/* Selectors card */}
      <div className="p-6 rounded-[2rem] bg-[#0c122c]/50 border border-indigo-500/10 backdrop-blur-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-indigo-300">Módulo (Filtro)</label>
            <select
              value={selectedModulo}
              onChange={(e) => setSelectedModulo(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[#0c122c] border border-indigo-500/15 text-white text-sm font-semibold focus:border-[#00ccff]/70 focus:outline-none"
            >
              <option value="" className="bg-[#0c122c]">Todos los módulos...</option>
              {modulos.map(m => (
                <option key={m.id} value={m.id} className="bg-[#0c122c]">{m.nombre}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-indigo-300">Buscar Alumno</label>
            <div className="relative">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nombre, apellido o DNI..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#0c122c] border border-indigo-500/15 text-white text-sm font-semibold focus:border-[#00ccff]/70 focus:outline-none placeholder-indigo-600"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-indigo-300">Examen *</label>
            <select
              value={selectedExamen}
              onChange={(e) => setSelectedExamen(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[#0c122c] border border-indigo-500/15 text-white text-sm font-semibold focus:border-[#00ccff]/70 focus:outline-none"
            >
              <option value="" className="bg-[#0c122c]">Seleccionar examen...</option>
              {examenes.map(e => {
                const label = `${e.tipo_examen} · ${e.modulo_nombre || e.bloque_nombre || "General"}` + (e.fecha ? ` (${e.fecha})` : "");
                return (
                  <option key={e.id} value={e.id} className="bg-[#0c122c]">{label}</option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* List Table */}
      {!selectedExamen ? (
        <div className="text-center py-12 text-indigo-400 font-semibold text-sm border border-indigo-500/5 rounded-3xl bg-[#0c122c]/10">
          Por favor, selecciona un Examen para registrar calificaciones.
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-indigo-300 font-bold uppercase tracking-wider space-y-4">
          <div className="animate-spin text-[#00ccff]"><Gamepad2 size={40} /></div>
          <p className="text-xs">Cargando legajos de alumnos...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-12 text-indigo-400 font-semibold text-sm border border-indigo-500/5 rounded-3xl bg-[#0c122c]/10">
          No hay estudiantes inscritos aptos para rendir este examen.
        </div>
      ) : (
        <div className="bg-[#0c122c]/20 border border-indigo-500/10 backdrop-blur-xl shadow-2xl rounded-[2rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-[#0c122c]/70 border-b border-indigo-500/10 text-indigo-300 text-xs font-black uppercase tracking-widest">
                  <th className="px-6 py-4.5">Alumno</th>
                  <th className="px-6 py-4.5">DNI</th>
                  <th className="px-6 py-4.5 text-center w-40">Calificación (0 - 10)</th>
                  <th className="px-6 py-4.5 text-center w-40">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-500/5 bg-transparent">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-indigo-400 italic text-sm">
                      No se encontraron alumnos con esa búsqueda.
                    </td>
                  </tr>
                ) : filteredStudents.map((student) => {
                  const record = notas[student.id];
                  const calif = record?.calificacion || "";
                  const approved = record?.aprobado || false;
                  
                  return (
                    <tr key={student.id} className="hover:bg-[#00ccff]/5 transition-all duration-300">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white text-base">
                          {student.apellido}, {student.nombre}
                        </div>
                        <div className="text-xs text-indigo-300">{student.email}</div>
                      </td>
                      <td className="px-6 py-4 text-indigo-200 font-semibold">
                        {student.dni}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="text"
                          value={calif}
                          onChange={(e) => handleGradeChange(student.id, e.target.value)}
                          placeholder="S/N"
                          className="w-24 text-center px-3 py-2 rounded-xl bg-[#0c122c] border border-indigo-500/20 text-white font-bold text-sm focus:border-[#00ccff]/70 focus:outline-none placeholder-indigo-950"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        {calif !== "" ? (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider ${
                            approved 
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" 
                              : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                          }`}>
                            {approved ? <Check size={12} /> : <X size={12} />}
                            {approved ? "Aprobado" : "Desaprobado"}
                          </span>
                        ) : (
                          <span className="text-indigo-400 italic text-xs">Sin Nota</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-6 border-t border-indigo-500/10 bg-[#0a0d24] flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-brand-cyan to-brand-accent text-[#050814] font-black text-xs uppercase tracking-widest hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all disabled:opacity-50"
            >
              <Save size={15} /> {saving ? "Guardando..." : "Guardar Calificaciones"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
