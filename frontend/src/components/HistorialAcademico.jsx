import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import apiClient from '../api/client';
import { listInscripciones } from '../services/inscripcionesService';
import { listNotas } from '../services/notasService';
import { Card, Select, Button, Input } from './UI';
import { Edit2, Trash2, Check, X, PlusCircle, AlertCircle } from 'lucide-react';

dayjs.extend(utc);

// --- Funciones auxiliares para Carga de Datos (Modal) ---
async function fetchExamenesByModulo(moduloId) {
  const { data } = await apiClient.get('/examenes', { params: { modulo_id: moduloId } });
  return data;
}

async function fetchExamenesFinalesByBloque(bloqueId) {
  const { data } = await apiClient.get('/examenes', { params: { bloque_id: bloqueId } });
  return data;
}

// --- Componente Modal (Custom Tailwind) ---
function Modal({ isOpen, onClose, title, children, actions }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1e1b4b] border border-indigo-500/30 rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-indigo-500/20">
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        <div className="p-6 overflow-y-auto flex-1 text-gray-200 space-y-4">
          {children}
        </div>
        <div className="p-4 border-t border-indigo-500/20 flex justify-end gap-3 bg-indigo-950/30 rounded-b-xl">
          {actions}
        </div>
      </div>
    </div>
  );
}

// --- CreateNotaModal Re-escrito con Tailwind ---
function CreateNotaModal({ open, onClose, studentId, cursos, onSave }) {
  // ... (Lógica de estado idéntica al original) ...
  const [curso, setCurso] = useState('');
  const [bloque, setBloque] = useState('');
  const [modulo, setModulo] = useState('');
  const [examen, setExamen] = useState('');
  const [calificacion, setCalificacion] = useState('');
  const [fechaCalificacion, setFechaCalificacion] = useState(dayjs().format('YYYY-MM-DD'));
  const [esEquivalencia, setEsEquivalencia] = useState(false);
  const [estructura, setEstructura] = useState(null);
  const [examenes, setExamenes] = useState([]);
  const [existingNote, setExistingNote] = useState(null);
  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [approvedModuleExamTypes, setApprovedModuleExamTypes] = useState(new Set());
  const [studentApprovedModuleIds, setStudentApprovedModuleIds] = useState(new Set());
  const [allModulesInBlockApproved, setAllModulesInBlockApproved] = useState(false);
  const [loading, setLoading] = useState(false);

  // ... (Effects de carga de datos idénticos al original para mantener lógica) ...
  useEffect(() => {
    if (!studentId) { setStudentEnrollments([]); return; }
    (async () => {
      try {
        const { results } = await listInscripciones({ estudiante_id: studentId, estado: 'CURSANDO' });
        setStudentEnrollments(results || []);
      } catch (error) { setStudentEnrollments([]); }
    })();
  }, [studentId]);

  useEffect(() => {
    if (!studentId || !modulo) { setApprovedModuleExamTypes(new Set()); return; }
    (async () => {
      try {
        const { results } = await listNotas({ estudiante_id: studentId, modulo_id: modulo, aprobado: true });
        setApprovedModuleExamTypes(new Set((results || []).map(nota => nota.examen_tipo_examen)));
      } catch (error) { setApprovedModuleExamTypes(new Set()); }
    })();
  }, [studentId, modulo]);

  useEffect(() => {
    if (!studentId) { setStudentApprovedModuleIds(new Set()); return; }
    (async () => {
      try {
        const { results } = await listNotas({ estudiante_id: studentId, aprobado: true });
        setStudentApprovedModuleIds(new Set((results || []).map(nota => Number(nota.examen_modulo_id)).filter(Boolean)));
      } catch (error) { setStudentApprovedModuleIds(new Set()); }
    })();
  }, [studentId]);

  useEffect(() => {
    if (!bloque || !estructura) { setAllModulesInBlockApproved(false); return; }
    const currentBloque = estructura?.bloques.find(b => b.id === Number(bloque));
    if (!currentBloque?.modulos?.length) { setAllModulesInBlockApproved(false); return; }
    const allApproved = currentBloque.modulos.every(m => studentApprovedModuleIds.has(m.id));
    setAllModulesInBlockApproved(allApproved);
    if (allApproved && modulo) setModulo('');
  }, [bloque, estructura, studentApprovedModuleIds, modulo]);

  useEffect(() => {
    if (!examen || !studentId) { setExistingNote(null); return; }
    (async () => {
      const { data } = await apiClient.get('/examenes/notas', { params: { estudiante_id: studentId, examen_id: examen, aprobado: true } });
      setExistingNote((data && data.length > 0) ? data[0] : null);
    })();
  }, [examen, studentId]);

  useEffect(() => {
    if (!curso) { setEstructura(null); setBloque(''); setModulo(''); setExamen(''); return; }
    (async () => {
      try {
        const { data: bloquesData } = await apiClient.get('/bloques', { params: { programa_id: curso } });
        const bloquesConModulos = await Promise.all((bloquesData || []).map(async (b) => {
          const { data: modsData } = await apiClient.get('/modulos', { params: { bloque_id: b.id } });
          return { ...b, modulos: modsData || [] };
        }));
        setEstructura({ bloques: bloquesConModulos });
      } catch (err) { setEstructura({ bloques: [] }); }
    })();
  }, [curso]);

  useEffect(() => { setModulo(''); setExamen(''); }, [bloque]);
  useEffect(() => { setExamen(''); }, [modulo]);

  useEffect(() => {
    const fetchAndFilterExams = async () => {
      let fetchedExams = [];
      let isFinal = false;
      if (modulo) fetchedExams = await fetchExamenesByModulo(modulo);
      else if (bloque) {
        const currentBloque = estructura?.bloques.find(b => b.id === Number(bloque));
        if (currentBloque?.modulos?.length === 1) isFinal = true;
        fetchedExams = await fetchExamenesFinalesByBloque(bloque);
      } else { setExamenes([]); return; }

      let filtered = (fetchedExams || []).filter(ex => ex.tipo_examen !== 'RECUP');

      if (modulo && approvedModuleExamTypes.has('PARCIAL')) {
        filtered = filtered.filter(ex => ex.tipo_examen !== 'PARCIAL');
      }

      if (bloque && !modulo && !isFinal) {
        const currentBloque = estructura?.bloques.find(b => b.id === Number(bloque));
        if (currentBloque) {
          const allApproved = currentBloque.modulos.every(m => studentApprovedModuleIds.has(m.id));
          if (!allApproved) filtered = filtered.filter(ex => !['FINAL_VIRTUAL', 'FINAL_SINC', 'EQUIVALENCIA'].includes(ex.tipo_examen));
        }
      }
      setExamenes(filtered);
    };
    fetchAndFilterExams();
  }, [modulo, bloque, approvedModuleExamTypes, studentApprovedModuleIds, estructura]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const selectedExamen = examenes.find(ex => Number(ex.id) === Number(examen));
      const payload = {
        estudiante_id: Number(studentId),
        examen_id: Number(examen),
        calificacion: Number(calificacion),
        fecha_calificacion: fechaCalificacion,
      };

      if (selectedExamen?.tipo_examen === 'FINAL_SINC') {
        await apiClient.post('/examenes/registro/nota-sincronico', payload);
      } else if (['PARCIAL', 'RECUP'].includes(selectedExamen?.tipo_examen)) {
        await apiClient.post('/examenes/registro/nota-parcial', payload);
      } else {
        // Fallback a nota genérica para Final Virtual o Equivalencia
        await apiClient.post('/examenes/notas', {
          estudiante: studentId,
          examen,
          calificacion: Number(calificacion),
          fecha_calificacion: fechaCalificacion,
          es_equivalencia: esEquivalencia,
          aprobado: Number(calificacion) >= 6,
        });
      }
      onSave();
      onClose();
    } catch (err) {
      console.error("Error saving grade:", err);
      const errorDetail = err.response?.data?.error || err.response?.data?.detail || "Error al guardar nota";
      alert(typeof errorDetail === 'string' ? errorDetail : JSON.stringify(errorDetail));
    } finally {
      setLoading(false);
    }
  };

  // Memoized options
  const enrolledProgramIds = useMemo(() => new Set(studentEnrollments.map(e => e.cohorte?.programa?.id).filter(Boolean)), [studentEnrollments]);
  const filteredCursos = useMemo(() => cursos.filter(c => enrolledProgramIds.has(c.id)), [cursos, enrolledProgramIds]);
  const enrolledBloquesDetailed = useMemo(() => {
    const map = new Map();
    studentEnrollments.forEach((e) => {
      const b = e.modulo?.bloque || e.cohorte?.bloque;
      if (b?.id && !map.has(b.id)) map.set(b.id, b);
    });
    return Array.from(map.values());
  }, [studentEnrollments]);
  const enrolledBloqueIds = useMemo(() => new Set(
    studentEnrollments
      .map(e => Number(e.modulo?.bloque?.id || e.cohorte?.bloque?.id))
      .filter(Boolean)
  ), [studentEnrollments]);
  const enrolledModulosByBloque = useMemo(() => {
    const map = new Map();
    studentEnrollments.forEach((e) => {
      const m = e.modulo;
      const bId = Number(m?.bloque?.id);
      if (!m?.id || !bId) return;
      if (!map.has(bId)) map.set(bId, new Map());
      map.get(bId).set(Number(m.id), m);
    });
    return map;
  }, [studentEnrollments]);
  const filteredBloquesOptions = useMemo(() => {
    const all = estructura?.bloques || [];
    const filtered = all.filter(b => enrolledBloqueIds.has(Number(b.id)));
    if (filtered.length > 0) return filtered;
    if (all.length > 0) return all;
    return enrolledBloquesDetailed;
  }, [estructura, enrolledBloqueIds, enrolledBloquesDetailed]);
  const enrolledModuloIds = useMemo(() => new Set(studentEnrollments.map(e => Number(e.modulo?.id)).filter(Boolean)), [studentEnrollments]);
  const filteredModulosOptions = useMemo(() => {
    if (!bloque) return [];
    // Ensure we handle both string and number IDs
    const bId = Number(bloque);
    const selectedBloque = filteredBloquesOptions.find(b => Number(b.id) === bId);
    const mods = selectedBloque?.modulos || [];

    // Fallback logic: 
    // 1. Try to filter by modules where student is actually enrolled
    const filtered = mods.filter(m => enrolledModuloIds.has(Number(m.id)));
    if (filtered.length > 0) return filtered;

    // 2. If no specific enrolling modulos found, show all modules of this block
    if (mods.length > 0) return mods;

    // 3. Last resort: check if enrolledModulosByBloque has anything
    const enrolledMap = enrolledModulosByBloque.get(bId);
    return enrolledMap ? Array.from(enrolledMap.values()) : [];
  }, [bloque, filteredBloquesOptions, enrolledModuloIds, enrolledModulosByBloque]);

  const examenOptions = useMemo(() => {
    if (!bloque) return [{ value: '', label: 'Selecciona bloque/módulo primero' }];
    if (!examenes || examenes.length === 0) return [{ value: '', label: 'No hay exámenes disponibles' }];
    return [
      { value: '', label: 'Seleccionar examen...' },
      ...examenes.map(ex => {
        let label = ex.tipo_examen;
        if (ex.tipo_examen === 'PARCIAL') label = 'PARCIAL (Módulo)';
        if (ex.tipo_examen === 'FINAL_VIRTUAL') label = 'EXAMEN VIRTUAL';
        if (ex.tipo_examen === 'FINAL_SINC') label = 'EXAMEN FINAL';
        if (ex.tipo_examen === 'EQUIVALENCIA') label = 'EQUIVALENCIA';
        return { value: ex.id, label };
      }),
    ];
  }, [bloque, examenes]);

  useEffect(() => {
    if (!curso && filteredCursos.length === 1) setCurso(String(filteredCursos[0].id));
  }, [curso, filteredCursos]);

  useEffect(() => {
    if (!bloque && filteredBloquesOptions.length === 1) {
      setBloque(String(filteredBloquesOptions[0].id));
    }
  }, [bloque, filteredBloquesOptions]);

  const cursoOptions = useMemo(() => [
    { value: '', label: 'Seleccionar curso...' },
    ...filteredCursos.map(c => ({ value: c.id, label: c.nombre }))
  ], [filteredCursos]);

  const bloqueOptions = useMemo(() => [
    { value: '', label: 'Seleccionar bloque...' },
    ...filteredBloquesOptions.map(b => ({ value: b.id, label: b.nombre }))
  ], [filteredBloquesOptions]);

  const moduloOptions = useMemo(() => [
    { value: '', label: 'Seleccionar módulo...' },
    ...filteredModulosOptions.map(m => ({
      value: m.id,
      label: m.nombre + (studentApprovedModuleIds.has(Number(m.id)) ? ' (Aprobado)' : '')
    }))
  ], [filteredModulosOptions, studentApprovedModuleIds]);

  return (
    <Modal isOpen={open} onClose={onClose} title="Añadir Nueva Nota / Equivalencia"
      actions={<><Button onClick={onClose} variant="ghost">Cancelar</Button><Button onClick={handleSave} disabled={!examen || !calificacion || existingNote || loading}>Guardar</Button></>}>

      <Select label="Curso" value={curso} onChange={e => setCurso(e.target.value)} options={cursoOptions} />
      <div className="flex gap-4">
        <div className="flex-1"><Select label="Bloque" value={bloque} onChange={e => setBloque(e.target.value)} disabled={!curso} options={bloqueOptions} /></div>
        <div className="flex-1"><Select label="Módulo" value={modulo} onChange={e => setModulo(e.target.value)} disabled={!bloque || (allModulesInBlockApproved && !modulo)} options={moduloOptions} /></div>
      </div>
      {allModulesInBlockApproved && <p className="text-sm text-green-400">Todos los módulos aprobados. Selecciona un Final.</p>}

      <Select
        label="Examen"
        value={examen}
        onChange={e => setExamen(e.target.value)}
        disabled={!bloque || !examenes || examenes.length === 0}
        options={examenOptions}
      />
      {existingNote && <div className="text-red-400 text-sm mt-1">Ya existe una nota aprobada para este examen.</div>}

      <div className="flex gap-4 mt-4">
        <div className="flex-1"><Input label="Calificación" type="number" value={calificacion} onChange={e => setCalificacion(e.target.value)} /></div>
        <div className="flex-1"><Input label="Fecha" type="date" value={fechaCalificacion} onChange={e => setFechaCalificacion(e.target.value)} /></div>
      </div>
      <div className="flex items-center gap-2 mt-4">
        <input type="checkbox" id="eq" checked={esEquivalencia} onChange={e => setEsEquivalencia(e.target.checked)} className="rounded bg-indigo-900 border-indigo-500" />
        <label htmlFor="eq" className="text-sm text-gray-300">Es Equivalencia</label>
      </div>
    </Modal>
  );
}

// --- Main Component: HistorialAcademico ---
export default function HistorialAcademico({ historial, setHistorial, selEstudiante, cursos, readOnly = false }) {
  const [filterPrograma, setFilterPrograma] = useState('');
  const [filterBloque, setFilterBloque] = useState('');
  const [filterModulo, setFilterModulo] = useState('');
  const [editingNotaId, setEditingNotaId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handlers for Edit/Delete
  const handleEditClick = (nota) => {
    setEditingNotaId(nota.id);
    setEditFormData({ calificacion: nota.calificacion, fecha_calificacion: nota.fecha_calificacion ? dayjs(nota.fecha_calificacion).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD') });
  };
  const handleCancelClick = () => setEditingNotaId(null);
  const handleFormChange = (e) => setEditFormData({ ...editFormData, [e.target.name]: e.target.value });

  const handleUpdate = async (notaId) => {
    setLoading(true);
    try {
      const original = historial.find(n => n.id === notaId);
      if (!original) return;
      const payload = { ...editFormData, estudiante: original.estudiante, examen: original.examen, calificacion: Number(editFormData.calificacion), aprobado: Number(editFormData.calificacion) >= 6 };
      const { data: updated } = await apiClient.put(`/examenes/notas/${notaId}`, payload);
      setHistorial(prev => prev.map(n => n.id === notaId ? updated : n));
      setEditingNotaId(null);
    } catch (e) { console.error(e); alert('Error al actualizar'); } finally { setLoading(false); }
  };

  const handleDelete = async (notaId) => {
    if (confirm('¿Eliminar nota?')) {
      setLoading(true);
      try {
        await apiClient.delete(`/examenes/notas/${notaId}`);
        setHistorial(prev => prev.filter(n => n.id !== notaId));
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
  };

  // Filter Logic
  const programasOptions = useMemo(() => Array.from(new Set(historial.map(h => h.examen_programa_nombre).filter(Boolean))), [historial]);
  const bloquesOptions = useMemo(() => Array.from(new Set(historial.filter(h => !filterPrograma || h.examen_programa_nombre === filterPrograma).map(h => h.examen_bloque_nombre).filter(Boolean))), [historial, filterPrograma]);
  const modulosOptions = useMemo(() => Array.from(new Set(historial.filter(h => !filterBloque || h.examen_bloque_nombre === filterBloque).map(h => h.examen_modulo_nombre).filter(Boolean))), [historial, filterBloque]);
  const filteredHistorial = useMemo(() => historial.filter(h => (!filterPrograma || h.examen_programa_nombre === filterPrograma) && (!filterBloque || h.examen_bloque_nombre === filterBloque) && (!filterModulo || h.examen_modulo_nombre === filterModulo)), [historial, filterPrograma, filterBloque, filterModulo]);

  useEffect(() => { setFilterBloque(''); setFilterModulo(''); }, [filterPrograma]);
  useEffect(() => { setFilterModulo(''); }, [filterBloque]);

  return (
    <>
      <Card className="bg-indigo-900/20 border-indigo-500/30 overflow-hidden">
        <div className="p-4 border-b border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Check className="text-brand-accent" /> Historial Académico
          </h2>
          {!readOnly && (
            <Button size="sm" onClick={() => setCreateModalOpen(true)} startIcon={<PlusCircle size={16} />}>Añadir Nota</Button>
          )}
        </div>

        {/* Filtros */}
        <div className="p-4 bg-indigo-950/30 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Filtrar Programa"
            value={filterPrograma}
            onChange={e => setFilterPrograma(e.target.value)}
            options={[{ value: '', label: 'Todos' }, ...programasOptions.map(p => ({ value: p, label: p }))]}
            className="text-xs"
          />
          <Select
            label="Filtrar Bloque"
            value={filterBloque}
            onChange={e => setFilterBloque(e.target.value)}
            disabled={!filterPrograma}
            options={[{ value: '', label: 'Todos' }, ...bloquesOptions.map(b => ({ value: b, label: b }))]}
            className="text-xs"
          />
          <Select
            label="Filtrar Módulo"
            value={filterModulo}
            onChange={e => setFilterModulo(e.target.value)}
            disabled={!filterBloque}
            options={[{ value: '', label: 'Todos' }, ...modulosOptions.map(m => ({ value: m, label: m }))]}
            className="text-xs"
          />
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-indigo-300 bg-indigo-950/50 uppercase text-xs font-semibold">
              <tr>
                <th className="px-4 py-3">Programa</th>
                <th className="px-4 py-3">Bloque / Módulo</th>
                <th className="px-4 py-3">Examen</th>
                <th className="px-4 py-3 text-center">Nota</th>
                <th className="px-4 py-3">Fecha</th>
                {!readOnly && <th className="px-4 py-3 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-500/10">
              {filteredHistorial.length > 0 ? (
                filteredHistorial.map(row => (
                  <tr key={row.id} className="hover:bg-white/5 transition-colors group">
                    {editingNotaId === row.id ? (
                      <>
                        <td colSpan={3} className="px-4 py-3 text-gray-400">Editando...</td>
                        <td className="px-4 py-3"><input type="number" name="calificacion" value={editFormData.calificacion} onChange={handleFormChange} className="w-16 bg-indigo-900 border border-indigo-500 rounded text-white px-1" /></td>
                        <td className="px-4 py-3"><input type="date" name="fecha_calificacion" value={editFormData.fecha_calificacion} onChange={handleFormChange} className="bg-indigo-900 border border-indigo-500 rounded text-white px-1" /></td>
                        <td className="px-4 py-3 text-right flex justify-end gap-2">
                          <button onClick={() => handleUpdate(row.id)} className="p-1 text-green-400 hover:text-green-300"><Check size={16} /></button>
                          <button onClick={handleCancelClick} className="p-1 text-red-400 hover:text-red-300"><X size={16} /></button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 font-medium text-white">{row.examen_programa_nombre}</td>
                        <td className="px-4 py-3 text-gray-300">{row.examen_bloque_nombre} / <span className="text-indigo-300">{row.examen_modulo_nombre}</span></td>
                        <td className="px-4 py-3 text-gray-300">
                          {row.examen_tipo_examen}
                          {row.intento > 1 && <span className="ml-2 text-[10px] text-indigo-400 font-normal px-1 border border-indigo-500/20 rounded">Intento {row.intento}</span>}
                          {row.es_nota_definitiva && (
                            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                              PROMEDIO/FINAL
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${row.aprobado ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {row.calificacion}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400">{row.fecha_calificacion ? dayjs.utc(row.fecha_calificacion).format('DD/MM/YYYY') : '-'}</td>
                        {!readOnly && (
                          <td className="px-4 py-3 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditClick(row)} className="p-1 text-indigo-400 hover:text-white mr-2"><Edit2 size={16} /></button>
                            <button onClick={() => handleDelete(row.id)} className="p-1 text-red-400 hover:text-red-300"><Trash2 size={16} /></button>
                          </td>
                        )}
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No hay registros académicos.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {!readOnly && isCreateModalOpen && (
        <CreateNotaModal
          open={isCreateModalOpen}
          onClose={() => setCreateModalOpen(false)}
          studentId={selEstudiante}
          cursos={cursos}
          onSave={() => {
            // Reload logic simplified
            (async () => {
              const { data } = await apiClient.get('/examenes/notas', { params: { estudiante_id: selEstudiante } });
              setHistorial(Array.isArray(data) ? data : []);
            })();
            setCreateModalOpen(false);
          }}
        />
      )}
    </>
  );
}
