import api from '@/services/api';

export interface MobilizationRequestSummary {
  id: number;
  destination: string;
  origin: string;
  status: string;
  mobilization_type: string;
  departure_date: string;
  travel_reason: string;
}

export interface DriverTripRecord {
  id: number;
  driver_response: 'pendiente' | 'aceptado' | 'rechazado';
  driver_reject_reason?: string | null;
  trip_status: string;
  request?: MobilizationRequestSummary;
  vehicle?: { plate: string; brand: string; model: string };
  driver?: { user?: { first_name: string; last_name: string } };
}

export interface RouteStopRecord {
  id: number;
  sequence: number;
  location: string | null;
  visited_canton: string | null;
  odometer_km: number | null;
  latitude: number | null;
  longitude: number | null;
}

export interface DriverCompensationRecord {
  id: number;
  route_sheet_id: number;
  allowances_amount: number;
  overtime_50_amount: number;
  overtime_100_amount: number;
  total_payout: number;
  payment_status:
    | 'pendiente_comprobante'
    | 'confirmado_conductor'
    | 'en_disputa'
    | 'verificado_movilidad';
  route_sheet?: {
    request?: { destination?: string; departure_date?: string };
  };
}

export interface DriverVehicleResponse {
  vehicle: {
    id: number;
    plate: string;
    brand: string;
    model: string;
    year?: number;
    current_mileage: number;
    next_oil_change_mileage: number;
  } | null;
  route_sheet_id?: number;
  km_to_maintenance?: number;
  maintenance_due?: boolean;
  message?: string;
}

export interface WorkOrderRecord {
  id: number;
  maintenance_type: string;
  work_details: string;
  entry_date: string;
  exit_date: string | null;
  vehicle?: { plate: string; brand: string; model: string };
}

export interface SupplyInventoryRecord {
  id: number;
  supply_name: string;
  current_stock: number;
  measurement_unit: string;
}

export const modulesApi = {
  listSolicitudes: (params?: Record<string, string>) =>
    api.get<MobilizationRequestSummary[]>('/solicitudes', { params }),
  authorize: (
    id: number,
    body: { action: 'approve' | 'reject'; observation?: string }
  ) => api.patch(`/solicitudes/${id}/autorizar-secretaria`, body),
  flujo: (id: number) => api.get(`/solicitudes/${id}/flujo`),
  participants: (id: number) => api.get(`/solicitudes/${id}/participantes`),
  addParticipant: (
    id: number,
    body: { user_id?: number; email?: string; national_id?: string }
  ) => api.post(`/solicitudes/${id}/participantes`, body),
  searchStudents: (q: string, page = 1, perPage?: number) =>
    api.get('/estudiantes', { params: { q, page, per_page: perPage } }),
  myInvitations: () => api.get('/mis-invitaciones'),
  respondInvitation: (
    id: number,
    body: { action: 'accept' | 'reject'; reason?: string }
  ) => api.patch(`/participantes/${id}/responder`, body),
  agenda: (params?: Record<string, string | number | undefined>) =>
    api.get('/agenda', { params }),
  myTrips: () => api.get<DriverTripRecord[]>('/mis-viajes'),
  respondTrip: (
    id: number,
    body: { action: 'accept' | 'reject'; reason?: string }
  ) => api.patch(`/hojas-ruta/${id}/responder`, body),
  reassign: (id: number, body: { driver_id: number; vehicle_id?: number }) =>
    api.patch(`/hojas-ruta/${id}/reasignar`, body),
  stops: (id: number) => api.get<RouteStopRecord[]>(`/hojas-ruta/${id}/paradas`),
  addStop: (id: number, body: Record<string, unknown>) =>
    api.post(`/hojas-ruta/${id}/paradas`, body),
  routeMaps: () => api.get('/mapas/viajes'),
  routeMap: (id: number) => api.get(`/mapas/viajes/${id}`),
  myVehicle: () => api.get<DriverVehicleResponse>('/mi-vehiculo'),
  createNovelty: (body: Record<string, unknown>) =>
    api.post('/novedades', body),
  listNovelties: () => api.get('/novedades'),
  myCompensations: () =>
    api.get<DriverCompensationRecord[]>('/mis-compensaciones'),
  confirmCompensation: (
    id: number,
    body: { action: 'confirm' | 'dispute'; observation?: string }
  ) => api.patch(`/compensaciones/${id}/confirmar`, body),
  drivers: () => api.get('/drivers'),
  vehicles: () => api.get('/vehicles'),
  createDriver: (body: Record<string, unknown>) => api.post('/drivers', body),
  updateDriver: (id: number, body: Record<string, unknown>) =>
    api.patch(`/drivers/${id}`, body),
  createVehicle: (body: Record<string, unknown>) => api.post('/vehicles', body),
  updateVehicle: (id: number, body: Record<string, unknown>) =>
    api.patch(`/vehicles/${id}`, body),
  updateVehicleDocuments: (id: number, body: Record<string, unknown>) =>
    api.patch(`/vehicles/${id}/documentos`, body),
  stations: () => api.get('/estaciones-servicio'),
  createStation: (body: Record<string, unknown>) =>
    api.post('/estaciones-servicio', body),
  updateStation: (id: number, body: Record<string, unknown>) =>
    api.patch(`/estaciones-servicio/${id}`, body),
  workOrders: () => api.get<WorkOrderRecord[]>('/ordenes-taller'),
  insumos: (q?: string) =>
    api.get<{ data: SupplyInventoryRecord[] }>('/insumos', { params: { q } }),
  rates: () => api.get('/tarifas'),
  createRate: (data: {
    rate_key: string;
    rate_label: string;
    rate_group: 'allowance' | 'fuel' | 'other';
    rate_value: number;
  }) => api.post('/tarifas', data),
  updateRate: (id: number, rate_value: number) =>
    api.put(`/tarifas/${id}`, { rate_value }),
};
