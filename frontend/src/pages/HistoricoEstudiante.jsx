import React, { useEffect, useState } from 'react';
import apiClient from '../services/apiClient';
import HistorialAcademico from '../components/HistorialAcademico';
import { Card, Select } from '../components/UI';
import { UserSearch } from 'lucide-react';

async function fetchEstudiantes() {
  try {
    const { data } = await apiClient.get('/estudiantes');
    if (Array.isArray(data)) return data;
    return [];
  } catch (error) {
    console.error("Error fetching students:", error);
    return [];
  }
}

export default function HistoricoEstudiante() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [selEstudiante, setSelEstudiante] = useState('');
  const [historial, setHistorial] = useState([]);

  useEffect(() => {
    (async () => {
      setEstudiantes(await fetchEstudiantes());
    })();
  }, []);

  useEffect(() => {
    if (!selEstudiante) {
      setHistorial([]);
      return;
    }
    (async () => {
      try {
        const { data } = await apiClient.get('/examenes/notas', { params: { estudiante_id: selEstudiante } });
        setHistorial(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching history:", error);
      }
    })();
  }, [selEstudiante]);

  // Transformar estudiantes para el Select
  const studentOptions = estudiantes.map(e => ({
    value: e.id,
    label: `${e.apellido}, ${e.nombre} (DNI: ${e.dni})`
  }));

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Histórico por Estudiante</h1>
        <p className="text-indigo-300">Consulta el legajo académico completo de un alumno.</p>
      </div>

      <Card className="bg-indigo-900/20 border-indigo-500/30">
        <div className="flex items-end gap-4">
          <div className="flex-1 max-w-md">
            <Select
              label="Seleccionar Estudiante"
              id="student-select"
              value={selEstudiante}
              onChange={(e) => setSelEstudiante(e.target.value)}
              options={[{ value: '', label: 'Buscar estudiante...' }, ...studentOptions]}
              className="bg-indigo-950/50 border-indigo-500/30 text-white"
            />
          </div>
          <div className="pb-2 text-indigo-400">
            <UserSearch size={24} />
          </div>
        </div>
      </Card>

      {selEstudiante && (
        <div className="animate-fade-in-up">
          <HistorialAcademico
            historial={historial}
            setHistorial={setHistorial}
            selEstudiante={selEstudiante}
            cursos={[]}
            readOnly={true}
          />
        </div>
      )}
    </div>
  );
}
