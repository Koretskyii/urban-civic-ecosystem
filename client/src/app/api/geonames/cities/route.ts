import { NextRequest, NextResponse } from 'next/server';

interface GeoName {
  name: string;
  adminName1?: string;
  lat?: string;
  lng?: string;
  geonameId?: number;
}

interface CityOption {
  label: string;
  region: string;
  lat?: number;
  lng?: number;
  geonameId?: number;
}

const MIN_QUERY_LENGTH = 2;
const MAX_ROWS = 10;
const parseOptionalCoordinate = (
  value: string | undefined,
): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? '';

  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ options: [] });
  }

  const username =
    process.env.GEONAMES_USERNAME || process.env.NEXT_PUBLIC_GEONAMES_USERNAME;

  if (!username) {
    return NextResponse.json(
      { message: 'GeoNames username is not configured', options: [] },
      { status: 500 },
    );
  }

  const geonamesUrl = new URL('https://secure.geonames.org/searchJSON');
  geonamesUrl.searchParams.set('name_startsWith', query);
  geonamesUrl.searchParams.set('country', 'UA');
  geonamesUrl.searchParams.set('featureClass', 'P');
  geonamesUrl.searchParams.set('maxRows', String(MAX_ROWS));
  geonamesUrl.searchParams.set('username', username);
  geonamesUrl.searchParams.set('lang', 'uk');

  try {
    const response = await fetch(geonamesUrl.toString(), {
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: 'Failed to fetch cities', options: [] },
        { status: 502 },
      );
    }

    const data = (await response.json()) as {
      status?: { message?: string };
      geonames?: GeoName[];
    };

    if (data.status?.message) {
      return NextResponse.json(
        { message: data.status.message, options: [] },
        { status: 400 },
      );
    }

    const formattedOptions: CityOption[] = (data.geonames ?? []).map((item) => {
      const parsedLat = parseOptionalCoordinate(item.lat);
      const parsedLng = parseOptionalCoordinate(item.lng);

      return {
        label: item.name,
        region: item.adminName1 || 'Unknown region',
        lat: parsedLat,
        lng: parsedLng,
        geonameId: item.geonameId,
      };
    });

    const deduplicated = Array.from(
      new Map(
        formattedOptions.map((option) => [
          `${option.label.toLowerCase()}::${option.region.toLowerCase()}`,
          option,
        ]),
      ).values(),
    );

    return NextResponse.json({ options: deduplicated });
  } catch {
    return NextResponse.json(
      { message: 'Failed to fetch cities', options: [] },
      { status: 500 },
    );
  }
}
