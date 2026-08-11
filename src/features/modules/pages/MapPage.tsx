import { useEffect, useMemo, useState } from 'react';
import RouteMapView, { type MapMarker } from '@/components/RouteMapView';
import { geocodePlace } from '@/lib/geo';
import api from '@/services/api';

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

export default function MapPage() {
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [selected, setSelected] = useState<number | ''>('');
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api.get('/mapas/viajes')
      .then((r) => setTrips(r.data || []))
      .catch(() => setError('No se pudieron cargar los viajes para el mapa.'));
  }, []);

  const loadMap = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/mapas/viajes/${id}`);
      setDetail(data);

      const next: MapMarker[] = [];
      if (data.origin) {
        const g = await geocodePlace(data.origin);
        if (g) next.push({ ...g, kind: 'origin', label: `Origen: ${data.origin}` });
      }
      (data.stops || []).forEach((s: any) => {
        if (s.latitude && s.longitude) {
          next.push({
            lat: Number(s.latitude),
            lng: Number(s.longitude),
            kind: 'stop',
            sequence: s.sequence,
            label: s.location,
          });
        }
      });
      if (data.destination) {
        const g = await geocodePlace(data.destination);
        if (g) next.push({ ...g, kind: 'destination', label: `Destino: ${data.destination}` });
      }
      setMarkers(next);
    } catch {
      setError('No se pudo armar el mapa de la ruta.');
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

  return (
    <section className="module-page map-page">
      <header className="module-header">
        <p className="module-kicker">Mapa operativo</p>
        <h1>Mapa de rutas</h1>
        <p className="module-lead">
          Visualiza origen, destino y paradas con coordenadas capturadas por el conductor.
          Las ciudades se ubican con geocodificación OpenStreetMap.
        </p>
      </header>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      <div className="map-layout">
        <aside className="module-panel map-sidebar">
          <label className="form-label" htmlFor="trip">Viaje</label>
          <select
            id="trip"
            className="form-select"
            value={selected}
            onChange={(e) => {
              const id = Number(e.target.value);
              setSelected(id);
              if (id) void loadMap(id);
            }}
          >
            <option value="">Seleccione una hoja de ruta…</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                #{t.id} · {t.origin} → {t.destination} · {t.trip_status}
              </option>
            ))}
          </select>

          {detail && (
            <div className="map-meta">
              <p><strong>Conductor:</strong> {detail.driver?.first_name} {detail.driver?.last_name}</p>
              <p><strong>Vehículo:</strong> {detail.vehicle?.plate}</p>
              <p><strong>Paradas:</strong> {(detail.stops || []).length}</p>
              <p><strong>Estado:</strong> {detail.trip_status}</p>
            </div>
          )}

          <ul className="map-legend" aria-label="Leyenda">
            {legend.map((l) => (
              <li key={l.t}>
                <span style={{ background: l.c }} />
                {l.t}
              </li>
            ))}
          </ul>
          {loading && <p className="ops-muted">Cargando mapa…</p>}
        </aside>

        <div className="module-panel map-stage">
          <RouteMapView markers={markers} height={520} />
          {markers.length === 0 && !loading && (
            <p className="map-empty">Seleccione un viaje para ver la ruta en el mapa.</p>
          )}
        </div>
      </div>
    </section>
  );
}
