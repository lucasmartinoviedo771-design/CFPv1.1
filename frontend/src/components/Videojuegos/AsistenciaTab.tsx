import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Search, ShieldAlert, CheckCircle2, Loader, Save, 
  X, Check, Gamepad2, Calendar 
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
}

interface Modulo {
  id: number;
  nombre: string;
  bloque_id: number;
  bloque_nombre: string;
}

interface AttendanceRecord {
  id: number | null;
  studentId: number;
  presente: boolean | null; // true, false, or null (not set)
}

export default function AsistenciaTab() {
  const [cohortes, setCohortes] = useState<Cohorte[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [students, setStudents] = useState<Alumno[]>([]);
  const [attendance, setAttendance] = useState<Record<number, AttendanceRecord>>({});
  
  // Selections
  const [selectedCohorte, setSelectedCohorte] = useState("");
  const [selectedModulo, setSelectedModulo] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load cohortes on mount
  useEffect(() => {
    apiClientV2.get("/videojuegos/cohortes")
      .then(({ data }) => setCohortes(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  // Load modules when cohorte changes
  useEffect(() => {
    if (!selectedCohorte) {
      setModulos([]);
      setSelectedModulo("");
      setStudents([]);
      setAttendance({});
      return;
    }
    apiClientV2.get("/videojuegos/modulos", { params: { cohorte_id: selectedCohorte } })
      .then(({ data }) => {
        setModulos(Array.isArray(data) ? data : []);
        setSelectedModulo("");
        setStudents([]);
        setAttendance({});
      }).catch(console.error);
  }, [selectedCohorte]);

  // Load students and attendance when modulo or date changes
  const loadData = useCallback(async () => {
    if (!selectedCohorte || !selectedModulo || !selectedDate) {
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      // 1. Fetch inscriptions for this cohorte + modulo to get enrolled VJ students
      const { data: inscs } = await apiClientV2.get("/videojuegos/inscripciones", {
        params: { cohorte_id: selectedCohorte, modulo_id: selectedModulo }
      });
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

      // 2. Fetch existing attendance for this modulo + date
      const { data: atts } = await apiClientV2.get("/videojuegos/asistencia", {
        params: { modulo_id: selectedModulo, fecha: selectedDate }
      });
      const existingAtts = Array.isArray(atts) ? atts : [];

      // Build grid state
      const initialGrid: Record<number, AttendanceRecord> = {};
      studentList.forEach(s => {
        initialGrid[s.id] = {
          id: null,
          studentId: s.id,
          presente: null
        };
      });

      existingAtts.forEach(att => {
        const studentId = att.estudiante?.id || att.estudiante;
        if (studentId && initialGrid[studentId]) {
          initialGrid[studentId] = {
            id: att.id,
            studentId: studentId,
            presente: att.presente
          };
        }
      });

      setStudents(studentList);
      setAttendance(initialGrid);
    } catch (err) {
      console.error(err);
      setError("Error al cargar listado de alumnos y asistencias.");
    } finally {
      setLoading(false);
    }
  }, [selectedCohorte, selectedModulo, selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = (studentId: number, isPresent: boolean) => {
    setAttendance(prev => {
      const current = prev[studentId];
      const newStatus = current.presente === isPresent ? null : isPresent;
      return {
        ...prev,
        [studentId]: {
          ...current,
          presente: newStatus
        }
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      let created = 0;
      let updated = 0;
      let deleted = 0;

      for (const record of Object.values(attendance)) {
        const { id, studentId, presente } = record;
        
        if (presente === null && id) {
          // If was set, and now toggled off, delete record (optional, or set false. Usually we just delete or update)
          // In standard CFP, "none" deletes it. Let's do that for cleanliness.
          await apiClientV2.delete(`/videojuegos/asistencia/${id}`);
          deleted++;
        } else if (presente !== null) {
          const payload = {
            estudiante: studentId,
            modulo: Number(selectedModulo),
            fecha: selectedDate,
            presente: presente
          };

          if (id) {
            await apiClientV2.patch(`/videojuegos/asistencia/${id}`, payload);
            updated++;
          } else {
            await apiClientV2.post("/videojuegos/asistencia", payload);
            created++;
          }
        }
      }
      setSuccess("Asistencias guardadas correctamente.");
      loadData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Error al guardar planilla de asistencias.");
    } finally {
      setSaving(false);
    }
  };

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
            <label className="text-[10px] font-black uppercase text-indigo-300">Cohorte</label>
            <select
              value={selectedCohorte}
              onChange={(e) => setSelectedCohorte(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[#0c122c] border border-indigo-500/15 text-white text-sm font-semibold focus:border-[#00ccff]/70 focus:outline-none"
            >
              <option value="" className="bg-[#0c122c]">Seleccionar cohorte...</option>
              {cohortes.map(c => (
                <option key={c.id} value={c.id} className="bg-[#0c122c]">{c.nombre}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-indigo-300">Módulo</label>
            <select
              value={selectedModulo}
              onChange={(e) => setSelectedModulo(e.target.value)}
              disabled={!selectedCohorte}
              className="w-full px-4 py-3 rounded-2xl bg-[#0c122c] border border-indigo-500/15 text-white text-sm font-semibold focus:border-[#00ccff]/70 focus:outline-none disabled:opacity-50"
            >
              <option value="" className="bg-[#0c122c]">Seleccionar módulo...</option>
              {modulos.map(m => (
                <option key={m.id} value={m.id} className="bg-[#0c122c]">{m.nombre} ({m.bloque_nombre})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-indigo-300">Fecha de Clase</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[#0c122c] border border-indigo-500/15 text-white text-sm font-semibold focus:border-[#00ccff]/70 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Grid Table */}
      {!selectedModulo ? (
        <div className="text-center py-12 text-indigo-400 font-semibold text-sm border border-indigo-500/5 rounded-3xl bg-[#0c122c]/10">
          Por favor, selecciona una Cohorte y un Módulo para cargar el listado.
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-indigo-300 font-bold uppercase tracking-wider space-y-4">
          <div className="animate-spin text-[#00ccff]"><Gamepad2 size={40} /></div>
          <p className="text-xs">Cargando alumnos inscritos...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-12 text-indigo-400 font-semibold text-sm border border-indigo-500/5 rounded-3xl bg-[#0c122c]/10">
          No hay estudiantes inscritos en este módulo para la cohorte seleccionada.
        </div>
      ) : (
        <div className="bg-[#0c122c]/20 border border-indigo-500/10 backdrop-blur-xl shadow-2xl rounded-[2rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-[#0c122c]/70 border-b border-indigo-500/10 text-indigo-300 text-xs font-black uppercase tracking-widest">
                  <th className="px-6 py-4.5">Alumno</th>
                  <th className="px-6 py-4.5">DNI</th>
                  <th className="px-6 py-4.5 text-center w-64">Asistencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-500/5 bg-transparent">
                {students.map((student) => {
                  const state = attendance[student.id]?.presente;
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
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleStatusChange(student.id, true)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1 transition-all ${
                              state === true
                                ? "bg-emerald-500 text-[#050814] shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                                : "bg-indigo-950 text-indigo-400 hover:bg-emerald-500/10 hover:text-emerald-400"
                            }`}
                          >
                            <Check size={14} /> Presente
                          </button>
                          <button
                            onClick={() => handleStatusChange(student.id, false)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1 transition-all ${
                              state === false
                                ? "bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                                : "bg-indigo-950 text-indigo-400 hover:bg-rose-500/10 hover:text-rose-400"
                            }`}
                          >
                            <X size={14} /> Ausente
                          </button>
                        </div>
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
              <Save size={15} /> {saving ? "Guardando..." : "Guardar Asistencias"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
