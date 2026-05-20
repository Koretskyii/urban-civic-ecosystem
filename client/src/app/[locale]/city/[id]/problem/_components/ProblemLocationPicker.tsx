'use client';

import { useEffect, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslations } from 'next-intl';
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
  DEFAULT_CITY_MAP_CENTER,
  DEFAULT_CITY_MAP_ZOOM,
  normalizeCoordinate,
  validateCoordinates,
} from '@/features/city-requests';

interface ProblemLocationPickerProps {
  lat: string;
  lng: string;
  onLatChange?: (value: string) => void;
  onLngChange?: (value: string) => void;
  readOnly?: boolean;
  titleKey?: string;
  hintKey?: string;
}

const markerIcon = L.icon(CITY_MAP_MARKER_ICON);

function ClickHandler({
  onLatChange,
  onLngChange,
}: Pick<ProblemLocationPickerProps, 'onLatChange' | 'onLngChange'>) {
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

export function ProblemLocationPicker(props: ProblemLocationPickerProps) {
  const {
    lat,
    lng,
    onLatChange,
    onLngChange,
    readOnly = false,
    titleKey = 'cityProblem.map.title',
    hintKey = 'cityProblem.map.hint',
  } = props;

  const t = useTranslations();

  const markerPosition = useMemo(() => {
    const parsed = validateCoordinates(lat.trim(), lng.trim());
    if (!parsed.ok) {
      return null;
    }

    return { lat: parsed.lat, lng: parsed.lng };
  }, [lat, lng]);

  const center = markerPosition ?? DEFAULT_CITY_MAP_CENTER;

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {t(titleKey)}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {t(hintKey)}
      </Typography>
      <Box sx={{ height: 280, borderRadius: 2, overflow: 'hidden' }}>
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
          <TileLayer
            attribution={CITY_MAP_ATTRIBUTION}
            url={CITY_MAP_TILE_URL}
          />
          {!readOnly ? (
            <ClickHandler onLatChange={onLatChange} onLngChange={onLngChange} />
          ) : null}
          {markerPosition ? (
            <Marker position={markerPosition} icon={markerIcon} />
          ) : null}
        </MapContainer>
      </Box>
    </Box>
  );
}
