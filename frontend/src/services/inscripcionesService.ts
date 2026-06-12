import apiClient from "../api/client";
import type { Inscripcion } from "../api/types";

export async function listInscripciones(params?: Record<string, unknown>): Promise<{ results: Inscripcion[] }> {
  const { data } = await apiClient.get<Inscripcion[] | { results: Inscripcion[] }>("/inscripciones", { params });
  let results: Inscripcion[] = [];
  if (data) {
    if (typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
      results = data.results;
    } else if (Array.isArray(data)) {
      results = data;
    }
  }
  return { results };
}

export async function createInscripcion(payload: Partial<Inscripcion>): Promise<Inscripcion> {
  try {
    const { data } = await apiClient.post<Inscripcion>("/inscripciones", payload);
    return data;
  } catch (err) {
    console.error("POST /inscripciones payload:", payload);
    if (err && typeof err === 'object' && 'response' in err) {
      const response = (err as { response?: { status?: number; data?: unknown } }).response;
      if (response) {
        console.error("POST /inscripciones error:", response.status, response.data);
        throw response.data;
      }
    }
    throw err;
  }
}

export async function updateInscripcion(id: number, payload: Partial<Inscripcion>): Promise<Inscripcion> {
  const { data } = await apiClient.patch<Inscripcion>(`/inscripciones/${id}`, payload);
  return data;
}

export async function deleteInscripcion(id: number): Promise<void> {
  await apiClient.delete(`/inscripciones/${id}`);
}
