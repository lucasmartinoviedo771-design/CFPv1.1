import React, { useEffect, useState } from 'react';
import apiClient from '../services/apiClient';
import HistorialAcademico from '../components/HistorialAcademico';
import { Card, Select } from '../components/UI';
import { UserSearch, FileText } from 'lucide-react';

async function fetchEstudiantes() {
  try {
    const { data } = await apiClient.get('/estudiantes');
    if (Array.isArray(data)) return data;
    return [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

export default function Notas() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [selEstudiante, setSelEstudiante] = useState('');
  const [historial, setHistorial] = useState([]);

  useEffect(() => {
    (async () => {
      setEstudiantes(await fetchEstudiantes());
    })();
  }, []);

  useEffect(() => {
    if (!selEstudiante) {
      setCursos([]);
      setHistorial([]);
      return;
    }
    // Fetch student's full academic history
    (async () => {
      const { data } = await apiClient.get('/examenes/notas', { params: { estudiante_id: selEstudiante } });
      setHistorial(Array.isArray(data) ? data : []);
    })();

    // Fetch courses for the selected student
    (async () => {
      const { data: allProgramas } = await apiClient.get('/programas');
      setCursos(Array.isArray(allProgramas) ? allProgramas : []);
    })();
  }, [selEstudiante]);

  // Student options for Select
  const studentOptions = estudiantes.map(e => ({
    value: e.id,
    label: `${e.apellido}, ${e.nombre} (${e.dni})`
  }));

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Gestión de Notas</h1>
        <p className="text-indigo-300">Carga y edición de calificaciones y exámenes.</p>
      </div>

      <Card className="bg-indigo-900/20 border-indigo-500/30">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-1/2">
            <Select
              label="Seleccionar Estudiante"
              value={selEstudiante}
              onChange={(e) => setSelEstudiante(e.target.value)}
              options={[{ value: '', label: 'Buscar estudiante...' }, ...studentOptions]}
              className="bg-indigo-950/50 border-indigo-500/30 text-white"
            />
          </div>
          <div className="pb-2 text-indigo-400 hidden md:block">
            <UserSearch size={24} />
          </div>
        </div>
      </Card>

      {selEstudiante ? (
        <div className="animate-fade-in-up delay-100">
          <HistorialAcademico
            historial={historial}
            setHistorial={setHistorial}
            selEstudiante={selEstudiante}
            cursos={cursos}
            readOnly={false}
          />
        </div>
      ) : (
        <div className="text-center py-10 opacity-50 flex flex-col items-center">
          <FileText size={48} className="text-indigo-400 mb-2" />
          <p className="text-indigo-300">Selecciona un estudiante para gestionar sus notas.</p>
        </div>
      )}
    </div>
  );
}
