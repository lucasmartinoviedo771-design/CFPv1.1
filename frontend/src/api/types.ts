export type Estudiante = {
  id: number;
  apellido: string;
  nombre: string;
  email: string;
  dni: string;
  estatus: string;
  ciudad?: string | null;
  telefono?: string | null;
  trayectos?: string[];
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
  titulo_secundario_digitalizado?: string | null;
  tutor_nombre?: string | null;
  tutor_dni?: string | null;
  dni_tutor_digitalizado?: string | null;
  nota_parental_firmada?: string | null;
};

export type Programa = {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
  resolucion_id?: number | null;
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
  bloque_id?: number | null;
  bloque_fechas_id: number;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
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
    bloque_fechas?: { id: number; nombre: string; descripcion?: string | null };
  };
  modulo?: (Modulo & { bloque?: { id: number; nombre: string } | null }) | null;
};

// Respuesta del login (POST /token).
export type LoginResponse = {
  detail?: string;
};

// Datos del usuario (GET /user).
export type UserDetails = {
  username: string;
  email?: string;
  is_superuser: boolean;
  is_staff?: boolean;
  groups: string[];
  must_change_password: boolean;
};

export type User = {
  id: number;
  username: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  groups: string[];
  is_superuser?: boolean;
  is_staff?: boolean;
};

export type PreinscripcionTerciario = {
  id: number;
  apellido_nombre: string;
  dni: string;
  email: string;
  estado: string;
  observaciones?: string | null;
  url_dni?: string | null;
  url_titulo?: string | null;
  hd_estado?: string | null;
  celular?: string | null;
  sexo?: string | null;
  fecha_nacimiento?: string | null;
  localidad_nacimiento?: string | null;
  provincia_nacimiento?: string | null;
  nacionalidad?: string | null;
  cuil?: string | null;
  domicilio?: string | null;
  localidad?: string | null;
  finalizo_secundaria?: string | null;
  posee_estudios_superiores?: boolean;
  estudios_superiores_finalizado?: boolean;
  estudios_superiores_carrera?: string | null;
  posee_pc?: boolean;
  posee_internet?: boolean;
  pueblo_originario?: boolean;
  posee_discapacidad?: boolean;
  tipo_discapacidad?: string | null;
  posee_cud?: boolean;
  apoyo_inclusion?: string | null;
  requiere_apoyo_especifico?: boolean;
  descripcion_apoyo?: string | null;
};


// Filtros del listado de estudiantes (GET /estudiantes).
export type EstudianteListParams = {
  anio?: number;
  estatus?: string;
  search?: string;
};

export type Examen = {
  id: number;
  modulo_id?: number | null;
  bloque_id?: number | null;
  tipo_examen: string;
  fecha?: string | null;
  peso: string | number;
};

export type Nota = {
  id: number;
  examen_id: number;
  estudiante_id: number;
  calificacion: number;
  aprobado: boolean;
  fecha_calificacion?: string | null;
  es_equivalencia: boolean;
  origen_equivalencia?: string | null;
  fecha_ref_equivalencia?: string | null;
  intento: number;
  es_nota_definitiva: boolean;
  habilitado_por_id?: number | null;
};

export type Asistencia = {
  id: number;
  estudiante_id: number;
  modulo_id: number;
  fecha: string;
  presente: boolean;
  archivo_origen?: string | null;
};

export type DashboardStats = {
  active_students_count?: number;
  courses_count?: number;
  pending_registrations_count?: number;
  graduates_count?: number;
  [key: string]: unknown;
};


