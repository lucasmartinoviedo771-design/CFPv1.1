import apiClient from "../api/client";
import type { Asistencia } from "../api/types";

export async function listAsistencias(params?: Record<string, unknown>): Promise<Asistencia[]> {
  const { data } = await apiClient.get<Asistencia[]>("/examenes/asistencias", { params });
  return data;
}

export async function createAsistencia(payload: Partial<Asistencia>): Promise<Asistencia> {
  const { data } = await apiClient.post<Asistencia>("/examenes/asistencias", payload);
  return data;
}

export async function updateAsistencia(id: number, payload: Partial<Asistencia>): Promise<Asistencia> {
  const { data } = await apiClient.patch<Asistencia>(`/examenes/asistencias/${id}`, payload);
  return data;
}

export async function deleteAsistencia(id: number): Promise<void> {
  await apiClient.delete(`/examenes/asistencias/${id}`);
}
