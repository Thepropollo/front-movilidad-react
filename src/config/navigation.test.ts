import { describe, expect, it } from 'vitest';
import { NAV_ITEMS, navForRoles } from './navigation';
import { ROLE_HOMES, type RoleId } from './roles';

describe('navegación por rol', () => {
  it('no tiene rutas ni ids duplicados', () => {
    const ids = NAV_ITEMS.map((item) => item.id);
    const paths = NAV_ITEMS.map((item) => item.path);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('cada enlace de un rol vive bajo su panel (salvo los transversales)', () => {
    for (const item of NAV_ITEMS) {
      if (item.roles.length > 1) continue;
      const home = ROLE_HOMES[item.roles[0] as RoleId];
      expect(item.path.startsWith(home), `${item.id} -> ${item.path}`).toBe(true);
    }
  });

  it('un docente no ve opciones de Secretaría y sí ve "Verificar documento"', () => {
    const items = navForRoles(['docente']);
    expect(items.some((i) => i.path.startsWith('/app/secretaria'))).toBe(false);
    expect(items.some((i) => i.path === '/app/verificar')).toBe(true);
  });

  it('"Liquidar viáticos" ya no se ofrece como acción disponible', () => {
    expect(NAV_ITEMS.some((i) => i.label === 'Liquidar viáticos')).toBe(false);
  });
});
