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
import ProcessPhaseLine, {
  type ProcessPhase,
} from '@/features/shared/ProcessPhaseLine';
import { useAlerts } from '@/context/AlertsContext';
import { useAuth } from '@/context/AuthContext';
import { HeroMetricCard, StatCard, ResourceCard } from '@/components/Cards';

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
  phases?: ProcessPhase[];
}

const RequestForm: React.FC = () => {
  const { refresh: refreshAlerts } = useAlerts();
  const { roleIds } = useAuth();
  const isFacultyRequest = roleIds.includes('responsable_facultad') && !roleIds.includes('docente');
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
  const [occupantCount, setOccupantCount] = useState('1');
  const [publicServantsCount, setPublicServantsCount] = useState('0');
  const [communicationNumber, setCommunicationNumber] = useState('');
  const [activityType, setActivityType] = useState('visitas_academicas');
  const [academicProgram, setAcademicProgram] = useState('');
  const [departureDate, setDepartureDate] = useState<string>('');
  const [departureTime, setDepartureTime] = useState<string>('');
  const [returnDate, setReturnDate] = useState<string>('');
  const [returnTime, setReturnTime] = useState<string>('');

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);

  // Modal / pre-calculation state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [preCalcData, setPreCalcData] = useState<{
    message?: string;
    requires_confirmation?: boolean;
    estimated_days?: number;
    projected_cost?: number;
    calculation_details?: {
      daily_rate?: number;
      extra_hours_cost?: number;
      fuel_estimate?: number;
      subtotal?: number;
    };
    request?: RequestData;
  } | null>(null);

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
    let ignore = false;
    api
      .get('/solicitudes')
      .then((response) => {
        if (!ignore) setPastRequests(response.data);
      })
      .catch((err) => {
        console.error('Error al obtener solicitudes:', err);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const requestPayload = (fundsAccepted: boolean) => ({
    mobilization_type: mobilizationType,
    origin,
    destination,
    destination_address: destinationAddress.trim() || null,
    destination_latitude: destinationPoint.lat,
    destination_longitude: destinationPoint.lng,
    travel_reason: travelReason,
    occupant_count: Number(occupantCount) || 1,
    public_servants_count: Number(publicServantsCount) || 0,
    communication_number: communicationNumber || null,
    activity_type: activityType || null,
    academic_program: academicProgram || null,
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
    } catch (err: unknown) {
      const apiErr = err as {
        response?: {
          data?: {
            errors?: Record<string, string[]>;
            message?: string;
          };
        };
      };
      if (apiErr.response?.data?.errors) {
        setErrors(apiErr.response.data.errors);
      } else {
        setErrors({
          general: [
            apiErr.response?.data?.message || 'Error al procesar la solicitud',
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
      refreshAlerts();
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
      void fetchRequests();
    } catch (err: unknown) {
      const apiErr = err as {
        response?: {
          data?: {
            errors?: Record<string, string[]>;
            message?: string;
          };
        };
      };
      if (apiErr.response?.data?.errors) {
        setErrors(apiErr.response.data.errors);
      } else {
        setErrors({
          general: [
            apiErr.response?.data?.message || 'Error al procesar la solicitud',
          ],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    let toneClass = 'is-invited';
    if (status.includes('aprob') || status === 'autorizada_secretaria') toneClass = 'is-active';
    else if (status.includes('pend')) toneClass = 'is-suspended';
    else if (status.includes('rechaz')) toneClass = 'is-danger';
    else if (status.includes('viaje')) toneClass = 'is-invited';

    return (
      <span className={`sgv-pill-capsule ${toneClass}`}>
        {labelOf(REQUEST_STATUS_LABEL, status)}
      </span>
    );
  };

  const approvedCount = pastRequests.filter((r) =>
    ['aprobada_secretaria', 'aprobada_rector', 'asignada', 'en_ruta', 'finalizada'].includes(r.status)
  ).length;
  const pendingCount = pastRequests.filter((r) =>
    ['pendiente_secretaria', 'pendiente_rector'].includes(r.status)
  ).length;
  const projectedCostSum = pastRequests.reduce((sum, r) => sum + (Number(r.projected_cost) || 0), 0);

  return (
    <div
      className="operational-page request-page wide-container mx-auto flex flex-col gap-6"
      style={{ textAlign: 'left' }}
    >
      <HeroMetricCard
        badge="Solicitudes y Viáticos"
        badgeVariant="indigo"
        title="Solicitud Oficial de Movilización y Simulación"
        description="Registre su requerimiento de movilización académica o administrativa. El sistema proyecta automáticamente los costos de comisión, viáticos fuera de sede y valida la disponibilidad institucional."
        metricValue={String(pastRequests.length)}
        metricLabel="MIS SOLICITUDES"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Solicitudes"
          value={pastRequests.length}
          tone="info"
          icon={<FileText size={18} />}
          hint="Historial acumulado de comisiones"
        />
        <StatCard
          label="En Revisión"
          value={pendingCount}
          tone={pendingCount > 0 ? 'warn' : 'neutral'}
          icon={<AlertTriangle size={18} />}
          hint={pendingCount > 0 ? 'Pendiente Secretaría / Rectorado' : 'Sin solicitudes en cola'}
        />
        <StatCard
          label="Aprobadas / Activas"
          value={approvedCount}
          tone="ok"
          icon={<CheckCircle size={18} />}
          hint="Con autorización institucional"
        />
        <StatCard
          label="Viáticos Proyectados"
          value={`$${projectedCostSum.toFixed(2)}`}
          tone="neutral"
          icon={<Calendar size={18} />}
          hint="Cálculo acumulado de comisiones"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ResourceCard
          title="Mis solicitudes"
          description="Consulte el estado de las solicitudes de su unidad."
          icon={<Calendar size={20} />}
          href={isFacultyRequest ? '/app/facultad/solicitudes' : '/app/docente/historial'}
        />
        {!isFacultyRequest && (
          <ResourceCard
            title="Liquidación Docente"
            description="Consulte el proceso disponible para comisiones finalizadas."
            icon={<FileCheck2 size={20} />}
            href="/app/docente/liquidar"
          />
        )}
        <ResourceCard
          title="Documentos y Normativa"
          description="Descargue reglamentos, formularios PST-01 y resoluciones vigentes."
          icon={<FileText size={20} />}
          href={isFacultyRequest ? '/app/facultad/documentos' : '/app/docente/documentos'}
        />
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
        <div className="lg:col-span-6 sgv-dark-form-card self-start">
          <div className="sgv-dark-form-header">
            <h2 className="sgv-dark-form-title">Datos del Viaje</h2>
            <p className="sgv-dark-form-subtitle">
              Ingresa los detalles de tu comisión de servicio institucional para simular viáticos
            </p>
          </div>

          <form onSubmit={handleSimulate} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Tipo de movilización</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMobilizationType('interna')}
                  className={`sgv-choice-card ${
                    mobilizationType === 'interna' ? 'is-selected' : ''
                  }`}
                >
                  <div className="sgv-choice-icon" aria-hidden="true">
                    <Car size={22} />
                  </div>
                  <div className="sgv-choice-body">
                    <strong>Movilización Interna</strong>
                    <span>Comisión dentro de Manabí</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setMobilizationType('externa')}
                  className={`sgv-choice-card ${
                    mobilizationType === 'externa' ? 'is-selected' : ''
                  }`}
                >
                  <div className="sgv-choice-icon" aria-hidden="true">
                    <Plane size={22} />
                  </div>
                  <div className="sgv-choice-body">
                    <strong>Comisión Externa</strong>
                    <span>Fuera de provincia · Requiere Rectorado</span>
                  </div>
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
                  className="btn-dark-cancel destination-map-toggle text-xs"
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
                      variant="dark-cancel"
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
                    <p className="destination-coordinates font-mono text-xs text-slate-400">
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

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label="N.º ocupantes"
                min={1}
                value={occupantCount}
                onChange={(e) => setOccupantCount(e.target.value)}
              />
              <Input
                type="number"
                label="Servidores públicos"
                min={0}
                value={publicServantsCount}
                onChange={(e) => setPublicServantsCount(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="N.º de comunicación"
                placeholder="Oficio / memo"
                value={communicationNumber}
                onChange={(e) => setCommunicationNumber(e.target.value)}
              />
              <Input
                label="Carrera / programa"
                value={academicProgram}
                onChange={(e) => setAcademicProgram(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tipo de actividad (PST-01)</label>
              <select
                className="form-select"
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
              >
                <option value="visitas_academicas">Visitas académicas</option>
                <option value="clases_practicas">Clases prácticas</option>
                <option value="proyectos_vinculacion">Proyectos de vinculación</option>
                <option value="congresos_cursos">Congresos y/o cursos</option>
                <option value="reuniones_interinstitucionales">
                  Reuniones interinstitucionales
                </option>
                <option value="reuniones_matriz">
                  Reuniones en matriz y/o extensión
                </option>
                <option value="otros">Otros</option>
              </select>
            </div>

            <div className="sgv-dark-divider">
              <Button
                type="button"
                variant="dark-cancel"
                fullWidth={false}
                onClick={() => {
                  setDestination('');
                  setTravelReason('');
                  setDepartureDate('');
                  setDepartureTime('');
                  setReturnDate('');
                  setReturnTime('');
                  setOrigin('MANTA');
                  setDestinationAddress('');
                }}
              >
                Limpiar
              </Button>
              <Button
                type="submit"
                variant="dark-submit"
                fullWidth={false}
                isLoading={loading}
                icon={<FileCheck2 size={16} />}
              >
                Registrar y Simular
              </Button>
            </div>
          </form>
        </div>

        {/* List panel */}
        <div className="lg:col-span-6 sgv-dark-table-card p-6 sm:p-8 self-start">
          <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-200">
            <div>
              <h2 className="font-mono text-xl font-bold text-slate-900 tracking-tight">
                Historial de Solicitudes
              </h2>
              <p className="font-mono text-xs text-slate-500 mt-1">
                Registro cronológico de comisiones solicitadas
              </p>
            </div>
            <button
              onClick={fetchRequests}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
              title="Actualizar listado"
              aria-label="Actualizar historial de solicitudes"
            >
              <RefreshCw size={18} />
            </button>
          </div>

          {pastRequests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="font-mono text-slate-600 font-medium">
                Aún no has registrado solicitudes de movilización.
              </p>
              <p className="font-mono text-slate-400 text-xs mt-1">
                Completa el formulario de la izquierda para ingresar tu primera solicitud.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pastRequests.map((req, idx) => {
                const squircleColors = ['is-mint', 'is-lavender', 'is-purple', 'is-amber', 'is-blue'];
                const avatarVariant = squircleColors[idx % squircleColors.length];
                return (
                  <div
                    key={req.id}
                    className="rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition bg-slate-50/50 hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`sgv-avatar-squircle ${avatarVariant} mt-0.5`} aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="font-mono font-bold text-slate-900 text-sm flex items-center gap-2">
                            {req.origin}
                            <ArrowRight size={14} className="text-slate-400 shrink-0" />
                            {req.destination}
                          </p>
                          <p className="font-mono text-xs text-slate-500 mt-1">
                            <Calendar size={12} className="inline mr-1 text-slate-400" />
                            {formatDateReadable(req.departure_date)}
                            {req.departure_time ? ` · ${req.departure_time}` : ''}
                            <span className="mx-1 text-slate-300">→</span>
                            {formatDateReadable(req.return_date)}
                            {req.return_time ? ` · ${req.return_time}` : ''}
                            <span className="mx-1 text-slate-300">·</span>
                            {req.estimated_days} d
                          </p>
                          {req.destination_address && (
                            <p className="font-mono text-xs text-slate-500 mt-1 flex items-start gap-1">
                              <MapPin size={12} className="mt-0.5 shrink-0 text-slate-400" />
                              <span className="truncate">{req.destination_address}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <div>{getStatusBadge(req.status)}</div>
                    </div>
                    {req.phases && req.phases.length > 0 && (
                      <div className="mt-3">
                        <ProcessPhaseLine phases={req.phases} compact />
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
                      <span className="font-mono text-xs text-slate-500 uppercase">
                        {labelOf(MOBILIZATION_TYPE_LABEL, req.mobilization_type)}
                      </span>
                      <span className="font-mono font-bold text-emerald-600 text-sm">
                        ${Number(req.projected_cost).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
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
              variant="dark-cancel"
              onClick={() => setShowModal(false)}
              fullWidth={false}
            >
              Cancelar y Editar
            </Button>
            <Button
              variant="dark-submit"
              onClick={handleConfirm}
              fullWidth={false}
            >
              Confirmar y Declarar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 p-3 bg-amber-50/90 border border-amber-200/80 rounded-xl">
            <AlertTriangle className="text-amber-600 shrink-0" size={22} aria-hidden="true" />
            <p className="text-xs font-bold text-amber-900 m-0">
              Revisión previa de viáticos institucionales según normativa vigente
            </p>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line m-0">
            {preCalcData?.message}
          </p>

          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Días Estimados
              </span>
              <span className="text-lg font-bold text-slate-900 font-mono">
                {preCalcData?.estimated_days} día(s)
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Costo Proyectado
              </span>
              <span className="text-xl font-extrabold text-primary font-mono">
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
