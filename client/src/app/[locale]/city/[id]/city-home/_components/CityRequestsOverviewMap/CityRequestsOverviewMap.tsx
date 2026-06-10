'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTranslations } from 'next-intl';
import {
  CITY_MAP_ATTRIBUTION,
  CITY_MAP_MARKER_ICON,
  CITY_MAP_TILE_URL,
  DEFAULT_CITY_MAP_CENTER,
  DEFAULT_CITY_MAP_ZOOM,
} from '@/features/city-requests';
import type {
  CityRequestsOverviewMapProps,
  FitRequestBoundsProps,
} from '../../types/CityHomeView.types';

const markerIcon = L.icon(CITY_MAP_MARKER_ICON);

const isValidCoordinate = (lat: unknown, lng: unknown) => {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

function FitRequestBounds({ points, center }: FitRequestBoundsProps) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) {
      map.setView(center, DEFAULT_CITY_MAP_ZOOM);
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], DEFAULT_CITY_MAP_ZOOM);
      return;
    }

    map.fitBounds(
      L.latLngBounds(points.map((point) => [point.lat, point.lng])),
      { padding: [28, 28], maxZoom: 14 },
    );
  }, [center, map, points]);

  return null;
}

export function CityRequestsOverviewMap({
  requests,
  defaultCenter,
  onRequestOpen,
}: CityRequestsOverviewMapProps) {
  const t = useTranslations();
  const mappedRequests = useMemo(
    () =>
      requests
        .filter((request) =>
          isValidCoordinate(request.locationLat, request.locationLng),
        )
        .map((request) => ({
          request,
          point: {
            lat: request.locationLat as number,
            lng: request.locationLng as number,
          },
        })),
    [requests],
  );
  const center = defaultCenter ?? DEFAULT_CITY_MAP_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={DEFAULT_CITY_MAP_ZOOM}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
    >
      <FitRequestBounds
        center={center}
        points={mappedRequests.map((item) => item.point)}
      />
      <TileLayer attribution={CITY_MAP_ATTRIBUTION} url={CITY_MAP_TILE_URL} />
      {mappedRequests.map(({ request, point }) => (
        <Marker
          key={request.id}
          position={point}
          icon={markerIcon}
          eventHandlers={{
            click: () => onRequestOpen(request.id),
          }}
        >
          <Popup>
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-[var(--primary)]">
                {request.title}
              </p>
              <p className="text-[var(--muted-foreground)]">
                {t(`cityHome.requests.status.${request.status}`)}
              </p>
              {request.address ? (
                <p className="text-[var(--muted-foreground)]">
                  {request.address}
                </p>
              ) : null}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
