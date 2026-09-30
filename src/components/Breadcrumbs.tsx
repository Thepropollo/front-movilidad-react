import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { NAV_ITEMS } from '../config/navigation';
import { ROLE_HOMES, ROLE_LABELS, homeForRoles, type RoleId } from '../config/roles';
import { useAuth } from '../context/AuthContext';

export interface BreadcrumbCrumb {
  label: string;
  path?: string;
  isCurrent?: boolean;
  isModule?: boolean;
}

const SHORT_ROLE: Record<string, string> = {
  'Secretaría / Administrativo': 'Secretaría',
  'Responsable de Facultad': 'Facultad',
};

const KNOWN_SEGMENT_LABELS: Record<string, string> = {
  'hoja-ruta': 'Hoja de ruta',
  'combustible': 'Combustible',
  'despacho': 'Despacho de combustible',
  'novedades': 'Novedades',
  'vehiculo': 'Mi vehículo',
  'vehiculos': 'Vehículos',
  'pagos': 'Mis pagos',
  'viajes': 'Mis viajes',
  'solicitudes': 'Solicitudes',
  'solicitar': 'Solicitar vehículo',
  'autorizar': 'Autorizar',
  'asignar': 'Asignar recursos',
  'agenda': 'Agenda semanal',
  'documentos': 'Documentos',
  'reportes': 'Reportes',
  'mapa': 'Mapa institucional',
  'taller': 'Taller mecánico',
  'ordenes': 'Órdenes de taller',
  'tarifas': 'Tarifas',
  'flota': 'Flota',
  'conductores': 'Conductores',
  'estado': 'Estado de flota',
  'inspeccion': 'Inspección',
  'lubricantes': 'Lubricantes',
  'disponibilidad': 'Disponibilidad',
  'participantes': 'Participantes',
  'flujo': 'Trazabilidad',
  'reasignar': 'Reasignar conductor',
  'liquidar': 'Liquidar viáticos',
  'evaluar': 'Calificar viaje',
  'invitaciones': 'Invitaciones',
  'detalle': 'Detalle de viaje',
  'seguimiento': 'Seguimiento',
  'historial': 'Historial',
  'pendientes': 'Aprobaciones pendientes',
  'economico': 'Auditoría financiera',
};

function getBreadcrumbTrail(
  pathname: string,
  homePath: string
): BreadcrumbCrumb[] {
  const isHome =
    pathname === homePath ||
    pathname === '/app' ||
    pathname === '/app/';

  if (isHome) {
    return [
      { label: 'Inicio', path: homePath },
      { label: 'Dashboard', isCurrent: true },
    ];
  }

  const trail: BreadcrumbCrumb[] = [{ label: 'Inicio', path: homePath }];

  // 1. Check if pathname matches a role home
  for (const [roleKey, roleHome] of Object.entries(ROLE_HOMES)) {
    if (pathname === roleHome) {
      const roleLabel =
        SHORT_ROLE[ROLE_LABELS[roleKey as RoleId]] ??
        ROLE_LABELS[roleKey as RoleId] ??
        roleKey;
      trail.push({ label: `Panel ${roleLabel}`, isCurrent: true });
      return trail;
    }
  }

  // 2. Find matching NavItem in NAV_ITEMS (exact or prefix)
  const match =
    NAV_ITEMS.find((item) => item.path === pathname) ||
    NAV_ITEMS.find((item) => pathname.startsWith(item.path + '/')) ||
    NAV_ITEMS.find((item) => pathname.startsWith(item.path));

  if (match) {
    if (match.module) {
      trail.push({ label: match.module, isModule: true });
    }
    trail.push({ label: match.label, isCurrent: true });
    return trail;
  }

  // 3. Fallback: Parse path segments after /app/
  const subPath = pathname.replace(/^\/app\/?/, '');
  const segments = subPath.split('/').filter(Boolean);

  if (segments.length === 0) {
    trail.push({ label: 'Dashboard', isCurrent: true });
    return trail;
  }

  const roleSegment = segments[0] as RoleId;
  const roleName =
    SHORT_ROLE[ROLE_LABELS[roleSegment]] ??
    ROLE_LABELS[roleSegment] ??
    segments[0];

  if (segments.length === 1) {
    trail.push({ label: `Panel ${roleName}`, isCurrent: true });
    return trail;
  }

  trail.push({ label: roleName, isModule: true });

  const remaining = segments.slice(1);
  const lastLabel = remaining
    .map(
      (s) =>
        KNOWN_SEGMENT_LABELS[s] ||
        s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')
    )
    .join(' · ');

  trail.push({ label: lastLabel, isCurrent: true });
  return trail;
}

export interface BreadcrumbsProps {
  homePath?: string;
  className?: string;
}

export default function Breadcrumbs({ homePath, className = '' }: BreadcrumbsProps) {
  const location = useLocation();
  const { roleIds } = useAuth();

  const resolvedHome = homePath || homeForRoles(roleIds);

  const trail = useMemo(
    () => getBreadcrumbTrail(location.pathname, resolvedHome),
    [location.pathname, resolvedHome]
  );

  return (
    <nav
      className={`shell-topbar-breadcrumb ${className}`.trim()}
      aria-label="Ruta de navegación"
    >
      <ol className="shell-breadcrumb-list">
        {trail.map((item, idx) => {
          const isLast = idx === trail.length - 1;
          const isFirst = idx === 0;

          return (
            <React.Fragment key={`${item.label}-${idx}`}>
              {idx > 0 && (
                <li
                  className={`shell-breadcrumb-separator${item.isModule ? ' is-module-sep' : ''}`}
                  aria-hidden="true"
                >
                  <ChevronRight size={13} />
                </li>
              )}
              <li
                className={`shell-breadcrumb-item${item.isModule ? ' is-module' : ''}${item.isCurrent ? ' is-current' : ''}`}
              >
                {item.path && !isLast ? (
                  <Link
                    to={item.path}
                    className="shell-breadcrumb-link"
                    title={`Ir a ${item.label}`}
                  >
                    {isFirst && <Home size={14} aria-hidden="true" />}
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <span
                    className={
                      item.isCurrent
                        ? 'shell-breadcrumb-current'
                        : item.isModule
                        ? 'shell-breadcrumb-module'
                        : ''
                    }
                    {...(item.isCurrent ? { 'aria-current': 'page' } : {})}
                    title={item.label}
                  >
                    {isFirst && <Home size={14} aria-hidden="true" />}
                    <span>{item.label}</span>
                  </span>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
