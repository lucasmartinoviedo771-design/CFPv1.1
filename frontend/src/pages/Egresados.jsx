import React, { useEffect, useState } from 'react';
import { listProgramas } from '../services/programasService';
import api from '../api/client';
import analytics from '../services/analyticsService';
import { Card, Select, Button } from '../components/UI';
import { GraduationCap, Users } from 'lucide-react';

export default function Egresados() {
  const [programas, setProgramas] = useState([]);
  const [cohortes, setCohortes] = useState([]);
  const [programaId, setProgramaId] = useState('');
  const [cohorteId, setCohorteId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const progs = await listProgramas();
        setProgramas(Array.isArray(progs) ? progs : []);
      } catch (e) { }
    })();
  }, []);

  useEffect(() => {
    const loadCohortes = async () => {
      if (!programaId) { setCohortes([]); setCohorteId(''); return; }
      try {
        const res = await api.get('/inscripciones/cohortes', { params: { programa_id: programaId } });
        setCohortes(Array.isArray(res.data) ? res.data : []);
      } catch (e) { setCohortes([]); }
    };
    loadCohortes();
  }, [programaId]);

  const fetchGraduates = async () => {
    setLoading(true); setError(''); setData(null);
    try {
      const params = {};
      if (cohorteId) params.cohorte_id = cohorteId; else if (programaId) params.programa_id = programaId;
      const d = await analytics.getGraduates(params);
      setData(d);
    } catch (e) {
      setError('Error al cargar egresados');
    } finally {
      setLoading(false);
    }
  };

  const programasOptions = programas.map(p => ({ value: p.id, label: p.nombre }));
  const cohortesOptions = cohortes.map(c => ({ value: c.id, label: c.nombre }));

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Egresados</h1>
        <p className="text-indigo-300">Consulta el listado de estudiantes graduados por programa.</p>
      </div>

      <Card className="bg-indigo-900/20 border-indigo-500/30">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-64">
            <Select
              label="Programa"
              value={programaId}
              onChange={(e) => { setProgramaId(e.target.value); setData(null); }}
              options={[{ value: '', label: 'Seleccionar...' }, ...programasOptions]}
              className="bg-indigo-950/50 border-indigo-500/30 text-white"
            />
          </div>
          <div className="w-full md:w-64">
            <Select
              label="Cohorte (Opcional)"
              value={cohorteId}
              onChange={(e) => { setCohorteId(e.target.value); setData(null); }}
              disabled={!programaId}
              options={[{ value: '', label: 'Todas las cohortes' }, ...cohortesOptions]}
              className="bg-indigo-900/50 border-indigo-500/30 text-white"
            />
          </div>
          <div className="flex-none pb-0.5">
            <Button
              onClick={fetchGraduates}
              className="bg-brand-accent hover:bg-orange-600 border-none px-6"
              disabled={!programaId}
              isLoading={loading}
            >
              Cargar Reporte
            </Button>
          </div>
        </div>
      </Card>

      {error && <div className="text-red-400 bg-red-500/10 p-4 rounded-lg border border-red-500/20">{error}</div>}

      {data && (
        <Card className="bg-indigo-900/20 border-indigo-500/30">
          <div className="border-b border-indigo-500/20 pb-4 mb-4 flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg text-brand-cyan">
              <GraduationCap size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{data.programa?.nombre} {data.cohorte_id ? `(Cohorte ${data.cohorte_id})` : ''}</h3>
              <p className="text-sm text-indigo-300">
                Bloques req: {data.overall?.total_bloques_requeridos} —
                <span className="text-green-400 font-bold mx-1">
                  Egresados: {data.overall?.graduados} / {data.overall?.total_estudiantes} ({Math.round((data.overall?.rate || 0) * 100)}%)
                </span>
              </p>
            </div>
          </div>

          {!data.graduados || data.graduados.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No se encontraron egresados para los filtros seleccionados.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.graduados.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/10 hover:border-brand-cyan/30 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                    {s.nombre.charAt(0)}{s.apellido.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{s.apellido}, {s.nombre}</p>
                    <p className="text-xs text-indigo-300">DNI: {s.dni}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
