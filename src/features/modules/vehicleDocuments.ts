export type VehicleDocumentType =
  | 'permiso_circulacion'
  | 'revision_tecnica'
  | 'matricula';

export type VehicleDocumentDraft = {
  issue_date: string;
  expiration_date: string;
};

export type VehicleDocument = {
  issue_date?: string | null;
  expiration_date?: string | null;
  status?: string;
};

export type VehicleRecord = {
  id: number;
  plate?: string;
  brand?: string;
  model?: string;
  documents?: Record<string, VehicleDocument>;
};

export const VEHICLE_DOCUMENT_TYPES: Array<{
  type: VehicleDocumentType;
  label: string;
  shortLabel: string;
}> = [
  {
    type: 'permiso_circulacion',
    label: 'Permiso de circulación',
    shortLabel: 'Permiso',
  },
  {
    type: 'revision_tecnica',
    label: 'Revisión técnica',
    shortLabel: 'Revisión',
  },
  { type: 'matricula', label: 'Matrícula', shortLabel: 'Matrícula' },
];

export const EMPTY_VEHICLE_DOCUMENTS: Record<
  VehicleDocumentType,
  VehicleDocumentDraft
> = {
  permiso_circulacion: { issue_date: '', expiration_date: '' },
  revision_tecnica: { issue_date: '', expiration_date: '' },
  matricula: { issue_date: '', expiration_date: '' },
};

export const DOCUMENT_STATUS_META: Record<
  string,
  { label: string; color: string; background: string }
> = {
  valid: { label: 'Al día', color: '#1b5e20', background: '#e4f2e7' },
  expiring: { label: 'Por vencer', color: '#8a5a00', background: '#fff8e6' },
  expired: { label: 'Vencido', color: '#b71c1c', background: '#fdf2f2' },
  missing: { label: 'Pendiente', color: '#526277', background: '#eef2f7' },
};

export function getVehicleDocument(
  vehicle: VehicleRecord,
  type: VehicleDocumentType
) {
  return vehicle.documents?.[type];
}

export function getDocumentStatus(
  vehicle: VehicleRecord,
  type: VehicleDocumentType
) {
  const document = getVehicleDocument(vehicle, type);
  if (document?.status) return document.status;
  if (!document?.expiration_date) return 'missing';

  const today = new Date().toISOString().slice(0, 10);
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + 30);
  const thirtyDaysFromNow = threshold.toISOString().slice(0, 10);

  if (document.expiration_date < today) return 'expired';
  if (document.expiration_date <= thirtyDaysFromNow) return 'expiring';
  return 'valid';
}
