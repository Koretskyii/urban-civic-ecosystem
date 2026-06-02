'use client';

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

  const onModeChange = (nextValue: ViewMode) => {
    if (nextValue === 'municipality' && !canManageRequests) return;
    onChange(nextValue);
  };

  return (
    <div className="rounded-lg border border-black/10 bg-white p-3">
      <div className="inline-flex rounded-md bg-black/5 p-1">
        <button
          type="button"
          onClick={() => onModeChange('citizen')}
          className={`rounded px-3 py-1.5 text-sm ${
            value === 'citizen'
              ? 'bg-white text-[var(--primary-light)] shadow-sm'
              : 'text-[var(--muted-foreground)]'
          }`}
        >
          {t('cityProblem.viewModes.citizen')}
        </button>
        {isPermissionLoading || canManageRequests ? (
          <button
            type="button"
            onClick={() => onModeChange('municipality')}
            className={`rounded px-3 py-1.5 text-sm ${
              value === 'municipality'
                ? 'bg-white text-[var(--primary-light)] shadow-sm'
                : 'text-[var(--muted-foreground)]'
            }`}
          >
            {t('cityProblem.viewModes.municipality')}
          </button>
        ) : null}
      </div>
    </div>
  );
}
