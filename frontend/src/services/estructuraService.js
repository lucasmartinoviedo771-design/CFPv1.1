import apiClient from "./apiClient";

// --- Bloque Service ---
export const listBloques = async (params) => {
  const { data } = await apiClient.get("/bloques", { params });
  return data;
}
// Para creación/edición de bloques usamos el endpoint DRF existente
import axios from "axios";
import authService from "./authService";

const authHeaders = () => {
  const token = authService.getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const createBloque = (data) => axios.post("/api/bloques/", data, { headers: authHeaders() });
export const updateBloque = (id, data) => axios.patch(`/api/bloques/${id}/`, data, { headers: authHeaders() });
export const deleteBloque = (id) => axios.delete(`/api/bloques/${id}/`, { headers: authHeaders() });

// --- Modulo Service ---
export const listModulos = async (params) => {
  const { data } = await apiClient.get("/modulos", { params });
  return data;
}
export const createModulo = (data) => apiClient.post("/modulos", data);
export const updateModulo = (id, data) => apiClient.patch(`/modulos/${id}`, data);
export const deleteModulo = (id) => apiClient.delete(`/modulos/${id}`);

// --- Examen Service ---
export const listExamenes = async (params) => {
  const { data } = await apiClient.get("/examenes", { params });
  return data;
}
export const createExamen = (data) => apiClient.post("/examenes", data);
export const updateExamen = (id, data) => apiClient.patch(`/examenes/${id}`, data);
export const deleteExamen = (id) => apiClient.delete(`/examenes/${id}`);

// --- Courses Graph ---
export const getCoursesGraph = async (params) => {
  const { data } = await axios.get('/api/analytics/courses-graph/', { params, headers: authHeaders() });
  return data;
}
