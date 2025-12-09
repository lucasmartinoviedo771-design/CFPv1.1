import apiClient from "../api/client";

export async function listNotas(params) {
  const { data } = await apiClient.get("/examenes/notas", { params });
  const results = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
  return { results };
}
export async function createNota(payload) {
  const { data } = await apiClient.post("/examenes/notas", payload);
  return data;
}
export async function updateNota(id, payload) {
  const { data } = await apiClient.patch(`/examenes/notas/${id}`, payload);
  return data;
}
export async function deleteNota(id) {
  await apiClient.delete(`/examenes/notas/${id}`);
}
