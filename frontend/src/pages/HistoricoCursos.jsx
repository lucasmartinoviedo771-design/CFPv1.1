import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { Card, Select, Button } from '../components/UI';
import { Search, AlertCircle } from 'lucide-react';
import { formatDateDisplay } from '../utils/dateFormat';
import { listProgramas } from '../services/programasService';

export default function HistoricoCursos() {
  const [programas, setProgramas] = useState([]);
  const [bloques, setBloques] = useState([]);
  const [cohortes, setCohortes] = useState([]);
  const [selectedPrograma, setSelectedPrograma] = useState('');
  const [selectedBloque, setSelectedBloque] = useState('');
  const [selectedCohorte, setSelectedCohorte] = useState('');
  const [tipoDato, setTipoDato] = useState('notas');
  const [searchTerm, setSearchTerm] = useState('');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const progs = await listProgramas();
        setProgramas(Array.isArray(progs) ? progs : []);
      } catch (err) {
        console.error("Error al cargar programas:", err);
        setError("No se pudieron cargar los programas.");
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [cohortesRes, bloquesRes] = await Promise.all([
          apiClient.get('/inscripciones/cohortes', { 
            params: { 
              programa_id: selectedPrograma || undefined,
              bloque_id: selectedBloque || undefined
            } 
          }),
          apiClient.get('/bloques', { params: { programa_id: selectedPrograma || undefined } }),
        ]);
        setCohortes(Array.isArray(cohortesRes.data) ? cohortesRes.data : []);
        setBloques(Array.isArray(bloquesRes.data) ? bloquesRes.data : []);
      } catch (err) {
        console.error("Error al cargar cohortes/bloques:", err);
        setError("No se pudieron cargar cohortes y bloques.");
      }
    })();
  }, [selectedPrograma, selectedBloque]);

  const handleBuscar = () => {
    setLoading(true);
    setError(null);
    setData(null);

    apiClient.get('/historico-cursos', {
      params: {
        tipo_dato: tipoDato,
        programa_id: selectedPrograma || undefined,
        bloque_id: selectedBloque || undefined,
        cohorte_id: selectedCohorte || undefined,
      },
    })
      .then(response => {
        setData(response.data);
      })
      .catch(err => {
        console.error("Error al buscar datos:", err);
        setError("Ocurrió un error al obtener los datos.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const programasOptions = programas.map(p => ({ value: p.id, label: p.nombre }));
  const bloquesOptions = bloques.map(b => ({ value: b.id, label: b.nombre }));
  const cohorteOptions = cohortes.map(c => ({ value: c.id, label: c.nombre }));
  const tipoOptions = [
    { value: 'notas', label: 'Notas' },
    { value: 'asistencia', label: 'Asistencia' }
  ];
  const looksLikeDate = (value) => typeof value === 'string'
    && (
      /^\d{4}-\d{2}-\d{2}$/.test(value)
      || /^\d{4}-\d{2}-\d{2}T/.test(value)
      || /^\d{2}\/\d{2}\/\d{4}$/.test(value)
    );

  const renderCellValue = (header, rawValue) => {
    if (rawValue === null || rawValue === undefined) return '-';
    if (looksLikeDate(rawValue)) return formatDateDisplay(rawValue);
    if (typeof header === 'string' && header.toLowerCase().includes('fecha') && typeof rawValue === 'string') {
      return formatDateDisplay(rawValue);
    }
    return String(rawValue);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Histórico por Cursos</h1>
          <p className="text-indigo-300">Consulta de calificaciones y asistencia por cohorte.</p>
        </div>
      </div>

      {/* Panel de Filtros */}
      <Card className="bg-indigo-900/20 border-indigo-500/30">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-64">
            <Select
              label="Programa"
              id="programa-select"
              value={selectedPrograma}
              onChange={e => {
                setSelectedPrograma(e.target.value);
                setSelectedBloque('');
                setSelectedCohorte('');
              }}
              options={[{ value: '', label: 'Todos' }, ...programasOptions]}
              className="bg-indigo-950/50 border-indigo-500/30 text-white"
            />
          </div>
          <div className="w-full md:w-64">
            <Select
              label="Bloque"
              id="bloque-select"
              value={selectedBloque}
              onChange={e => {
                setSelectedBloque(e.target.value);
                setSelectedCohorte('');
              }}
              options={[{ value: '', label: 'Todos' }, ...bloquesOptions]}
              className="bg-indigo-950/50 border-indigo-500/30 text-white"
            />
          </div>
          <div className="w-full md:w-64">
            <Select
              label="Cohorte"
              id="cohorte-select"
              value={selectedCohorte}
              onChange={e => setSelectedCohorte(e.target.value)}
              options={[{ value: '', label: 'Todos' }, ...cohorteOptions]}
              className="bg-indigo-950/50 border-indigo-500/30 text-white"
            />
          </div>

          <div className="w-full md:w-48">
            <Select
              label="Tipo de Dato"
              id="tipo-dato-select"
              value={tipoDato}
              onChange={e => setTipoDato(e.target.value)}
              options={tipoOptions}
              className="bg-indigo-950/50 border-indigo-500/30 text-white"
            />
          </div>

          <div className="flex-none">
            <Button
              onClick={handleBuscar}
              isLoading={loading}
              className="bg-brand-accent hover:bg-orange-600 text-white border-none shadow-lg shadow-orange-500/20"
              startIcon={<Search size={18} />}
            >
              Buscar
            </Button>
          </div>
        </div>
      </Card>

      {/* Mensajes de Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center text-red-200">
          <AlertCircle className="mr-2" size={20} />
          {error}
        </div>
      )}

      {/* Resultados */}
      {data && (() => {
        const filteredRows = (data.rows || []).filter(row => {
          if (!searchTerm) return true;
          const searchLower = searchTerm.toLowerCase();
          const estudiante = String(row.Estudiante || '').toLowerCase();
          const dni = String(row.DNI || '').toLowerCase();
          return estudiante.includes(searchLower) || dni.includes(searchLower);
        });

        return (
          <Card className="bg-indigo-900/20 border-indigo-500/30 overflow-hidden">
            <div className="p-4 border-b border-indigo-500/30 bg-indigo-950/30 flex justify-between items-center">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
                <input
                  type="text"
                  placeholder="Filtrar por Apellido, Nombre o DNI..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-indigo-900/40 border border-indigo-500/30 rounded-lg py-2 pl-10 pr-4 text-white placeholder-indigo-400/50 focus:outline-none focus:border-brand-cyan transition-colors"
                />
              </div>
              <span className="text-sm text-indigo-300 hidden md:inline-block">
                Mostrando {filteredRows.length} resultados
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-indigo-500/30">
              <thead className="bg-indigo-950/50">
                <tr>
                  {data.headers && data.headers.map(header => (
                    <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-500/10 bg-transparent">
                {filteredRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    {data.headers.map(header => (
                      <td key={`${row.ID}-${header}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {renderCellValue(header, row[header])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRows.length === 0 && (
              <div className="p-8 text-center text-indigo-300">
                {searchTerm ? 'No hay resultados para la búsqueda actual.' : 'No se encontraron datos para la selección.'}
              </div>
            )}
          </div>
        </Card>
        );
      })()}
    </div>
  );
}
