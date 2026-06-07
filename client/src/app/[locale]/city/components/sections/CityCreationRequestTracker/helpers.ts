export function formatCoordinates(lat?: number | null, lng?: number | null) {
  if (lat == null || lng == null) return null;
  return `${lat}, ${lng}`;
}

export function formatDateTime(value?: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
