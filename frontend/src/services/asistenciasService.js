import apiClient from "../api/client";

export async function listAsistencias(params) {
  const { data } = await apiClient.get("/examenes/asistencias", { params });
  return data;
}
export async function createAsistencia(payload) {
  const { data } = await apiClient.post("/examenes/asistencias", payload);
  return data;
}
export async function updateAsistencia(id, payload) {
  const { data } = await apiClient.patch(`/examenes/asistencias/${id}`, payload);
  return data;
}
export async function deleteAsistencia(id) {
  await apiClient.delete(`/examenes/asistencias/${id}`);
}
