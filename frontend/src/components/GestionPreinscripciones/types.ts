import type { EstudianteDetail } from '../../api/types';

export interface Aspirante extends EstudianteDetail {
    autorizacion_status?: string | null;
    autorizacion_fecha?: string | null;
    autorizacion_selfie?: string | null;
    autorizacion_token?: string | null;
    created_at?: string | null;
}

export interface FeedbackState {
    open: boolean;
    message: string;
    severity: "success" | "error";
}

export interface OrderingState {
    field: string;
    direction: "asc" | "desc";
}
