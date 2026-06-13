import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import apiClient from '../api/client';
import { Card, Button } from './UI';
import { Check, PlusCircle } from 'lucide-react';
import { Programa } from '../api/types';
import { HistorialNota } from './HistorialAcademico/types';
import HistorialAcademicoFilters from './HistorialAcademico/HistorialAcademicoFilters';
import HistorialAcademicoTable from './HistorialAcademico/HistorialAcademicoTable';
import CreateNotaModal from './HistorialAcademico/CreateNotaModal';

dayjs.extend(utc);

export type { HistorialNota };

interface HistorialAcademicoProps {
  historial: HistorialNota[];
  setHistorial: React.Dispatch<React.SetStateAction<HistorialNota[]>>;
  selEstudiante: number | string;
  cursos: Programa[];
  readOnly?: boolean;
}

export default function HistorialAcademico({
  historial,
  setHistorial,
  selEstudiante,
  cursos,
  readOnly = false,
}: HistorialAcademicoProps) {
  const [filterPrograma, setFilterPrograma] = useState('');
  const [filterBloque, setFilterBloque] = useState('');
  const [filterModulo, setFilterModulo] = useState('');
  const [editingNotaId, setEditingNotaId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<{ calificacion?: number | string; fecha_calificacion?: string }>({});
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handlers for Edit/Delete
  const handleEditClick = (nota: HistorialNota) => {
    setEditingNotaId(nota.id);
    setEditFormData({
      calificacion: nota.calificacion,
      fecha_calificacion: nota.fecha_calificacion
        ? dayjs(nota.fecha_calificacion).format('YYYY-MM-DD')
        : dayjs().format('YYYY-MM-DD'),
    });
  };
  const handleCancelClick = () => setEditingNotaId(null);
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });

  const handleUpdate = async (notaId: number) => {
    setLoading(true);
    try {
      const original = historial.find(n => n.id === notaId);
      if (!original) return;
      const payload = {
        ...editFormData,
        estudiante: original.estudiante,
        examen: original.examen,
        calificacion: Number(editFormData.calificacion),
        aprobado: Number(editFormData.calificacion) >= 6,
      };
      const { data: updated } = await apiClient.put<HistorialNota>(`/examenes/notas/${notaId}`, payload);
      setHistorial(prev => prev.map(n => (n.id === notaId ? updated : n)));
      setEditingNotaId(null);
    } catch (e: unknown) {
      console.error(e);
      alert('Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (notaId: number) => {
    if (confirm('¿Eliminar nota?')) {
      setLoading(true);
      try {
        await apiClient.delete(`/examenes/notas/${notaId}`);
        setHistorial(prev => prev.filter(n => n.id !== notaId));
      } catch (e: unknown) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
  };

  // Filter Logic
  const programasOptions = useMemo(
    () => Array.from(new Set(historial.map(h => h.examen_programa_nombre).filter(Boolean))) as string[],
    [historial]
  );
  const bloquesOptions = useMemo(
    () =>
      Array.from(
        new Set(
          historial
            .filter(h => !filterPrograma || h.examen_programa_nombre === filterPrograma)
            .map(h => h.examen_bloque_nombre)
            .filter(Boolean)
        )
      ) as string[],
    [historial, filterPrograma]
  );
  const modulosOptions = useMemo(
    () =>
      Array.from(
        new Set(
          historial
            .filter(h => !filterBloque || h.examen_bloque_nombre === filterBloque)
            .map(h => h.examen_modulo_nombre)
            .filter(Boolean)
        )
      ) as string[],
    [historial, filterBloque]
  );
  const filteredHistorial = useMemo(
    () =>
      historial.filter(
        h =>
          (!filterPrograma || h.examen_programa_nombre === filterPrograma) &&
          (!filterBloque || h.examen_bloque_nombre === filterBloque) &&
          (!filterModulo || h.examen_modulo_nombre === filterModulo)
      ),
    [historial, filterPrograma, filterBloque, filterModulo]
  );

  useEffect(() => {
    setFilterBloque('');
    setFilterModulo('');
  }, [filterPrograma]);
  useEffect(() => {
    setFilterModulo('');
  }, [filterBloque]);

  return (
    <>
      <Card className="bg-indigo-900/20 border-indigo-500/30 overflow-hidden">
        <div className="p-4 border-b border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Check className="text-brand-accent" /> Historial Académico
          </h2>
          {!readOnly && (
            <Button size="sm" onClick={() => setCreateModalOpen(true)} startIcon={<PlusCircle size={16} />}>
              Añadir Nota
            </Button>
          )}
        </div>

        <HistorialAcademicoFilters
          filterPrograma={filterPrograma}
          onFilterProgramaChange={setFilterPrograma}
          programasOptions={programasOptions}
          filterBloque={filterBloque}
          onFilterBloqueChange={setFilterBloque}
          bloquesOptions={bloquesOptions}
          filterModulo={filterModulo}
          onFilterModuloChange={setFilterModulo}
          modulosOptions={modulosOptions}
        />

        <HistorialAcademicoTable
          filteredHistorial={filteredHistorial}
          editingNotaId={editingNotaId}
          editFormData={editFormData}
          readOnly={readOnly}
          onEditClick={handleEditClick}
          onCancelClick={handleCancelClick}
          onFormChange={handleFormChange}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      </Card>

      {!readOnly && isCreateModalOpen && (
        <CreateNotaModal
          open={isCreateModalOpen}
          onClose={() => setCreateModalOpen(false)}
          studentId={selEstudiante}
          cursos={cursos}
          onSave={() => {
            (async () => {
              try {
                const { data } = await apiClient.get<HistorialNota[]>('/examenes/notas', {
                  params: { estudiante_id: selEstudiante },
                });
                setHistorial(Array.isArray(data) ? data : []);
              } catch (e: unknown) {
                console.error(e);
              }
            })();
            setCreateModalOpen(false);
          }}
        />
      )}
    </>
  );
}
