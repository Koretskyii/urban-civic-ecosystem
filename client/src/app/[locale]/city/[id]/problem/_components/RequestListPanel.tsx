'use client';

import {
  Chip,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
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
              sx={{ alignItems: 'flex-start' }}
            >
              <ListItemText
                primary={request.title}
                secondary={
                  <Stack spacing={0.75} sx={{ mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {request.user.name}
                    </Typography>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap">
                      <Chip
                        size="small"
                        color="primary"
                        label={request.status}
                      />
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`P${request.priority}`}
                      />
                      {request.assignedDepartment?.name ? (
                        <Chip
                          size="small"
                          variant="outlined"
                          color="secondary"
                          label={request.assignedDepartment.name}
                        />
                      ) : null}
                    </Stack>
                  </Stack>
                }
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </Paper>
  );
}
