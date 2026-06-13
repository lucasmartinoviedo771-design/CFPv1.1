import { Programa, Cohorte, Bloque, Modulo, Examen } from "../../api/types";

export interface ExamenFormState {
  tipo_examen: string;
  fecha: string;
  modulo: number | null;
  bloque: number | null;
}

export interface ModuloFormState {
  nombre: string;
  orden: number;
  bloque: number;
}

export interface BloqueFormState {
  nombre: string;
  orden: number;
  programa_id: number;
}

export interface GraphChild {
  id: number;
  orden: number;
  nombre: string;
  es_practica: boolean;
}

export interface GraphFinal {
  id: number;
  tipo_examen: string;
  fecha?: string | null;
}

export interface GraphBloque {
  id: number;
  orden: number;
  nombre: string;
  children?: GraphChild[];
  finales?: GraphFinal[];
}

export interface CourseGraph {
  tree: GraphBloque[];
}
