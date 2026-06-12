import apiClient from "../api/client";
import type { Programa } from "../api/types";

export async function listProgramas(params?: Record<string, unknown>): Promise<Programa[]> {
  const { data } = await apiClient.get<Programa[]>("/programas", { params });
  return data;
}

export async function createPrograma(payload: Partial<Programa>): Promise<Programa> {
  const { data } = await apiClient.post<Programa>("/programas", payload);
  return data;
}

export async function updatePrograma(id: number, payload: Partial<Programa>): Promise<Programa> {
  const { data } = await apiClient.patch<Programa>(`/programas/${id}`, payload);
  return data;
}

export async function deletePrograma(id: number): Promise<void> {
  await apiClient.delete(`/programas/${id}`);
}
