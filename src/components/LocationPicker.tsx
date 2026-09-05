import { useEffect, useId, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { reverseGeocode, ULEAM_CENTER } from '@/lib/geo';

export type SelectedLocation = {
  lat: number | null;
  lng: number | null;
  address: string;
};

type Props = {
  value: SelectedLocation;
  onChange: (location: SelectedLocation) => void;
  height?: number;
};

const selectedIcon = L.divIcon({
  className: 'location-picker-pin',
  html: '<span></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export default function LocationPicker({ value, onChange, height = 250 }: Props) {
  const id = useId().replace(/:/g, '');
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const initialValueRef = useRef(value);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const element = document.getElementById(`location-map-${id}`);
    if (!element) return;

    const map = L.map(element).setView(
      initialValueRef.current.lat !== null && initialValueRef.current.lng !== null
        ? [initialValueRef.current.lat, initialValueRef.current.lng]
        : [ULEAM_CENTER.lat, ULEAM_CENTER.lng],
      initialValueRef.current.lat !== null && initialValueRef.current.lng !== null ? 15 : 11
    );
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    if (initialValueRef.current.lat !== null && initialValueRef.current.lng !== null) {
      markerRef.current = L.marker(
        [initialValueRef.current.lat, initialValueRef.current.lng],
        { icon: selectedIcon }
      ).addTo(map);
    }

    map.on('click', (event) => {
      const { lat, lng } = event.latlng;
      markerRef.current?.remove();
      markerRef.current = L.marker([lat, lng], { icon: selectedIcon }).addTo(map);
      onChangeRef.current({ lat, lng, address: 'Buscando dirección…' });

      void reverseGeocode(lat, lng)
        .then((location) => {
          onChangeRef.current({
            lat,
            lng,
            address: location?.label || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          });
        })
        .catch(() => {
          onChangeRef.current({
            lat,
            lng,
            address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          });
        });
    });

    setTimeout(() => map.invalidateSize(), 80);
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [id]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || value.lat === null || value.lng === null) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    const point: L.LatLngExpression = [value.lat, value.lng];
    if (markerRef.current) {
      markerRef.current.setLatLng(point);
    } else {
      markerRef.current = L.marker(point, { icon: selectedIcon }).addTo(map);
    }
    map.setView(point, Math.max(map.getZoom(), 15));
  }, [value.lat, value.lng]);

  return (
    <div className="location-picker">
      <div
        id={`location-map-${id}`}
        className="location-picker-map"
        style={{ height }}
        aria-label="Mapa para seleccionar el destino"
      />
      <p className="location-picker-help">
        Haz clic en el mapa para marcar el punto exacto del destino.
      </p>
    </div>
  );
}
