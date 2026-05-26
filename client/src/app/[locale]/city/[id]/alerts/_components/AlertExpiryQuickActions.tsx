'use client';

import { Button, Box } from '@mui/material';
import { addDaysToDateTimeInput } from '../alerts.utils';

interface AlertExpiryQuickActionsProps {
  value: string;
  onChange: (value: string) => void;
  t: (key: string) => string;
}

export default function AlertExpiryQuickActions({
  value,
  onChange,
  t,
}: AlertExpiryQuickActionsProps) {
  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      <Button
        type="button"
        size="small"
        onClick={() => onChange(addDaysToDateTimeInput(value, 7))}
      >
        {t('alerts.actions.plus7Days')}
      </Button>
      <Button
        type="button"
        size="small"
        onClick={() => onChange(addDaysToDateTimeInput(value, 30))}
      >
        {t('alerts.actions.plus30Days')}
      </Button>
      <Button
        type="button"
        size="small"
        variant={value ? 'text' : 'contained'}
        color={value ? 'inherit' : 'primary'}
        onClick={() => onChange('')}
      >
        {t('alerts.actions.noExpiry')}
      </Button>
      <Button type="button" size="small" onClick={() => onChange('')}>
        {t('alerts.actions.clearExpiry')}
      </Button>
    </Box>
  );
}
