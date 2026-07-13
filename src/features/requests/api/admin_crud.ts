import api from '@/services/api';
import { type PaginatedResponse } from './admin';

export interface Role {
  id: number;
  name: string;
  description: string | null;
}

export interface User {
  id: number;
  national_id: string;
  first_name: string;
  last_name: string;
  email: string;
  faculty_institution: string;
  role_id: number;
  is_active: boolean;
  role?: Role;
}

export interface Vehicle {
  id: number;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  fuel_type: 'diesel' | 'extra' | 'super' | string;
  current_mileage: number;
  next_oil_change_mileage: number;
  operational_status: 'disponible' | 'en_viaje' | 'en_taller' | 'inactivo' | string;
}

export interface DriverLicense {
  id: number;
  driver_id: number;
  license_type: string;
  current_points: number;
  expiration_date: string;
}

export interface Driver {
  id: number;
  user_id: number;
  contract_type: 'nombramiento' | 'contrato' | 'LOSEP' | 'CODIGO_TRABAJO' | string;
  is_available: boolean;
  user?: User;
  licenses?: DriverLicense[];
}

// ===========================================================================
// Users CRUD
// ===========================================================================
export function fetchAdminUsers(params?: { search?: string; faculty?: string; page?: number; paginate?: true }): Promise<PaginatedResponse<User>>;
export function fetchAdminUsers(params?: { search?: string; faculty?: string; paginate: false }): Promise<User[]>;
export async function fetchAdminUsers(params?: any): Promise<any> {
  const response = await api.get('/admin/usuarios', { params });
  return response.data;
}

export const createAdminUser = async (data: any): Promise<{ message: string; user: User }> => {
  const response = await api.post('/admin/usuarios', data);
  return response.data;
};

export const updateAdminUser = async (id: number, data: any): Promise<{ message: string; user: User }> => {
  const response = await api.put(`/admin/usuarios/${id}`, data);
  return response.data;
};

export const deleteAdminUser = async (id: number): Promise<{ message: string; soft_deleted: boolean; user?: User }> => {
  const response = await api.delete(`/admin/usuarios/${id}`);
  return response.data;
};

export const fetchRoles = async (): Promise<Role[]> => {
  const response = await api.get('/admin/roles');
  return response.data;
};

// ===========================================================================
// Vehicles CRUD
// ===========================================================================
export const fetchAdminVehicles = async (): Promise<Vehicle[]> => {
  const response = await api.get('/admin/vehiculos');
  return response.data;
};

export const createAdminVehicle = async (data: any): Promise<{ message: string; vehicle: Vehicle }> => {
  const response = await api.post('/admin/vehiculos', data);
  return response.data;
};

export const updateAdminVehicle = async (id: number, data: any): Promise<{ message: string; vehicle: Vehicle }> => {
  const response = await api.put(`/admin/vehiculos/${id}`, data);
  return response.data;
};

export const deleteAdminVehicle = async (id: number): Promise<{ message: string; soft_deleted: boolean; vehicle?: Vehicle }> => {
  const response = await api.delete(`/admin/vehiculos/${id}`);
  return response.data;
};

// ===========================================================================
// Drivers CRUD
// ===========================================================================
export const fetchAdminDrivers = async (): Promise<Driver[]> => {
  const response = await api.get('/admin/choferes');
  return response.data;
};

export const createAdminDriver = async (data: any): Promise<{ message: string; driver: Driver }> => {
  const response = await api.post('/admin/choferes', data);
  return response.data;
};

export const updateAdminDriver = async (id: number, data: any): Promise<{ message: string; driver: Driver }> => {
  const response = await api.put(`/admin/choferes/${id}`, data);
  return response.data;
};

export const deleteAdminDriver = async (id: number): Promise<{ message: string; soft_deleted: boolean; driver?: Driver }> => {
  const response = await api.delete(`/admin/choferes/${id}`);
  return response.data;
};

// ===========================================================================
// Service Stations CRUD
// ===========================================================================
export interface ServiceStation {
  id: number;
  commercial_name: string;
  ruc: string;
  address: string;
  active_agreement: boolean;
}

export const fetchAdminStations = async (): Promise<ServiceStation[]> => {
  const response = await api.get('/admin/estaciones');
  return response.data;
};

export const createAdminStation = async (data: any): Promise<{ message: string; station: ServiceStation }> => {
  const response = await api.post('/admin/estaciones', data);
  return response.data;
};

export const updateAdminStation = async (id: number, data: any): Promise<{ message: string; station: ServiceStation }> => {
  const response = await api.put(`/admin/estaciones/${id}`, data);
  return response.data;
};

export const toggleAdminStationAgreement = async (id: number): Promise<{ message: string; station: ServiceStation }> => {
  const response = await api.patch(`/admin/estaciones/${id}/toggle-convenio`);
  return response.data;
};

// ===========================================================================
// Service Rates CRUD
// ===========================================================================
export interface RateConfiguration {
  id: number;
  rate_key: string;
  rate_value: number;
}

export const fetchAdminRates = async (): Promise<RateConfiguration[]> => {
  const response = await api.get('/admin/tarifas');
  return response.data;
};

export const updateAdminRate = async (id: number, value: number): Promise<{ message: string; rate: RateConfiguration }> => {
  const response = await api.put(`/admin/tarifas/${id}`, { rate_value: value });
  return response.data;
};
