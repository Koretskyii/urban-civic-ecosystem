'use client';

import { MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { useTranslations } from 'next-intl';
import {
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
} from './problem-workspace.constants';
import type { CityRequestStatus, Department } from '@/types';

interface MunicipalityQueueHeaderProps {
  filterStatus: CityRequestStatus | 'ALL';
  filterDepartmentId: string;
  filterPriority: string;
  departments: Department[];
  onFilterStatusChange: (value: CityRequestStatus | 'ALL') => void;
  onFilterDepartmentChange: (value: string) => void;
  onFilterPriorityChange: (value: string) => void;
}

export function MunicipalityQueueHeader(props: MunicipalityQueueHeaderProps) {
  const t = useTranslations();
  const {
    filterStatus,
    filterDepartmentId,
    filterPriority,
    departments,
    onFilterStatusChange,
    onFilterDepartmentChange,
    onFilterPriorityChange,
  } = props;

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>
        {t('cityProblem.municipality.queueTitle')}
      </Typography>
      <Typography color="text.secondary">
        {t('cityProblem.municipality.queueHint')}
      </Typography>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mt: 2 }}>
        <TextField
          select
          label={t('cityProblem.fields.filterStatus')}
          value={filterStatus}
          onChange={(event) =>
            onFilterStatusChange(
              event.target.value as CityRequestStatus | 'ALL',
            )
          }
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="ALL">ALL</MenuItem>
          {STATUS_OPTIONS.map((status) => (
            <MenuItem key={status} value={status}>
              {status}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label={t('cityProblem.fields.filterDepartment')}
          value={filterDepartmentId}
          onChange={(event) => onFilterDepartmentChange(event.target.value)}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="ALL">ALL</MenuItem>
          {departments.map((department) => (
            <MenuItem key={department.id} value={department.id}>
              {department.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label={t('cityProblem.fields.filterPriority')}
          value={filterPriority}
          onChange={(event) => onFilterPriorityChange(event.target.value)}
          sx={{ minWidth: 180 }}
        >
          {PRIORITY_OPTIONS.map((priority) => (
            <MenuItem key={priority} value={priority}>
              {priority}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
    </Paper>
  );
}
