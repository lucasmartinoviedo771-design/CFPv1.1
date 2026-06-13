export const STORAGE_KEY = "preinscripcion_videojuegos_v1";

export interface FormState {
  apellido: string;
  nombre: string;
  email: string;
  DNI: string;
  cuit: string;
  sexo: string;
  fecha_nacimiento: string;
  pais_nacimiento: string;
  pais_nacimiento_otro: string;
  nacionalidad: string;
  nacionalidad_otra: string;
  lugar_nacimiento: string;
  domicilio: string;
  barrio: string;
  ciudad: string;
  telefono: string;
  nivel_educativo: string;
  posee_pc: boolean;
  posee_conectividad: boolean;
  puede_traer_pc: boolean;
  trabaja: boolean;
  lugar_trabajo: string;
  tutor_nombre: string;
  tutor_dni: string;
  tutor_telefono: string;
}

export const INIT_FORM: FormState = {
  apellido: "",
  nombre: "",
  email: "",
  DNI: "",
  cuit: "",
  sexo: "",
  fecha_nacimiento: "",
  pais_nacimiento: "Argentina",
  pais_nacimiento_otro: "",
  nacionalidad: "Argentina",
  nacionalidad_otra: "",
  lugar_nacimiento: "",
  domicilio: "",
  barrio: "",
  ciudad: "",
  telefono: "",
  nivel_educativo: "Secundaria Completa",
  posee_pc: false,
  posee_conectividad: false,
  puede_traer_pc: false,
  trabaja: false,
  lugar_trabajo: "",
  tutor_nombre: "",
  tutor_dni: "",
  tutor_telefono: "",
};

export interface Bloque {
  bloque_id: number;
  bloque_nombre: string;
  cohorte_nombre: string;
}

export interface ProgramaOferta {
  programa_id: number;
  programa_nombre: string;
  bloques?: Bloque[];
}

export interface VideojuegosConfig {
  abierta: boolean;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  mensaje_cierre?: string | null;
}
