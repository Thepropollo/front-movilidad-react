export const OPERATIONAL_STATUS_LABEL: Record<string, string> = {
  disponible: 'Disponible',
  en_viaje: 'En viaje',
  en_taller: 'En taller',
  inactivo: 'Inactivo',
};

export const FUEL_TYPE_LABEL: Record<string, string> = {
  diesel: 'Diésel',
  extra: 'Extra',
  super: 'Súper',
};

export const TRIP_STATUS_LABEL: Record<string, string> = {
  programado: 'Programado',
  en_ruta: 'En ruta',
  pendiente_feedback: 'Pendiente de evaluación',
  finalizado: 'Finalizado',
};

export const DRIVER_RESPONSE_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  aceptado: 'Aceptado',
  rechazado: 'Rechazado',
};

export const INVITATION_STATUS_LABEL: Record<string, string> = {
  invitado: 'Pendiente',
  aceptado: 'Aceptado',
  rechazado: 'Rechazado',
};

export const MOBILIZATION_TYPE_LABEL: Record<string, string> = {
  interna: 'Interna',
  externa: 'Externa',
};

export const ORDER_STATUS_LABEL: Record<string, string> = {
  emitida: 'Emitida',
  despachada: 'Despachada',
};

export const CONTRACT_TYPE_LABEL: Record<string, string> = {
  contrato: 'Contrato',
  nombramiento: 'Nombramiento',
};

export const REQUEST_STATUS_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  pendiente_secretaria: 'Pendiente de Secretaría',
  pendiente_rectorado: 'Pendiente de Rectorado',
  autorizada_secretaria: 'Autorizada por Secretaría',
  aprobado_rectorado: 'Aprobado por Rectorado',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  rechazado: 'Rechazado',
};

export const COMPENSATION_STATUS_LABEL: Record<string, string> = {
  pendiente_comprobante: 'Pendiente de confirmación',
  confirmado_conductor: 'Confirmado',
  en_disputa: 'En disputa',
  verificado_movilidad: 'Verificado por Movilidad',
  pagado: 'Pagado',
};

/** Devuelve la etiqueta legible de un valor, o el valor original si no existe. */
export function labelOf(
  map: Record<string, string>,
  value?: string | null
): string {
  if (value === null || value === undefined || value === '') return '—';
  return map[value] ?? value;
}

export function yesNo(value: unknown): string {
  return value ? 'Sí' : 'No';
}
