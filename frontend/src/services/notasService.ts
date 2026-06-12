import apiClient from "../api/client";
import type { Nota } from "../api/types";

export async function listNotas(params?: Record<string, unknown>): Promise<{ results: Nota[] }> {
  const { data } = await apiClient.get<Nota[] | { results: Nota[] }>("/examenes/notas", { params });
  let results: Nota[] = [];
  if (data) {
    if (typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
      results = data.results;
    } else if (Array.isArray(data)) {
      results = data;
    }
  }
  return { results };
}

export async function createNota(payload: Partial<Nota>): Promise<Nota> {
  const { data } = await apiClient.post<Nota>("/examenes/notas", payload);
  return data;
}

export async function updateNota(id: number, payload: Partial<Nota>): Promise<Nota> {
  const { data } = await apiClient.patch<Nota>(`/examenes/notas/${id}`, payload);
  return data;
}

export async function deleteNota(id: number): Promise<void> {
  await apiClient.delete(`/examenes/notas/${id}`);
}
