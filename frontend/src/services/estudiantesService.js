import apiClient from "./apiClient";
import { handleApiError } from "../utils/errorHandler";

/**
 * Lista todos los estudiantes con filtros opcionales
 * @param {Object} params - Parámetros de filtro
 * @returns {Promise<Object>} Lista paginada de estudiantes
 */
export async function listEstudiantes(params) {
  try {
    const { data } = await apiClient.get("/estudiantes", { params });
    return data;
  } catch (err) {
    throw new Error(handleApiError(err, "Error al cargar estudiantes"));
  }
}

/**
 * Crea un nuevo estudiante
 * @param {Object} payload - Datos del estudiante
 * @returns {Promise<Object>} Estudiante creado
 */
export async function createEstudiante(payload) {
  try {
    const { data } = await apiClient.post("/estudiantes", payload);
    return data;
  } catch (err) {
    console.error("Error al crear estudiante:", payload);
    throw new Error(handleApiError(err, "Error al crear estudiante"));
  }
}

/**
 * Actualiza un estudiante existente
 * @param {number} id - ID del estudiante
 * @param {Object} payload - Datos a actualizar
 * @returns {Promise<Object>} Estudiante actualizado
 */
export async function updateEstudiante(id, payload) {
  try {
    const { data } = await apiClient.patch(`/estudiantes/${id}`, payload);
    return data;
  } catch (err) {
    throw new Error(handleApiError(err, "Error al actualizar estudiante"));
  }
}

/**
 * Elimina (soft delete) un estudiante
 * @param {number} id - ID del estudiante
 * @returns {Promise<void>}
 */
export async function deleteEstudiante(id) {
  try {
    await apiClient.delete(`/estudiantes/${id}`);
  } catch (err) {
    throw new Error(handleApiError(err, "Error al eliminar estudiante"));
  }
}
