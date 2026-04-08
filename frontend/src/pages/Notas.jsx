import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import HistorialAcademico from '../components/HistorialAcademico';
import { Card, Select } from '../components/UI';
import { Autocomplete } from '../components/Autocomplete';
import { UserSearch, FileText, Search } from 'lucide-react';

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
    const studentOptions = estudiantes.map(e => {
        const age = calculateAge(e.fecha_nacimiento);
        const ageLabel = age !== null ? (age < 18 ? ` - ${age} años 👶` : ` - ${age} años`) : "";
        return {
            value: e.id,
            label: `${e.apellido}, ${e.nombre} (${e.dni})`,
            sublabel: ageLabel ? ageLabel.replace(" - ", "") : "Edad no disponible"
        };
    });

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Gestión de Notas</h1>
        <p className="text-indigo-300">Carga y edición de calificaciones y exámenes.</p>
        <p className="text-[10px] text-brand-accent/60 mt-1 uppercase font-bold tracking-widest">
            {estudiantes.length === 0 ? "Buscando alumnos..." : `Sincronizados: ${estudiantes.length} estudiantes`}
        </p>
      </div>

      <Card className="bg-indigo-900/15 border-indigo-500/20 overflow-visible relative z-30">
        <div className="flex flex-col md:flex-row gap-6 items-end">
          <div className="w-full md:w-1/2 lg:w-1/3">
            <Autocomplete
              label="Seleccionar Estudiante"
              value={selEstudiante}
              onChange={(val) => setSelEstudiante(val)}
              options={studentOptions}
              placeholder="Escriba apellido, nombre o DNI..."
              className="bg-indigo-950/40"
            />
          </div>
          <div className="hidden md:flex items-center gap-2 pb-2.5 text-indigo-400 group">
             <div className="p-2 rounded-lg bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors">
                <UserSearch size={22} className="group-hover:scale-110 transition-transform" />
             </div>
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
