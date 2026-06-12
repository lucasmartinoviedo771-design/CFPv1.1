import apiClient from '../api/client';

export async function getEnrollments(params?: Record<string, unknown>): Promise<unknown> {
  const { data } = await apiClient.get('/analytics/enrollments', { params });
  return data;
}

export async function getAttendance(params?: Record<string, unknown>): Promise<unknown> {
  const { data } = await apiClient.get('/analytics/attendance', { params });
  return data;
}

export async function getGrades(params?: Record<string, unknown>): Promise<unknown> {
  const { data } = await apiClient.get('/analytics/grades', { params });
  return data;
}

export async function getDropout(params?: Record<string, unknown>): Promise<unknown> {
  const { data } = await apiClient.get('/analytics/dropout', { params });
  return data;
}

export async function getGraduates(params?: Record<string, unknown>): Promise<unknown> {
  const { data } = await apiClient.get('/analytics/graduates', { params });
  return data;
}

const analyticsService = {
  getEnrollments,
  getAttendance,
  getGrades,
  getDropout,
  getGraduates,
};

export default analyticsService;
