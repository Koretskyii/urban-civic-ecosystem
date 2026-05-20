'use client';

import {
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import type { CityRequestListItem } from '@/types';

interface RequestListPanelProps {
  requests: CityRequestListItem[];
  isLoading: boolean;
  viewMode: 'citizen' | 'municipality';
  activeRequestId: string;
  onSelect: (requestId: string) => void;
}

export function RequestListPanel(props: RequestListPanelProps) {
  const { requests, isLoading, viewMode, activeRequestId, onSelect } = props;
  const t = useTranslations();

  return (
    <Paper sx={{ p: 2, flex: 1, minHeight: 420 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        {viewMode === 'municipality'
          ? t('cityProblem.municipality.listTitle')
          : t('cityProblem.listTitle')}
      </Typography>

      {isLoading ? (
        <Typography>{t('cityProblem.loading')}</Typography>
      ) : requests.length === 0 ? (
        <Typography>{t('cityProblem.empty')}</Typography>
      ) : (
        <List>
          {requests.map((request) => (
            <ListItemButton
              key={request.id}
              selected={request.id === activeRequestId}
              onClick={() => onSelect(request.id)}
            >
              <ListItemText
                primary={request.title}
                secondary={`${request.user.name} - ${request.status} - p${request.priority}`}
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </Paper>
  );
}
