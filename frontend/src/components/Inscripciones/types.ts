import type { Estudiante, Cohorte, Programa, Inscripcion } from "../../api/types";

export type ExtendedEstudiante = Estudiante & {
    tutor_nombre?: string | null;
    tutor_dni?: string | null;
    tutor_telefono?: string | null;
    autorizacion_status?: string | null;
    autorizacion_token?: string | null;
    fecha_nacimiento?: string | null;
};

export type ExtendedCohorte = Cohorte & {
    programa?: Programa;
    bloque?: { id: number; nombre: string } | null;
    bloque_fechas?: { id: number; nombre: string; descripcion?: string | null };
};

export type ExtendedInscripcion = Omit<Inscripcion, "estudiante" | "cohorte"> & {
    estudiante?: ExtendedEstudiante;
    cohorte?: ExtendedCohorte;
};

export interface LocalModulo {
    id: number;
    nombre: string;
}

export interface LocalBloque {
    id: number;
    nombre: string;
    modulos: LocalModulo[];
}

export const calculateAge = (birthDate: string | null | undefined): number | null => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};
