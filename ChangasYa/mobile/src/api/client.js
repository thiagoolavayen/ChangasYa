import axios from 'axios';

// Configurar en mobile/.env con EXPO_PUBLIC_API_URL=http://TU_IP_LOCAL:4000/api
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Interceptor para adjuntar el token del trabajador cuando exista
export function setWorkerToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}
