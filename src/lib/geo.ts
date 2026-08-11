export type LatLng = { lat: number; lng: number; label?: string };

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

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
  const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
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
      () => reject(new Error('No se pudo obtener la ubicación. Active el GPS/permiso del navegador.')),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  });
}

/** Centro por defecto: Manta / ULEAM */
export const ULEAM_CENTER: LatLng = { lat: -0.954, lng: -80.745, label: 'Manta' };
