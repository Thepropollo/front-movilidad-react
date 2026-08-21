import api from '@/services/api';

export interface PendingRouteSheet {
  id: number;
  request_id: number;
  vehicle_id: number;
  driver_id: number;
  transport_chief_id: number;
  initial_mileage: number | null;
  final_mileage: number | null;
  trip_status: 'programado' | 'en_ruta' | 'pendiente_feedback' | 'finalizado';
  vehicle: {
    id: number;
    plate: string;
    brand: string;
    model: string;
    current_mileage: number;
    operational_status: string;
  };
  driver: {
    id: number;
    contract_type: string;
    user: {
      id: number;
      first_name: string;
      last_name: string;
    };
  };
  request: {
    id: number;
    origin: string;
    destination: string;
    travel_reason: string;
    departure_date: string;
    return_date: string;
    requester: {
      id: number;
      first_name: string;
      last_name: string;
    };
  };
}

export interface ChecklistComponent {
  id: number;
  component_name: string;
  category: string;
}

export const fetchPendingRouteSheets = async (): Promise<
  PendingRouteSheet[]
> => {
  const response = await api.get('/inspecciones/pendientes');
  return response.data;
};

export const fetchChecklistComponents = async (): Promise<
  ChecklistComponent[]
> => {
  const response = await api.get('/inspecciones/componentes');
  return response.data;
};

export const submitChecklist = async (data: {
  route_sheet_id: number;
  registration_type: 'salida' | 'llegada';
  fuel_level: '1/4' | '1/2' | '3/4' | 'full';
  checkpoint_mileage: number;
  components: Array<{
    id: number;
    physical_condition: 'BUENO' | 'REGULAR' | 'MALO';
  }>;
}) => {
  const response = await api.post('/actas-entrega', data);
  return response.data;
};
