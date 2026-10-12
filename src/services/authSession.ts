/**
 * Manejo centralizado del token de sesión (Laravel Sanctum, Bearer).
 *
 * Decisión consciente: el token se guarda en localStorage porque el backend
 * emite tokens Bearer (no cookies de sesión). localStorage es legible por
 * cualquier script que se ejecute en la página, así que una vulnerabilidad XSS
 * podría robar el token. Migrar a cookies HttpOnly + CSRF (modo SPA de
 * Sanctum) requiere cambios en el backend; mientras tanto, todo el acceso al
 * token pasa por este módulo para poder cambiar el mecanismo en un solo lugar.
 */

const TOKEN_KEY = 'access_token';
/** Clave heredada de versiones anteriores que guardaban el perfil completo. */
const LEGACY_USER_KEY = 'user_data';
const REDIRECT_KEY = 'auth_redirect_to';
const NOTICE_KEY = 'auth_notice';

function safeLocal(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

function safeSession(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  try {
    return safeLocal()?.getItem(TOKEN_KEY) ?? null;
  } catch {
    return null;
  }
}

export function setAccessToken(token: string): void {
  try {
    safeLocal()?.setItem(TOKEN_KEY, token);
  } catch {
    // Sin almacenamiento disponible la sesión solo vive en memoria.
  }
}

export function clearAccessToken(): void {
  try {
    const storage = safeLocal();
    storage?.removeItem(TOKEN_KEY);
    storage?.removeItem(LEGACY_USER_KEY);
  } catch {
    // Nada que limpiar si el almacenamiento no está disponible.
  }
}

/** Elimina datos de perfil persistidos por versiones antiguas de la app. */
export function clearLegacyUserData(): void {
  try {
    safeLocal()?.removeItem(LEGACY_USER_KEY);
  } catch {
    // Ignorar.
  }
}

/** Solo se aceptan rutas internas ("/algo"), nunca URLs absolutas ni "//host". */
export function isSafeInternalPath(path: string | null | undefined): path is string {
  return !!path && path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/login');
}

/** Recuerda a dónde volver después de iniciar sesión. */
export function rememberRedirect(path: string, notice?: string): void {
  try {
    const storage = safeSession();
    storage?.setItem(REDIRECT_KEY, isSafeInternalPath(path) ? path : '/app');
    if (notice) {
      storage?.setItem(NOTICE_KEY, notice);
    }
  } catch {
    // Continuar al login aunque no se pueda guardar el destino.
  }
}
