import React, { useState, useEffect } from 'react';
import { Car, User, FileText, CheckCircle, AlertTriangle, RefreshCw, Milestone, ShieldAlert, Award } from 'lucide-react';
import api from '@/services/api';

interface RequestData {
  id: number;
  mobilization_type: string;
  origin: string;
  destination: string;
  travel_reason: string;
  departure_date: string;
  return_date: string;
  estimated_days: number;
  projected_cost: number;
  status: string;
  requester?: {
    first_name: string;
    last_name: string;
    faculty_institution: string;
  };
}

interface VehicleData {
  id: number;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  current_mileage: number;
  next_oil_change_mileage: number;
  operational_status: string;
  status_label: string;
  status_details: string;
  is_selectable: boolean;
}

interface DriverData {
  id: number;
  name: string;
  email?: string;
  national_id: string;
  contract_type: string;
  license_type: string;
  points: number;
  expiration_date: string;
  status_label: string;
  status_details: string;
  is_selectable: boolean;
}

const TransportPanel: React.FC = () => {
  // Lists from backend
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [drivers, setDrivers] = useState<DriverData[]>([]);

  // Selection states
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [listLoading, setListLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);

  const loadAllData = async () => {
    setListLoading(true);
    setApiError(null);
    try {
      const [reqRes, vehRes, driRes] = await Promise.all([
        api.get('/solicitudes'),
        api.get('/vehicles'),
        api.get('/drivers')
      ]);

      // Internas autorizadas por Secretaría; externas aprobadas por Vicerrectorado
      const filterable = reqRes.data.filter((r: RequestData) =>
        (r.mobilization_type === 'interna' && ['autorizada_secretaria', 'pendiente'].includes(r.status)) ||
        (r.mobilization_type === 'externa' && r.status === 'aprobado_rectorado')
      );

      setRequests(filterable);
      setVehicles(vehRes.data);
      setDrivers(driRes.data);

      // Reset selections if selected request is no longer in the list
      if (selectedRequest) {
        const stillExists = filterable.some((r: RequestData) => r.id === selectedRequest.id);
        if (!stillExists) {
          setSelectedRequest(null);
          setSelectedVehicleId(null);
          setSelectedDriverId(null);
        }
      }
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Error al cargar los datos del panel.');
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleIssueRouteSheet = async () => {
    if (!selectedRequest || !selectedVehicleId || !selectedDriverId) {
      setApiError('Debe seleccionar una solicitud, un vehículo y un conductor.');
      return;
    }

    setLoading(true);
    setApiError(null);
    setSuccessData(null);

    try {
      const response = await api.post('/hojas-ruta', {
        request_id: selectedRequest.id,
        vehicle_id: selectedVehicleId,
        driver_id: selectedDriverId
      });

      setSuccessData(response.data);
      setSelectedRequest(null);
      setSelectedVehicleId(null);
      setSelectedDriverId(null);
      loadAllData();
    } catch (err: any) {
      if (err.response && err.response.data) {
        const data = err.response.data;
        // En caso de errores 422 de Laravel
        if (data.errors) {
          const errorsList = Object.values(data.errors).flat().join(', ');
          setApiError(errorsList);
        } else {
          setApiError(data.message || 'Error al emitir la hoja de ruta.');
        }
      } else {
        setApiError('Error de red al conectar con el servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl w-full mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-primary flex items-center gap-2">
            <Milestone className="text-secondary" size={28} />
            Sección de Transporte y Logística
          </h1>
          <p className="text-gray-500 mt-1">Asignación de recursos institucionales y emisión de Hojas de Ruta.</p>
        </div>
        <button 
          onClick={loadAllData} 
          disabled={listLoading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition cursor-pointer"
        >
          <RefreshCw className={listLoading ? "animate-spin" : ""} size={16} />
          <span>Actualizar Datos</span>
        </button>
      </div>

      {/* Success Notification */}
      {successData && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top duration-300">
          <CheckCircle className="shrink-0 text-green-600 mt-0.5" size={22} />
          <div>
            <p className="font-bold text-base">¡Hoja de Ruta Emitida!</p>
            <p className="text-sm mt-0.5">{successData.message}</p>
            <p className="text-xs text-gray-500 mt-1 font-semibold uppercase">
              Hoja de Ruta ID: #{successData.route_sheet?.id} | Kilometraje inicial: {successData.route_sheet?.initial_mileage} km
            </p>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {apiError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-start gap-3 shadow-sm animate-in fade-in duration-200">
          <AlertTriangle className="shrink-0 text-red-600 mt-0.5" size={22} />
          <div>
            <p className="font-bold">Error de Validación / Bloqueo en Cascada</p>
            <p className="text-sm mt-0.5">{apiError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Requests List */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow border p-5 flex flex-col h-[650px]">
          <h2 className="text-lg font-bold text-primary mb-4 pb-2 border-b">
            Solicitudes por Asignar ({requests.length})
          </h2>

          {listLoading && requests.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center">
              <RefreshCw className="animate-spin text-secondary mb-2" size={32} />
              <span className="text-sm text-gray-400">Cargando solicitudes...</span>
            </div>
          ) : requests.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
              <FileText className="text-gray-300 mb-2" size={40} />
              <p className="text-gray-500 font-bold">Sin solicitudes pendientes</p>
              <p className="text-xs text-gray-400 mt-1">Todas las comisiones tienen sus recursos asignados.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              {requests.map((req) => (
                <div
                  key={req.id}
                  onClick={() => {
                    setSelectedRequest(req);
                    setSelectedVehicleId(null);
                    setSelectedDriverId(null);
                    setSuccessData(null);
                  }}
                  className={`p-4 rounded-lg border text-left cursor-pointer transition flex flex-col justify-between ${
                    selectedRequest?.id === req.id 
                      ? 'border-secondary bg-secondary/5 ring-1 ring-secondary' 
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                      req.mobilization_type === 'externa' 
                        ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {req.mobilization_type}
                    </span>
                    <span className="font-extrabold text-primary text-sm">${Number(req.projected_cost).toFixed(2)}</span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-1">
                    {req.origin} &rarr; {req.destination}
                  </h3>

                  <div className="text-xs text-gray-500 mt-2 space-y-1">
                    <p className="truncate"><span className="font-semibold text-gray-700">Solicita:</span> {req.requester?.first_name} {req.requester?.last_name}</p>
                    <p><span className="font-semibold text-gray-700">Fecha:</span> {req.departure_date} al {req.return_date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Assignment Process */}
        <div className="lg:col-span-2 flex flex-col gap-6 h-[650px]">
          {!selectedRequest ? (
            <div className="flex-1 bg-gray-50 border border-dashed rounded-xl flex flex-col justify-center items-center text-center p-6">
              <Milestone className="text-gray-300 mb-3" size={54} />
              <h3 className="text-gray-600 font-bold text-lg">Asignación de Recursos en Patio</h3>
              <p className="text-gray-400 text-sm mt-1 max-w-sm">
                Seleccione una solicitud de movilización de la lista de la izquierda para comenzar el despacho de vehículos y conductores.
              </p>
            </div>
          ) : (
            <div className="flex-1 bg-white rounded-xl shadow border p-6 flex flex-col overflow-hidden">
              {/* Active Request Info */}
              <div className="bg-gray-50 border rounded-lg p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0 text-sm">
                <div>
                  <span className="text-xs text-gray-400 block font-bold uppercase">Destino y Motivo</span>
                  <span className="font-bold text-primary block truncate">{selectedRequest.destination}</span>
                  <span className="text-xs text-gray-500 block truncate italic">"{selectedRequest.travel_reason}"</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block font-bold uppercase">Fechas del Viaje</span>
                  <span className="font-bold text-gray-950 block">{selectedRequest.departure_date}</span>
                  <span className="text-xs text-gray-500 block">al {selectedRequest.return_date} ({selectedRequest.estimated_days} días)</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block font-bold uppercase">Pre-Cálculo Autorizado</span>
                  <span className="font-extrabold text-secondary text-base">${Number(selectedRequest.projected_cost).toFixed(2)}</span>
                  <span className="text-xs text-gray-400 block font-medium">Viáticos institucionales</span>
                </div>
              </div>

              {/* Scrollable selectors */}
              <div className="flex-1 overflow-y-auto space-y-6 pr-1">
                {(vehicles.every((v) => !v.is_selectable) || drivers.every((d) => !d.is_selectable)) && (
                  <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-sm">
                    No hay recursos disponibles para emitir hoja de ruta.
                    {vehicles.every((v) => !v.is_selectable) && ' Todos los vehículos están en viaje, taller o bloqueados.'}
                    {drivers.every((d) => !d.is_selectable) && ' No hay conductores habilitados.'}
                  </div>
                )}

                {/* 1. Vehicle Selection */}
                <div>
                  <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-1">
                    <Car size={16} className="text-secondary" />
                    1. Seleccione Vehículo Institucional
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {vehicles.map((veh) => {
                      const isSelected = selectedVehicleId === veh.id;
                      return (
                        <div
                          key={veh.id}
                          onClick={() => {
                            if (veh.is_selectable) {
                              setSelectedVehicleId(veh.id);
                              setSuccessData(null);
                            }
                          }}
                          className={`p-3.5 rounded-lg border text-left transition relative ${
                            !veh.is_selectable 
                              ? 'bg-gray-100 border-red-200 opacity-65 cursor-not-allowed' 
                              : isSelected
                              ? 'border-secondary bg-secondary/5 ring-1 ring-secondary cursor-pointer'
                              : 'border-gray-200 hover:border-gray-300 cursor-pointer bg-white'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-extrabold text-gray-950 text-sm">{veh.plate}</span>
                              <p className="text-xs text-gray-600 font-semibold">{veh.brand} {veh.model} ({veh.year})</p>
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              veh.status_label === 'available'
                                ? 'bg-green-100 text-green-800'
                                : veh.status_label === 'on_trip'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {veh.status_label === 'available'
                                ? 'Operativo'
                                : veh.status_label === 'on_trip'
                                ? 'En viaje'
                                : 'Bloqueado'}
                            </span>
                          </div>

                          <div className="text-xs text-gray-500 mt-2 flex justify-between">
                            <span>Kilometraje: {veh.current_mileage} km</span>
                            <span>Próx Cambio: {veh.next_oil_change_mileage} km</span>
                          </div>

                          {!veh.is_selectable && (
                            <div className="mt-2.5 pt-1.5 border-t border-red-100 flex items-center gap-1.5 text-red-700 text-[10px] font-bold uppercase">
                              <ShieldAlert size={12} />
                              <span>{veh.status_details}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Driver Selection */}
                <div>
                  <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-1">
                    <User size={16} className="text-secondary" />
                    2. Seleccione Conductor Habilitado
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {drivers.map((dri) => {
                      const isSelected = selectedDriverId === dri.id;
                      return (
                        <div
                          key={dri.id}
                          onClick={() => {
                            if (dri.is_selectable) {
                              setSelectedDriverId(dri.id);
                              setSuccessData(null);
                            }
                          }}
                          className={`p-3.5 rounded-lg border text-left transition relative ${
                            !dri.is_selectable 
                              ? 'bg-gray-100 border-red-200 opacity-65 cursor-not-allowed' 
                              : isSelected
                              ? 'border-secondary bg-secondary/5 ring-1 ring-secondary cursor-pointer'
                              : 'border-gray-200 hover:border-gray-300 cursor-pointer bg-white'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-extrabold text-gray-950 text-sm">{dri.name}</span>
                              <p className="text-xs text-gray-400 font-medium">C.I. {dri.national_id}</p>
                              {dri.email && <p className="text-xs text-gray-500">{dri.email}</p>}
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              dri.status_label === 'available'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {dri.status_label === 'available' ? 'Habilitado' : 'Bloqueado'}
                            </span>
                          </div>

                          <div className="text-xs text-gray-500 mt-2.5 flex items-center justify-between border-t pt-1.5">
                            <span className="flex items-center gap-0.5">
                              <Award size={13} className="text-secondary" />
                              Puntos: <strong className="text-primary font-bold">{dri.points} pt</strong>
                            </span>
                            <span>Tipo: {dri.license_type}</span>
                            <span>Exp: {dri.expiration_date}</span>
                          </div>

                          {!dri.is_selectable && (
                            <div className="mt-2.5 pt-1.5 border-t border-red-100 flex items-center gap-1.5 text-red-700 text-[10px] font-bold uppercase">
                              <ShieldAlert size={12} />
                              <span>{dri.status_details}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="border-t pt-4 mt-4 shrink-0 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setSelectedVehicleId(null);
                    setSelectedDriverId(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-semibold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleIssueRouteSheet}
                  disabled={loading || !selectedVehicleId || !selectedDriverId}
                  className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-bold shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} />
                      <span>Emitiendo...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      <span>Emitir Hoja de Ruta</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default TransportPanel;
