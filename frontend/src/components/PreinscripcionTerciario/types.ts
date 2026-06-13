export const STORAGE_KEY = "preinscripcion_terciario_v1";

export interface FormState {
  email: string;
  apellido: string;
  nombre: string;
  dni: string;
  cuil: string;
  sexo: string;
  celular: string;
  fecha_nacimiento: string;
  localidad_nacimiento: string;
  localidad_nacimiento_otra: string;
  provincia_nacimiento: string;
  nacionalidad: string;
  domicilio: string;
  provincia_residencia: string;
  localidad: string;
  finalizo_secundaria: string;
  posee_estudios_superiores: string;
  estudios_superiores_finalizado: string;
  estudios_superiores_carrera: string;
  posee_pc: string;
  posee_internet: string;
  pueblo_originario: string;
  posee_discapacidad: string;
  tipo_discapacidad: string;
  posee_cud: string;
  apoyo_inclusion: string;
  requiere_apoyo_especifico: string;
  descripcion_apoyo: string;
}

export const INIT_FORM: FormState = {
  email: "",
  apellido: "",
  nombre: "",
  dni: "",
  cuil: "",
  sexo: "",
  celular: "",
  fecha_nacimiento: "",
  localidad_nacimiento: "",
  localidad_nacimiento_otra: "",
  provincia_nacimiento: "",
  nacionalidad: "Argentina",
  domicilio: "",
  provincia_residencia: "",
  localidad: "",
  finalizo_secundaria: "",
  posee_estudios_superiores: "",
  estudios_superiores_finalizado: "",
  estudios_superiores_carrera: "",
  posee_pc: "",
  posee_internet: "",
  pueblo_originario: "",
  posee_discapacidad: "",
  tipo_discapacidad: "",
  posee_cud: "",
  apoyo_inclusion: "",
  requiere_apoyo_especifico: "",
  descripcion_apoyo: "",
};

export interface PreinscripcionConfig {
  abierta: boolean;
  mensaje_cierre?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
}
