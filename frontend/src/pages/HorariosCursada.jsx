import React, { useEffect, useMemo, useState } from 'react';
import { Card, Select, Button, Input } from '../components/UI';
import api from '../api/client';
import { EditOutlined, DeleteOutline } from '@mui/icons-material';

const DIAS = [
  { value: 'LUNES', label: 'Lunes' },
  { value: 'MARTES', label: 'Martes' },
  { value: 'MIERCOLES', label: 'Miércoles' },
  { value: 'JUEVES', label: 'Jueves' },
  { value: 'VIERNES', label: 'Viernes' },
  { value: 'SABADO', label: 'Sábado' },
  { value: 'DOMINGO', label: 'Domingo' },
];

const emptyForm = {
  programa_id: '',
  cohorte_id: '',
  bloque_id: '',
  modulo_id: '',
  docente_id: '',
  dia_semana: 'LUNES',
  hora_inicio: '',
  hora_fin: '',
};

const add40Minutes = (hhmm) => {
  if (!hhmm || !hhmm.includes(':')) return '';
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return '';
  const total = (h * 60 + m + 40) % (24 * 60);
  const nextH = String(Math.floor(total / 60)).padStart(2, '0');
  const nextM = String(total % 60).padStart(2, '0');
  return `${nextH}:${nextM}`;
};

export default function HorariosCursada() {
  const [programas, setProgramas] = useState([]);
  const [bloques, setBloques] = useState([]);
  const [cohortes, setCohortes] = useState([]);
  const [modulos, setModulos] = useState([]); // Filtered for Select
  const [allModulos, setAllModulos] = useState([]); // All loaded modules
  const [horarios, setHorarios] = useState([]);
  const [docentes, setDocentes] = useState([]);

  const [filterProgramaId, setFilterProgramaId] = useState('');
  const [filterBloqueId, setFilterBloqueId] = useState('');
  const [filterCohorteId, setFilterCohorteId] = useState('');
  const [showPastYears, setShowPastYears] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });
  const currentYear = new Date().getFullYear();

  const isCohorteVisibleByYear = (cohorte) => {
    if (showPastYears) return true;
    const y = Number(String(cohorte?.fecha_inicio || '').slice(0, 4));
    if (!y) return true;
    return y === currentYear;
  };

  const fetchAll = async () => {
    try {
      const { data } = await api.get('/horarios-cursada/metadata');
      setProgramas(Array.isArray(data.programas) ? data.programas : []);
      setBloques(Array.isArray(data.bloques) ? data.bloques : []);
      setCohortes(Array.isArray(data.cohortes) ? data.cohortes : []);
      setHorarios(Array.isArray(data.horarios) ? data.horarios : []);
      setDocentes(Array.isArray(data.docentes) ? data.docentes : []);
      setAllModulos(Array.isArray(data.modulos) ? data.modulos : []);
    } catch {
      setFeedback({ open: true, message: 'Error cargando datos iniziales', severity: 'error' });
    }
  };

  useEffect(() => {
    fetchAll().catch(() => { });
  }, []);

  useEffect(() => {
    const bloqueId = form.bloque_id;
    if (!bloqueId) {
      setModulos([]);
      return;
    }
    // Filter from allModulos instead of API call
    const filtered = allModulos.filter(m => String(m.bloque_id) === String(bloqueId));
    setModulos(filtered);
  }, [form.bloque_id, allModulos]);

  const bloquesFiltrados = useMemo(() => {
    if (!filterProgramaId) return bloques;
    return bloques.filter((b) => String(b.programa_id) === String(filterProgramaId));
  }, [bloques, filterProgramaId]);

  const bloquesFormOptions = useMemo(() => {
    if (!form.programa_id) return [];
    return bloques.filter((b) => String(b.programa_id) === String(form.programa_id));
  }, [bloques, form.programa_id]);

  const cohortesFiltradas = useMemo(() => {
    return cohortes.filter((c) => {
      if (!isCohorteVisibleByYear(c)) return false;
      if (filterProgramaId && String(c.programa_id) !== String(filterProgramaId)) return false;
      if (filterBloqueId && String(c.bloque_id || '') !== String(filterBloqueId)) return false;
      return true;
    });
  }, [cohortes, filterProgramaId, filterBloqueId, showPastYears]);

  const horariosFiltrados = useMemo(() => {
    return horarios.filter((h) => {
      const coh = cohortes.find((c) => c.id === h.cohorte_id);
      if (!coh) return false;
      if (!isCohorteVisibleByYear(coh)) return false;
      if (filterProgramaId && String(coh.programa_id) !== String(filterProgramaId)) return false;
      if (filterBloqueId && String(h.bloque_id) !== String(filterBloqueId)) return false;
      if (filterCohorteId && String(h.cohorte_id) !== String(filterCohorteId)) return false;
      return true;
    });
  }, [horarios, cohortes, filterProgramaId, filterBloqueId, filterCohorteId, showPastYears]);

  const cohortesFormOptions = useMemo(() => {
    return cohortes.filter((c) => {
      if (!form.bloque_id) return false;
      if (!isCohorteVisibleByYear(c) && String(c.id) !== String(form.cohorte_id || '')) return false;
      return String(c.bloque_id || '') === String(form.bloque_id);
    });
  }, [cohortes, form.bloque_id, form.cohorte_id, showPastYears]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const onEdit = (h) => {
    const horaInicio = (h.hora_inicio || '').slice(0, 5);
    setEditingId(h.id);
    const coh = cohortes.find(c => c.id === h.cohorte_id);
    setForm({
      programa_id: coh ? String(coh.programa_id) : '',
      cohorte_id: String(h.cohorte_id || ''),
      bloque_id: String(h.bloque_id || ''),
      modulo_id: h.modulo_id ? String(h.modulo_id) : '',
      docente_id: h.docente_id ? String(h.docente_id) : '',
      dia_semana: h.dia_semana,
      hora_inicio: horaInicio,
      hora_fin: add40Minutes(horaInicio),
    });
  };

  const onDelete = async (id) => {
    if (!window.confirm('¿Eliminar este horario?')) return;
    await api.delete(`/horarios-cursada/${id}`);
    await fetchAll();
    setFeedback({ open: true, message: 'Horario eliminado', severity: 'success' });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.cohorte_id || !form.bloque_id || !form.dia_semana || !form.hora_inicio) return;

    setSaving(true);
    try {
      const horaFinCalculada = add40Minutes(form.hora_inicio);
      const payload = {
        cohorte_id: Number(form.cohorte_id),
        bloque_id: Number(form.bloque_id),
        modulo_id: form.modulo_id ? Number(form.modulo_id) : null,
        docente_id: form.docente_id ? Number(form.docente_id) : null,
        dia_semana: form.dia_semana,
        hora_inicio: form.hora_inicio,
        hora_fin: horaFinCalculada,
      };
      if (editingId) {
        await api.put(`/horarios-cursada/${editingId}`, payload);
        resetForm(); // Reset only on edit success
        setFeedback({ open: true, message: 'Horario actualizado', severity: 'success' });
      } else {
        await api.post('/horarios-cursada', payload);
        // Do NOT reset form on create success, per user request
        setFeedback({ open: true, message: 'Horario creado exitosamente. Puedes seguir cargando.', severity: 'success' });
      }
      await fetchAll();
    } catch (error) {
      console.error(error);
      setFeedback({ open: true, message: 'Error al guardar.', severity: 'error' });
    } finally {
      setSaving(false);
      // Auto-hide feedback after 3s
      setTimeout(() => setFeedback(prev => ({ ...prev, open: false })), 3000);
    }
  };

  const getPrograma = (cohorteId) => {
    const coh = cohortes.find((c) => c.id === cohorteId);
    return programas.find((p) => p.id === coh?.programa_id)?.nombre || '-';
  };

  const getBloque = (bloqueId) => bloques.find((b) => b.id === bloqueId)?.nombre || '-';
  const getCohorte = (cohorteId) => {
    const c = cohortes.find((x) => x.id === cohorteId);
    if (!c) return '-';
    return `${c.nombre} (${c.fecha_inicio || '-'})`;
  };
  const getModulo = (moduloId) => allModulos.find((m) => m.id === moduloId)?.nombre || '-';

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Horarios de Cursada</h1>
        <p className="text-indigo-300">Define días y horarios para bloques y módulos por cohorte.</p>
      </div>

      <Card className="bg-indigo-900/20 border-indigo-500/30" title={editingId ? 'Editar Horario' : 'Nuevo Horario'}>
        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Programa"
              value={form.programa_id || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, programa_id: e.target.value, bloque_id: '', cohorte_id: '', modulo_id: '' }))}
              options={[{ value: '', label: 'Seleccionar...' }, ...programas.map((p) => ({ value: p.id, label: p.nombre }))]}
            />
            <Select
              label="Bloque"
              value={form.bloque_id}
              onChange={(e) => setForm((prev) => ({ ...prev, bloque_id: e.target.value, cohorte_id: '', modulo_id: '' }))}
              options={[{ value: '', label: 'Seleccionar...' }, ...bloquesFormOptions.map((b) => ({ value: b.id, label: b.nombre }))]}
            />
            <Select
              label="Cohorte"
              value={form.cohorte_id}
              onChange={(e) => setForm((prev) => ({ ...prev, cohorte_id: e.target.value }))}
              options={[{ value: '', label: 'Seleccionar...' }, ...cohortesFormOptions.map((c) => ({ value: c.id, label: `${c.nombre} (${c.fecha_inicio || '-'})` }))]}
            />
            <Select
              label="Módulo (opcional)"
              value={form.modulo_id}
              onChange={(e) => setForm((prev) => ({ ...prev, modulo_id: e.target.value }))}
              options={[{ value: '', label: 'Bloque completo' }, ...modulos.map((m) => ({ value: m.id, label: m.nombre }))]}
            />
            <Select
              label="Docente (opcional)"
              value={form.docente_id}
              onChange={(e) => setForm((prev) => ({ ...prev, docente_id: e.target.value }))}
              options={[
                { value: '', label: 'Sin asignar' },
                ...docentes.map((d) => ({ value: d.id, label: `${d.first_name || ''} ${d.last_name || ''}`.trim() || d.username })),
              ]}
            />
            <Select
              label="Día"
              value={form.dia_semana}
              onChange={(e) => setForm((prev) => ({ ...prev, dia_semana: e.target.value }))}
              options={DIAS}
            />
            <Input
              label="Hora Inicio"
              type="time"
              value={form.hora_inicio}
              onChange={(e) => setForm((prev) => {
                const nextInicio = e.target.value;
                return { ...prev, hora_inicio: nextInicio, hora_fin: add40Minutes(nextInicio) };
              })}
            />
            <Input
              label="Hora Fin"
              type="time"
              value={form.hora_fin}
              disabled
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            {!editingId && (
              <Button type="button" variant="outline" onClick={resetForm}>
                Limpiar todo
              </Button>
            )}
            {editingId && (
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar edición
              </Button>
            )}
            <Button type="submit" disabled={saving}>
              {editingId ? 'Guardar cambios' : 'Crear horario'}
            </Button>
          </div>
        </form>
      </Card>

      {feedback.open && (
        <div className={`fixed bottom-4 right-4 p-4 rounded shadow-xl border flex items-center gap-2 z-50 ${feedback.severity === 'error' ? 'bg-red-900 border-red-500 text-white' : 'bg-green-900 border-green-500 text-white'}`}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback({ ...feedback, open: false })} className="ml-2 font-bold">X</button>
        </div>
      )}

      <Card className="bg-indigo-900/20 border-indigo-500/30" title="Filtros de listado">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Programa"
            value={filterProgramaId}
            onChange={(e) => { setFilterProgramaId(e.target.value); setFilterBloqueId(''); setFilterCohorteId(''); }}
            options={[{ value: '', label: 'Todos' }, ...programas.map((p) => ({ value: p.id, label: p.nombre }))]}
          />
          <Select
            label="Bloque"
            value={filterBloqueId}
            onChange={(e) => { setFilterBloqueId(e.target.value); setFilterCohorteId(''); }}
            options={[{ value: '', label: 'Todos' }, ...bloquesFiltrados.map((b) => ({ value: b.id, label: b.nombre }))]}
          />
          <Select
            label="Cohorte"
            value={filterCohorteId}
            onChange={(e) => setFilterCohorteId(e.target.value)}
            options={[{ value: '', label: 'Todas' }, ...cohortesFiltradas.map((c) => ({ value: c.id, label: `${c.nombre} (${c.fecha_inicio || '-'})` }))]}
          />
          <label className="md:col-span-3 mt-1 inline-flex items-center gap-2 text-indigo-200 text-sm">
            <input
              type="checkbox"
              checked={showPastYears}
              onChange={(e) => setShowPastYears(e.target.checked)}
            />
            Mostrar años pasados (por defecto solo año {currentYear})
          </label>
          <p className="md:col-span-3 text-xs text-indigo-300">
            Coincidencias en la tabla: {horariosFiltrados.length}
          </p>
        </div>
      </Card>

      <Card className="bg-indigo-900/20 border-indigo-500/30" title="Horarios cargados">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#1e1b4b] text-indigo-300 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Programa</th>
                <th className="px-4 py-3">Bloque</th>
                <th className="px-4 py-3">Cohorte</th>
                <th className="px-4 py-3">Módulo</th>
                <th className="px-4 py-3">Docente</th>
                <th className="px-4 py-3">Día</th>
                <th className="px-4 py-3">Inicio</th>
                <th className="px-4 py-3">Fin</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-500/10">
              {horariosFiltrados.map((h) => (
                <tr key={h.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 text-white">{getPrograma(h.cohorte_id)}</td>
                  <td className="px-4 py-3 text-indigo-100">{getBloque(h.bloque_id)}</td>
                  <td className="px-4 py-3 text-indigo-100">{getCohorte(h.cohorte_id)}</td>
                  <td className="px-4 py-3 text-indigo-100">{h.modulo_id ? getModulo(h.modulo_id) : 'Bloque completo'}</td>
                  <td className="px-4 py-3 text-indigo-100">{h.docente_nombre || 'Sin asignar'}</td>
                  <td className="px-4 py-3 text-indigo-100">{DIAS.find((d) => d.value === h.dia_semana)?.label || h.dia_semana}</td>
                  <td className="px-4 py-3 text-indigo-100">{String(h.hora_inicio || '').slice(0, 5)}</td>
                  <td className="px-4 py-3 text-indigo-100">{String(h.hora_fin || '').slice(0, 5)}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-indigo-300 hover:text-white mr-3" onClick={() => onEdit(h)}><EditOutlined fontSize="small" /></button>
                    <button className="text-red-300 hover:text-red-100" onClick={() => onDelete(h.id)}><DeleteOutline fontSize="small" /></button>
                  </td>
                </tr>
              ))}
              {horariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-indigo-300">No hay horarios cargados.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
