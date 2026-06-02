'use client';

import { PERMISSION_GROUPS } from '@/constants/rbac.const';
import {
  useCityAlertTypes,
  useCityAlerts,
  useCreateAlert,
  useDeleteAlert,
  usePermission,
  useUpdateAlert,
} from '@/hooks';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { FormEvent, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Alert, AlertType, AlertSeverity } from '@/types';
import {
  ALERT_DEFAULT_SEVERITY,
  ALERT_SEVERITY_FILTER_ALL,
  ALERT_SEVERITY_OPTIONS,
  ALERT_TYPE_TRANSLATION_KEYS,
} from '../alerts.constants';
import {
  sortAlertsByPriority,
  toDateTimeLocalInputValue,
} from '../alerts.utils';
import AlertExpiryQuickActions from './AlertExpiryQuickActions';
import { Bell } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface AlertsListProps {
  cityId: string;
}

export default function AlertsList(props: AlertsListProps) {
  const t = useTranslations();
  const { cityId } = props;
  const [search, setSearch] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [onlyActive, setOnlyActive] = useState(true);
  const [previewAsCitizen, setPreviewAsCitizen] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<
    typeof ALERT_SEVERITY_FILTER_ALL | AlertSeverity
  >(ALERT_SEVERITY_FILTER_ALL);

  const [newAlertTypeId, setNewAlertTypeId] = useState('');
  const [newSeverity, setNewSeverity] = useState<AlertSeverity>(
    ALERT_DEFAULT_SEVERITY,
  );
  const [newExpiresAt, setNewExpiresAt] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const [editingAlertTypeId, setEditingAlertTypeId] = useState('');
  const [editingSeverity, setEditingSeverity] = useState<AlertSeverity>(
    ALERT_DEFAULT_SEVERITY,
  );
  const [editingExpiresAt, setEditingExpiresAt] = useState('');
  const [editingTitle, setEditingTitle] = useState('');
  const [editingContent, setEditingContent] = useState('');
  const [formError, setFormError] = useState('');

  const debouncedSearch = useDebouncedValue(search, 450);
  const { can: canCreateAlert } = usePermission(
    PERMISSION_GROUPS.ALERT.CREATE,
    {
      cityId,
    },
  );
  const { can: canUpdateAlert } = usePermission(
    PERMISSION_GROUPS.ALERT.UPDATE,
    {
      cityId,
    },
  );
  const { can: canDeleteAlert } = usePermission(
    PERMISSION_GROUPS.ALERT.DELETE,
    {
      cityId,
    },
  );
  const { can: canManageAlert } = usePermission(
    PERMISSION_GROUPS.ALERT.MANAGE,
    {
      cityId,
    },
  );
  const isCitizenView = canManageAlert && previewAsCitizen;
  const effectiveCanManageAlert = canManageAlert && !isCitizenView;

  const listQuery = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      includeDeleted: effectiveCanManageAlert ? includeDeleted : false,
      onlyActive: effectiveCanManageAlert ? onlyActive : true,
      severity:
        severityFilter === ALERT_SEVERITY_FILTER_ALL
          ? undefined
          : severityFilter,
    }),
    [
      debouncedSearch,
      effectiveCanManageAlert,
      includeDeleted,
      onlyActive,
      severityFilter,
    ],
  );

  const { data: alerts, isLoading, error } = useCityAlerts(cityId, listQuery);
  const { data: alertTypes } = useCityAlertTypes(cityId);
  const createAlertMutation = useCreateAlert();
  const updateAlertMutation = useUpdateAlert();
  const deleteAlertMutation = useDeleteAlert();
  const canManageView =
    (canCreateAlert || canUpdateAlert || canDeleteAlert) && !isCitizenView;

  const visibleAlerts = useMemo(() => {
    if (!alerts) return [];
    const filtered = effectiveCanManageAlert
      ? alerts
      : alerts.filter((item: Alert) => !item.deletedAt);
    return sortAlertsByPriority(filtered);
  }, [alerts, effectiveCanManageAlert]);

  const translateAlertTypeName = (name: string) => {
    const translationKey = ALERT_TYPE_TRANSLATION_KEYS[name];
    return translationKey ? t(translationKey) : name;
  };

  const onCreateAlert = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    const title = newTitle.trim();
    const content = newContent.trim();
    if (!newAlertTypeId || title.length < 3 || content.length < 3) {
      setFormError(t('alerts.formValidation'));
      return;
    }

    try {
      await createAlertMutation.mutateAsync({
        cityId,
        payload: {
          alertTypeId: newAlertTypeId,
          severity: newSeverity,
          expiresAt: newExpiresAt || undefined,
          title,
          content,
        },
      });
      setNewAlertTypeId('');
      setNewSeverity(ALERT_DEFAULT_SEVERITY);
      setNewExpiresAt('');
      setNewTitle('');
      setNewContent('');
    } catch {
      setFormError(t('alerts.createError'));
    }
  };

  const startEdit = (item: {
    id: string;
    alertTypeId: string;
    severity: AlertSeverity;
    expiresAt?: string | null;
    title: string;
    content: string;
  }) => {
    setEditingAlertId(item.id);
    setEditingAlertTypeId(item.alertTypeId);
    setEditingSeverity(item.severity);
    setEditingExpiresAt(toDateTimeLocalInputValue(item.expiresAt));
    setEditingTitle(item.title);
    setEditingContent(item.content);
    setFormError('');
  };

  const onSaveEdit = async () => {
    if (!editingAlertId) return;
    const title = editingTitle.trim();
    const content = editingContent.trim();
    if (!editingAlertTypeId || title.length < 3 || content.length < 3) {
      setFormError(t('alerts.formValidation'));
      return;
    }

    try {
      await updateAlertMutation.mutateAsync({
        cityId,
        alertId: editingAlertId,
        payload: {
          alertTypeId: editingAlertTypeId,
          severity: editingSeverity,
          expiresAt: editingExpiresAt || null,
          title,
          content,
        },
      });
      setEditingAlertId(null);
      setEditingAlertTypeId('');
      setEditingSeverity(ALERT_DEFAULT_SEVERITY);
      setEditingExpiresAt('');
      setEditingTitle('');
      setEditingContent('');
    } catch {
      setFormError(t('alerts.updateError'));
    }
  };

  const onDeleteAlert = async (alertId: string) => {
    try {
      await deleteAlertMutation.mutateAsync({ cityId, alertId });
    } catch {
      setFormError(t('alerts.deleteError'));
    }
  };

  if (isLoading) {
    return (
      <div className="mt-4 text-center text-sm text-[var(--muted-foreground)]">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <p className="mt-2 text-sm text-[var(--danger-dark)]">
        {t('alerts.loadError')}
      </p>
    );
  }

  return (
    <div className="mt-2">
      <div className="mb-3 flex items-center gap-2">
        <div className="rounded-lg bg-[var(--warning)]/10 p-2 text-[var(--warning-dark)]">
          <Bell size={20} />
        </div>
        <h2 className="text-2xl">{t('alerts.title')}</h2>
      </div>

      {canManageView || canManageAlert ? (
        <div className="mb-3">
          {formError ? (
            <p className="mb-2 rounded-md border border-[var(--danger-light)] bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger-dark)]">
              {formError}
            </p>
          ) : null}

          {canCreateAlert ? (
            <form
              onSubmit={onCreateAlert}
              className="grid gap-2 rounded-xl border border-[var(--warning-dark)]/25 bg-[linear-gradient(180deg,rgba(255,186,8,0.08)_0%,#fff_40%)] p-3 shadow-sm"
            >
              <p className="text-lg font-semibold">{t('alerts.createTitle')}</p>
              <Select
                value={newAlertTypeId || undefined}
                onValueChange={setNewAlertTypeId}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={t('alerts.fields.type')} />
                </SelectTrigger>
                <SelectContent>
                  {(alertTypes ?? []).map((type: AlertType) => (
                    <SelectItem key={type.id} value={type.id}>
                      {translateAlertTypeName(type.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder={t('alerts.fields.title')}
                required
                className="h-10 rounded-md border border-black/15 px-3 text-sm outline-none focus:border-[var(--secondary)] focus:ring-2 focus:ring-[var(--secondary)]/20"
              />
              <Select
                value={newSeverity}
                onValueChange={(value) =>
                  setNewSeverity(value as AlertSeverity)
                }
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALERT_SEVERITY_OPTIONS.map((severity) => (
                    <SelectItem key={severity} value={severity}>
                      {t(`alerts.severity.${severity}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                type="datetime-local"
                value={newExpiresAt}
                onChange={(event) => setNewExpiresAt(event.target.value)}
                className="h-10 rounded-md border border-black/15 px-3 text-sm outline-none focus:border-[var(--secondary)] focus:ring-2 focus:ring-[var(--secondary)]/20"
              />
              <AlertExpiryQuickActions
                value={newExpiresAt}
                onChange={setNewExpiresAt}
                t={t}
              />
              <textarea
                value={newContent}
                onChange={(event) => setNewContent(event.target.value)}
                placeholder={t('alerts.fields.content')}
                required
                rows={4}
                className="rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-[var(--secondary)]"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={createAlertMutation.isPending}
                  className="rounded-md bg-[linear-gradient(90deg,var(--warning-dark)_0%,var(--danger-dark)_100%)] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-105 disabled:opacity-60"
                >
                  {createAlertMutation.isPending
                    ? t('alerts.actions.creating')
                    : t('alerts.actions.create')}
                </button>
              </div>
            </form>
          ) : null}

          <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
            {canManageAlert ? (
              <label className="flex shrink-0 items-center gap-2 text-sm leading-none">
                <Checkbox
                  checked={isCitizenView}
                  onCheckedChange={(checked) =>
                    setPreviewAsCitizen(Boolean(checked))
                  }
                />
                {t('alerts.previewAsCitizen')}
              </label>
            ) : null}
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('alerts.searchPlaceholder')}
              className="h-10 flex-1 rounded-md border border-black/15 px-3 text-sm outline-none focus:border-[var(--secondary)]"
            />
            <Select
              value={severityFilter}
              onValueChange={(value) =>
                setSeverityFilter(
                  value as typeof ALERT_SEVERITY_FILTER_ALL | AlertSeverity,
                )
              }
            >
              <SelectTrigger className="h-10 !w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALERT_SEVERITY_FILTER_ALL}>
                  {t('alerts.filters.allSeverity')}
                </SelectItem>
                {ALERT_SEVERITY_OPTIONS.map((severity) => (
                  <SelectItem key={severity} value={severity}>
                    {t(`alerts.severity.${severity}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {effectiveCanManageAlert ? (
              <>
                <label className="flex shrink-0 items-center gap-2 text-sm leading-none">
                  <Checkbox
                    checked={includeDeleted}
                    onCheckedChange={(checked) =>
                      setIncludeDeleted(Boolean(checked))
                    }
                  />
                  {t('alerts.includeDeleted')}
                </label>
                <label className="flex shrink-0 items-center gap-2 text-sm leading-none">
                  <Checkbox
                    checked={onlyActive}
                    onCheckedChange={(checked) =>
                      setOnlyActive(Boolean(checked))
                    }
                  />
                  {t('alerts.onlyActive')}
                </label>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {visibleAlerts.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          {t('alerts.empty')}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleAlerts.map((alert) => {
            const date = new Date(alert.createdAt);
            const formattedDate = date.toLocaleDateString('uk-UA', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });
            const formattedTime = date.toLocaleTimeString('uk-UA', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <article
                key={alert.id}
                className={`flex h-full flex-col rounded-xl border border-black/10 border-t-4 border-t-[var(--warning)] bg-[linear-gradient(180deg,rgba(255,186,8,0.08)_0%,#fff_38%)] p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(204,149,0,0.2)] ${
                  alert.deletedAt ? 'bg-black/5' : ''
                }`}
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  <h3 className="text-lg font-bold">{alert.title}</h3>
                  {alert.deletedAt ? (
                    <span className="text-xs font-bold text-[var(--muted-foreground)]">
                      {t('alerts.deletedLabel')}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {translateAlertTypeName(alert.alertType.name)}
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {t(`alerts.severity.${alert.severity}`)} ·{' '}
                  {`${t('alerts.expiresAtLabel')}: ${
                    alert.expiresAt
                      ? new Date(alert.expiresAt).toLocaleString('uk-UA')
                      : t('alerts.noExpiry')
                  }`}
                </p>
                <p className="my-2 text-sm">{alert.content}</p>
                <div className="my-1 h-px bg-black/10" />
                <p className="text-xs text-[var(--muted-foreground)]">
                  {formattedDate} · {formattedTime}
                </p>
                {canManageView && !alert.deletedAt ? (
                  <div className="mt-2 flex gap-2">
                    {canUpdateAlert ? (
                      <button
                        type="button"
                        onClick={() =>
                          startEdit({
                            id: alert.id,
                            alertTypeId: alert.alertTypeId,
                            severity: alert.severity,
                            expiresAt: alert.expiresAt,
                            title: alert.title,
                            content: alert.content,
                          })
                        }
                        className="rounded-md border border-[var(--warning-dark)]/40 px-2 py-1 text-xs text-[var(--warning-dark)] hover:bg-[var(--warning)]/10"
                      >
                        {t('alerts.actions.edit')}
                      </button>
                    ) : null}
                    {canDeleteAlert ? (
                      <button
                        type="button"
                        onClick={() => onDeleteAlert(alert.id)}
                        disabled={deleteAlertMutation.isPending}
                        className="rounded-md border border-[var(--danger)] px-2 py-1 text-xs text-[var(--danger)] disabled:opacity-60"
                      >
                        {t('alerts.actions.delete')}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      {editingAlertId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-4 shadow-xl">
            <h3 className="mb-3 text-lg font-semibold">
              {t('alerts.editTitle')}
            </h3>
            <div className="grid gap-2">
              <Select
                value={editingAlertTypeId}
                onValueChange={setEditingAlertTypeId}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(alertTypes ?? []).map((type: AlertType) => (
                    <SelectItem key={type.id} value={type.id}>
                      {translateAlertTypeName(type.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                value={editingTitle}
                onChange={(event) => setEditingTitle(event.target.value)}
                placeholder={t('alerts.fields.title')}
                className="h-10 rounded-md border border-black/15 px-3 text-sm outline-none focus:border-[var(--secondary)]"
              />
              <Select
                value={editingSeverity}
                onValueChange={(value) =>
                  setEditingSeverity(value as AlertSeverity)
                }
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALERT_SEVERITY_OPTIONS.map((severity) => (
                    <SelectItem key={severity} value={severity}>
                      {t(`alerts.severity.${severity}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                type="datetime-local"
                value={editingExpiresAt}
                onChange={(event) => setEditingExpiresAt(event.target.value)}
                className="h-10 rounded-md border border-black/15 px-3 text-sm outline-none focus:border-[var(--secondary)]"
              />
              <AlertExpiryQuickActions
                value={editingExpiresAt}
                onChange={setEditingExpiresAt}
                t={t}
              />
              <textarea
                value={editingContent}
                onChange={(event) => setEditingContent(event.target.value)}
                placeholder={t('alerts.fields.content')}
                rows={4}
                className="rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-[var(--secondary)]"
              />
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingAlertId(null)}
                className="rounded-md px-3 py-2 text-sm"
              >
                {t('alerts.actions.cancel')}
              </button>
              <button
                type="button"
                onClick={onSaveEdit}
                disabled={updateAlertMutation.isPending}
                className="rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {updateAlertMutation.isPending
                  ? t('alerts.actions.saving')
                  : t('alerts.actions.save')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
