import axios from 'axios';
import authService from './authService';

const authHeaders = () => {
  const token = authService.getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function getEnrollments(params) {
  const { data } = await axios.get('/api/analytics/enrollments/', { params, headers: authHeaders() });
  return data;
}

export async function getAttendance(params) {
  const { data } = await axios.get('/api/analytics/attendance/', { params, headers: authHeaders() });
  return data;
}

export async function getGrades(params) {
  const { data } = await axios.get('/api/analytics/grades/', { params, headers: authHeaders() });
  return data;
}

export async function getDropout(params) {
  const { data } = await axios.get('/api/analytics/dropout/', { params, headers: authHeaders() });
  return data;
}

export async function getGraduates(params) {
  const { data } = await axios.get('/api/analytics/graduates/', { params, headers: authHeaders() });
  return data;
}

export default {
  getEnrollments,
  getAttendance,
  getGrades,
  getDropout,
  getGraduates,
};
