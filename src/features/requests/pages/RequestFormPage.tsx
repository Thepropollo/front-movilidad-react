import React, { useState, useEffect } from 'react';
import {
  FileText,
  MapPin,
  Calendar,
  FileCheck2,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Car,
  Plane,
  ArrowRight,
} from 'lucide-react';
import api from '@/services/api';
import Button from '@/components/Button';
import Input from '@/components/Input';
import LocationPicker, { type SelectedLocation } from '@/components/LocationPicker';
import Modal from '@/components/Modal';
import { formatDateReadable } from '@/lib/datetime';
import { geocodePlace } from '@/lib/geo';
import { MOBILIZATION_TYPE_LABEL, REQUEST_STATUS_LABEL, labelOf } from '@/lib/labels';

interface RequestData {
  id: number;
  mobilization_type: string;
  origin: string;
  destination: string;
  destination_address?: string | null;
  travel_reason: string;
  departure_date: string;
  departure_time?: string | null;
  return_date: string;
  return_time?: string | null;
  estimated_days: number;
  projected_cost: number;
  status: string;
}

const RequestForm: React.FC = () => {
  // Form fields
  const [mobilizationType, setMobilizationType] = useState<string>('interna');
  const [origin, setOrigin] = useState<string>('MANTA');
  const [destination, setDestination] = useState<string>('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [destinationPoint, setDestinationPoint] = useState<SelectedLocation>({
    lat: null,
    lng: null,
    address: '',
  });
  const [showDestinationMap, setShowDestinationMap] = useState(false);
  const [locatingDestination, setLocatingDestination] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [travelReason, setTravelReason] = useState<string>('');
  const [departureDate, setDepartureDate] = useState<string>('');
  const [departureTime, setDepartureTime] = useState<string>('');
  const [returnDate, setReturnDate] = useState<string>('');
  const [returnTime, setReturnTime] = useState<string>('');

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<any>(null);

  // Modal / pre-calculation state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [preCalcData, setPreCalcData] = useState<any>(null);

  // Past requests
  const [pastRequests, setPastRequests] = useState<RequestData[]>([]);

  // Fetch past requests
  const fetchRequests = async () => {
    try {
      const response = await api.get('/solicitudes');
      setPastRequests(response.data);
    } catch (err) {
      console.error('Error al obtener solicitudes:', err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const requestPayload = (fundsAccepted: boolean) => ({
    mobilization_type: mobilizationType,
    origin,
    destination,
    destination_address: destinationAddress.trim() || null,
    destination_latitude: destinationPoint.lat,
    destination_longitude: destinationPoint.lng,
    travel_reason: travelReason,
    departure_date: departureDate,
    departure_time: departureTime,
    return_date: returnDate,
    return_time: returnTime,
    declaracion_fondos_aceptada: fundsAccepted,
  });

  const handleDestinationLocation = (location: SelectedLocation) => {
    setDestinationPoint(location);
    setDestinationAddress(location.address);
    setLocationError(null);
  };

  const locateDestination = async () => {
    const query = destinationAddress.trim() || destination.trim();
    if (!query) {
      setLocationError('Escriba una dirección o destino para buscarlo en el mapa.');
      return;
    }

    setLocatingDestination(true);
    setLocationError(null);
    try {
      const location = await geocodePlace(query);
      if (!location) {
        setLocationError('No encontramos esa dirección. Puede marcar el punto manualmente.');
        return;
      }
      handleDestinationLocation({
        lat: location.lat,
        lng: location.lng,
        address: location.label || query,
      });
      setShowDestinationMap(true);
    } catch {
      setLocationError('No se pudo buscar la dirección. Puede marcar el punto manualmente.');
    } finally {
      setLocatingDestination(false);
    }
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors(null);
    setSuccessMsg(null);

    try {
      const response = await api.post('/solicitudes', requestPayload(false));

      if (response.data.requires_confirmation) {
        setPreCalcData(response.data);
        setShowModal(true);
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors({
          general: [
            err.response?.data?.message || 'Error al procesar la solicitud',
          ],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    setShowModal(false);
    setErrors(null);

    try {
      const response = await api.post('/solicitudes', requestPayload(true));

      setSuccessMsg(response.data.message);
      // Reset form
      setDestination('');
      setTravelReason('');
      setDepartureDate('');
      setDepartureTime('');
      setReturnDate('');
      setReturnTime('');
      setOrigin('MANTA');
      setDestinationAddress('');
      setDestinationPoint({ lat: null, lng: null, address: '' });
      setShowDestinationMap(false);

      // Refresh requests list
      fetchRequests();
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors({
          general: [
            err.response?.data?.message || 'Error al procesar la solicitud',
          ],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const STATUS_BADGE: Record<string, string> = {
    pendiente: 'bg-blue-100 text-blue-800',
    pendiente_secretaria: 'bg-blue-100 text-blue-800',
    pendiente_rectorado: 'bg-amber-100 text-amber-900',
    autorizada_secretaria: 'bg-blue-100 text-blue-800',
    aprobado_rectorado: 'bg-purple-100 text-purple-800',
    aprobada: 'bg-green-100 text-green-800',
    rechazada: 'bg-red-100 text-red-800',
  };

  const getStatusBadge = (status: string) => (
    <span
      className={`px-2 py-1 text-xs font-semibold rounded-full ${
        STATUS_BADGE[status] ?? 'bg-gray-100 text-gray-800'
      }`}
    >
      {labelOf(REQUEST_STATUS_LABEL, status)}
    </span>
  );

  return (
    <div
      className="operational-page request-page glass-panel wide-container mx-auto"
      style={{ textAlign: 'left' }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-primary flex items-center gap-2">
            <FileText className="text-secondary" size={28} />
            Solicitud de Movilización
          </h1>
          <p className="text-gray-500 mt-1">
            Registra tu comisión de servicio y simula los viáticos proyectados.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 flex items-center gap-3">
          <CheckCircle className="shrink-0 text-green-600" size={22} />
          <div>
            <p className="font-semibold">¡Operación exitosa!</p>
            <p className="text-sm">{successMsg}</p>
          </div>
        </div>
      )}

      {errors && errors.general && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-center gap-3">
          <AlertTriangle className="shrink-0 text-red-600" size={22} />
          <p className="font-semibold text-sm">{errors.general[0]}</p>
        </div>
      )}

      {errors && !errors.general && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-start gap-3">
          <AlertTriangle className="shrink-0 text-red-600 mt-0.5" size={22} />
          <div>
            <p className="font-semibold text-sm">
              No se pudo procesar la solicitud
            </p>
            <ul className="text-sm mt-1 list-disc pl-5">
              {Object.entries(errors)
                .filter(([k]) => k !== 'general')
                .map(([k, v]) => (
                  <li key={k}>{(v as string[]).join(', ')}</li>
                ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form panel */}
        <div className="lg:col-span-6 glass-panel p-8 self-start bg-white">
          <h2 className="text-xl font-bold text-primary mb-6 border-b pb-2">
            Datos del Viaje
          </h2>

          <form onSubmit={handleSimulate} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Tipo de movilización</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMobilizationType('interna')}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-4 text-left transition-all cursor-pointer ${
                    mobilizationType === 'interna'
                      ? 'border-secondary bg-secondary/10 ring-1 ring-secondary'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <Car
                    size={22}
                    className={
                      mobilizationType === 'interna'
                        ? 'text-secondary'
                        : 'text-gray-400'
                    }
                  />
                  <span className="font-bold text-primary text-sm">Interna</span>
                  <span className="text-xs text-muted">Provincial</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobilizationType('externa')}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-4 text-left transition-all cursor-pointer ${
                    mobilizationType === 'externa'
                      ? 'border-secondary bg-secondary/10 ring-1 ring-secondary'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <Plane
                    size={22}
                    className={
                      mobilizationType === 'externa'
                        ? 'text-secondary'
                        : 'text-gray-400'
                    }
                  />
                  <span className="font-bold text-primary text-sm">Externa</span>
                  <span className="text-xs text-muted">Fuera de la provincia</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Origen"
                icon={<MapPin size={16} />}
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                required
              />
              <Input
                label="Destino"
                icon={<MapPin size={16} />}
                placeholder="Ej. Guayaquil, Quito"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                error={
                  errors?.destination ? errors.destination[0] : undefined
                }
                required
              />
            </div>

            <div className="destination-location-section">
              <div className="destination-location-header">
                <div>
                  <p className="form-label" style={{ marginBottom: 4 }}>
                    Ubicación detallada del destino
                  </p>
                  <p className="destination-location-note">
                    Opcional. Agregue una dirección o marque el punto exacto en el mapa.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-outline destination-map-toggle"
                  onClick={() => {
                    setShowDestinationMap((visible) => !visible);
                    setLocationError(null);
                  }}
                >
                  <MapPin size={16} />
                  {showDestinationMap ? 'Ocultar mapa' : 'Ubicar en mapa'}
                </button>
              </div>

              {showDestinationMap && (
                <div className="destination-map-content">
                  <div className="destination-location-tools">
                    <Input
                      id="destination-address"
                      label="Dirección o referencia"
                      placeholder="Ej. Av. Malecón y calle 10, Manta"
                      value={destinationAddress}
                      onChange={(e) => {
                        setDestinationAddress(e.target.value);
                        setDestinationPoint({ lat: null, lng: null, address: '' });
                        setLocationError(null);
                      }}
                      containerStyle={{ marginBottom: 0 }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      fullWidth={false}
                      isLoading={locatingDestination}
                      onClick={() => void locateDestination()}
                    >
                      Buscar dirección
                    </Button>
                  </div>
                  {locationError && (
                    <p className="destination-location-error" role="alert">
                      {locationError}
                    </p>
                  )}
                  <LocationPicker
                    value={destinationPoint}
                    onChange={handleDestinationLocation}
                    height={240}
                  />
                  {destinationPoint.lat !== null && destinationPoint.lng !== null && (
                    <p className="destination-coordinates">
                      Punto seleccionado: {destinationPoint.lat.toFixed(6)},{' '}
                      {destinationPoint.lng.toFixed(6)}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                label="Fecha de salida"
                className="trip-date-input"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                error={
                  errors?.departure_date ? errors.departure_date[0] : undefined
                }
                required
              />

              <Input
                type="date"
                label="Fecha de retorno"
                className="trip-date-input"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                error={errors?.return_date ? errors.return_date[0] : undefined}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="time"
                label="Hora de salida"
                className="trip-date-input"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                error={
                  errors?.departure_time ? errors.departure_time[0] : undefined
                }
                required
              />

              <Input
                type="time"
                label="Hora de retorno"
                className="trip-date-input"
                value={returnTime}
                onChange={(e) => setReturnTime(e.target.value)}
                error={errors?.return_time ? errors.return_time[0] : undefined}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Motivo del Viaje</label>
              <textarea
                rows={3}
                placeholder="Describa el propósito académico o administrativo de la comisión..."
                value={travelReason}
                onChange={(e) => setTravelReason(e.target.value)}
                className={`form-input ${errors?.travel_reason ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                style={{ paddingLeft: '16px', resize: 'vertical' }}
                required
              />
              {errors?.travel_reason && (
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--danger)',
                    marginTop: '4px',
                    display: 'block',
                    fontWeight: 500,
                  }}
                >
                  {errors.travel_reason[0]}
                </span>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              icon={<FileCheck2 size={16} />}
              style={{ width: '100%', marginTop: '12px' }}
            >
              Registrar y Simular
            </Button>
          </form>
        </div>

        {/* List panel */}
        <div className="lg:col-span-6 glass-panel p-8 bg-white">
          <div className="flex justify-between items-center mb-6 border-b pb-2">
            <h2 className="text-xl font-bold text-primary">
              Historial de Solicitudes
            </h2>
             <button
               onClick={fetchRequests}
               className="text-gray-400 hover:text-secondary transition"
               title="Actualizar listado"
               aria-label="Actualizar historial de solicitudes"
             >
              <RefreshCw size={18} />
            </button>
          </div>

          {pastRequests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500 font-medium">
                Aún no has registrado solicitudes de movilización.
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Completa el formulario de la izquierda para ingresar tu primera
                solicitud.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pastRequests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition bg-gray-50/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-primary text-sm flex items-center gap-2">
                        {req.origin}
                        <ArrowRight size={14} className="text-gray-400 shrink-0" />
                        {req.destination}
                      </p>
                       <p className="text-xs text-gray-500 mt-1">
                        <Calendar size={12} className="inline mr-1" />
                        {formatDateReadable(req.departure_date)}
                        {req.departure_time ? ` · ${req.departure_time}` : ''}
                        <span className="mx-1">→</span>
                        {formatDateReadable(req.return_date)}
                        {req.return_time ? ` · ${req.return_time}` : ''}
                        <span className="mx-1">·</span>
                         {req.estimated_days} d
                       </p>
                       {req.destination_address && (
                         <p className="text-xs text-gray-500 mt-1 flex items-start gap-1">
                           <MapPin size={12} className="mt-0.5 shrink-0" />
                           <span>{req.destination_address}</span>
                         </p>
                       )}
                    </div>
                    {getStatusBadge(req.status)}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      {labelOf(MOBILIZATION_TYPE_LABEL, req.mobilization_type)}
                    </span>
                    <span className="font-bold text-primary text-sm">
                      ${Number(req.projected_cost).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal - Fund Declaration */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Declaración de Fondos Institucionales"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowModal(false)}
              style={{ width: 'auto' }}
            >
              Cancelar y Editar
            </Button>
            <Button
              variant="gold"
              onClick={handleConfirm}
              style={{ width: 'auto' }}
            >
              Confirmar y Declarar
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              backgroundColor: '#fffbeb',
              border: '1px solid #fef3c7',
              padding: '12px',
              borderRadius: '8px',
            }}
          >
            <AlertTriangle className="text-amber-600 shrink-0" size={24} />
            <div>
              <p
                style={{
                  fontSize: '13px',
                  color: '#92400e',
                  margin: 0,
                  fontWeight: 700,
                }}
              >
                Revisión de costos estimados de viáticos
              </p>
            </div>
          </div>

          <p
            style={{
              fontSize: '14px',
              color: '#4b5563',
              lineHeight: '1.5',
              whiteSpace: 'pre-line',
              margin: 0,
            }}
          >
            {preCalcData?.message}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              padding: '16px',
              borderRadius: '8px',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '10px',
                  color: '#9ca3af',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  display: 'block',
                }}
              >
                Días Estimados
              </span>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#111827',
                }}
              >
                {preCalcData?.estimated_days} día(s)
              </span>
            </div>
            <div>
              <span
                style={{
                  fontSize: '10px',
                  color: '#9ca3af',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  display: 'block',
                }}
              >
                Costo Proyectado
              </span>
              <span
                style={{
                  fontSize: '18px',
                  fontWeight: 'extrabold',
                  color: 'var(--color-primary)',
                }}
              >
                ${Number(preCalcData?.projected_cost).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RequestForm;
