import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import axios from 'axios';
import authService from '../services/authService';
import { Card, Select, Button } from '../components/UI';
import { Search, AlertCircle } from 'lucide-react';

export default function HistoricoCursos() {
  const [cohortes, setCohortes] = useState([]);
  const [selectedCohorte, setSelectedCohorte] = useState('');
  const [tipoDato, setTipoDato] = useState('notas');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Cargar las cohortes para el selector
    apiClient.get('/inscripciones/cohortes')
      .then(response => {
        setCohortes(Array.isArray(response.data) ? response.data : []);
      })
      .catch(err => {
        console.error("Error al cargar cohortes:", err);
        setError("No se pudieron cargar las cohortes. Verifica la conexión.");
      });
  }, []);

  const handleBuscar = () => {
    if (!selectedCohorte) {
      setError("Por favor, selecciona una cohorte.");
      return;
    }
    setLoading(true);
    setError(null);
    setData(null);

    const token = authService.getAccessToken();
    // Usamos el endpoint configurado, ajusta la URL base si es necesario en axios
    // O mejor aún, usamos apiClient para mantener la configuración base
    apiClient.get(`/historico-cursos/?cohorte_id=${selectedCohorte}&tipo_dato=${tipoDato}`)
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

  // Convertir cohortes a formato {value, label} para el Select
  const cohorteOptions = cohortes.map(c => ({ value: c.id, label: c.nombre }));
  const tipoOptions = [
    { value: 'notas', label: 'Notas' },
    { value: 'asistencia', label: 'Asistencia' }
  ];

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
              label="Cohorte"
              id="cohorte-select"
              value={selectedCohorte}
              onChange={e => setSelectedCohorte(e.target.value)}
              options={[{ value: '', label: 'Seleccionar...' }, ...cohorteOptions]}
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
      {data && (
        <Card className="bg-indigo-900/20 border-indigo-500/30 overflow-hidden">
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
                {data.rows && data.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    {data.headers.map(header => (
                      <td key={`${row.ID}-${header}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {row[header] !== null && row[header] !== undefined ? String(row[header]) : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {(!data.rows || data.rows.length === 0) && (
              <div className="p-8 text-center text-indigo-300">
                No se encontraron datos para la selección.
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
