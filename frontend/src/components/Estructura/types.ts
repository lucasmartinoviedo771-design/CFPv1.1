export interface ModuloEstructura {
  id: number;
  nombre: string;
  es_practica: boolean;
  asistencia_requerida_practica: number;
  bloque_id: number | null;
  bloque?: { id: number } | null;
}

export interface BloqueEstructura {
  id: number;
  nombre: string;
  programa_id: number | null;
  correlativas_ids: number[];
  modulos: ModuloEstructura[];
}

export interface ProgramaEstructura {
  id: number;
  nombre: string;
  codigo: string;
  resolucion_id: number | null;
  bloques: BloqueEstructura[];
}

export interface ResolucionEstructura {
  id: number;
  numero: string;
  nombre: string;
  fecha_publicacion: string;
  vigente: boolean;
  observaciones: string;
  programas: ProgramaEstructura[];
}

// Dialog forms interfaces
export interface ModuloForm {
  id?: number;
  nombre: string;
  es_practica: boolean;
  asistencia_requerida_practica: number;
  bloque_id: number | null;
}

export interface BloqueForm {
  id?: number;
  nombre: string;
  programa_id: number | null;
  correlativas_ids: number[];
}

export interface ProgramaForm {
  id?: number;
  nombre: string;
  codigo: string;
  resolucion_id: number | null;
}

export interface ResolucionForm {
  id?: number;
  numero: string;
  nombre: string;
  fecha_publicacion: string;
  vigente: boolean;
  observaciones: string;
}

export const initialModuloFormState: ModuloForm = {
  nombre: '',
  es_practica: false,
  asistencia_requerida_practica: 80,
  bloque_id: null,
};

export const initialBloqueFormState: BloqueForm = {
  nombre: '',
  programa_id: null,
  correlativas_ids: [],
};

export const initialProgramaFormState: ProgramaForm = {
  nombre: '',
  codigo: '',
  resolucion_id: null,
};

export const initialResolucionFormState: ResolucionForm = {
  numero: '',
  nombre: '',
  fecha_publicacion: '',
  vigente: true,
  observaciones: '',
};
