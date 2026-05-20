'use client';

import { Paper, Stack, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useTranslations } from 'next-intl';

type ViewMode = 'citizen' | 'municipality';

interface ProblemModeSwitcherProps {
  value: ViewMode;
  canManageRequests: boolean;
  isPermissionLoading: boolean;
  onChange: (value: ViewMode) => void;
}

export function ProblemModeSwitcher(props: ProblemModeSwitcherProps) {
  const { value, canManageRequests, isPermissionLoading, onChange } = props;
  const t = useTranslations();

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <ToggleButtonGroup
          value={value}
          exclusive
          size="small"
          onChange={(_event, nextValue: ViewMode | null) => {
            if (!nextValue) return;
            if (nextValue === 'municipality' && !canManageRequests) return;
            onChange(nextValue);
          }}
        >
          <ToggleButton value="citizen">
            {t('cityProblem.viewModes.citizen')}
          </ToggleButton>
          {isPermissionLoading || canManageRequests ? (
            <ToggleButton value="municipality">
              {t('cityProblem.viewModes.municipality')}
            </ToggleButton>
          ) : null}
        </ToggleButtonGroup>
      </Stack>
    </Paper>
  );
}
