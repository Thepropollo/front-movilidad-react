import { useEffect, useMemo, useState } from 'react';
import {
  Compass,
  MapPin,
  Navigation,
  CalendarDays,
  Car,
  AlertCircle,
  Route,
} from 'lucide-react';
import RouteMapView, { type MapMarker } from '@/components/RouteMapView';
import { geocodePlace, isLikelyEcuadorCoordinate } from '@/lib/geo';
import { TRIP_STATUS_LABEL, labelOf } from '@/lib/labels';
import api from '@/services/api';
import { HeroMetricCard, StatCard, ResourceCard } from '@/components/Cards';
import { useAuth } from '@/context/AuthContext';

type TripRow = {
  id: number;
  origin: string;
  destination: string;
  trip_status: string;
  driver: string;
  vehicle: string;
  stops_count: number;
  has_geo: boolean;
};

interface TripDetail {
  driver?: {
    first_name?: string;
    last_name?: string;
  };
  vehicle?: {
    plate?: string;
  };
  stops?: Array<{
    latitude?: number | string;
    longitude?: number | string;
    sequence?: number;
    location?: string;
    arrival_time?: string;
  }>;
  trip_status?: string;
  destination_address?: string;
  origin?: string;
  destination?: string;
}

export default function MapPage() {
  const { roleIds } = useAuth();
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [selected, setSelected] = useState<number | ''>('');
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [detail, setDetail] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    api
      .get('/mapas/viajes')
      .then((r) => {
        if (!ignore) {
          const payload = r.data;
          setTrips(Array.isArray(payload) ? payload : (payload?.data ?? []));
        }
      })
      .catch(() => {
        if (!ignore) setError('No se pudieron cargar los viajes para el mapa.');
      })
      .finally(() => {
        if (!ignore) setLoadingTrips(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const loadMap = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<TripDetail>(`/mapas/viajes/${id}`);
      setDetail(data);

      const next: MapMarker[] = [];
      if (data.origin) {
        const g = await geocodePlace(data.origin);
        if (g)
          next.push({ ...g, kind: 'origin', label: `Origen: ${data.origin}` });
      }
      (data.stops || []).forEach((s) => {
        const latitude = Number(s.latitude);
        const longitude = Number(s.longitude);
        if (isLikelyEcuadorCoordinate(latitude, longitude)) {
          next.push({
            lat: latitude,
            lng: longitude,
            kind: 'stop',
            sequence: s.sequence,
            label: s.arrival_time
              ? `Parada ${s.sequence}: ${s.location || 'Coordenadas GPS'} (${String(s.arrival_time).slice(0, 5)})`
              : `Parada ${s.sequence}: ${s.location || 'Coordenadas GPS'}`,
          });
        }
      });
      if (data.destination) {
        const g = await geocodePlace(data.destination);
        if (g)
          next.push({
            ...g,
            kind: 'destination',
            label: `Destino: ${data.destination}`,
          });
      }
      setMarkers(next);
    } catch {
      setError('No se pudo cargar el detalle del viaje.');
    } finally {
      setLoading(false);
    }
  };

  const legend = useMemo(
    () => [
      { c: '#0b5fff', t: 'Origen' },
      { c: '#002855', t: 'Paradas GPS' },
      { c: '#c5a059', t: 'Destino' },
    ],
    []
  );

  const geoCount = trips.filter((t) => t.has_geo).length;
  const enRutaCount = trips.filter((t) => t.trip_status === 'en_ruta').length;
  const stopsCount = markers.filter((m) => m.kind === 'stop').length;

  return (
    <section className="module-page map-page flex flex-col gap-6 max-w-7xl mx-auto p-4 md:p-6">
      <HeroMetricCard
        badge="Cartografía y Georreferenciación"
        badgeVariant="indigo"
        title="Mapa Operativo de Rutas y Paradas GPS"
        description="Visualización satelital y cartográfica de rutas institucionales. Consulte puntos de origen, destino y paradas con coordenadas georreferenciadas registradas en ruta por los conductores."
        metricValue={String(trips.length)}
        metricLabel="HOJAS DE RUTA REGISTRADAS"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Rutas"
          value={trips.length}
          tone="info"
          icon={<Route size={18} />}
          hint="Disponibles para mapeo"
        />
        <StatCard
          label="Con Georreferencia"
          value={geoCount}
          tone="ok"
          icon={<MapPin size={18} />}
          hint="Con coordenadas registradas"
        />
        <StatCard
          label="En Circulación"
          value={enRutaCount}
          tone={enRutaCount > 0 ? 'warn' : 'neutral'}
          icon={<Navigation size={18} />}
          hint={enRutaCount > 0 ? 'Unidades en vía activa' : 'Sin viajes en curso'}
        />
        <StatCard
          label="Paradas Detectadas"
          value={stopsCount}
          tone="neutral"
          icon={<Compass size={18} />}
          hint={selected ? `Hoja de ruta #${selected}` : 'Seleccione una ruta'}
        />
      </div>

      {(roleIds.includes('secretaria') || roleIds.includes('conductor')) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {roleIds.includes('secretaria') && (
            <>
              <ResourceCard
                title="Agenda de Flota"
                description="Consulte el calendario de salidas y estado de comisiones."
                icon={<CalendarDays size={20} />}
                href="/app/secretaria/agenda"
              />
              <ResourceCard
                title="Disponibilidad Vehicular"
                description="Ver unidades vehiculares y choferes con estatus libre."
                icon={<Car size={20} />}
                href="/app/secretaria/disponibilidad"
              />
            </>
          )}
          {roleIds.includes('conductor') && (
            <ResourceCard
              title="Guía de Ruta Conductor"
              description="Navegación asistida GPS y captura de paradas para choferes."
              icon={<Compass size={20} />}
              href="/app/conductor/hoja-ruta"
            />
          )}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-mono flex items-center gap-2" role="alert">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="map-layout">
        <aside className="module-panel map-sidebar">
          <label className="form-label" htmlFor="trip">
            Seleccionar Hoja de Ruta
          </label>
          <select
            id="trip"
            className="form-select"
            value={selected}
            disabled={loadingTrips}
            onChange={(e) => {
              const id = Number(e.target.value);
              setSelected(id);
              if (id) void loadMap(id);
            }}
          >
            <option value="">
              {loadingTrips ? 'Cargando viajes…' : 'Seleccione una hoja de ruta…'}
            </option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                #{t.id} · {t.origin} → {t.destination} ·{' '}
                {labelOf(TRIP_STATUS_LABEL, t.trip_status)}
              </option>
            ))}
          </select>
          {!loadingTrips && trips.length === 0 && (
            <p className="ops-muted text-xs font-mono mt-2" role="status">
              No hay hojas de ruta disponibles para visualizar.
            </p>
          )}

          {detail && (
            <div className="map-meta mt-4 space-y-1 text-xs font-mono">
              <p className="m-0">
                <strong className="text-zinc-700">Conductor:</strong> {detail.driver?.first_name}{' '}
                {detail.driver?.last_name}
              </p>
              <p className="m-0">
                <strong className="text-zinc-700">Vehículo:</strong> {detail.vehicle?.plate}
              </p>
              <p className="m-0">
                <strong className="text-zinc-700">Paradas:</strong> {(detail.stops || []).length}
              </p>
              <p className="m-0">
                <strong className="text-zinc-700">Estado:</strong>{' '}
                {labelOf(TRIP_STATUS_LABEL, detail.trip_status || '')}
              </p>
              {detail.destination_address && (
                <p className="m-0">
                  <strong className="text-zinc-700">Dirección destino:</strong> {detail.destination_address}
                </p>
              )}
            </div>
          )}

          <ul className="map-legend mt-4" aria-label="Leyenda">
            {legend.map((l) => (
              <li key={l.t} className="flex items-center gap-2 text-xs font-mono">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: l.c }} />
                <span>{l.t}</span>
              </li>
            ))}
          </ul>
          {loading && (
            <div className="map-sidebar-loading flex items-center gap-2 text-xs font-mono text-zinc-500 mt-3" role="status">
              <span className="spinner w-4 h-4" />
              <span>Armando mapa…</span>
            </div>
          )}
        </aside>

        <div className="module-panel map-stage">
          <RouteMapView markers={markers} height={520} />
          {loading && (
            <div className="map-loading" role="status">
              <span className="spinner w-7 h-7" />
              <span className="text-xs font-mono">Localizando origen y paradas…</span>
            </div>
          )}
          {markers.length === 0 && !loading && (
            <p className="map-empty text-xs font-mono">
              Seleccione un viaje en el menú lateral para ver la ruta en el mapa satelital.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
