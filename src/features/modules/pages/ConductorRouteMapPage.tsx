import { useEffect, useMemo, useRef, useState } from 'react';
import {
  LocateFixed,
  MapPin,
  Navigation,
  Flag,
  CircleDot,
  Route,
  Loader2,
  Crosshair,
  CheckCircle2,
  ListChecks,
} from 'lucide-react';
import RouteMapView, { type MapMarker } from '@/components/RouteMapView';
import {
  fetchRouteDetails,
  geocodePlace,
  isLikelyEcuadorCoordinate,
  watchPosition,
  clearWatch,
  type LatLng,
  type RoutePlan,
} from '@/lib/geo';
import { TRIP_STATUS_LABEL, labelOf } from '@/lib/labels';
import api from '@/services/api';
import { modulesApi } from '../api';

type Trip = {
  id: number;
  trip_status: string;
  driver_response: string;
  request?: { origin?: string; destination?: string; departure_date?: string };
  vehicle?: { plate?: string; brand?: string; model?: string };
};

type Stop = {
  id: number;
  sequence: number;
  location?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  odometer_km?: number | null;
  arrival_time?: string | null;
  notes?: string | null;
};

type TripDetail = {
  route_sheet_id: number;
  trip_status: string;
  origin?: string;
  destination?: string;
  destination_address?: string | null;
  destination_latitude?: number | string | null;
  destination_longitude?: number | string | null;
  vehicle?: { plate: string; brand: string; model: string };
  stops?: Stop[];
};

const ACTIVE_STATUS = ['en_ruta', 'programado'];

const formatDistance = (meters: number) =>
  meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;

const formatDuration = (seconds: number) => {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours} h ${remainingMinutes} min` : `${hours} h`;
};

const formatEta = (seconds: number) =>
  new Intl.DateTimeFormat('es-EC', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(Date.now() + seconds * 1000));

async function buildMarkers(data: TripDetail): Promise<MapMarker[]> {
  const next: MapMarker[] = [];
  if (data.origin) {
    const g = await geocodePlace(data.origin);
    if (g) next.push({ ...g, kind: 'origin', label: `Origen: ${data.origin}` });
  }
  (data.stops || [])
    .slice()
    .sort((a, b) => a.sequence - b.sequence)
    .forEach((s) => {
       const latitude = Number(s.latitude);
       const longitude = Number(s.longitude);
       if (isLikelyEcuadorCoordinate(latitude, longitude)) {
        next.push({
          lat: latitude,
          lng: longitude,
          kind: 'stop',
          sequence: s.sequence,
          label: s.location || `Parada ${s.sequence}`,
        });
      }
    });
  if (data.destination) {
    const hasExactDestination =
      data.destination_latitude != null &&
      data.destination_longitude != null &&
      isLikelyEcuadorCoordinate(
        Number(data.destination_latitude),
        Number(data.destination_longitude)
      );
    if (hasExactDestination) {
      next.push({
        lat: Number(data.destination_latitude),
        lng: Number(data.destination_longitude),
        kind: 'destination',
        label: `Destino: ${data.destination_address || data.destination}`,
      });
    } else {
      const g = await geocodePlace(data.destination);
      if (g)
        next.push({ ...g, kind: 'destination', label: `Destino: ${data.destination}` });
    }
  }
  return next;
}

export default function ConductorRouteMapPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedId, setSelectedId] = useState<number | ''>('');
  const [detail, setDetail] = useState<TripDetail | null>(null);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [routePlan, setRoutePlan] = useState<RoutePlan | null>(null);
  const [navigationStart, setNavigationStart] = useState<LatLng | null>(null);
  const [rerouting, setRerouting] = useState(false);
  const [live, setLive] = useState<LatLng | null>(null);
  const [follow, setFollow] = useState(true);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsRetry, setGpsRetry] = useState(0);

  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [stopName, setStopName] = useState('');
  const [odometer, setOdometer] = useState('');
  const [note, setNote] = useState('');
  const rerouteAtRef = useRef(0);

  const accepted = useMemo(
    () => trips.filter((t) => t.driver_response === 'aceptado'),
    [trips]
  );

  const stops = useMemo(
    () => (detail?.stops || []).slice().sort((a, b) => a.sequence - b.sequence),
    [detail]
  );

  // Cargar viajes aceptados, auto-seleccionar el activo y arrancar GPS en vivo.
  useEffect(() => {
    void modulesApi
      .myTrips()
      .then((r) => {
        const list: Trip[] = r.data || [];
        setTrips(list);
        const acceptedList = list.filter((t) => t.driver_response === 'aceptado');
        const active =
          acceptedList.find((t) => ACTIVE_STATUS.includes(t.trip_status)) ??
          acceptedList[0];
        if (active) {
          setSelectedId(active.id);
          setBuilding(true);
        }
      })
      .catch(() => setError('No se pudieron cargar sus viajes.'))
      .finally(() => setLoading(false));

  }, []);

  useEffect(() => {
    const watcher = watchPosition(
      (p) => {
        setLive(p);
        setGpsError(null);
      },
      (e) => setGpsError(e.message)
    );

    return () => clearWatch(watcher);
  }, [gpsRetry]);

  // Cargar detalle (origen, destino, paradas) cuando cambia la selección.
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;

    void api
      .get(`/mapas/viajes/${selectedId}`)
      .then(async ({ data }: { data: TripDetail }) => {
        if (cancelled) return;
        setDetail(data);
        const next = await buildMarkers(data);
        if (!cancelled) {
          setMarkers(next);
          setNavigationStart(null);
          setRoutePlan(await fetchRouteDetails(next));
        }
      })
      .catch(() => {
        if (!cancelled) setError('No se pudo armar el mapa de la ruta.');
      })
      .finally(() => {
        if (!cancelled) setBuilding(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  // Enfocar el mapa apenas llega el GPS, sin esperar la respuesta del enrutador.
  useEffect(() => {
    if (!live || !detail || markers.length < 2 || navigationStart) return;
    const timer = window.setTimeout(() => setNavigationStart(live), 0);
    return () => window.clearTimeout(timer);
  }, [detail, live, markers, navigationStart]);

  // Recalcular desde la posición actual permite recuperar la ruta si el conductor toma otra calle.
  useEffect(() => {
    if (!live || !selectedId || !detail || markers.length < 2) return;
    if (Date.now() - rerouteAtRef.current < 10000) return;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      rerouteAtRef.current = Date.now();
      setRerouting(true);
      const completedSequences = new Set(
        stops.filter((stop) => stop.arrival_time).map((stop) => stop.sequence)
      );
      const pendingMarkers = markers.filter(
        (marker) =>
          marker.kind !== 'origin' &&
          !(marker.kind === 'stop' && marker.sequence && completedSequences.has(marker.sequence))
      );
      const recalculated = await fetchRouteDetails([live, ...pendingMarkers]);
      if (!cancelled && recalculated) {
        setRoutePlan(recalculated);
        setNavigationStart(live);
      }
      if (!cancelled) setRerouting(false);
    }, 1200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [detail, live, markers, selectedId, stops]);

  const selectTrip = (value: string) => {
    const id = value ? Number(value) : '';
    setSelectedId(id);
    setError(null);
    setMsg(null);
    if (!id) {
      setDetail(null);
      setMarkers([]);
      setRoutePlan(null);
      setNavigationStart(null);
      rerouteAtRef.current = 0;
      setBuilding(false);
    } else {
      setDetail(null);
      setMarkers([]);
      setRoutePlan(null);
      setNavigationStart(null);
      rerouteAtRef.current = 0;
      setBuilding(true);
    }
  };

  const registerStop = async () => {
    if (!selectedId) return;
    setRegistering(true);
    setMsg(null);
    setError(null);
    try {
      const { data } = await modulesApi.addStop(Number(selectedId), {
        location:
          stopName.trim() ||
          (live
            ? `Parada GPS ${live.lat.toFixed(5)}, ${live.lng.toFixed(5)}`
            : 'Parada sin nombre'),
        odometer_km: odometer ? Number(odometer) : undefined,
        notes: note.trim() || undefined,
        arrival_time: new Date().toISOString(),
        latitude: live?.lat,
        longitude: live?.lng,
      });
      setMsg(data.message);
      setStopName('');
      setOdometer('');
      setNote('');

      const { data: refreshed } = await api.get(`/mapas/viajes/${selectedId}`);
       setDetail(refreshed);
       const refreshedMarkers = await buildMarkers(refreshed);
       setMarkers(refreshedMarkers);
       setNavigationStart(null);
       setRoutePlan(await fetchRouteDetails(refreshedMarkers));
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'No se pudo registrar la parada.');
    } finally {
      setRegistering(false);
    }
  };

  const remainingRouteMarkers = useMemo(() => {
    const completedSequences = new Set(
      stops.filter((stop) => stop.arrival_time).map((stop) => stop.sequence)
    );
    return markers.filter(
      (marker) =>
        marker.kind !== 'origin' &&
        !(marker.kind === 'stop' && marker.sequence && completedSequences.has(marker.sequence))
    );
  }, [markers, stops]);

  const selectedTrip = accepted.find((t) => t.id === selectedId);
  const nextStop = stops.find((stop) => !stop.arrival_time);
  const completedStops = stops.filter((stop) => stop.arrival_time).length;
  const progressTotal = stops.length + 1;
  const progressPercent = Math.round((completedStops / progressTotal) * 100);
  const nextInstruction = routePlan?.steps[0];
  const nextPointLabel = nextStop?.location || detail?.destination_address || detail?.destination;

  return (
    <section className="module-page driver-route-page">
      <header className="module-header">
        <p className="module-kicker">Guía de ruta</p>
        <h1>Navegación del viaje</h1>
        <p className="module-lead">
          Siga la ruta, registre paradas en el camino y vea su posición en vivo.
        </p>
      </header>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      {msg && (
        <div className="alert alert-info" role="status">
          {msg}
        </div>
      )}
      {gpsError && !live && (
        <div className="alert alert-warning" role="alert">
          <div>
            <strong>Ubicación no disponible</strong>
            <span>
              {gpsError} Permita el acceso a la ubicación en el navegador. Si usa
              un teléfono, abra la aplicación con HTTPS o desde localhost.
            </span>
          </div>
          <button
            type="button"
            className="btn btn-outline gps-retry"
            onClick={() => {
              setGpsError(null);
              setGpsRetry((attempt) => attempt + 1);
            }}
          >
            Reintentar GPS
          </button>
        </div>
      )}

      <div className="guide-trip-picker">
        <label className="form-label" htmlFor="guide-trip">
          Viaje activo
        </label>
        <select
          id="guide-trip"
          className="form-select"
          value={selectedId}
          disabled={loading}
          onChange={(e) => selectTrip(e.target.value)}
        >
          <option value="">Seleccione un viaje…</option>
          {accepted.map((t) => (
            <option key={t.id} value={t.id}>
              #{t.id} · {t.request?.origin} → {t.request?.destination}
            </option>
          ))}
        </select>
      </div>

      <div className="route-guide-layout">
        {/* Mapa */}
        <div className="guide-map module-panel">
          {accepted.length === 0 && !loading ? (
            <div className="guide-empty">
              <Route className="guide-empty-icon" size={48} />
              <p className="guide-empty-title">No tiene viajes aceptados</p>
              <p className="guide-empty-sub">
                Acepte una asignación en «Mis viajes» para ver su ruta aquí.
              </p>
            </div>
          ) : (
            <>
              <RouteMapView
                markers={markers}
                routeMarkers={navigationStart ? remainingRouteMarkers : markers}
                height={620}
                livePosition={live}
                routeStartPosition={navigationStart}
                follow={follow}
              />
              {selectedTrip && detail && routePlan && (
                <div className="guide-mobile-nav" role="status">
                  <div className="guide-mobile-nav-heading">
                    <span><Navigation size={14} /> Próxima maniobra</span>
                    <strong>{rerouting ? 'Recalculando' : live ? 'GPS activo' : 'Sin GPS'}</strong>
                  </div>
                  <p>{nextInstruction?.instruction || 'Continúe hacia su destino'}</p>
                  <div className="guide-mobile-nav-meta">
                    <span>{nextInstruction ? formatDistance(nextInstruction.distanceMeters) : 'Ruta lista'}</span>
                    <span>ETA {formatEta(routePlan.durationSeconds)}</span>
                  </div>
                </div>
              )}
              <div className="guide-map-controls">
                <button
                  type="button"
                  className={`guide-btn ${follow ? 'is-active' : ''}`}
                  onClick={() => setFollow((v) => !v)}
                  title="Centrar el mapa en su ubicación"
                >
                  <Crosshair size={16} />
                  {follow ? 'Siguiendo' : 'Centrar en mí'}
                </button>
                <button
                  type="button"
                  className="guide-btn guide-btn-register"
                  onClick={() => void registerStop()}
                  disabled={registering || !selectedId}
                >
                  {registering ? (
                    <Loader2 size={16} className="spin" />
                  ) : (
                    <MapPin size={16} />
                  )}
                  Registrar parada aquí
                </button>
              </div>
              {building && (
                <div className="map-loading" role="status">
                  <span className="spinner" style={{ width: 28, height: 28 }} />
                  <span>Armando ruta…</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Panel guía */}
        <aside className="guide-panel module-panel">
          {selectedTrip && detail && (
            <div className="guide-live-strip">
              <span className={`guide-live-indicator ${live ? 'is-on' : 'is-off'}`} />
              <div>
                <strong>{live ? 'GPS activo' : 'GPS sin señal'}</strong>
                <span>{live ? 'Ubicación actualizada en vivo' : 'La ruta sigue disponible'}</span>
              </div>
              <span className={`guide-trip-status status-${detail.trip_status}`}>
                {labelOf(TRIP_STATUS_LABEL, detail.trip_status)}
              </span>
            </div>
          )}

          {selectedTrip && detail && (
            <>
              <div className="guide-summary">
                <p>
                  <strong>{detail.destination}</strong>
                </p>
                <span className="guide-summary-meta">
                  {detail.vehicle?.plate} ·{' '}
                  {labelOf(TRIP_STATUS_LABEL, detail.trip_status)}
                </span>
                {detail.destination_address && (
                  <span className="guide-summary-address">
                    <MapPin size={13} /> {detail.destination_address}
                  </span>
                )}
              </div>

              <div className="guide-navigation">
                <div className="guide-navigation-heading">
                  <h2 className="guide-section-title">
                    <Navigation size={16} /> Navegación activa
                  </h2>
                  {rerouting ? (
                    <span className="guide-following-label is-recalculating">Recalculando ruta</span>
                  ) : follow ? (
                    <span className="guide-following-label">Siguiendo GPS</span>
                  ) : null}
                </div>
                {routePlan ? (
                  <>
                    <div className="guide-next-maneuver">
                      <div className="guide-next-maneuver-icon" aria-hidden="true">
                        <Navigation size={22} />
                      </div>
                      <div>
                        <span className="guide-next-label">Siguiente indicación</span>
                        <strong>{nextInstruction?.instruction || 'Continúe hacia su destino'}</strong>
                        <span className="guide-next-detail">
                          {nextInstruction
                            ? `${formatDistance(nextInstruction.distanceMeters)} hasta la maniobra`
                            : 'Siga la línea marcada en el mapa'}
                        </span>
                      </div>
                    </div>
                    <div className="guide-route-metrics">
                      <div>
                        <strong>{formatDistance(routePlan.distanceMeters)}</strong>
                        <span>{navigationStart ? 'Distancia restante' : 'Distancia total'}</span>
                      </div>
                      <div>
                        <strong>{formatDuration(routePlan.durationSeconds)}</strong>
                        <span>{navigationStart ? 'Tiempo restante' : 'Duración estimada'}</span>
                      </div>
                      <div>
                        <strong>{formatEta(routePlan.durationSeconds)}</strong>
                        <span>Llegada estimada</span>
                      </div>
                    </div>
                    <div className="guide-next-point">
                      <span className="guide-next-label">Próximo punto operativo</span>
                      <strong>
                        <Flag size={14} />{' '}
                        {nextPointLabel}
                      </strong>
                    </div>
                    <div className="guide-progress-block">
                      <div className="guide-progress-heading">
                        <span><ListChecks size={14} /> Progreso por puntos</span>
                        <strong>{completedStops}/{progressTotal}</strong>
                      </div>
                      <div className="guide-progress-track" aria-label={`${progressPercent}% de puntos completados`}>
                        <span style={{ width: `${progressPercent}%` }} />
                      </div>
                      <small>
                        {completedStops > 0
                          ? `${completedStops} parada(s) registrada(s)`
                          : 'Aún no se han registrado paradas'}
                      </small>
                    </div>
                    {routePlan.steps.length > 0 && (
                      <div className="guide-upcoming">
                        <span className="guide-next-label">Siguientes indicaciones</span>
                        <ol className="guide-instructions">
                          {routePlan.steps.slice(1, 5).map((step, index) => (
                          <li key={`${step.instruction}-${index}`}>
                            <span>{index + 1}</span>
                            <div>
                              <strong>{step.instruction}</strong>
                              <small>{formatDistance(step.distanceMeters)}</small>
                            </div>
                          </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="guide-navigation-empty">
                    Seleccione un viaje con origen y destino ubicables para mostrar la navegación.
                  </p>
                )}
              </div>

              <div className="guide-itinerary">
                <h2 className="guide-section-title">
                  <Navigation size={16} /> Itinerario
                </h2>

                <ol className="guide-steps">
                  <li className="guide-step">
                    <span className="guide-step-dot origin" />
                    <div>
                      <p className="guide-step-name">Origen</p>
                      <span className="guide-step-sub">{detail.origin}</span>
                    </div>
                  </li>

                  {stops.map((s) => (
                     <li className={`guide-step ${s.arrival_time ? 'is-complete' : ''}`} key={s.id}>
                       <span className="guide-step-dot stop">
                         {s.arrival_time && <CheckCircle2 size={12} />}
                       </span>
                       <div>
                         <p className="guide-step-name">Parada {s.sequence}</p>
                         <span className="guide-step-sub">
                           {s.location || '—'}
                           {s.odometer_km ? ` · ${s.odometer_km} km` : ''}
                         </span>
                         {s.arrival_time && <small className="guide-step-complete">Registrada</small>}
                       </div>
                     </li>
                  ))}

                  <li className="guide-step is-target">
                    <span className="guide-step-dot destination" />
                    <div>
                      <p className="guide-step-name">
                        <Flag size={13} /> Destino final
                      </p>
                       <span className="guide-step-sub">
                         {detail.destination_address || detail.destination}
                       </span>
                    </div>
                  </li>
                </ol>
              </div>

              <div className="guide-register">
                <h2 className="guide-section-title">
                  <CircleDot size={16} /> Registrar parada
                </h2>
                <div className="guide-form-grid">
                  <div className="guide-field">
                    <label htmlFor="guide-stop-name">Lugar de la parada</label>
                    <input
                      id="guide-stop-name"
                      className="form-input"
                      placeholder="Ej. Portoviejo"
                      value={stopName}
                      onChange={(e) => setStopName(e.target.value)}
                    />
                  </div>
                  <div className="guide-field">
                    <label htmlFor="guide-odometer">Odómetro (km)</label>
                    <input
                      id="guide-odometer"
                      className="form-input"
                      type="number"
                      min="0"
                      placeholder="Ej. 45230"
                      value={odometer}
                      onChange={(e) => setOdometer(e.target.value)}
                    />
                  </div>
                </div>
                <div className="guide-field guide-note-field">
                  <label htmlFor="guide-stop-note">Nota (opcional)</label>
                  <input
                    id="guide-stop-note"
                    className="form-input"
                    placeholder="Agregue una referencia o novedad"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 8 }}
                  onClick={() => void registerStop()}
                  disabled={registering || !selectedId}
                >
                  {registering ? (
                    <Loader2 size={16} className="spin" />
                  ) : (
                    <MapPin size={16} />
                  )}
                  Guardar parada
                </button>
                {live ? (
                  <p className="guide-gps-ok">
                    <LocateFixed size={14} /> GPS en vivo: {live.lat.toFixed(5)},{' '}
                    {live.lng.toFixed(5)}
                  </p>
                ) : (
                  <p className="guide-gps-warn">
                    <LocateFixed size={14} /> Sin señal GPS.
                  </p>
                )}
              </div>
            </>
          )}

          {!selectedTrip && !loading && accepted.length > 0 && (
            <p className="ops-muted" style={{ padding: '12px 0' }}>
              Seleccione un viaje para ver su guía de ruta.
            </p>
          )}

          {loading && (
            <p className="ops-muted" style={{ padding: '12px 0' }}>
              Cargando viajes…
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}
