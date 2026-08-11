import api from '@/services/api';

export const modulesApi = {
  listSolicitudes: (params?: Record<string, string>) =>
    api.get('/solicitudes', { params }),
  authorize: (id: number, body: { action: 'approve' | 'reject'; observation?: string }) =>
    api.patch(`/solicitudes/${id}/autorizar-secretaria`, body),
  flujo: (id: number) => api.get(`/solicitudes/${id}/flujo`),
  participants: (id: number) => api.get(`/solicitudes/${id}/participantes`),
  addParticipant: (id: number, body: { user_id?: number; email?: string; national_id?: string }) =>
    api.post(`/solicitudes/${id}/participantes`, body),
  searchStudents: (q: string) => api.get('/estudiantes', { params: { q } }),
  myInvitations: () => api.get('/mis-invitaciones'),
  respondInvitation: (id: number, body: { action: 'accept' | 'reject'; reason?: string }) =>
    api.patch(`/participantes/${id}/responder`, body),
  agenda: (from?: string, to?: string) => api.get('/agenda', { params: { from, to } }),
  alerts: () => api.get('/alertas'),
  myTrips: () => api.get('/mis-viajes'),
  respondTrip: (id: number, body: { action: 'accept' | 'reject'; reason?: string }) =>
    api.patch(`/hojas-ruta/${id}/responder`, body),
  reassign: (id: number, body: { driver_id: number; vehicle_id?: number }) =>
    api.patch(`/hojas-ruta/${id}/reasignar`, body),
  stops: (id: number) => api.get(`/hojas-ruta/${id}/paradas`),
  addStop: (id: number, body: Record<string, unknown>) =>
    api.post(`/hojas-ruta/${id}/paradas`, body),
  myVehicle: () => api.get('/mi-vehiculo'),
  createNovelty: (body: Record<string, unknown>) => api.post('/novedades', body),
  listNovelties: () => api.get('/novedades'),
  myCompensations: () => api.get('/mis-compensaciones'),
  confirmCompensation: (id: number, body: { action: 'confirm' | 'dispute'; observation?: string }) =>
    api.patch(`/compensaciones/${id}/confirmar`, body),
  drivers: () => api.get('/drivers'),
  vehicles: () => api.get('/vehicles'),
  createDriver: (body: Record<string, unknown>) => api.post('/drivers', body),
  updateDriver: (id: number, body: Record<string, unknown>) => api.patch(`/drivers/${id}`, body),
  createVehicle: (body: Record<string, unknown>) => api.post('/vehicles', body),
  updateVehicle: (id: number, body: Record<string, unknown>) => api.patch(`/vehicles/${id}`, body),
  stations: () => api.get('/estaciones-servicio'),
  createStation: (body: Record<string, unknown>) => api.post('/estaciones-servicio', body),
  updateStation: (id: number, body: Record<string, unknown>) =>
    api.patch(`/estaciones-servicio/${id}`, body),
  workOrders: () => api.get('/ordenes-taller'),
  insumos: (q?: string) => api.get('/insumos', { params: { q } }),
};
