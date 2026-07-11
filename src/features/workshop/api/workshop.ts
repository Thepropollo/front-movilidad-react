import api from '@/services/api';

export interface IssueLog {
  id: number;
  vehicle_id: number;
  route_sheet_id: number | null;
  reporting_driver_id: number;
  breakdown_date: string;
  description: string;
  status: 'pendiente' | 'en_revision' | 'solventado';
  vehicle: {
    id: number;
    plate: string;
    brand: string;
    model: string;
    current_mileage: number;
  };
  reporting_driver: {
    id: number;
    first_name: string;
    last_name: string;
  };
  route_sheet?: {
    id: number;
    driver?: {
      user?: {
        first_name: string;
        last_name: string;
      };
    };
  };
}

export interface WorkOrder {
  id: number;
  issue_log_id: number | null;
  vehicle_id: number;
  responsible_mechanic_id: number;
  supervisor_id: number;
  maintenance_type: 'preventivo' | 'correctivo' | 'cambio_aceite';
  work_details: string;
  entry_date: string;
  exit_date: string | null;
  vehicle: {
    id: number;
    plate: string;
    brand: string;
    model: string;
    current_mileage: number;
  };
  responsible_mechanic?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  supervisor?: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

export interface SupplyItem {
  id: number;
  supply_name: string;
  current_stock: number;
  measurement_unit: string;
}

export const fetchWorkshopData = async (): Promise<{ issues: IssueLog[]; work_orders: WorkOrder[] }> => {
  const response = await api.get('/novedades');
  return response.data;
};

export const fetchSupplies = async (query?: string): Promise<SupplyItem[]> => {
  const response = await api.get('/insumos', { params: { q: query } });
  return response.data;
};

export const createWorkOrder = async (data: {
  issue_log_id: number | null;
  vehicle_id: number;
  responsible_mechanic_id: number;
  maintenance_type: 'preventivo' | 'correctivo' | 'cambio_aceite';
  work_details: string;
}) => {
  const response = await api.post('/ordenes-taller', data);
  return response.data;
};

export const closeWorkOrder = async (id: number, suppliesUsed: Array<{ id: number; quantity: number }>) => {
  const response = await api.patch(`/ordenes-taller/${id}/cerrar`, {
    insumos_utilizados: suppliesUsed
  });
  return response.data;
};

export const fetchMechanicsList = async (): Promise<Array<{ id: number; first_name: string; last_name: string }>> => {
  const response = await api.get('/mecanicos');
  return response.data;
};
