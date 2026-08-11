export type RoleId =
  | 'secretaria'
  | 'conductor'
  | 'mecanico'
  | 'docente'
  | 'responsable_facultad'
  | 'vicerrector'
  | 'estudiante';

export const ROLE_ALIASES: Record<string, RoleId> = {
  jefe_transporte: 'secretaria',
  chofer: 'conductor',
  solicitante: 'docente',
  rector: 'vicerrector',
  pasajero: 'estudiante',
};

export const ROLE_LABELS: Record<RoleId, string> = {
  secretaria: 'Secretaría / Administrativo',
  conductor: 'Conductor',
  mecanico: 'Mecánico',
  docente: 'Docente',
  responsable_facultad: 'Responsable de Facultad',
  vicerrector: 'Vicerrector',
  estudiante: 'Estudiante',
};

export const ROLE_HOMES: Record<RoleId, string> = {
  secretaria: '/app/secretaria',
  conductor: '/app/conductor',
  mecanico: '/app/mecanico',
  docente: '/app/docente',
  responsable_facultad: '/app/facultad',
  vicerrector: '/app/vicerrector',
  estudiante: '/app/estudiante',
};

export function canonicalizeRole(role?: string | null): RoleId | null {
  if (!role) return null;
  if (role in ROLE_LABELS) return role as RoleId;
  return ROLE_ALIASES[role] ?? null;
}

export function normalizeRoles(
  primary?: { name?: string } | null,
  roles?: Array<{ name?: string }> | null
): RoleId[] {
  const names = [
    ...(roles?.map((r) => r.name) ?? []),
    primary?.name,
  ].filter(Boolean) as string[];

  const set = new Set<RoleId>();
  for (const name of names) {
    const canonical = canonicalizeRole(name);
    if (canonical) set.add(canonical);
  }
  return Array.from(set);
}

export function hasAnyRole(owned: RoleId[], allowed: RoleId[]): boolean {
  return allowed.some((role) => owned.includes(role));
}

export function homeForRoles(roles: RoleId[]): string {
  const priority: RoleId[] = [
    'secretaria',
    'vicerrector',
    'responsable_facultad',
    'docente',
    'conductor',
    'mecanico',
    'estudiante',
  ];
  for (const role of priority) {
    if (roles.includes(role)) return ROLE_HOMES[role];
  }
  return '/app';
}

/** Regla: mecánico puro no puede ser conductor; conductor sí puede ser mecánico. */
export function isDualConductorMechanic(roles: RoleId[]): boolean {
  return roles.includes('conductor') && roles.includes('mecanico');
}

export function isDualDocenteFacultad(roles: RoleId[]): boolean {
  return roles.includes('docente') && roles.includes('responsable_facultad');
}
