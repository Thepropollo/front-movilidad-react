import type { RoleId } from './roles';

export type NavItem = {
  id: string;
  label: string;
  shortLabel?: string;
  path: string;
  module: string;
  roles: RoleId[];
  status: 'ready' | 'stub';
  description: string;
  /** Shown as quick actions; secondary stays collapsed. */
  priority: 'primary' | 'secondary';
};

export const NAV_ITEMS: NavItem[] = [
  // Secretaría — flujo diario primero
  { id: 'sec-autorizar', label: 'Autorizar solicitudes', shortLabel: 'Autorizar', path: '/app/secretaria/autorizar', module: 'Operación diaria', roles: ['secretaria'], status: 'ready', description: 'Aprobar o rechazar con observación', priority: 'primary' },
  { id: 'sec-asignar', label: 'Asignar recursos', shortLabel: 'Asignar', path: '/app/secretaria/asignar', module: 'Operación diaria', roles: ['secretaria'], status: 'ready', description: 'Conductor y vehículo', priority: 'primary' },
  { id: 'sec-agenda', label: 'Agenda semanal', shortLabel: 'Agenda', path: '/app/secretaria/agenda', module: 'Operación diaria', roles: ['secretaria'], status: 'ready', description: 'Calendario por conductor/vehículo', priority: 'primary' },
  { id: 'sec-alertas', label: 'Alertas', path: '/app/secretaria/alertas', module: 'Operación diaria', roles: ['secretaria'], status: 'ready', description: 'Licencias, matrículas, cupos, km', priority: 'primary' },
  { id: 'sec-solicitudes', label: 'Bandeja de solicitudes', shortLabel: 'Bandeja', path: '/app/secretaria/solicitudes', module: 'Consultas', roles: ['secretaria'], status: 'ready', description: 'Todas las solicitudes con estado', priority: 'secondary' },
  { id: 'sec-participantes', label: 'Participantes', path: '/app/secretaria/participantes', module: 'Consultas', roles: ['secretaria'], status: 'ready', description: 'Aceptados y rechazados', priority: 'secondary' },
  { id: 'sec-flujo', label: 'Trazabilidad', path: '/app/secretaria/flujo', module: 'Consultas', roles: ['secretaria'], status: 'ready', description: 'Historial de estados y actores', priority: 'secondary' },
  { id: 'sec-mapa', label: 'Mapa de rutas', shortLabel: 'Mapa', path: '/app/secretaria/mapa', module: 'Consultas', roles: ['secretaria'], status: 'ready', description: 'Visualizar recorridos', priority: 'secondary' },
  { id: 'sec-disponibilidad', label: 'Disponibilidad', path: '/app/secretaria/disponibilidad', module: 'Consultas', roles: ['secretaria'], status: 'ready', description: 'Conductores libres', priority: 'secondary' },
  { id: 'sec-reasignar', label: 'Reasignar conductor', shortLabel: 'Reasignar', path: '/app/secretaria/reasignar', module: 'Consultas', roles: ['secretaria'], status: 'ready', description: 'Tras rechazo notificado', priority: 'secondary' },
  { id: 'sec-flota-conductores', label: 'Conductores', path: '/app/secretaria/flota/conductores', module: 'Flota y taller', roles: ['secretaria'], status: 'ready', description: 'Registrar y editar conductores', priority: 'secondary' },
  { id: 'sec-flota-vehiculos', label: 'Vehículos', path: '/app/secretaria/flota/vehiculos', module: 'Flota y taller', roles: ['secretaria'], status: 'ready', description: 'Registrar y editar vehículos', priority: 'secondary' },
  { id: 'sec-flota-estado', label: 'Estado de flota', shortLabel: 'Estado flota', path: '/app/secretaria/flota/estado', module: 'Flota y taller', roles: ['secretaria'], status: 'ready', description: 'Disponible / en uso / taller', priority: 'secondary' },
  { id: 'sec-gasolineras', label: 'Gasolineras', path: '/app/secretaria/gasolineras', module: 'Flota y taller', roles: ['secretaria'], status: 'ready', description: 'Cupos y precios', priority: 'secondary' },
  { id: 'sec-ot', label: 'Orden de revisión', shortLabel: 'Taller', path: '/app/secretaria/taller', module: 'Flota y taller', roles: ['secretaria'], status: 'ready', description: 'Generar OT', priority: 'secondary' },
  { id: 'sec-reportes', label: 'Reportes', path: '/app/secretaria/reportes', module: 'Economía', roles: ['secretaria'], status: 'ready', description: 'CSV y resúmenes', priority: 'primary' },
  { id: 'sec-viaticos', label: 'Viáticos', path: '/app/secretaria/economico', module: 'Economía', roles: ['secretaria'], status: 'ready', description: 'Liquidaciones y auditoría', priority: 'secondary' },
  { id: 'sec-documentos', label: 'Documentos', path: '/app/secretaria/documentos', module: 'Economía', roles: ['secretaria'], status: 'ready', description: 'Actas e historial', priority: 'secondary' },
  { id: 'sec-inspeccion', label: 'Inspección en patio', shortLabel: 'Inspección', path: '/app/secretaria/inspeccion', module: 'Flota y taller', roles: ['secretaria'], status: 'ready', description: 'Actas entrega/recepción', priority: 'secondary' },

  // Conductor
  { id: 'con-viajes', label: 'Mis viajes', path: '/app/conductor/viajes', module: 'Hoy', roles: ['conductor'], status: 'ready', description: 'Aceptar o rechazar asignaciones', priority: 'primary' },
  { id: 'con-hoja', label: 'Hoja de ruta', path: '/app/conductor/hoja-ruta', module: 'Hoy', roles: ['conductor'], status: 'ready', description: 'Paradas con GPS', priority: 'primary' },
  { id: 'con-mapa', label: 'Mapa de mi ruta', shortLabel: 'Mapa', path: '/app/conductor/mapa', module: 'Hoy', roles: ['conductor'], status: 'ready', description: 'Ver recorrido', priority: 'primary' },
  { id: 'con-pagos', label: 'Mis pagos', path: '/app/conductor/pagos', module: 'Administrativo', roles: ['conductor'], status: 'ready', description: 'Confirmar o disputar montos', priority: 'primary' },
  { id: 'con-combustible', label: 'Combustible', path: '/app/conductor/combustible', module: 'Administrativo', roles: ['conductor'], status: 'ready', description: 'Vales y despacho', priority: 'secondary' },
  { id: 'con-novedad', label: 'Reportar novedad', shortLabel: 'Novedad', path: '/app/conductor/novedades', module: 'Administrativo', roles: ['conductor'], status: 'ready', description: 'Avería o anomalía', priority: 'secondary' },
  { id: 'con-vehiculo', label: 'Mi vehículo', path: '/app/conductor/vehiculo', module: 'Administrativo', roles: ['conductor'], status: 'ready', description: 'Km y mantenimiento', priority: 'secondary' },

  // Mecánico
  { id: 'mec-ordenes', label: 'Órdenes de taller', shortLabel: 'Órdenes', path: '/app/mecanico/ordenes', module: 'Taller', roles: ['mecanico'], status: 'ready', description: 'OT asignadas y cierre', priority: 'primary' },
  { id: 'mec-inspeccion', label: 'Inspección en patio', shortLabel: 'Inspección', path: '/app/mecanico/inspeccion', module: 'Taller', roles: ['mecanico'], status: 'ready', description: 'Actas entrega/recepción', priority: 'primary' },
  { id: 'mec-lubricantes', label: 'Lubricantes', path: '/app/mecanico/lubricantes', module: 'Taller', roles: ['mecanico'], status: 'ready', description: 'Aceites y filtros', priority: 'secondary' },
  { id: 'mec-historial', label: 'Historial', path: '/app/mecanico/historial', module: 'Taller', roles: ['mecanico'], status: 'ready', description: 'OT ejecutadas', priority: 'secondary' },

  // Docente
  { id: 'doc-solicitar', label: 'Solicitar viaje', shortLabel: 'Solicitar', path: '/app/docente/solicitar', module: 'Solicitud', roles: ['docente'], status: 'ready', description: 'Crear solicitud', priority: 'primary' },
  { id: 'doc-participantes', label: 'Participantes', path: '/app/docente/participantes', module: 'Solicitud', roles: ['docente'], status: 'ready', description: 'Invitar estudiantes', priority: 'primary' },
  { id: 'doc-flujo', label: 'Trazabilidad', path: '/app/docente/flujo', module: 'Solicitud', roles: ['docente'], status: 'ready', description: 'Etapas y responsables', priority: 'primary' },
  { id: 'doc-liquidar', label: 'Liquidar viáticos', shortLabel: 'Liquidar', path: '/app/docente/liquidar', module: 'Después del viaje', roles: ['docente'], status: 'ready', description: 'Comprobantes', priority: 'primary' },
  { id: 'doc-mapa', label: 'Mapa del viaje', shortLabel: 'Mapa', path: '/app/docente/mapa', module: 'Después del viaje', roles: ['docente'], status: 'ready', description: 'Seguimiento geográfico', priority: 'secondary' },
  { id: 'doc-seguimiento', label: 'Durante el viaje', shortLabel: 'Seguimiento', path: '/app/docente/seguimiento', module: 'Después del viaje', roles: ['docente'], status: 'ready', description: 'Conductor y horarios', priority: 'secondary' },
  { id: 'doc-evaluar', label: 'Calificar viaje', shortLabel: 'Calificar', path: '/app/docente/evaluar', module: 'Después del viaje', roles: ['docente'], status: 'ready', description: 'Evaluación post-viaje', priority: 'secondary' },
  { id: 'doc-reportes', label: 'Mis reportes', path: '/app/docente/reportes', module: 'Después del viaje', roles: ['docente'], status: 'ready', description: 'Historial exportable', priority: 'secondary' },
  { id: 'doc-historial', label: 'Historial', path: '/app/docente/historial', module: 'Después del viaje', roles: ['docente'], status: 'ready', description: 'Viajes solicitados', priority: 'secondary' },

  // Facultad
  { id: 'fac-bandeja', label: 'Solicitudes de facultad', shortLabel: 'Bandeja', path: '/app/facultad/solicitudes', module: 'Facultad', roles: ['responsable_facultad'], status: 'ready', description: 'Viajes de su unidad', priority: 'primary' },
  { id: 'fac-reportes', label: 'Reportes', path: '/app/facultad/reportes', module: 'Facultad', roles: ['responsable_facultad'], status: 'ready', description: 'Exportar movimientos', priority: 'primary' },
  { id: 'fac-historial', label: 'Historial', path: '/app/facultad/historial', module: 'Facultad', roles: ['responsable_facultad'], status: 'ready', description: 'Filtros por periodo', priority: 'secondary' },

  // Vicerrector
  { id: 'vic-bandeja', label: 'Externas pendientes', shortLabel: 'Pendientes', path: '/app/vicerrector/pendientes', module: 'Vicerrectorado', roles: ['vicerrector'], status: 'ready', description: 'Aprobar o rechazar', priority: 'primary' },
  { id: 'vic-reportes', label: 'Reportes', path: '/app/vicerrector/reportes', module: 'Vicerrectorado', roles: ['vicerrector'], status: 'ready', description: 'Externas y CSV', priority: 'primary' },
  { id: 'vic-mapa', label: 'Mapa de rutas', shortLabel: 'Mapa', path: '/app/vicerrector/mapa', module: 'Vicerrectorado', roles: ['vicerrector'], status: 'ready', description: 'Rutas externas', priority: 'secondary' },
  { id: 'vic-historial', label: 'Historial', path: '/app/vicerrector/historial', module: 'Vicerrectorado', roles: ['vicerrector'], status: 'ready', description: 'Historial filtrable', priority: 'secondary' },
  { id: 'vic-docs', label: 'Documentos', path: '/app/vicerrector/documentos', module: 'Vicerrectorado', roles: ['vicerrector'], status: 'ready', description: 'Documentación', priority: 'secondary' },

  // Estudiante
  { id: 'est-invitaciones', label: 'Invitaciones', path: '/app/estudiante/invitaciones', module: 'Mis viajes', roles: ['estudiante'], status: 'ready', description: 'Confirmar participación', priority: 'primary' },
  { id: 'est-detalle', label: 'Conductor y horario', shortLabel: 'Detalle', path: '/app/estudiante/detalle', module: 'Mis viajes', roles: ['estudiante'], status: 'ready', description: 'Datos asignados', priority: 'primary' },
  { id: 'est-mapa', label: 'Mapa del viaje', shortLabel: 'Mapa', path: '/app/estudiante/mapa', module: 'Mis viajes', roles: ['estudiante'], status: 'ready', description: 'Ver ruta asignada', priority: 'primary' },
  { id: 'est-flujo', label: 'Trazabilidad', path: '/app/estudiante/flujo', module: 'Mis viajes', roles: ['estudiante'], status: 'ready', description: 'Estado del viaje', priority: 'secondary' },
  { id: 'est-evaluar', label: 'Calificar viaje', shortLabel: 'Calificar', path: '/app/estudiante/evaluar', module: 'Mis viajes', roles: ['estudiante'], status: 'ready', description: 'Evaluación 1-5', priority: 'secondary' },
  { id: 'est-historial', label: 'Historial', path: '/app/estudiante/historial', module: 'Mis viajes', roles: ['estudiante'], status: 'ready', description: 'Viajes propios', priority: 'secondary' },
];

export function navForRoles(roles: RoleId[]): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.some((r) => roles.includes(r)));
}

export function primaryNav(items: NavItem[]): NavItem[] {
  return items.filter((item) => item.priority === 'primary');
}

export function secondaryNav(items: NavItem[]): NavItem[] {
  return items.filter((item) => item.priority === 'secondary');
}

export function groupNavByModule(items: NavItem[]): Record<string, NavItem[]> {
  return items.reduce<Record<string, NavItem[]>>((acc, item) => {
    acc[item.module] = acc[item.module] ?? [];
    acc[item.module].push(item);
    return acc;
  }, {});
}

export function navLabel(item: NavItem, compact = false): string {
  return compact && item.shortLabel ? item.shortLabel : item.label;
}
