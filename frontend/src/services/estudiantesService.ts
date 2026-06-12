import apiClient from "../api/client";
import { handleApiError } from "../utils/errorHandler";
import type { Estudiante, EstudianteDetail, EstudianteListParams } from "../api/types";

/**
 * Lista todos los estudiantes con filtros opcionales
 * @param {EstudianteListParams} params - Parámetros de filtro
 * @returns {Promise<Estudiante[]>} Lista de estudiantes
 */
export async function listEstudiantes(params?: EstudianteListParams): Promise<Estudiante[]> {
  try {
    const { data } = await apiClient.get<Estudiante[]>("/estudiantes", { params });
    return data;
  } catch (err) {
    throw new Error(handleApiError(err, "Error al cargar estudiantes"));
  }
}

/**
 * Crea un nuevo estudiante
 * @param {Partial<EstudianteDetail>} payload - Datos del estudiante
 * @returns {Promise<EstudianteDetail>} Estudiante creado
 */
export async function createEstudiante(payload: Partial<EstudianteDetail>): Promise<EstudianteDetail> {
  try {
    const { data } = await apiClient.post<EstudianteDetail>("/estudiantes", payload);
    return data;
  } catch (err) {
    console.error("Error al crear estudiante:", payload);
    throw new Error(handleApiError(err, "Error al crear estudiante"));
  }
}

/**
 * Actualiza un estudiante existente
 * @param {number} id - ID del estudiante
 * @param {Partial<EstudianteDetail>} payload - Datos a actualizar
 * @returns {Promise<EstudianteDetail>} Estudiante actualizado
 */
export async function updateEstudiante(id: number, payload: Partial<EstudianteDetail>): Promise<EstudianteDetail> {
  try {
    const { data } = await apiClient.patch<EstudianteDetail>(`/estudiantes/${id}`, payload);
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
export async function deleteEstudiante(id: number): Promise<void> {
  try {
    await apiClient.delete(`/estudiantes/${id}`);
  } catch (err) {
    throw new Error(handleApiError(err, "Error al eliminar estudiante"));
  }
}
