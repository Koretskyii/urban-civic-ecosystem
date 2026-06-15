'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import {
  CITY_MAP_ATTRIBUTION,
  CITY_MAP_TILE_URL,
  DEFAULT_CITY_MAP_CENTER,
  DEFAULT_CITY_MAP_ZOOM,
} from '@/features/city-requests';
import type { GeoPoint } from '../analytics.types';
import {
  HEAT_BLUR,
  HEAT_FIT_MAX_ZOOM,
  HEAT_FIT_PADDING,
  HEAT_MAX_ZOOM,
  HEAT_RADIUS,
} from '../analytics.const';

interface RequestsHeatmapProps {
  points: GeoPoint[];
  center?: { lat: number; lng: number };
}

const HEAT_GRADIENT = {
  0.2: '#3f88c5',
  0.4: '#316b50',
  0.6: '#ffba08',
  0.8: '#e04040',
  1.0: '#d00000',
};

function HeatLayer({ points }: { points: GeoPoint[] }) {
  const map = useMap();

  const tuples = useMemo<L.HeatLatLngTuple[]>(
    () => points.map((p) => [p.lat, p.lng, p.weight]),
    [points],
  );

  useEffect(() => {
    if (tuples.length === 0) return;

    const maxWeight = Math.max(...tuples.map((t) => t[2]), 1);
    const layer = L.heatLayer(tuples, {
      radius: HEAT_RADIUS,
      blur: HEAT_BLUR,
      maxZoom: HEAT_MAX_ZOOM,
      max: maxWeight,
      gradient: HEAT_GRADIENT,
    });
    layer.addTo(map);

    const bounds = L.latLngBounds(tuples.map((t) => [t[0], t[1]]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: HEAT_FIT_PADDING,
        maxZoom: HEAT_FIT_MAX_ZOOM,
      });
    }

    return () => {
      layer.remove();
    };
  }, [map, tuples]);

  return null;
}

export function RequestsHeatmap({ points, center }: RequestsHeatmapProps) {
  const mapCenter = center ?? DEFAULT_CITY_MAP_CENTER;

  return (
    <MapContainer
      center={mapCenter}
      zoom={DEFAULT_CITY_MAP_ZOOM}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
    >
      <TileLayer url={CITY_MAP_TILE_URL} attribution={CITY_MAP_ATTRIBUTION} />
      <HeatLayer points={points} />
    </MapContainer>
  );
}
