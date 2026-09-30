import axios from 'axios';

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
    const token = localStorage.getItem('access_token');
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
    if (status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      if (!window.location.pathname.startsWith('/login')) {
        try {
          sessionStorage.setItem(
            'auth_redirect_to',
            window.location.pathname.startsWith('/') &&
              !window.location.pathname.startsWith('//')
              ? window.location.pathname
              : '/app'
          );
          sessionStorage.setItem(
            'auth_notice',
            'Tu sesión venció. Inicia sesión para continuar.'
          );
        } catch {
          // Continue to login even when browser storage is unavailable.
        }
        window.location.assign('/login');
      }
    } else if (status === 403 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app:forbidden'));
    }
    return Promise.reject(error);
  }
);

export default api;
