'use client';

import type { RoleUiMode } from '@/hooks/useRoleUiMode';
import { useTranslations } from 'next-intl';

interface RoleModeSwitcherProps {
  value: RoleUiMode;
  canManage: boolean;
  isPermissionLoading?: boolean;
  citizenLabel?: string;
  manageLabel?: string;
  onChange: (value: RoleUiMode) => void;
}

export function RoleModeSwitcher(props: RoleModeSwitcherProps) {
  const { value, canManage, citizenLabel, manageLabel, onChange } = props;
  const t = useTranslations();

  if (!canManage) {
    return null;
  }

  const onModeChange = (nextValue: RoleUiMode) => {
    if (nextValue === 'manage' && !canManage) return;
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
          {citizenLabel ?? t('common.viewModes.citizen')}
        </button>
        <button
          type="button"
          onClick={() => onModeChange('manage')}
          className={`rounded px-3 py-1.5 text-sm ${
            value === 'manage'
              ? 'bg-white text-[var(--primary-light)] shadow-sm'
              : 'text-[var(--muted-foreground)]'
          }`}
        >
          {manageLabel ?? t('common.viewModes.manage')}
        </button>
      </div>
    </div>
  );
}
