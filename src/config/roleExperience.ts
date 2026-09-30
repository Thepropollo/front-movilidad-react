import type { RoleId } from './roles';

export type RolePillar = {
  title: string;
  text: string;
  href: string;
};

export type RoleExperience = {
  promise: string;
  pillars: RolePillar[];
  guide: string[];
};

/** Primera vista: lo que la tesis promete, en el lenguaje de cada rol. */
export const ROLE_EXPERIENCE: Record<RoleId, RoleExperience> = {
  secretaria: {
    promise:
      'Un repositorio único para autorizar, asignar y controlar la flota: sin oficios sueltos ni asignaciones cruzadas.',
    pillars: [
      {
        title: 'Autorizar',
        text: 'Bandeja digital. Internas, externas y salidas próximas.',
        href: '/app/secretaria/autorizar',
      },
      {
        title: 'Asignar',
        text: 'Conductor y vehículo según disponibilidad real.',
        href: '/app/secretaria/asignar',
      },
      {
        title: 'Flota y taller',
        text: 'Estado, aceite y mantenimiento preventivo.',
        href: '/app/secretaria/flota/estado',
      },
      {
        title: 'Reportes',
        text: 'Combustible, kilometraje y constancia para decidir.',
        href: '/app/secretaria/reportes',
      },
    ],
    guide: [
      'Atienda primero las salidas de las próximas 48 horas y los viajes externos.',
      'No asigne unidades con aceite vencido o en taller: el sistema las bloquea.',
      'Cierre cada trámite con hoja de ruta y PDF; la trazabilidad queda en el flujo.',
    ],
  },
  responsable_facultad: {
    promise:
      'La facultad solicita el vehículo en línea, sigue el trámite y conserva el respaldo digital.',
    pillars: [
      {
        title: 'Solicitar',
        text: 'Registro digital: ocupantes, actividad y destino.',
        href: '/app/facultad/solicitar',
      },
      {
        title: 'Trazabilidad',
        text: 'Estado, responsables y fechas de cada salida.',
        href: '/app/facultad/seguimiento',
      },
      {
        title: 'Documentos',
        text: 'Orden y hoja de ruta en PDF institucional.',
        href: '/app/facultad/documentos',
      },
      {
        title: 'Reportes',
        text: 'Constancia de uso de la unidad académica.',
        href: '/app/facultad/reportes',
      },
    ],
    guide: [
      'Registre la salida aquí: ya no hace falta el oficio físico para iniciar el trámite.',
      'Las internas las autoriza Secretaría; las externas pasan por Vicerrectorado.',
      'En seguimiento ve quién actuó y cuándo. El PDF queda como constancia.',
    ],
  },
  docente: {
    promise:
      'Pida el vehículo, invite participantes y siga la autorización hasta el respaldo PDF.',
    pillars: [
      {
        title: 'Solicitar',
        text: 'Trámite digital para la práctica, visita o gestión.',
        href: '/app/docente/solicitar',
      },
      {
        title: 'Seguimiento',
        text: 'Quién autorizó, qué falta y en qué fecha sale.',
        href: '/app/docente/flujo',
      },
      {
        title: 'Participantes',
        text: 'Invitaciones y confirmaciones del viaje.',
        href: '/app/docente/participantes',
      },
      {
        title: 'Documentos',
        text: 'Orden de movilización lista para archivo.',
        href: '/app/docente/documentos',
      },
    ],
    guide: [
      'Una solicitud interna no espera a Vicerrectorado; una externa sí.',
      'Invite a estudiantes y docentes: el sistema deja constancia de quién viaja.',
      'Cuando esté autorizada, descargue el PDF. No dependa del papel suelto.',
    ],
  },
  vicerrector: {
    promise:
      'Visto bueno digital de viajes externos, con constancia de lo autorizado y lo rechazado.',
    pillars: [
      {
        title: 'Pendientes',
        text: 'Externas que esperan autorización académica.',
        href: '/app/vicerrector/pendientes',
      },
      {
        title: 'Historial',
        text: 'Trazabilidad de vistos buenos y rechazos.',
        href: '/app/vicerrector/historial',
      },
      {
        title: 'Documentos',
        text: 'Respaldos PDF del trámite.',
        href: '/app/vicerrector/documentos',
      },
      {
        title: 'Reportes',
        text: 'Informe del periodo para la dirección.',
        href: '/app/vicerrector/reportes',
      },
    ],
    guide: [
      'Solo ve movilizaciones externas: las internas las resuelve Secretaría.',
      'Autorice o rechace con observación; queda registrado quién decidió.',
      'El informe mensual concentra lo atendido en el periodo.',
    ],
  },
  conductor: {
    promise:
      'Acepte el viaje, recorra la hoja de ruta y reporte kilometraje o novedades de la unidad.',
    pillars: [
      {
        title: 'Viajes',
        text: 'Aceptar o rechazar la asignación.',
        href: '/app/conductor/viajes',
      },
      {
        title: 'Hoja de ruta',
        text: 'Recorrido y paradas del servicio.',
        href: '/app/conductor/hoja-ruta',
      },
      {
        title: 'Combustible',
        text: 'Tickets de despacho de la unidad.',
        href: '/app/conductor/combustible',
      },
      {
        title: 'Novedades',
        text: 'Fallas o observaciones para taller.',
        href: '/app/conductor/novedades',
      },
    ],
    guide: [
      'Si no puede cubrir el viaje, rechace a tiempo para reasignar.',
      'Registre paradas y kilometraje: alimentan reportes de uso de la flota.',
      'Una novedad a tiempo evita un mantenimiento solo correctivo.',
    ],
  },
  mecanico: {
    promise:
      'Pase del mantenimiento reactivo al preventivo: aceite, inspecciones y órdenes de taller.',
    pillars: [
      {
        title: 'Órdenes',
        text: 'Trabajo preventivo y correctivo abierto.',
        href: '/app/mecanico/ordenes',
      },
      {
        title: 'Inspección',
        text: 'Acta de entrega y recepción de la unidad.',
        href: '/app/mecanico/inspeccion',
      },
      {
        title: 'Lubricantes',
        text: 'Control de aceite antes de que falle el motor.',
        href: '/app/mecanico/lubricantes',
      },
      {
        title: 'Reportes',
        text: 'Historial de la unidad para decidir.',
        href: '/app/mecanico/reportes',
      },
    ],
    guide: [
      'Priorice unidades con aceite vencido: no deben salir asignadas.',
      'Cada OT deja historial de la placa: asignaciones y taller en un solo lugar.',
      'Cierre la orden al terminar; así Secretaría ve la unidad otra vez disponible.',
    ],
  },
  estudiante: {
    promise:
      'Confirme si viaja, consulte horarios y conserve el documento del servicio.',
    pillars: [
      {
        title: 'Invitaciones',
        text: 'Aceptar o rechazar la participación.',
        href: '/app/estudiante/invitaciones',
      },
      {
        title: 'Seguimiento',
        text: 'Estado del viaje en el que participa.',
        href: '/app/estudiante/flujo',
      },
      {
        title: 'Documentos',
        text: 'Orden y hoja de ruta en PDF.',
        href: '/app/estudiante/documentos',
      },
      {
        title: 'Evaluar',
        text: 'Califique el servicio al cerrar el viaje.',
        href: '/app/estudiante/evaluar',
      },
    ],
    guide: [
      'Responda la invitación: el docente necesita saber quién sube.',
      'El detalle del viaje sustituye preguntar por WhatsApp u oficio.',
      'Al volver, evalúe: esa nota mejora el servicio de la flota.',
    ],
  },
};
