import React from 'react';
import { Select } from '../UI';

export interface HistorialAcademicoFiltersProps {
  filterPrograma: string;
  onFilterProgramaChange: (val: string) => void;
  programasOptions: string[];
  filterBloque: string;
  onFilterBloqueChange: (val: string) => void;
  bloquesOptions: string[];
  filterModulo: string;
  onFilterModuloChange: (val: string) => void;
  modulosOptions: string[];
}

export default function HistorialAcademicoFilters({
  filterPrograma,
  onFilterProgramaChange,
  programasOptions,
  filterBloque,
  onFilterBloqueChange,
  bloquesOptions,
  filterModulo,
  onFilterModuloChange,
  modulosOptions,
}: HistorialAcademicoFiltersProps) {
  return (
    <div className="p-4 bg-indigo-950/30 grid grid-cols-1 md:grid-cols-3 gap-4">
      <Select
        label="Filtrar Programa"
        value={filterPrograma}
        onChange={e => onFilterProgramaChange(e.target.value)}
        options={[{ value: '', label: 'Todos' }, ...programasOptions.map(p => ({ value: p, label: p }))]}
        className="text-xs"
      />
      <Select
        label="Filtrar Bloque"
        value={filterBloque}
        onChange={e => onFilterBloqueChange(e.target.value)}
        disabled={!filterPrograma}
        options={[{ value: '', label: 'Todos' }, ...bloquesOptions.map(b => ({ value: b, label: b }))]}
        className="text-xs"
      />
      <Select
        label="Filtrar Módulo"
        value={filterModulo}
        onChange={e => onFilterModuloChange(e.target.value)}
        disabled={!filterBloque}
        options={[{ value: '', label: 'Todos' }, ...modulosOptions.map(m => ({ value: m, label: m }))]}
        className="text-xs"
      />
    </div>
  );
}
