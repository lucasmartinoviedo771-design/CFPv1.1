import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { listAsistencias, createAsistencia, updateAsistencia } from "../services/asistenciasService";
import api from '../api/client';
import { Card, Select, Button, Input } from '../components/UI';
import { Check, X, Save, CheckSquare, AlertCircle, Loader, Baby } from 'lucide-react';

const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export default function Asistencia() {
  const [programas, setProgramas] = useState([]);
  const [cohortes, setCohortes] = useState([]);
  const [selectedCohorteNombre, setSelectedCohorteNombre] = useState('');
  const [bloques, setBloques] = useState([]);
  const [selectedProgramaId, setSelectedProgramaId] = useState('');
  const [selectedBloqueId, setSelectedBloqueId] = useState('');
  const [selectedClaseDate, setSelectedClaseDate] = useState('');
  const [selectedClaseSlot, setSelectedClaseSlot] = useState('');
  const [clasesProgramadas, setClasesProgramadas] = useState([]);
  const [students, setStudents] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [attendanceGrid, setAttendanceGrid] = useState({});
  const [studentEnrolledModules, setStudentEnrolledModules] = useState({});
  const [loadingData, setLoadingData] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });

  const formatDate = (yyyyMmDd) => {
    if (!yyyyMmDd || !yyyyMmDd.includes('-')) return yyyyMmDd || '';
    const [y, m, d] = yyyyMmDd.split('-');
    return `${d}/${m}/${y}`;
  };

  const fetchProgramas = useCallback(async () => {
    try {
      const { data } = await api.get('/programas');
      setProgramas(Array.isArray(data) ? data : []);
    } catch (error) { setFeedback({ open: true, message: 'Error al cargar programas.', severity: 'error' }); }
  }, []);

  const fetchCohortes = useCallback(async (programaId) => {
    if (!programaId) return;
    try {
      const { data } = await api.get(`/inscripciones/cohortes`, { params: { programa_id: programaId } });
      setCohortes(Array.isArray(data) ? data : []);
    } catch (error) { setFeedback({ open: true, message: 'Error al cargar cohortes.', severity: 'error' }); }
  }, []);

  const fetchBloques = useCallback(async (programaId) => {
    if (!programaId) return;
    try {
      const { data } = await api.get(`/bloques`, { params: { programa_id: programaId } });
      const bloquesData = Array.isArray(data) ? data : [];
      setBloques(bloquesData);
      if (bloquesData.length === 1) setSelectedBloqueId(bloquesData[0].id);
    } catch (error) { setFeedback({ open: true, message: 'Error al cargar bloques.', severity: 'error' }); }
  }, []);

  const fetchStudentsAndModulos = useCallback(async (cohorteNombre, bloqueId, fecha) => {
    if (!cohorteNombre || !bloqueId || !fecha) return;
    setLoadingData(true);
    try {
      const cohortesFiltradas = cohortes.filter((c) => {
        if (String(c.bloque_id || '') !== String(bloqueId)) return false;
        return String(c.nombre || '') === String(cohorteNombre || '');
      });
      const cohorteIds = cohortesFiltradas.map((c) => c.id);
      if (!cohorteIds.length) {
        setStudents([]);
        setModulos([]);
        setAttendanceGrid({});
        setStudentEnrolledModules({});
        setLoadingData(false);
        return;
      }

      const [inscriptionsResponses, modulesRes, attendanceData] = await Promise.all([
        Promise.all(cohorteIds.map((id) => api.get(`/inscripciones`, { params: { cohorte_id: id } }))),
        api.get(`/modulos`, { params: { bloque_id: bloqueId } }),
        listAsistencias({ bloque_id: bloqueId, fecha }),
      ]);

      const inscriptions = inscriptionsResponses.flatMap((res) => (Array.isArray(res.data) ? res.data : []));

      const existingAttendance = Array.isArray(attendanceData) ? attendanceData : [];
      const modulosBloque = Array.isArray(modulesRes.data) ? modulesRes.data : [];

      const studentMap = new Map();
      const enrolledModulesMap = {};

      inscriptions.filter(insc => insc.modulo && insc.modulo.bloque_id === Number(bloqueId)).forEach(insc => {
        if (insc.estudiante && insc.modulo) {
          studentMap.set(insc.estudiante.id, insc.estudiante);
          if (!enrolledModulesMap[insc.estudiante.id]) enrolledModulesMap[insc.estudiante.id] = [];
          enrolledModulesMap[insc.estudiante.id].push(insc.modulo.id);
        }
      });

      const uniqueStudents = Array.from(studentMap.values());
      const uniqueModulos = modulosBloque;

      const grid = {};
      uniqueStudents.forEach(student => {
        grid[student.id] = {};
        uniqueModulos.forEach(mod => { grid[student.id][mod.id] = { status: 'none', id: null }; });
      });

      existingAttendance.forEach(att => {
        if (grid[att.estudiante] && grid[att.estudiante][att.modulo]) {
          grid[att.estudiante][att.modulo] = { status: att.presente ? 'present' : 'absent', id: att.id };
        }
      });

      setStudents(uniqueStudents);
      setModulos(uniqueModulos);
      setStudentEnrolledModules(enrolledModulesMap);
      setAttendanceGrid(grid);
    } catch (error) {
      setFeedback({ open: true, message: 'Error al cargar datos.', severity: 'error' });
    } finally { setLoadingData(false); }
  }, [cohortes]);

  const fetchClasesProgramadas = useCallback(async (cohorteNombre, bloqueId) => {
    if (!cohorteNombre || !bloqueId) {
      setClasesProgramadas([]);
      return;
    }
    try {
      const cohortesFiltradas = cohortes.filter((c) => {
        if (String(c.bloque_id || '') !== String(bloqueId)) return false;
        return String(c.nombre || '') === String(cohorteNombre || '');
      });
      const cohorteIds = cohortesFiltradas.map((c) => c.id);
      if (!cohorteIds.length) {
        setClasesProgramadas([]);
        return;
      }
      const responses = await Promise.all(
        cohorteIds.map((id) => api.get('/horarios-cursada/clases-programadas', { params: { cohorte_id: id, bloque_id: bloqueId } }))
      );
      const clases = responses.flatMap((res) => (Array.isArray(res.data) ? res.data : []));
      clases.sort((a, b) => {
        const aKey = `${a.fecha || ''}${a.hora_inicio || ''}`;
        const bKey = `${b.fecha || ''}${b.hora_inicio || ''}`;
        return aKey.localeCompare(bKey);
      });
      setClasesProgramadas(clases);
    } catch (error) {
      setClasesProgramadas([]);
      setFeedback({ open: true, message: 'Error al cargar clases programadas.', severity: 'error' });
    }
  }, [cohortes]);

  useEffect(() => { fetchProgramas(); }, [fetchProgramas]);
  useEffect(() => { fetchCohortes(selectedProgramaId); }, [fetchCohortes, selectedProgramaId]);
  useEffect(() => { fetchBloques(selectedProgramaId); }, [fetchBloques, selectedProgramaId]);
  useEffect(() => { fetchClasesProgramadas(selectedCohorteNombre, selectedBloqueId); }, [fetchClasesProgramadas, selectedCohorteNombre, selectedBloqueId]);
  useEffect(() => {
    if (selectedCohorteNombre && selectedBloqueId && selectedClaseDate) {
      fetchStudentsAndModulos(selectedCohorteNombre, selectedBloqueId, selectedClaseDate);
    }
  }, [selectedCohorteNombre, selectedBloqueId, selectedClaseDate, fetchStudentsAndModulos]);

  const handleProgramaChange = (e) => {
    setSelectedProgramaId(e.target.value); setSelectedCohorteNombre(''); setSelectedBloqueId(''); setSelectedClaseDate('');
    setSelectedClaseSlot('');
    setClasesProgramadas([]);
    setStudents([]); setModulos([]); setAttendanceGrid({}); setStudentEnrolledModules({});
  };
  const handleCohorteChange = (e) => {
    setSelectedCohorteNombre(e.target.value); setSelectedClaseDate('');
    setSelectedClaseSlot('');
    setStudents([]); setModulos([]); setAttendanceGrid({}); setStudentEnrolledModules({});
  };

  const handleStatusChange = (studentId, moduloId, newStatus) => {
    setAttendanceGrid(prevGrid => {
      const newGrid = { ...prevGrid };
      if (newGrid[studentId] && newGrid[studentId][moduloId]) {
        const current = newGrid[studentId][moduloId];
        const finalStatus = current.status === newStatus ? 'none' : newStatus; // Toggle
        newGrid[studentId][moduloId] = { ...current, status: finalStatus };
      }
      return newGrid;
    });
  };

  const handleSaveAttendance = async () => {
    setLoadingData(true);
    try {
      for (const studentId in attendanceGrid) {
        for (const moduloId in attendanceGrid[studentId]) {
          const { status, id } = attendanceGrid[studentId][moduloId];
          const isEnrolled = studentEnrolledModules[studentId]?.includes(parseInt(moduloId));
          if (!isEnrolled) continue;

          if (status === 'none' && id) {
            await api.delete(`/examenes/asistencias/${id}`);
          } else if (status === 'present' || status === 'absent') {
            const payload = { estudiante: Number(studentId), modulo: Number(moduloId), fecha: selectedClaseDate, presente: status === 'present' };
            if (id) await updateAsistencia(id, payload); else await createAsistencia(payload);
          }
        }
      }
      setFeedback({ open: true, message: 'Asistencias guardadas con éxito', severity: 'success' });
      fetchStudentsAndModulos(selectedCohorteNombre, selectedBloqueId, selectedClaseDate);
    } catch (error) {
      setFeedback({ open: true, message: `Error al guardar: ${error.message}`, severity: 'error' });
    } finally { setLoadingData(false); }
  };

  const cohortesOptions = useMemo(() => {
    const base = cohortes.filter((c) => {
      if (!selectedBloqueId) return true;
      return String(c.bloque_id || '') === String(selectedBloqueId);
    });
    const uniqueNames = Array.from(new Set(base.map((c) => (c.nombre || '').trim()).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, 'es'));
    return [{ value: '', label: 'Seleccionar...' }, ...uniqueNames.map((nombre) => ({ value: nombre, label: nombre }))];
  }, [cohortes, selectedBloqueId]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Gestión de Asistencias</h1>
        <p className="text-indigo-300">Control de asistencia por clase.</p>
      </div>

      <Card className="bg-indigo-900/20 border-indigo-500/30 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <Select label="Programa" value={selectedProgramaId} onChange={handleProgramaChange} options={[{ value: '', label: 'Seleccionar...' }, ...programas.map(p => ({ value: p.id, label: p.nombre }))]} className="bg-indigo-950/50" />
          <Select
            label="Bloque"
            value={selectedBloqueId}
            onChange={e => { setSelectedBloqueId(e.target.value); setSelectedCohorteNombre(''); setSelectedClaseDate(''); setSelectedClaseSlot(''); setClasesProgramadas([]); setStudents([]); setModulos([]); setAttendanceGrid({}); setStudentEnrolledModules({}); }}
            disabled={!selectedProgramaId}
            options={[{ value: '', label: 'Seleccionar...' }, ...bloques.map(b => ({ value: b.id, label: b.nombre }))]}
            className="bg-indigo-950/50"
          />
          <Select
            label="Cohorte"
            value={selectedCohorteNombre}
            onChange={handleCohorteChange}
            disabled={!selectedProgramaId}
            options={cohortesOptions}
            className="bg-indigo-950/50"
          />
          <Input
            label="Fecha"
            type="date"
            value={selectedClaseDate || ''}
            onChange={(e) => {
              setSelectedClaseDate(e.target.value);
              setSelectedClaseSlot('');
            }}
            disabled={!selectedCohorteNombre}
            className="bg-indigo-950/50"
          />
          <Select
            label="Sel. Rápida (Horario)"
            value={selectedClaseSlot}
            onChange={(e) => {
              const slot = e.target.value;
              setSelectedClaseSlot(slot);
              const fecha = slot ? slot.split('|')[0] : '';
              setSelectedClaseDate(fecha);
            }}
            disabled={!selectedCohorteNombre}
            options={[
              { value: '', label: 'Seleccionar...' },
              ...clasesProgramadas.map((c) => ({
                value: `${c.fecha}|${c.hora_inicio}|${c.hora_fin}|${c.cohorte_id}|${c.modulo_id || 0}`,
                label: `${formatDate(c.fecha)} ${String(c.hora_inicio || '').slice(0, 5)} - ${String(c.hora_fin || '').slice(0, 5)}`,
              })),
            ]}
            className="bg-indigo-950/50"
          />
        </div>
      </Card>

      {loadingData && <div className="p-8 flex justify-center"><Loader className="animate-spin text-brand-accent h-8 w-8" /></div>}

      {!loadingData && selectedBloqueId && students.length > 0 && modulos.length > 0 && (
        <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-xl overflow-hidden shadow-xl animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#1e1b4b] text-indigo-300 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 sticky left-0 bg-[#1e1b4b] z-10 w-48">Estudiante</th>
                  {modulos.map(mod => <th key={mod.id} className="px-4 py-3 text-center min-w-[120px]">{mod.nombre}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-500/10">
                {students.map(student => (
                  <tr key={student.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-medium sticky left-0 bg-[#0a0033]/90 md:bg-transparent z-10">
                      {(() => {
                        const age = calculateAge(student.fecha_nacimiento);
                        const isMinor = age !== null && age < 18;
                        return (
                          <div className="flex items-center gap-2">
                            <span className={isMinor ? "text-orange-400 font-bold" : "text-white"}>
                              {student.apellido}, {student.nombre}
                            </span>
                            {age !== null && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isMinor ? "bg-orange-500/20 text-orange-300 border border-orange-500/30" : "bg-indigo-500/20 text-indigo-300"}`}>
                                {age} {isMinor && <Baby size={10} className="inline ml-0.5" />}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    {modulos.map(mod => {
                      const isEnrolled = studentEnrolledModules[student.id]?.includes(mod.id);
                      const status = attendanceGrid[student.id]?.[mod.id]?.status || 'none';
                      if (!isEnrolled) return <td key={mod.id} className="px-4 py-3 text-center text-gray-700 bg-black/20">-</td>;

                      return (
                        <td key={mod.id} className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleStatusChange(student.id, mod.id, 'present')}
                              className={`p-1 rounded transition-all ${status === 'present' ? 'bg-green-500 text-white shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-indigo-950 text-gray-500 hover:text-green-400'}`}
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => handleStatusChange(student.id, mod.id, 'absent')}
                              className={`p-1 rounded transition-all ${status === 'absent' ? 'bg-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-indigo-950 text-gray-500 hover:text-red-400'}`}
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-indigo-500/20 bg-indigo-950/30 flex justify-end">
            <Button onClick={handleSaveAttendance} disabled={loadingData} startIcon={<Save size={18} />} className="bg-brand-accent hover:bg-orange-600 border-none shadow-lg">
              Guardar Asistencias
            </Button>
          </div>
        </div>
      )}

      {!loadingData && selectedBloqueId && students.length === 0 && (
        <div className="text-center py-10 text-indigo-300 bg-indigo-900/10 rounded-xl border border-indigo-500/20">
          No hay estudiantes inscriptos para los filtros seleccionados.
        </div>
      )}

      {feedback.open && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-xl border flex items-center gap-2 animate-fade-in z-50 ${feedback.severity === 'error' ? 'bg-red-900/90 border-red-500 text-white' : 'bg-green-900/90 border-green-500 text-white'}`}>
          {feedback.severity === 'error' ? <AlertCircle size={20} /> : <CheckSquare size={20} />}
          {feedback.message}
          <button onClick={() => setFeedback({ ...feedback, open: false })} className="ml-4 hover:text-gray-300"><X size={14} /></button>
        </div>
      )}
    </div>
  );
}
