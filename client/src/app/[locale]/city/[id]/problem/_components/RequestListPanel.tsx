'use client';

import { memo, useMemo, useState } from 'react';
import {
  Button,
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

const INITIAL_BATCH_SIZE = 40;
const LOAD_MORE_STEP = 40;

interface RequestRowProps {
  request: CityRequestListItem;
  isActive: boolean;
  onSelect: (requestId: string) => void;
}

const RequestRow = memo(function RequestRow({
  request,
  isActive,
  onSelect,
}: RequestRowProps) {
  return (
    <ListItemButton
      selected={isActive}
      onClick={() => onSelect(request.id)}
      sx={{ alignItems: 'flex-start' }}
    >
      <ListItemText
        primary={request.title}
        secondaryTypographyProps={{ component: 'div' }}
        secondary={
          <Stack spacing={0.75} sx={{ mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {request.user.name}
            </Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap">
              <Chip size="small" color="primary" label={request.status} />
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
  );
});

export const RequestListPanel = memo(function RequestListPanel(
  props: RequestListPanelProps,
) {
  const { requests, isLoading, viewMode, activeRequestId, onSelect } = props;
  const t = useTranslations();
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH_SIZE);

  const visibleRequests = useMemo(
    () => requests.slice(0, visibleCount),
    [requests, visibleCount],
  );
  const canLoadMore = visibleCount < requests.length;

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
        <>
          <List>
            {visibleRequests.map((request) => (
              <RequestRow
                key={request.id}
                request={request}
                isActive={request.id === activeRequestId}
                onSelect={onSelect}
              />
            ))}
          </List>
          {canLoadMore ? (
            <Button
              variant="text"
              onClick={() => setVisibleCount((prev) => prev + LOAD_MORE_STEP)}
            >
              {t('common.loadMore')}
            </Button>
          ) : null}
        </>
      )}
    </Paper>
  );
});
