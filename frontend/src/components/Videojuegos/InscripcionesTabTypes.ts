export interface Alumno {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
}

export interface Cohorte {
  id: number;
  nombre: string;
  programa_id: number;
  fecha_inicio: string;
  fecha_fin: string;
}

export interface Modulo {
  id: number;
  nombre: string;
  bloque_id: number;
  bloque_nombre: string;
}

export interface Inscripcion {
  id: number;
  estudiante: Alumno;
  cohorte: Cohorte;
  modulo: Modulo | null;
  estado: string;
  created_at: string;
}
