'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CalendarDays,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { useCityAlertDetail } from '@/hooks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Alert } from '@/types';
import {
  ALERT_TYPE_TRANSLATION_KEYS,
  SEVERITY_ACCENT,
  SEVERITY_VARIANT,
} from '../../../alerts.constants';
import InfoRow from './InfoRow/InfoRow';

interface AlertDetailViewProps {
  cityId: string;
  alertId: string;
}

export default function AlertDetailView({
  cityId,
  alertId,
}: AlertDetailViewProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [currentTime] = useState(() => Date.now());
  const {
    data: alert,
    isLoading,
    isError,
  } = useCityAlertDetail(cityId, alertId);
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [locale],
  );

  if (isLoading) {
    return (
      <div className="mt-8 text-center text-sm text-[var(--muted-foreground)]">
        Loading...
      </div>
    );
  }

  if (isError || !alert) {
    return (
      <div className="space-y-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(`/city/${cityId}/alerts`)}
        >
          <ArrowLeft size={16} className="mr-2" />
          {t('alerts.detail.backToAlerts')}
        </Button>
        <p className="rounded-lg border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-3 py-4 text-sm text-[var(--danger-dark)]">
          {t('alerts.loadError')}
        </p>
      </div>
    );
  }

  const isExpired = Boolean(
    alert.expiresAt && new Date(alert.expiresAt).getTime() <= currentTime,
  );
  const typeName = translateAlertTypeName(alert, t);

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="ghost"
        onClick={() => router.push(`/city/${cityId}/alerts`)}
      >
        <ArrowLeft size={16} className="mr-2" />
        {t('alerts.detail.backToAlerts')}
      </Button>

      <article className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
        <div
          className={`border-b p-5 md:p-6 ${SEVERITY_ACCENT[alert.severity]}`}
        >
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant={SEVERITY_VARIANT[alert.severity]}>
              {t(`alerts.severity.${alert.severity}`)}
            </Badge>
            <Badge variant={alert.deletedAt ? 'danger' : 'outline'}>
              {alert.deletedAt ? t('alerts.deletedLabel') : typeName}
            </Badge>
            {isExpired ? (
              <Badge variant="outline">{t('alerts.detail.expired')}</Badge>
            ) : null}
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-white/70 p-2 text-[var(--warning-dark)]">
              {alert.severity === 'CRITICAL' ? (
                <ShieldAlert size={30} />
              ) : (
                <Bell size={30} />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl leading-tight text-[var(--primary)] md:text-4xl">
                {alert.title}
              </h1>
              <p className="mt-2 text-sm text-[var(--primary-light)]">
                {t('alerts.detail.createdAt', {
                  date: dateFormatter.format(new Date(alert.createdAt)),
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 md:p-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="whitespace-pre-wrap text-base leading-7 text-[var(--primary-light)]">
            {alert.content}
          </div>

          <Card className="h-fit rounded-xl">
            <CardHeader>
              <CardTitle>{t('alerts.detail.summaryTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow
                icon={<AlertTriangle size={16} />}
                label={t('alerts.fields.severity')}
                value={t(`alerts.severity.${alert.severity}`)}
              />
              <InfoRow
                icon={<Bell size={16} />}
                label={t('alerts.fields.type')}
                value={typeName}
              />
              <InfoRow
                icon={<Clock size={16} />}
                label={t('alerts.expiresAtLabel')}
                value={
                  alert.expiresAt
                    ? dateFormatter.format(new Date(alert.expiresAt))
                    : t('alerts.noExpiry')
                }
              />
              <InfoRow
                icon={<CalendarDays size={16} />}
                label={t('alerts.detail.updatedLabel')}
                value={dateFormatter.format(new Date(alert.updatedAt))}
              />
            </CardContent>
          </Card>
        </div>
      </article>
    </div>
  );
}

function translateAlertTypeName(
  alert: Alert,
  t: ReturnType<typeof useTranslations>,
) {
  const translationKey = ALERT_TYPE_TRANSLATION_KEYS[alert.alertType.name];
  return translationKey ? t(translationKey) : alert.alertType.name;
}
