import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import api from './api';
import { getAccessToken, setAccessToken } from './authSession';

function rejectWith(status: number): AxiosAdapter {
  return (config: InternalAxiosRequestConfig) =>
    Promise.reject(
      new AxiosError('error', String(status), config, null, {
        status,
        statusText: String(status),
        data: { message: 'x' },
        headers: {},
        config,
      })
    );
}

describe('cliente API', () => {
  const originalAdapter = api.defaults.adapter;

  beforeEach(() => {
    window.history.pushState({}, '', '/login');
  });

  afterEach(() => {
    api.defaults.adapter = originalAdapter;
    window.history.pushState({}, '', '/');
  });

  it('envía el token Bearer guardado', async () => {
    setAccessToken('tok-1');
    let auth: unknown;
    api.defaults.adapter = (config) => {
      auth = config.headers.Authorization;
      return Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config });
    };
    await api.get('/me');
    expect(auth).toBe('Bearer tok-1');
  });

  it('un 401 en /login (credenciales inválidas) no cierra la sesión ni marca "sesión vencida"', async () => {
    setAccessToken('tok-previo');
    api.defaults.adapter = rejectWith(401);
    await expect(api.post('/login', {})).rejects.toBeInstanceOf(AxiosError);
    expect(getAccessToken()).toBe('tok-previo');
    expect(sessionStorage.getItem('auth_notice')).toBeNull();
  });

  it('un 401 en otra ruta elimina el token', async () => {
    setAccessToken('tok-vencido');
    api.defaults.adapter = rejectWith(401);
    await expect(api.get('/solicitudes')).rejects.toBeInstanceOf(AxiosError);
    expect(getAccessToken()).toBeNull();
  });
});
