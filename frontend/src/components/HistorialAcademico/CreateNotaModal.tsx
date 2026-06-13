import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import apiClient from '../../api/client';
import { listInscripciones } from '../../services/inscripcionesService';
import { listNotas } from '../../services/notasService';
import { Select, Button, Input } from '../UI';
import { Programa, Modulo } from '../../api/types';
import {
  ExamenSimple,
  HistorialNota,
  ExtendedNota,
  ExtendedInscripcion,
  BloqueConModulos,
  Estructura
} from './types';

// --- Funciones auxiliares para Carga de Datos (Modal) ---
async function fetchExamenesByModulo(moduloId: number | string): Promise<ExamenSimple[]> {
  const { data } = await apiClient.get<ExamenSimple[]>('/examenes', { params: { modulo_id: moduloId } });
  return data;
}

async function fetchExamenesFinalesByBloque(bloqueId: number | string): Promise<ExamenSimple[]> {
  const { data } = await apiClient.get<ExamenSimple[]>('/examenes', { params: { bloque_id: bloqueId } });
  return data;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions: React.ReactNode;
}

// --- Componente Modal (Custom Tailwind) ---
function Modal({ isOpen, onClose, title, children, actions }: ModalProps) {
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

export interface CreateNotaModalProps {
  open: boolean;
  onClose: () => void;
  studentId: number | string;
  cursos: Programa[];
  onSave: () => void;
}

export default function CreateNotaModal({ open, onClose, studentId, cursos, onSave }: CreateNotaModalProps) {
  const [curso, setCurso] = useState('');
  const [bloque, setBloque] = useState('');
  const [modulo, setModulo] = useState('');
  const [examen, setExamen] = useState('');
  const [calificacion, setCalificacion] = useState('');
  const [fechaCalificacion, setFechaCalificacion] = useState(dayjs().format('YYYY-MM-DD'));
  const [esEquivalencia, setEsEquivalencia] = useState(false);
  const [estructura, setEstructura] = useState<Estructura | null>(null);
  const [examenes, setExamenes] = useState<ExamenSimple[]>([]);
  const [existingNote, setExistingNote] = useState<HistorialNota | null>(null);
  const [studentEnrollments, setStudentEnrollments] = useState<ExtendedInscripcion[]>([]);
  const [approvedModuleExamTypes, setApprovedModuleExamTypes] = useState<Set<string>>(new Set());
  const [studentApprovedModuleIds, setStudentApprovedModuleIds] = useState<Set<number>>(new Set());
  const [allModulesInBlockApproved, setAllModulesInBlockApproved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!studentId) { setStudentEnrollments([]); return; }
    (async () => {
      try {
        const { results } = await listInscripciones({ estudiante_id: Number(studentId), estado: 'CURSANDO,APROBADO' });
        setStudentEnrollments(results as ExtendedInscripcion[] || []);
      } catch (error: unknown) { setStudentEnrollments([]); }
    })();
  }, [studentId]);

  useEffect(() => {
    if (!studentId || !modulo) { setApprovedModuleExamTypes(new Set()); return; }
    (async () => {
      try {
        const { results } = await listNotas({ estudiante_id: Number(studentId), modulo_id: Number(modulo), aprobado: true });
        setApprovedModuleExamTypes(new Set((results as ExtendedNota[] || []).map(nota => nota.examen_tipo_examen || "")));
      } catch (error: unknown) { setApprovedModuleExamTypes(new Set()); }
    })();
  }, [studentId, modulo]);

  useEffect(() => {
    if (!studentId) { setStudentApprovedModuleIds(new Set()); return; }
    (async () => {
      try {
        const { results } = await listNotas({ estudiante_id: Number(studentId), aprobado: true });
        setStudentApprovedModuleIds(new Set((results as ExtendedNota[] || []).map(nota => Number(nota.examen_modulo_id)).filter(Boolean)));
      } catch (error: unknown) { setStudentApprovedModuleIds(new Set()); }
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
      try {
        const { data } = await apiClient.get<HistorialNota[]>('/examenes/notes-check', {
          params: { estudiante_id: studentId, examen_id: examen, aprobado: true }
        });
        setExistingNote((data && data.length > 0) ? data[0] : null);
      } catch (error: unknown) {
        try {
          const { data } = await apiClient.get<HistorialNota[]>('/examenes/notas', {
            params: { estudiante_id: studentId, examen_id: examen, aprobado: true }
          });
          setExistingNote((data && data.length > 0) ? data[0] : null);
        } catch (innerErr: unknown) {
          setExistingNote(null);
        }
      }
    })();
  }, [examen, studentId]);

  useEffect(() => {
    if (!curso) { setEstructura(null); setBloque(''); setModulo(''); setExamen(''); return; }
    (async () => {
      try {
        const { data: bloquesData } = await apiClient.get<Omit<BloqueConModulos, "modulos">[]>('/bloques', { params: { programa_id: curso } });
        const bloquesConModulos = await Promise.all((bloquesData || []).map(async (b) => {
          const { data: modsData } = await apiClient.get<Modulo[]>('/modulos', { params: { bloque_id: b.id } });
          return { ...b, modulos: modsData || [] } as BloqueConModulos;
        }));
        setEstructura({ bloques: bloquesConModulos });
      } catch (err: unknown) { setEstructura({ bloques: [] }); }
    })();
  }, [curso]);

  useEffect(() => { setModulo(''); setExamen(''); }, [bloque]);
  useEffect(() => { setExamen(''); }, [modulo]);

  useEffect(() => {
    const fetchAndFilterExams = async () => {
      let fetchedExams: ExamenSimple[] = [];
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
      } else if (['PARCIAL', 'RECUP'].includes(selectedExamen?.tipo_examen || "")) {
        await apiClient.post('/examenes/registro/nota-parcial', payload);
      } else {
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
    } catch (err: unknown) {
      console.error("Error saving grade:", err);
      const axiosError = err as { response?: { data?: { error?: string; detail?: string } } };
      const errorDetail = axiosError.response?.data?.error || axiosError.response?.data?.detail || "Error al guardar nota";
      alert(typeof errorDetail === 'string' ? errorDetail : JSON.stringify(errorDetail));
    } finally {
      setLoading(false);
    }
  };

  // Memoized options
  const enrolledProgramIds = useMemo(() => new Set(studentEnrollments.map(e => e.cohorte?.programa?.id).filter(Boolean)), [studentEnrollments]);
  const filteredCursos = useMemo(() => cursos.filter(c => enrolledProgramIds.has(c.id)), [cursos, enrolledProgramIds]);
  const enrolledBloquesDetailed = useMemo(() => {
    const map = new Map<number, { id: number; nombre: string }>();
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
    const map = new Map<number, Map<number, Modulo>>();
    studentEnrollments.forEach((e) => {
      const m = e.modulo;
      const bId = Number(m?.bloque?.id);
      if (!m?.id || !bId) return;
      if (!map.has(bId)) map.set(bId, new Map<number, Modulo>());
      map.get(bId)!.set(Number(m.id), m);
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
    const bId = Number(bloque);
    const selectedBloque = filteredBloquesOptions.find(b => Number(b.id) === bId);
    const mods = (selectedBloque as { modulos?: Modulo[] })?.modulos || [];

    const filtered = mods.filter(m => enrolledModuloIds.has(Number(m.id)));
    if (filtered.length > 0) return filtered;

    if (mods.length > 0) return mods;

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
        return { value: String(ex.id), label };
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
    ...filteredCursos.map(c => ({ value: String(c.id), label: c.nombre }))
  ], [filteredCursos]);

  const bloqueOptions = useMemo(() => [
    { value: '', label: 'Seleccionar bloque...' },
    ...filteredBloquesOptions.map(b => ({ value: String(b.id), label: b.nombre }))
  ], [filteredBloquesOptions]);

  const moduloOptions = useMemo(() => [
    { value: '', label: 'Seleccionar módulo...' },
    ...filteredModulosOptions.map(m => ({
      value: String(m.id),
      label: m.nombre + (studentApprovedModuleIds.has(Number(m.id)) ? ' (Aprobado)' : '')
    }))
  ], [filteredModulosOptions, studentApprovedModuleIds]);

  return (
    <Modal isOpen={open} onClose={onClose} title="Añadir Nueva Nota / Equivalencia"
      actions={<><Button onClick={onClose} variant="ghost">Cancelar</Button><Button onClick={handleSave} disabled={!examen || !calificacion || !!existingNote || loading}>Guardar</Button></>}>

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
