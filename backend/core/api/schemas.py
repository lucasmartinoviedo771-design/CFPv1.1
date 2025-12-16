from datetime import date, datetime
from typing import List, Optional

from ninja import Schema


class ProgramaOut(Schema):
    id: int
    codigo: str
    nombre: str
    activo: bool


class ProgramaIn(Schema):
    codigo: str
    nombre: str
    activo: bool = True


class BloqueSimpleOut(Schema):
    id: int
    nombre: str
    orden: int


class ProgramaDetailOut(ProgramaOut):
    bloques: List[BloqueSimpleOut] = []


class BloqueOut(Schema):
    id: int
    programa_id: int
    nombre: str
    orden: int
    correlativas_ids: List[int] = []


class ModuloOut(Schema):
    id: int
    bloque_id: int
    nombre: str
    orden: int
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    es_practica: bool
    asistencia_requerida_practica: int


class ModuloIn(Schema):
    bloque_id: int
    nombre: str
    orden: int
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    es_practica: bool
    asistencia_requerida_practica: int


class BloqueDetailOut(BloqueOut):
    modulos: List[ModuloOut] = []


class BloqueDeFechasOut(Schema):
    id: int
    nombre: str
    fecha_inicio: date


class CohorteOut(Schema):
    id: int
    nombre: str
    programa_id: int
    bloque_fechas_id: int


class CohorteIn(Schema):
    nombre: str
    programa_id: int
    bloque_fechas_id: int


# --- Inputs ---
class EstudianteIn(Schema):
    email: str
    apellido: str
    nombre: str
    dni: str
    cuit: Optional[str] = None
    sexo: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    pais_nacimiento: Optional[str] = None
    nacionalidad: Optional[str] = None
    lugar_nacimiento: Optional[str] = None
    domicilio: Optional[str] = None
    barrio: Optional[str] = None
    ciudad: Optional[str] = None
    telefono: Optional[str] = None
    nivel_educativo: Optional[str] = None
    estatus: Optional[str] = None
    posee_pc: Optional[bool] = None
    posee_conectividad: Optional[bool] = None
    puede_traer_pc: Optional[bool] = None
    trabaja: Optional[bool] = None
    lugar_trabajo: Optional[str] = None
    dni_digitalizado: Optional[str] = None


class InscripcionIn(Schema):
    estudiante_id: int
    cohorte_id: int
    modulo_id: Optional[int] = None
    estado: Optional[str] = None


class NotaIn(Schema):
    examen: int
    estudiante: int
    calificacion: float
    aprobado: Optional[bool] = None
    es_equivalencia: Optional[bool] = None
    origen_equivalencia: Optional[str] = None
    fecha_ref_equivalencia: Optional[date] = None


class AsistenciaIn(Schema):
    estudiante: int
    modulo: int
    fecha: date
    presente: bool
    archivo_origen: Optional[str] = None


class ExamenIn(Schema):
    modulo_id: Optional[int] = None
    bloque_id: Optional[int] = None
    tipo_examen: str
    fecha: Optional[date] = None
    peso: Optional[float] = 0

class EstudianteOut(Schema):
    id: int
    apellido: str
    nombre: str
    email: str
    dni: str
    estatus: str
    ciudad: Optional[str] = None
    telefono: Optional[str] = None


class EstudianteDetailOut(EstudianteOut):
    cuit: Optional[str] = None
    sexo: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    pais_nacimiento: Optional[str] = None
    nacionalidad: Optional[str] = None
    lugar_nacimiento: Optional[str] = None
    domicilio: Optional[str] = None
    barrio: Optional[str] = None
    nivel_educativo: Optional[str] = None
    posee_pc: bool
    posee_conectividad: bool
    puede_traer_pc: bool
    trabaja: bool
    lugar_trabajo: Optional[str] = None
    dni_digitalizado: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class InscripcionOut(Schema):
    id: int
    estudiante_id: int
    cohorte_id: int
    modulo_id: Optional[int] = None
    estado: str
    created_at: datetime
    updated_at: datetime


class ChangePasswordIn(Schema):
    current_password: str
    new_password: str

class UserIn(Schema):
    username: Optional[str] = None
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    password: Optional[str] = None
    password2: Optional[str] = None
    groups: Optional[List[str]] = None


class UserOut(Schema):
    id: int
    username: str
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_superuser: bool = False
    is_staff: bool = False
    groups: List[str] = []

    @staticmethod
    def resolve_groups(obj):
        return [g.name for g in obj.groups.all()]

