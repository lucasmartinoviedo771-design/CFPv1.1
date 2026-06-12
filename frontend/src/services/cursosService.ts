import apiClient from "../api/client";
import type { Programa, Cohorte } from "../api/types";

export async function listCursos(params?: Record<string, unknown>): Promise<Programa[]> {
  const { data } = await apiClient.get<Programa[]>("/programas", { params });
  return data;
}

export async function getCurso(id: number): Promise<Programa> {
  const { data } = await apiClient.get<Programa>(`/programas/${id}`);
  return data;
}

export async function createCurso(payload: Partial<Programa>): Promise<Programa> {
  const { data } = await apiClient.post<Programa>("/programas", payload);
  return data;
}

export async function updateCurso(id: number, payload: Partial<Programa>): Promise<Programa> {
  const { data } = await apiClient.patch<Programa>(`/programas/${id}`, payload);
  return data;
}

export async function deleteCurso(id: number): Promise<void> {
  await apiClient.delete(`/programas/${id}`);
}

export async function listCohortes(params?: Record<string, unknown>): Promise<Cohorte[]> {
  const { data } = await apiClient.get<Cohorte[]>("/inscripciones/cohortes", { params });
  return data;
}
