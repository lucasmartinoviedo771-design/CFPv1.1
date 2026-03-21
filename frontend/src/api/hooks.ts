import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClientV2 } from './client';
import type { Estudiante, EstudianteDetail, Inscripcion, Programa, Bloque, Modulo, Cohorte } from './types';

// Keys helpers
const keys = {
  estudiantes: (params?: Record<string, any>) => ['estudiantes', params] as const,
  estudiante: (id: number) => ['estudiante', id] as const,
  programas: ['programas'] as const,
  bloques: (programa_id?: number) => ['bloques', programa_id] as const,
  modulos: (bloque_id?: number) => ['modulos', bloque_id] as const,
  cohortes: (programa_id?: number) => ['cohortes', programa_id] as const,
  inscripciones: (filters?: Record<string, any>) => ['inscripciones', filters] as const,
};

// Estudiantes
export const useEstudiantes = (params?: { 
  search?: string; 
  dni?: string; 
  estatus?: string; 
  cohorte_id?: number; 
  bloque_id?: number; 
  modulo_id?: number;
  anio?: string;
  telefono?: string;
}) =>
  useQuery({
    queryKey: keys.estudiantes(params),
    queryFn: async () => {
      const { data } = await apiClientV2.get<Estudiante[]>('/estudiantes', { params });
      return data;
    },
  });

export const useEstudiante = (id: number) =>
  useQuery({
    queryKey: keys.estudiante(id),
    queryFn: async () => {
      const { data } = await apiClientV2.get<EstudianteDetail>(`/estudiantes/${id}`);
      return data;
    },
    enabled: !!id,
  });

export const useSaveEstudiante = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<EstudianteDetail> & { id?: number, dniFile?: File | null, tituloFile?: File | null, dniTutorFile?: File | null, notaParentalFile?: File | null }) => {
      const { dniFile, tituloFile, dniTutorFile, notaParentalFile, ...jsonPayload } = payload;

      // Always remove file fields from JSON payload - files are only sent via FormData to /documentos endpoint
      delete jsonPayload.dni_digitalizado;
      delete jsonPayload.titulo_secundario_digitalizado;
      delete jsonPayload.dni_tutor_digitalizado;
      delete jsonPayload.nota_parental_firmada;

      let estId = jsonPayload.id;
      let resultData;

      if (estId) {
        const { id, ...rest } = jsonPayload;
        const { data } = await apiClientV2.patch<EstudianteDetail>(`/estudiantes/${id}`, rest);
        resultData = data;
      } else {
        const { data } = await apiClientV2.post<EstudianteDetail>('/estudiantes', jsonPayload);
        estId = data.id;
        resultData = data;
      }

      if (estId && (dniFile || tituloFile || dniTutorFile || notaParentalFile)) {
        const formData = new FormData();
        if (dniFile) formData.append('dni_digitalizado', dniFile);
        if (tituloFile) formData.append('titulo_secundario_digitalizado', tituloFile);
        if (dniTutorFile) formData.append('dni_tutor_digitalizado', dniTutorFile);
        if (notaParentalFile) formData.append('nota_parental_firmada', notaParentalFile);

        const { data } = await apiClientV2.post<EstudianteDetail>(`/estudiantes/${estId}/documentos`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        resultData = data;
      }

      return resultData;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['estudiantes'] });
    },
  });
};

// Programas / Bloques / Modulos
export const useProgramas = () =>
  useQuery({
    queryKey: keys.programas,
    queryFn: async () => {
      const { data } = await apiClientV2.get<Programa[]>('/programas');
      return data;
    },
  });

export const useSavePrograma = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Programa> & { id?: number }) => {
      if (payload.id) {
        const { id, ...rest } = payload;
        const { data } = await apiClientV2.patch<Programa>(`/programas/${id}`, rest);
        return data;
      }
      const { data } = await apiClientV2.post<Programa>('/programas', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.programas });
    },
  });
};

export const useDeletePrograma = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClientV2.delete(`/programas/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.programas });
    },
  });
};

export const useBloques = (programa_id?: number) =>
  useQuery({
    queryKey: keys.bloques(programa_id),
    queryFn: async () => {
      const { data } = await apiClientV2.get<Bloque[]>('/bloques', { params: { programa_id } });
      return data;
    },
  });

export const useModulos = (bloque_id?: number) =>
  useQuery({
    queryKey: keys.modulos(bloque_id),
    queryFn: async () => {
      const { data } = await apiClientV2.get<Modulo[]>('/modulos', { params: { bloque_id } });
      return data;
    },
  });

// Cohortes / Inscripciones
export const useCohortes = (programa_id?: number) =>
  useQuery({
    queryKey: keys.cohortes(programa_id),
    queryFn: async () => {
      const { data } = await apiClientV2.get<Cohorte[]>('/inscripciones/cohortes', { params: { programa_id } });
      return data;
    },
  });

export const useInscripciones = (filters?: { cohorte_id?: number; estudiante_id?: number; estado?: string }) =>
  useQuery({
    queryKey: keys.inscripciones(filters),
    queryFn: async () => {
      const { data } = await apiClientV2.get<Inscripcion[]>('/inscripciones', { params: filters });
      return data;
    },
  });

export const useSaveInscripcion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Inscripcion> & { id?: number }) => {
      if (payload.id) {
        const { id, ...rest } = payload;
        const { data } = await apiClientV2.patch<Inscripcion>(`/inscripciones/${id}`, rest);
        return data;
      }
      const { data } = await apiClientV2.post<Inscripcion>('/inscripciones', payload);
      return data;
    },
    onMutate: async (newInscripcion) => {
      if (!newInscripcion.id) return; // Only do optimistic update on edits

      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await qc.cancelQueries({ queryKey: keys.inscripciones() });

      // Snapshot the previous value
      const previousInscripciones = qc.getQueriesData<Inscripcion[]>({ queryKey: keys.inscripciones() });

      // Optimistically update to the new value
      qc.setQueriesData<Inscripcion[]>({ queryKey: keys.inscripciones() }, (old) => {
        if (!old) return [];
        return old.map(insc => insc.id === newInscripcion.id ? { ...insc, ...newInscripcion } as Inscripcion : insc);
      });

      // Return a context object with the snapshotted value
      return { previousInscripciones };
    },
    onError: (err, newInscripcion, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousInscripciones) {
        context.previousInscripciones.forEach(([queryKey, data]) => {
          qc.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we're in sync
      // but only in the background (preventing the 3 second freeze on UI jump)
      qc.invalidateQueries({ queryKey: keys.inscripciones() });
      qc.invalidateQueries({ queryKey: keys.estudiantes() }); // Also invalidate students if needed
    },
  });
};

export const useDeleteInscripcion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClientV2.delete(`/inscripciones/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inscripciones'] });
    },
  });
};
