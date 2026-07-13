import api from '@/services/api';

export interface AdminKpis {
  total_gallons: number;
  total_km: number;
  total_trips: number;
  vehicles_in_workshop: number;
}

export interface FacultyReportItem {
  faculty: string;
  total_trips: number;
  total_cost: string;
}

export interface RateConfiguration {
  id: number;
  rate_key: 'viatico_diario' | 'extra_50' | 'extra_100' | string;
  rate_value: number;
}

export interface ServiceStation {
  id: number;
  commercial_name: string;
  ruc: string;
  address: string;
  active_agreement: boolean;
}

export interface SystemLog {
  id: number;
  user_id: number | null;
  action: string;
  affected_table: string;
  record_id: number;
  ip_address: string | null;
  created_at: string;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: {
      name: string;
    };
  } | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export const fetchAdminKpis = async (): Promise<AdminKpis> => {
  const response = await api.get('/reportes/kpis');
  return response.data;
};

export const fetchFacultyReport = async (params?: {
  start_date?: string;
  end_date?: string;
}): Promise<FacultyReportItem[]> => {
  const response = await api.get('/reportes/facultades', { params });
  return response.data;
};

export const fetchRates = async (): Promise<RateConfiguration[]> => {
  const response = await api.get('/tarifas');
  return response.data;
};

export const updateRate = async (id: number, value: number): Promise<RateConfiguration> => {
  const response = await api.put(`/tarifas/${id}`, { rate_value: value });
  return response.data;
};

export const toggleServiceStationAgreement = async (id: number): Promise<ServiceStation> => {
  const response = await api.patch(`/estaciones-servicio/${id}/toggle`);
  return response.data;
};

export const fetchSystemLogs = async (params?: {
  search?: string;
  action?: string;
  page?: number;
}): Promise<PaginatedResponse<SystemLog>> => {
  const response = await api.get('/logs-sistema', { params });
  return response.data;
};
