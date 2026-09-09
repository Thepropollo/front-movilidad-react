import api from '@/services/api';

export interface RouteSheetSummary {
  id: number;
  initial_mileage: number | null;
  final_mileage: number | null;
  trip_status: string;
  vehicle: {
    id: number;
    plate: string;
    brand: string;
    model: string;
  };
  driver: {
    id: number;
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
    projected_cost: string;
    requester: {
      id: number;
      first_name: string;
      last_name: string;
    };
  };
}

export interface CompensationCalculation {
  route_sheet_id: number;
  applied_rate_id: number;
  nights_outside: number;
  allowances_amount: number;
  lodging_rate: number;
  food_rate: number;
  lodging_amount: number;
  food_amount: number;
  overtime_50_hours: number;
  overtime_50_rate: number;
  overtime_50_amount: number;
  overtime_100_hours: number;
  overtime_100_rate: number;
  overtime_100_amount: number;
  total_payout: number;
  departure_real: string;
  arrival_real: string;
}

export interface DriverCompensation {
  id: number;
  route_sheet_id: number;
  applied_rate_id: number;
  allowances_amount: number;
  overtime_50_amount: number;
  overtime_100_amount: number;
  total_payout: number;
  payment_receipt_url: string;
  payment_status:
    | 'pendiente_comprobante'
    | 'confirmado_conductor'
    | 'en_disputa'
    | 'verificado_movilidad';
  route_sheet: RouteSheetSummary;
}

export const submitArrivalAct = async (data: {
  hoja_ruta_id: number;
  mecanico_o_guardia_id: number;
  kilometraje_garita: number;
  nivel_combustible: string;
}): Promise<any> => {
  const response = await api.post('/actas-recepcion-llegada', data);
  return response.data;
};

export const submitEvaluation = async (data: {
  hoja_ruta_id: number;
  pasajero_id: number;
  calificacion_conductor: number;
  calificacion_vehiculo: number;
  comments?: string;
}): Promise<any> => {
  const response = await api.post('/evaluaciones', data);
  return response.data;
};

export const fetchPendingEvaluations = async (): Promise<
  RouteSheetSummary[]
> => {
  const response = await api.get('/mis-evaluaciones-pendientes');
  return response.data;
};

export const fetchPendingLiquidations = async (): Promise<
  DriverCompensation[]
> => {
  const response = await api.get('/compensaciones/pendientes');
  return response.data;
};

export const fetchTeacherPendingLiquidations = async (): Promise<
  RouteSheetSummary[]
> => {
  const response = await api.get('/mis-comisiones-pendientes-liquidar');
  return response.data;
};

export const calculateCompensation = async (
  routeSheetId: number
): Promise<CompensationCalculation> => {
  const response = await api.get(`/compensaciones/${routeSheetId}/calcular`);
  return response.data;
};

export const submitLiquidation = async (
  routeSheetId: number,
  data: { comprobante_pago_url: string }
): Promise<any> => {
  const response = await api.post(
    `/compensaciones/${routeSheetId}/liquidar`,
    data
  );
  return response.data;
};

export const approveLiquidation = async (
  routeSheetId: number
): Promise<any> => {
  const response = await api.post(`/compensaciones/${routeSheetId}/aprobar`);
  return response.data;
};
