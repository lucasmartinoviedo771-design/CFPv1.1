import axios from "axios";
// Unificar estrategia de baseURL con apiClient: usar REACT_APP_API_BASE_URL si existe,
// de lo contrario, usar ruta relativa "/api" para que funcione con el proxy de CRA
// o con servidor detrás del mismo host.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_V2_BASE || "/api/v2",
  timeout: 60000,
});
export default api;
