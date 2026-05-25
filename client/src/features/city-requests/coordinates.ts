const MIN_LAT = -90;
const MAX_LAT = 90;
const MIN_LNG = -180;
const MAX_LNG = 180;

export function parseCoordinate(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isLatitudeInRange(value: number): boolean {
  return value >= MIN_LAT && value <= MAX_LAT;
}

export function isLongitudeInRange(value: number): boolean {
  return value >= MIN_LNG && value <= MAX_LNG;
}

export function normalizeCoordinate(value: number): string {
  return value.toFixed(6);
}

export function validateCoordinates(lat: string, lng: string) {
  const parsedLat = parseCoordinate(lat);
  const parsedLng = parseCoordinate(lng);

  if (parsedLat === null || parsedLng === null) {
    return {
      ok: false as const,
      reason: 'invalid_number' as const,
    };
  }

  if (!isLatitudeInRange(parsedLat) || !isLongitudeInRange(parsedLng)) {
    return {
      ok: false as const,
      reason: 'out_of_range' as const,
    };
  }

  return {
    ok: true as const,
    lat: parsedLat,
    lng: parsedLng,
    normalizedLat: normalizeCoordinate(parsedLat),
    normalizedLng: normalizeCoordinate(parsedLng),
  };
}
