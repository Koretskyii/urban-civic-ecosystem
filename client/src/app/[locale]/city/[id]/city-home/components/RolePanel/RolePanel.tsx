'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import {
  ROLE_ACCENT_CLASSES,
  ROLE_CAPABILITY_KEYS,
} from '@/constants/rbac.const';
import type { RolePanelProps } from '../../types/CityHomeView.types';

export function RolePanel({ role, isMember }: RolePanelProps) {
  const t = useTranslations();
  const visibleRole = role ?? 'citizen';
  const capabilityKeys = isMember
    ? ['overview', ...ROLE_CAPABILITY_KEYS[visibleRole]]
    : ['join'];

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-semibold text-[var(--muted-foreground)]">
          {t('cityHome.rolePanel.title')}
        </p>
        <div
          className={`rounded-lg border p-3 ${isMember ? ROLE_ACCENT_CLASSES[visibleRole] : 'border-black/10 bg-white'}`}
        >
          <div className="flex items-center gap-2">
            {isMember ? (
              <ShieldCheck size={20} className="text-[var(--success)]" />
            ) : (
              <AlertTriangle size={20} className="text-[var(--warning-dark)]" />
            )}
            <p className="text-lg font-semibold text-[var(--primary)]">
              {isMember
                ? t(`cityMembers.roles.${visibleRole}`)
                : t('cityHome.rolePanel.guestTitle')}
            </p>
          </div>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {isMember
              ? t(`cityHome.rolePanel.roleDescriptions.${visibleRole}`)
              : t('cityHome.rolePanel.guestDescription')}
          </p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-[var(--muted-foreground)]">
          {t('cityHome.rolePanel.allowedTitle')}
        </p>
        <div className="space-y-2">
          {capabilityKeys.map((key) => (
            <div
              key={key}
              className="flex items-start gap-2 rounded-lg border border-black/10 bg-white px-3 py-2"
            >
              <CheckCircle2
                size={16}
                className="mt-0.5 shrink-0 text-[var(--success)]"
              />
              <span className="text-sm text-[var(--primary-light)]">
                {t(`cityHome.rolePanel.capabilities.${key}`)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
