export type LatLng = { lat: number; lng: number; label?: string };

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const OSRM = 'https://router.project-osrm.org/route/v1/driving';

/** Geocodifica un lugar en Ecuador (OpenStreetMap Nominatim). */
export async function geocodePlace(query: string): Promise<LatLng | null> {
  const q = query.trim();
  if (!q) return null;

  const url = new URL(NOMINATIM);
  url.searchParams.set('q', `${q}, Ecuador`);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'es',
    },
  });

  if (!res.ok) return null;
  const data = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;
  if (!data[0]) return null;

  return {
    lat: Number(data[0].lat),
    lng: Number(data[0].lon),
    label: data[0].display_name,
  };
}

export function getCurrentPosition(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalización no disponible en este navegador.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: 'Mi ubicación',
        });
      },
      () =>
        reject(
          new Error(
            'No se pudo obtener la ubicación. Active el GPS/permiso del navegador.'
          )
        ),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  });
}

/** Observa continuamente la posición del dispositivo. Devuelve el id del watcher. */
export function watchPosition(
  onUpdate: (p: LatLng) => void,
  onError: (e: Error) => void
): number | null {
  if (!navigator.geolocation) {
    onError(new Error('Geolocalización no disponible en este navegador.'));
    return null;
  }

  return navigator.geolocation.watchPosition(
    (pos) =>
      onUpdate({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        label: 'Mi ubicación',
      }),
    () =>
      onError(
        new Error('No se pudo obtener la ubicación. Active el GPS/permiso.')
      ),
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
  );
}

export function clearWatch(id: number | null): void {
  if (id !== null) navigator.geolocation.clearWatch(id);
}

/** Centro por defecto: Manta / ULEAM */
export const ULEAM_CENTER: LatLng = {
  lat: -0.954,
  lng: -80.745,
  label: 'Manta',
};

/**
 * Calcula la ruta real por carretera entre una lista ordenada de puntos
 * usando el servicio público OSRM. Devuelve la geometría (lista de
 * coordenadas) o null si no es posible enrutar.
 */
export async function fetchRoute(points: LatLng[]): Promise<LatLng[] | null> {
  const valid = points.filter(
    (p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)
  );
  if (valid.length < 2) return null;

  const coords = valid.map((p) => `${p.lng},${p.lat}`).join(';');
  const url = `${OSRM}/${coords}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      routes?: Array<{ geometry?: { coordinates?: number[][] } }>;
    };
    const coordinates = data.routes?.[0]?.geometry?.coordinates;
    if (!coordinates?.length) return null;

    return coordinates.map(([lng, lat]) => ({ lat, lng }));
  } catch {
    return null;
  }
}