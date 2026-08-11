import { useEffect, useId, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ULEAM_CENTER, type LatLng } from '../lib/geo';

export type MapMarker = LatLng & {
  kind?: 'origin' | 'destination' | 'stop' | 'live';
  sequence?: number;
};

type Props = {
  markers: MapMarker[];
  height?: number;
  drawLine?: boolean;
};

const icon = (color: string) =>
  L.divIcon({
    className: 'map-pin',
    html: `<span style="background:${color};width:14px;height:14px;border-radius:50%;display:block;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.25)"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

const COLORS: Record<string, string> = {
  origin: '#0b5fff',
  destination: '#c5a059',
  stop: '#002855',
  live: '#2e7d32',
};

export default function RouteMapView({ markers, height = 420, drawLine = true }: Props) {
  const id = useId().replace(/:/g, '');
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const el = document.getElementById(`map-${id}`);
    if (!el) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(el, { zoomControl: true, attributionControl: true }).setView(
      [ULEAM_CENTER.lat, ULEAM_CENTER.lng],
      11
    );
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    const points: L.LatLngExpression[] = [];
    markers.forEach((m) => {
      if (Number.isFinite(m.lat) && Number.isFinite(m.lng)) {
        const ll: L.LatLngExpression = [m.lat, m.lng];
        points.push(ll);
        const marker = L.marker(ll, { icon: icon(COLORS[m.kind || 'stop'] || COLORS.stop) }).addTo(map);
        const title = m.label || m.kind || 'Punto';
        marker.bindPopup(
          `<strong>${title}</strong>${m.sequence ? `<br/>Parada #${m.sequence}` : ''}`
        );
      }
    });

    if (drawLine && points.length >= 2) {
      L.polyline(points, { color: '#002855', weight: 4, opacity: 0.85 }).addTo(map);
    }

    if (points.length === 1) {
      map.setView(points[0], 13);
    } else if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [36, 36] });
    }

    setTimeout(() => map.invalidateSize(), 80);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [id, markers, drawLine]);

  return (
    <div className="route-map-wrap" style={{ height }}>
      <div id={`map-${id}`} className="route-map-canvas" style={{ height: '100%', width: '100%' }} />
    </div>
  );
}
