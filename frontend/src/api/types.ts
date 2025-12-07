export type Estudiante = {
  id: number;
  apellido: string;
  nombre: string;
  email: string;
  dni: string;
  estatus: string;
  ciudad?: string | null;
  telefono?: string | null;
};

export type EstudianteDetail = Estudiante & {
  cuit?: string | null;
  sexo?: string | null;
  fecha_nacimiento?: string | null;
  pais_nacimiento?: string | null;
  nacionalidad?: string | null;
  lugar_nacimiento?: string | null;
  domicilio?: string | null;
  barrio?: string | null;
  nivel_educativo?: string | null;
  posee_pc: boolean;
  posee_conectividad: boolean;
  puede_traer_pc: boolean;
  trabaja: boolean;
  lugar_trabajo?: string | null;
  dni_digitalizado?: string | null;
};

export type Programa = {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
};

export type Bloque = {
  id: number;
  programa_id: number;
  nombre: string;
  orden: number;
  correlativas_ids: number[];
};

export type Modulo = {
  id: number;
  bloque_id: number;
  nombre: string;
  orden: number;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  es_practica: boolean;
  asistencia_requerida_practica: number;
};

export type Cohorte = {
  id: number;
  nombre: string;
  programa_id: number;
  bloque_fechas_id: number;
};

export type Inscripcion = {
  id: number;
  estudiante_id: number;
  cohorte_id: number;
  modulo_id?: number | null;
  estado: string;
  created_at: string;
  updated_at: string;
  estudiante?: Estudiante;
  cohorte?: Cohorte & {
    programa?: Programa;
    bloque_fechas?: { id: number; nombre: string; fecha_inicio: string };
  };
  modulo?: (Modulo & { bloque?: { id: number; nombre: string } | null }) | null;
};
