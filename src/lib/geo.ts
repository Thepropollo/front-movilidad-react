export type LatLng = { lat: number; lng: number; label?: string };
export type RouteInstruction = {
  instruction: string;
  distanceMeters: number;
  location: LatLng;
};

export type RoutePlan = {
  distanceMeters: number;
  durationSeconds: number;
  steps: RouteInstruction[];
};

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';
const ROUTING_SERVERS = [
  'https://router.project-osrm.org/route/v1/driving',
  'https://routing.openstreetmap.de/routed-car/route/v1/driving',
];

/** Evita usar coordenadas invertidas o de otro continente en este mapa ecuatoriano. */
export function isLikelyEcuadorCoordinate(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -5.5 &&
    lat <= 2.5 &&
    lng >= -92.5 &&
    lng <= -75
  );
}

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

/** Obtiene una dirección legible a partir de un punto seleccionado en el mapa. */
export async function reverseGeocode(lat: number, lng: number): Promise<LatLng | null> {
  const url = new URL(NOMINATIM_REVERSE);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('format', 'json');
  url.searchParams.set('zoom', '18');

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'es',
    },
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { display_name?: string };
  return {
    lat,
    lng,
    label: data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
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

  for (const server of ROUTING_SERVERS) {
    try {
      const res = await fetch(
        `${server}/${coords}?overview=full&geometries=geojson`
      );
      if (!res.ok) continue;

      const data = (await res.json()) as {
        code?: string;
        routes?: Array<{ geometry?: { coordinates?: number[][] } }>;
      };
      const coordinates = data.routes?.[0]?.geometry?.coordinates;
      if (data.code && data.code !== 'Ok') continue;
      if (!coordinates || coordinates.length < 2) continue;

      const route = coordinates.flatMap(([lng, lat]) =>
        Number.isFinite(lat) && Number.isFinite(lng) ? [{ lat, lng }] : []
      );
      if (route.length >= 2) return route;
    } catch {
      // Intenta el siguiente servicio público de enrutamiento.
    }
  }

  return null;
}

const maneuverText = (step: {
  maneuver?: { type?: string; modifier?: string };
  name?: string;
}) => {
  const type = step.maneuver?.type;
  const modifier = step.maneuver?.modifier;
  const road = step.name?.trim();
  const roadText = road ? ` por ${road}` : '';
  const direction =
    modifier === 'slight left'
      ? 'ligeramente a la izquierda'
      : modifier === 'slight right'
        ? 'ligeramente a la derecha'
        : modifier === 'sharp left'
          ? 'cerrado a la izquierda'
          : modifier === 'sharp right'
            ? 'cerrado a la derecha'
            : modifier === 'left'
              ? 'a la izquierda'
              : modifier === 'right'
                ? 'a la derecha'
                : modifier === 'straight'
                  ? 'recto'
                  : modifier === 'uturn'
                    ? 'en U'
                    : '';

  if (type === 'depart') return `Salga${roadText}`;
  if (type === 'arrive') return 'Ha llegado a su destino';
  if (type === 'roundabout' || type === 'rotary') return `Tome la rotonda${roadText}`;
  if (type === 'merge') return `Incorpórese${roadText}`;
  if (type === 'fork') return `Manténgase ${direction || 'en la vía'}${roadText}`;
  if (direction === 'ligeramente a la izquierda' || direction === 'ligeramente a la derecha') {
    return `Manténgase ${direction}${roadText}`;
  }
  if (direction === 'cerrado a la izquierda' || direction === 'cerrado a la derecha') {
    return `Gire ${direction}${roadText}`;
  }
  if (direction === 'a la izquierda' || direction === 'a la derecha') {
    return `Gire ${direction}${roadText}`;
  }
  if (direction === 'en U') return `Realice un giro ${direction}${roadText}`;
  if (direction === 'recto') return `Continúe recto${roadText}`;
  return `Continúe${roadText}`;
};

/** Obtiene distancia, duración e instrucciones para la navegación del conductor. */
export async function fetchRouteDetails(points: LatLng[]): Promise<RoutePlan | null> {
  const valid = points.filter(
    (p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)
  );
  if (valid.length < 2) return null;

  const coords = valid.map((p) => `${p.lng},${p.lat}`).join(';');
  for (const server of ROUTING_SERVERS) {
    try {
      const res = await fetch(`${server}/${coords}?overview=false&steps=true`);
      if (!res.ok) continue;
      const data = (await res.json()) as {
        code?: string;
        routes?: Array<{
          distance?: number;
          duration?: number;
          legs?: Array<{
            steps?: Array<{
              distance?: number;
              name?: string;
              maneuver?: {
                type?: string;
                modifier?: string;
                location?: number[];
              };
            }>;
          }>;
        }>;
      };
      if (data.code && data.code !== 'Ok') continue;
      const route = data.routes?.[0];
      if (!route) continue;

      const steps = (route.legs || []).flatMap((leg) =>
        (leg.steps || []).flatMap((step) => {
          const coordinates = step.maneuver?.location;
          if (!coordinates || coordinates.length < 2) return [];
          return [
            {
              instruction: maneuverText(step),
              distanceMeters: step.distance || 0,
              location: { lat: coordinates[1], lng: coordinates[0] },
            },
          ];
        })
      );

      return {
        distanceMeters: route.distance || 0,
        durationSeconds: route.duration || 0,
        steps,
      };
    } catch {
      // Intenta el siguiente servicio si el proveedor principal no responde.
    }
  }

  return null;
}
