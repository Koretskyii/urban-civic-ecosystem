'use client';

import { PERMISSION_GROUPS } from '@/constants/rbac.const';
import {
  useCityAlertTypes,
  useCreateAlert,
  useDeleteAlert,
  useInfiniteCityAlerts,
  usePermission,
  useRoleUiMode,
  useUpdateAlert,
} from '@/hooks';
import { FormEvent, useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import type { Alert, AlertType, AlertSeverity } from '@/types';
import {
  ALERT_DEFAULT_SEVERITY,
  ALERT_SEVERITY_FILTER_ALL,
  ALERT_SEVERITY_OPTIONS,
  ALERT_TYPE_PLACEHOLDER,
  ALERT_TYPE_TRANSLATION_KEYS,
} from '../alerts.constants';
import {
  sortAlertsByPriority,
  toDateTimeLocalInputValue,
} from '../alerts.utils';
import { Bell } from 'lucide-react';
import { RoleModeSwitcher } from '@/components';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CitizenAlertsView } from './CitizenAlertsView';
import { ManageAlertsView } from './ManageAlertsView';
import AlertExpiryQuickActions from './AlertExpiryQuickActions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AlertsListProps {
  cityId: string;
}

const EMPTY_ALERT_TYPES: AlertType[] = [];

export default function AlertsList(props: AlertsListProps) {
  const t = useTranslations();
  const { cityId } = props;
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [onlyActive, setOnlyActive] = useState(true);
  const [alertTypeId, setAlertTypeId] = useState('ALL');
  const [sortBy, setSortBy] = useState<
    'severity' | 'createdAt' | 'expiresAt' | 'title'
  >('severity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
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

  const { can: canCreateAlert, isLoading: isCreatePermissionLoading } =
    usePermission(PERMISSION_GROUPS.ALERT.CREATE, {
      cityId,
    });
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
  const canUseManageMode =
    canCreateAlert || canUpdateAlert || canDeleteAlert || canManageAlert;
  const { mode: uiMode, setMode: setUiMode } = useRoleUiMode(
    canUseManageMode,
    isCreatePermissionLoading,
  );
  const isManageMode = uiMode === 'manage';
  const effectiveCanManageAlert = canManageAlert && isManageMode;

  const listQuery = useMemo(
    () => ({
      search: search.trim() || undefined,
      includeDeleted: effectiveCanManageAlert ? includeDeleted : false,
      onlyActive: effectiveCanManageAlert ? onlyActive : false,
      severity:
        severityFilter === ALERT_SEVERITY_FILTER_ALL
          ? undefined
          : severityFilter,
      alertTypeId: alertTypeId === 'ALL' ? undefined : alertTypeId,
      sortBy,
      sortOrder,
    }),
    [
      search,
      effectiveCanManageAlert,
      includeDeleted,
      onlyActive,
      severityFilter,
      alertTypeId,
      sortBy,
      sortOrder,
    ],
  );

  const alertsQuery = useInfiniteCityAlerts(cityId, listQuery);
  const fetchNextAlertsPage = alertsQuery.fetchNextPage;
  const alerts = useMemo(
    () => alertsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [alertsQuery.data],
  );
  const { data: alertTypes } = useCityAlertTypes(cityId);
  const safeAlertTypes = alertTypes ?? EMPTY_ALERT_TYPES;
  const createAlertMutation = useCreateAlert();
  const updateAlertMutation = useUpdateAlert();
  const deleteAlertMutation = useDeleteAlert();
  const visibleAlerts = useMemo(() => {
    const filtered = effectiveCanManageAlert
      ? alerts
      : alerts.filter((item: Alert) => !item.deletedAt);
    return sortAlertsByPriority(filtered);
  }, [alerts, effectiveCanManageAlert]);
  const loadMoreAlerts = useCallback(() => {
    void fetchNextAlertsPage();
  }, [fetchNextAlertsPage]);

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

  const openAlertDetail = (alertId: string) => {
    router.push(`/city/${cityId}/alerts/${alertId}`);
  };

  if (alertsQuery.isLoading) {
    return (
      <div className="mt-4 text-center text-sm text-[var(--muted-foreground)]">
        Loading...
      </div>
    );
  }

  if (alertsQuery.error) {
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
      <div className="mb-3">
        <RoleModeSwitcher
          value={uiMode}
          canManage={canUseManageMode}
          isPermissionLoading={isCreatePermissionLoading}
          onChange={setUiMode}
        />
      </div>

      {isManageMode ? (
        <ManageAlertsView
          alerts={visibleAlerts}
          alertTypes={safeAlertTypes}
          search={search}
          includeDeleted={includeDeleted}
          onlyActive={onlyActive}
          alertTypeId={alertTypeId}
          severityFilter={severityFilter}
          sortBy={sortBy}
          sortOrder={sortOrder}
          formError={formError}
          newAlertTypeId={newAlertTypeId}
          newSeverity={newSeverity}
          newExpiresAt={newExpiresAt}
          newTitle={newTitle}
          newContent={newContent}
          canCreateAlert={canCreateAlert}
          canUpdateAlert={canUpdateAlert}
          canDeleteAlert={canDeleteAlert}
          canManageAlert={canManageAlert}
          isCreating={createAlertMutation.isPending}
          isDeleting={deleteAlertMutation.isPending}
          hasNextPage={alertsQuery.hasNextPage}
          isFetchingNextPage={alertsQuery.isFetchingNextPage}
          t={t}
          translateAlertTypeName={translateAlertTypeName}
          onSearchChange={setSearch}
          onIncludeDeletedChange={setIncludeDeleted}
          onOnlyActiveChange={setOnlyActive}
          onAlertTypeIdChange={setAlertTypeId}
          onSeverityFilterChange={setSeverityFilter}
          onSortByChange={setSortBy}
          onSortOrderChange={setSortOrder}
          onNewAlertTypeIdChange={setNewAlertTypeId}
          onNewSeverityChange={setNewSeverity}
          onNewExpiresAtChange={setNewExpiresAt}
          onNewTitleChange={setNewTitle}
          onNewContentChange={setNewContent}
          onCreateAlert={onCreateAlert}
          onOpenAlert={openAlertDetail}
          onStartEdit={startEdit}
          onDeleteAlert={onDeleteAlert}
          onLoadMore={loadMoreAlerts}
        />
      ) : (
        <CitizenAlertsView
          alerts={visibleAlerts}
          search={search}
          severityFilter={severityFilter}
          hasNextPage={alertsQuery.hasNextPage}
          isFetchingNextPage={alertsQuery.isFetchingNextPage}
          t={t}
          translateAlertTypeName={translateAlertTypeName}
          onSearchChange={setSearch}
          onSeverityFilterChange={setSeverityFilter}
          onOpenAlert={openAlertDetail}
          onLoadMore={loadMoreAlerts}
        />
      )}

      <Dialog
        open={Boolean(editingAlertId)}
        onOpenChange={(open) => {
          if (!open) setEditingAlertId(null);
        }}
      >
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{t('alerts.editTitle')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Select
              value={editingAlertTypeId || ALERT_TYPE_PLACEHOLDER}
              onValueChange={(value) => {
                if (value !== ALERT_TYPE_PLACEHOLDER) {
                  setEditingAlertTypeId(value);
                }
              }}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder={t('alerts.fields.type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALERT_TYPE_PLACEHOLDER} disabled>
                  {t('alerts.fields.type')}
                </SelectItem>
                {safeAlertTypes.map((type: AlertType) => (
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
          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
