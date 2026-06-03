import type { ReactNode } from 'react';
import type { Alert, CityRequestListItem, News, RoleKey } from '@/types';

export type CityCoordinate = {
  lat: number;
  lng: number;
};

export type CityHomeViewProps = {
  cityId: string;
};

export type RolePanelProps = {
  role: RoleKey | null;
  isMember: boolean;
};

export type ContentCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
  actionLabel: string;
  onAction: () => void;
  children: ReactNode;
};

export type AsyncListStateProps = {
  enabled: boolean;
  isLoading: boolean;
  isError: boolean;
  empty: boolean;
  disabledText: string;
  emptyText: string;
  errorText: string;
  children: ReactNode;
};

export type StateMessageProps = {
  text: string;
  tone?: 'muted' | 'danger';
};

export type NewsPreviewProps = {
  item: News;
  dateFormatter: Intl.DateTimeFormat;
  onOpen: () => void;
};

export type AlertPreviewProps = {
  item: Alert;
  onOpen: () => void;
};

export type RequestPreviewProps = {
  item: CityRequestListItem;
  dateFormatter: Intl.DateTimeFormat;
  onOpen: (requestId: string) => void;
};

export type CityRequestsOverviewMapProps = {
  requests: CityRequestListItem[];
  defaultCenter?: CityCoordinate;
  onRequestOpen: (requestId: string) => void;
};

export type FitRequestBoundsProps = {
  points: CityCoordinate[];
  center: CityCoordinate;
};
