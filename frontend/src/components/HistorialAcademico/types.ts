import { Programa, Cohorte, Modulo, Inscripcion, Nota } from '../../api/types';

export interface ExamenSimple {
  id: number;
  tipo_examen: string;
  modulo_id?: number | null;
  bloque_id?: number | null;
}

export interface HistorialNota {
  id: number;
  examen_programa_nombre?: string;
  examen_bloque_nombre?: string;
  examen_modulo_nombre?: string;
  examen_tipo_examen?: string;
  intento: number;
  es_nota_definitiva: boolean;
  aprobado: boolean;
  calificacion: number;
  fecha_calificacion?: string | null;
  estudiante: number;
  examen: number;
}

export interface ExtendedNota extends Nota {
  examen_tipo_examen?: string;
  examen_modulo_id?: number | null;
}

export interface ExtendedInscripcion extends Omit<Inscripcion, 'cohorte'> {
  cohorte?: Cohorte & {
    programa?: Programa;
    bloque_fechas?: { id: number; nombre: string; descripcion?: string | null };
    bloque?: { id: number; nombre: string };
  };
}

export interface BloqueConModulos {
  id: number;
  programa_id: number;
  nombre: string;
  orden: number;
  correlativas_ids: number[];
  modulos: Modulo[];
}

export interface Estructura {
  bloques: BloqueConModulos[];
}
