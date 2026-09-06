import { useEffect, useId, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ULEAM_CENTER, fetchRoute, type LatLng } from '../lib/geo';

export type MapMarker = LatLng & {
  kind?: 'origin' | 'destination' | 'stop' | 'live';
  sequence?: number;
};

type Props = {
  markers: MapMarker[];
  routeMarkers?: MapMarker[];
  height?: number;
  drawLine?: boolean;
  livePosition?: LatLng | null;
  routeStartPosition?: LatLng | null;
  follow?: boolean;
};

const icon = (color: string) =>
  L.divIcon({
    className: 'map-pin',
    html: `<span style="background:${color};width:14px;height:14px;border-radius:50%;display:block;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.25)"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

const liveIcon = () =>
  L.divIcon({
    className: 'map-pin map-pin-live',
    html: '<span></span>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

const COLORS: Record<string, string> = {
  origin: '#0b5fff',
  destination: '#c5a059',
  stop: '#002855',
  live: '#2e7d32',
};

export default function RouteMapView({
  markers,
  routeMarkers = markers,
  height = 420,
  drawLine = true,
  livePosition = null,
  routeStartPosition = null,
  follow = false,
}: Props) {
  const id = useId().replace(/:/g, '');
  const mapRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const liveMarkerRef = useRef<L.Marker | null>(null);
  const hasLivePositionRef = useRef(false);
  const [routing, setRouting] = useState(false);
  const [routeFallback, setRouteFallback] = useState(false);

  // Crear el mapa una sola vez.
  useEffect(() => {
    const el = document.getElementById(`map-${id}`);
    if (!el) return;

    const map = L.map(el, {
      zoomControl: true,
      attributionControl: true,
    }).setView([ULEAM_CENTER.lat, ULEAM_CENTER.lng], 11);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    routeLayerRef.current = L.layerGroup().addTo(map);

    setTimeout(() => map.invalidateSize(), 80);

    return () => {
      map.remove();
      mapRef.current = null;
      routeLayerRef.current = null;
      liveMarkerRef.current = null;
    };
  }, [id]);

  // Marcadores de la ruta (origen, paradas, destino) + línea de carretera.
  useEffect(() => {
    const map = mapRef.current;
    const routeLayer = routeLayerRef.current;
    if (!map || !routeLayer) return;

    let cancelled = false;
    routeLayer.clearLayers();
    setRouteFallback(false);

    const routePoints = routeStartPosition
      ? [routeStartPosition, ...routeMarkers.filter((m) => m.kind !== 'origin')]
      : routeMarkers;
    const points: L.LatLngExpression[] = routePoints.flatMap((m) =>
      Number.isFinite(m.lat) && Number.isFinite(m.lng) ? [[m.lat, m.lng]] : []
    );
    markers.forEach((m) => {
      if (Number.isFinite(m.lat) && Number.isFinite(m.lng)) {
        const ll: L.LatLngExpression = [m.lat, m.lng];
        const marker = L.marker(ll, {
          icon: icon(COLORS[m.kind || 'stop'] || COLORS.stop),
        }).addTo(routeLayer);
        const title = m.label || m.kind || 'Punto';
        marker.bindPopup(
          `<strong>${title}</strong>${m.sequence ? `<br/>Parada #${m.sequence}` : ''}`
        );
      }
    });

    // Línea recta provisional (si falla el enrutamiento se mantiene).
    let fallbackLine: L.Polyline | null = null;
    if (drawLine && points.length >= 2) {
      fallbackLine = L.polyline(points, {
        color: '#002855',
        weight: 4,
        opacity: 0.85,
        dashArray: '8 8',
      }).addTo(routeLayer);
    }

    if (points.length === 1) {
      map.setView(points[0], 13);
    } else if (routeStartPosition) {
      // En navegación activa se prioriza el tramo cercano al conductor,
      // no la vista completa entre ciudades.
      map.setView(
        [routeStartPosition.lat, routeStartPosition.lng],
        Math.max(map.getZoom(), 17),
        { animate: false }
      );
    } else if (points.length > 1 && !routeStartPosition && !hasLivePositionRef.current) {
      map.fitBounds(L.latLngBounds(points), { padding: [36, 36] });
    }

    if (drawLine && points.length >= 2) {
      void Promise.resolve().then(() => {
        if (!cancelled) setRouting(true);
      });
      void fetchRoute(routePoints)
        .then((route) => {
          if (cancelled) return;
          if (!route?.length) {
            setRouteFallback(true);
            return;
          }
          fallbackLine?.remove();
          const routeLatLngs = route.map(
            (p) => [p.lat, p.lng] as L.LatLngExpression
          );
          L.polyline(routeLatLngs, {
            color: '#002855',
            weight: 5,
            opacity: 0.9,
          }).addTo(routeLayer);
           if (!routeStartPosition && !hasLivePositionRef.current) {
             map.fitBounds(L.latLngBounds(routeLatLngs), { padding: [36, 36] });
           }
        })
        .catch(() => {
          if (!cancelled) setRouteFallback(true);
        })
        .finally(() => {
          if (!cancelled) setRouting(false);
        });
    } else {
      void Promise.resolve().then(() => {
        if (!cancelled) setRouting(false);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [drawLine, markers, routeMarkers, routeStartPosition]);

  // Marcador de posición en vivo + modo "seguir".
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (
      livePosition &&
      Number.isFinite(livePosition.lat) &&
      Number.isFinite(livePosition.lng)
    ) {
      hasLivePositionRef.current = true;
      const ll: L.LatLngExpression = [livePosition.lat, livePosition.lng];
      if (!liveMarkerRef.current) {
        liveMarkerRef.current = L.marker(ll, { icon: liveIcon() }).addTo(map);
      } else {
        liveMarkerRef.current.setLatLng(ll);
      }

      if (follow) {
        map.setView(ll, Math.max(map.getZoom(), 17), { animate: true });
      }
    } else {
      hasLivePositionRef.current = false;
    }
  }, [livePosition, follow]);

  return (
    <div className="route-map-wrap" style={{ height, position: 'relative' }}>
      <div
        id={`map-${id}`}
        className="route-map-canvas"
        style={{ height: '100%', width: '100%' }}
      />
      {routing && (
        <div className="map-loading" role="status">
          <span className="spinner" style={{ width: 28, height: 28 }} />
          <span>Calculando ruta…</span>
        </div>
      )}
      {!routing && routeFallback && (
        <div className="map-loading map-loading-note">
          Ruta aproximada (línea recta); no fue posible enrutar por carretera.
        </div>
      )}
    </div>
  );
}
