'use client';

import { useEffect } from 'react';
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import {
  CITY_MAP_ATTRIBUTION,
  CITY_MAP_MARKER_ICON,
  CITY_MAP_TILE_URL,
  DEFAULT_CITY_MAP_ZOOM,
  normalizeCoordinate,
} from '@/features/city-requests';

interface ProblemLocationMapProps {
  center: { lat: number; lng: number };
  markerPosition: { lat: number; lng: number } | null;
  readOnly: boolean;
  onLatChange?: (value: string) => void;
  onLngChange?: (value: string) => void;
}

const markerIcon = L.icon(CITY_MAP_MARKER_ICON);

function ClickHandler({
  onLatChange,
  onLngChange,
}: Pick<ProblemLocationMapProps, 'onLatChange' | 'onLngChange'>) {
  useMapEvents({
    click(event) {
      if (!onLatChange || !onLngChange) {
        return;
      }

      onLatChange(normalizeCoordinate(event.latlng.lat));
      onLngChange(normalizeCoordinate(event.latlng.lng));
    },
  });

  return null;
}

function RecenterMap({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center);
  }, [map, center]);

  return null;
}

export function ProblemLocationMap({
  center,
  markerPosition,
  readOnly,
  onLatChange,
  onLngChange,
}: ProblemLocationMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={DEFAULT_CITY_MAP_ZOOM}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={!readOnly}
      dragging={!readOnly}
      doubleClickZoom={!readOnly}
      touchZoom={!readOnly}
      keyboard={!readOnly}
    >
      <RecenterMap center={center} />
      <TileLayer attribution={CITY_MAP_ATTRIBUTION} url={CITY_MAP_TILE_URL} />
      {!readOnly ? (
        <ClickHandler onLatChange={onLatChange} onLngChange={onLngChange} />
      ) : null}
      {markerPosition ? (
        <Marker position={markerPosition} icon={markerIcon} />
      ) : null}
    </MapContainer>
  );
}
