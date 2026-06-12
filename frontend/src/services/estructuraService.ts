import apiClient from "../api/client";
import type { Bloque, Modulo, Examen } from "../api/types";
import { AxiosResponse } from "axios";

// --- Bloque Service ---
export const listBloques = async (params?: Record<string, unknown>): Promise<Bloque[]> => {
  const { data } = await apiClient.get<Bloque[]>("/bloques", { params });
  return data;
};
export const createBloque = (data: Partial<Bloque>): Promise<AxiosResponse<Bloque>> => 
  apiClient.post<Bloque>("/bloques", data);

export const updateBloque = (id: number, data: Partial<Bloque>): Promise<AxiosResponse<Bloque>> => 
  apiClient.patch<Bloque>(`/bloques/${id}`, data);

export const deleteBloque = (id: number): Promise<AxiosResponse<void>> => 
  apiClient.delete<void>(`/bloques/${id}`);

// --- Modulo Service ---
export const listModulos = async (params?: Record<string, unknown>): Promise<Modulo[]> => {
  const { data } = await apiClient.get<Modulo[]>("/modulos", { params });
  return data;
};
export const createModulo = (data: Partial<Modulo>): Promise<AxiosResponse<Modulo>> => 
  apiClient.post<Modulo>("/modulos", data);

export const updateModulo = (id: number, data: Partial<Modulo>): Promise<AxiosResponse<Modulo>> => 
  apiClient.patch<Modulo>(`/modulos/${id}`, data);

export const deleteModulo = (id: number): Promise<AxiosResponse<void>> => 
  apiClient.delete<void>(`/modulos/${id}`);

// --- Examen Service ---
export const listExamenes = async (params?: Record<string, unknown>): Promise<Examen[]> => {
  const { data } = await apiClient.get<Examen[]>("/examenes", { params });
  return data;
};
export const createExamen = (data: Partial<Examen>): Promise<AxiosResponse<Examen>> => 
  apiClient.post<Examen>("/examenes", data);

export const updateExamen = (id: number, data: Partial<Examen>): Promise<AxiosResponse<Examen>> => 
  apiClient.patch<Examen>(`/examenes/${id}`, data);

export const deleteExamen = (id: number): Promise<AxiosResponse<void>> => 
  apiClient.delete<void>(`/examenes/${id}`);

// --- Courses Graph ---
export const getCoursesGraph = async (params?: Record<string, unknown>): Promise<unknown> => {
  const { data } = await apiClient.get('/analytics/courses-graph', { params });
  return data;
};
