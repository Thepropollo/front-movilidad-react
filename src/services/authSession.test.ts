import { describe, expect, it } from 'vitest';
import {
  clearAccessToken,
  getAccessToken,
  isSafeInternalPath,
  rememberRedirect,
  setAccessToken,
} from './authSession';

describe('authSession', () => {
  it('guarda, lee y elimina el token en un solo lugar', () => {
    expect(getAccessToken()).toBeNull();
    setAccessToken('abc123');
    expect(getAccessToken()).toBe('abc123');
    localStorage.setItem('user_data', '{"legacy":true}');
    clearAccessToken();
    expect(getAccessToken()).toBeNull();
    expect(localStorage.getItem('user_data')).toBeNull();
  });

  it('solo acepta rutas internas como destino de redirección', () => {
    expect(isSafeInternalPath('/app/verificar/5')).toBe(true);
    expect(isSafeInternalPath('//evil.example')).toBe(false);
    expect(isSafeInternalPath('https://evil.example')).toBe(false);
    expect(isSafeInternalPath('/login')).toBe(false);
    expect(isSafeInternalPath('')).toBe(false);
  });

  it('recuerda el destino y el aviso para después del login', () => {
    rememberRedirect('/app/verificar/7', 'Tu sesión venció.');
    expect(sessionStorage.getItem('auth_redirect_to')).toBe('/app/verificar/7');
    expect(sessionStorage.getItem('auth_notice')).toBe('Tu sesión venció.');

    rememberRedirect('//evil.example');
    expect(sessionStorage.getItem('auth_redirect_to')).toBe('/app');
  });
});
