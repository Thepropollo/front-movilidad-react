import axios from 'axios';
import {
  clearAccessToken,
  getAccessToken,
  rememberRedirect,
} from './authSession';

const baseURL = import.meta.env.VITE_API_BASE_URL?.trim();

if (!baseURL) {
  throw new Error(
    'VITE_API_BASE_URL debe configurarse antes de iniciar la aplicación.'
  );
}

const api = axios.create({
  baseURL,
  timeout: 20_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl: string = error?.config?.url ?? '';
    // Un 401 en /login o /register significa credenciales inválidas, no una
    // sesión vencida: se deja que el formulario muestre el error.
    const isAuthAttempt = /^\/?(login|register)\/?$/.test(requestUrl);
    if (status === 401 && !isAuthAttempt && typeof window !== 'undefined') {
      clearAccessToken();
      if (!window.location.pathname.startsWith('/login')) {
        rememberRedirect(
          window.location.pathname + window.location.search,
          'Tu sesión venció. Inicia sesión para continuar.'
        );
        window.location.assign('/login');
      }
    } else if (status === 403 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app:forbidden'));
    }
    return Promise.reject(error);
  }
);

export default api;
