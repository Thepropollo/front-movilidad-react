import api from '@/services/api';

export interface FuelOrder {
  id: number;
  order_code: string;
  route_sheet_id: number;
  station_id: number;
  transport_chief_id: number;
  dispatched_fuel_type: 'diesel' | 'extra' | 'super';
  authorized_gallons: number;
  actual_dispatched_gallons: number | null;
  total_amount_paid: number | null;
  order_status: 'emitida' | 'despachada' | 'anulada';
  dispatch_date: string | null;
  created_at: string;
  route_sheet: {
    id: number;
    initial_mileage: number | null;
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
    };
  };
  station: {
    id: number;
    commercial_name: string;
    ruc: string;
    address: string;
  };
}

export interface ServiceStation {
  id: number;
  commercial_name: string;
  ruc: string;
  address: string;
  active_agreement: boolean;
}

export const fetchDriverFuelOrders = async (): Promise<FuelOrder[]> => {
  const response = await api.get('/mis-ordenes-combustible');
  return response.data;
};

export const fetchFuelOrderDetails = async (orderCode: string): Promise<FuelOrder> => {
  const response = await api.get(`/ordenes-combustible/${orderCode}`);
  return response.data;
};

export const dispatchFuelOrder = async (
  orderCode: string,
  data: { galones_reales_despachados: number; valor_total_pagado: number }
): Promise<FuelOrder> => {
  const response = await api.patch(`/ordenes-combustible/${orderCode}/despachar`, data);
  return response.data;
};

export const fetchServiceStations = async (): Promise<ServiceStation[]> => {
  const response = await api.get('/estaciones-servicio');
  return response.data;
};

export const emitFuelOrder = async (data: { route_sheet_id: number; station_id: number }): Promise<any> => {
  const response = await api.post('/ordenes-combustible', data);
  return response.data;
};
