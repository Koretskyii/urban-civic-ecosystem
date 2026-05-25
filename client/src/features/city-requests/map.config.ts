export const DEFAULT_CITY_MAP_CENTER = {
  lat: 50.4501,
  lng: 30.5234,
} as const;

export const DEFAULT_CITY_MAP_ZOOM = 12;

export const CITY_MAP_TILE_URL =
  process.env.NEXT_PUBLIC_MAP_TILE_URL ??
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

export const CITY_MAP_ATTRIBUTION = '&copy; OpenStreetMap contributors';

export const CITY_MAP_MARKER_ICON = {
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41] as [number, number],
  iconAnchor: [12, 41] as [number, number],
};
