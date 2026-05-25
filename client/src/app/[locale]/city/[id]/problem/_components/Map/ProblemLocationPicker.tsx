'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslations } from 'next-intl';
import {
  DEFAULT_CITY_MAP_CENTER,
  validateCoordinates,
} from '@/features/city-requests';

interface ProblemLocationPickerProps {
  lat: string;
  lng: string;
  defaultCenter?: { lat: number; lng: number };
  onLatChange?: (value: string) => void;
  onLngChange?: (value: string) => void;
  readOnly?: boolean;
  titleKey?: string;
  hintKey?: string;
}

const ProblemLocationMap = dynamic(
  () =>
    import('./ProblemLocationMap').then((module) => module.ProblemLocationMap),
  { ssr: false },
);

const normalizeDefaultCenter = (
  center: { lat: number; lng: number } | undefined,
): { lat: number; lng: number } | undefined => {
  if (!center) {
    return undefined;
  }

  if (!Number.isFinite(center.lat) || !Number.isFinite(center.lng)) {
    return undefined;
  }

  if (
    center.lat < -90 ||
    center.lat > 90 ||
    center.lng < -180 ||
    center.lng > 180
  ) {
    return undefined;
  }

  if (center.lat === 0 || center.lng === 0) {
    return undefined;
  }

  return center;
};

export function ProblemLocationPicker(props: ProblemLocationPickerProps) {
  const {
    lat,
    lng,
    defaultCenter,
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

  const safeDefaultCenter = useMemo(
    () => normalizeDefaultCenter(defaultCenter),
    [defaultCenter],
  );

  const center = markerPosition ?? safeDefaultCenter ?? DEFAULT_CITY_MAP_CENTER;

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {t(titleKey)}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {t(hintKey)}
      </Typography>
      <Box sx={{ height: 280, borderRadius: 2, overflow: 'hidden' }}>
        <ProblemLocationMap
          center={center}
          markerPosition={markerPosition}
          readOnly={readOnly}
          onLatChange={onLatChange}
          onLngChange={onLngChange}
        />
      </Box>
    </Box>
  );
}
