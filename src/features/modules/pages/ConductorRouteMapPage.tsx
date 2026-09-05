import { useEffect, useMemo, useState } from 'react';
import {
  LocateFixed,
  MapPin,
  Navigation,
  Flag,
  CircleDot,
  Route,
  Loader2,
  Crosshair,
} from 'lucide-react';
import RouteMapView, { type MapMarker } from '@/components/RouteMapView';
import {
  fetchRouteDetails,
  geocodePlace,
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
      if (s.latitude && s.longitude) {
        next.push({
          lat: Number(s.latitude),
          lng: Number(s.longitude),
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
      Number.isFinite(Number(data.destination_latitude)) &&
      Number.isFinite(Number(data.destination_longitude));
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
  const [live, setLive] = useState<LatLng | null>(null);
  const [follow, setFollow] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [stopName, setStopName] = useState('');
  const [odometer, setOdometer] = useState('');
  const [note, setNote] = useState('');

  const accepted = useMemo(
    () => trips.filter((t) => t.driver_response === 'aceptado'),
    [trips]
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

    const watcher = watchPosition(
      (p) => {
        setLive(p);
        setGpsError(null);
      },
      (e) => setGpsError(e.message)
    );

    return () => clearWatch(watcher);
  }, []);

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

  const selectTrip = (value: string) => {
    const id = value ? Number(value) : '';
    setSelectedId(id);
    setError(null);
    setMsg(null);
    if (!id) {
      setDetail(null);
      setMarkers([]);
      setRoutePlan(null);
      setBuilding(false);
    } else {
      setDetail(null);
      setMarkers([]);
      setRoutePlan(null);
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
      setRoutePlan(await fetchRouteDetails(refreshedMarkers));
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'No se pudo registrar la parada.');
    } finally {
      setRegistering(false);
    }
  };

  const stops = useMemo(
    () => (detail?.stops || []).slice().sort((a, b) => a.sequence - b.sequence),
    [detail]
  );

  const selectedTrip = accepted.find((t) => t.id === selectedId);

  return (
    <section className="module-page">
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
          {gpsError} La ruta se mostrará igualmente; podrá registrar paradas con
          coordenadas manuales.
        </div>
      )}

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
                height={620}
                livePosition={live}
                follow={follow}
              />
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
          <label className="form-label" htmlFor="guide-trip">
            Viaje
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
                <h2 className="guide-section-title">
                  <Navigation size={16} /> Navegación
                </h2>
                {routePlan ? (
                  <>
                    <div className="guide-route-metrics">
                      <div>
                        <strong>{formatDistance(routePlan.distanceMeters)}</strong>
                        <span>Distancia</span>
                      </div>
                      <div>
                        <strong>{formatDuration(routePlan.durationSeconds)}</strong>
                        <span>Tiempo estimado</span>
                      </div>
                    </div>
                    <div className="guide-next-point">
                      <span className="guide-next-label">Próximo punto</span>
                      <strong>
                        <Flag size={14} />{' '}
                        {detail.destination_address || detail.destination}
                      </strong>
                    </div>
                    {routePlan.steps.length > 0 && (
                      <ol className="guide-instructions">
                        {routePlan.steps.slice(0, 8).map((step, index) => (
                          <li key={`${step.instruction}-${index}`}>
                            <span>{index + 1}</span>
                            <div>
                              <strong>{step.instruction}</strong>
                              <small>{formatDistance(step.distanceMeters)}</small>
                            </div>
                          </li>
                        ))}
                      </ol>
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
                    <li className="guide-step" key={s.id}>
                      <span className="guide-step-dot stop" />
                      <div>
                        <p className="guide-step-name">Parada {s.sequence}</p>
                        <span className="guide-step-sub">
                          {s.location || '—'}
                          {s.odometer_km ? ` · ${s.odometer_km} km` : ''}
                        </span>
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
