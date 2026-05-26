'use client';

import { PERMISSION_GROUPS } from '@/constants/rbac.const';
import { usePermission } from '@/hooks';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  useCityAlerts,
  useCityAlertTypes,
  useCreateAlert,
  useDeleteAlert,
  useUpdateAlert,
} from '@/hooks/useCities';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import { FormEvent, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { AlertSeverity } from '@/types';
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
    if (!alerts) {
      return [];
    }

    const filtered = effectiveCanManageAlert
      ? alerts
      : alerts.filter((item) => !item.deletedAt);

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
    if (!editingAlertId) {
      return;
    }

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
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" sx={{ mt: 2 }}>
        {t('alerts.loadError')}
      </Typography>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box
          sx={{
            p: 1,
            borderRadius: 2,
            bgcolor: 'rgba(255, 186, 8, 0.1)',
            color: 'warning.dark',
            display: 'flex',
          }}
        >
          <NotificationsActiveRoundedIcon />
        </Box>
        <Typography variant="h3">{t('alerts.title')}</Typography>
      </Box>

      {canManageView || canManageAlert ? (
        <Box sx={{ mb: 3 }}>
          {formError ? <Alert severity="error">{formError}</Alert> : null}
          {createAlertMutation.isError ? (
            <Alert severity="error" sx={{ mt: 1 }}>
              {t('alerts.createError')}
            </Alert>
          ) : null}
          {updateAlertMutation.isError ? (
            <Alert severity="error" sx={{ mt: 1 }}>
              {t('alerts.updateError')}
            </Alert>
          ) : null}
          {deleteAlertMutation.isError ? (
            <Alert severity="error" sx={{ mt: 1 }}>
              {t('alerts.deleteError')}
            </Alert>
          ) : null}

          {canCreateAlert ? (
            <Box
              component="form"
              onSubmit={onCreateAlert}
              sx={{
                display: 'grid',
                gap: 1.5,
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <Typography variant="h5">{t('alerts.createTitle')}</Typography>

              <FormControl fullWidth required>
                <InputLabel id="alert-type-label">
                  {t('alerts.fields.type')}
                </InputLabel>
                <Select
                  labelId="alert-type-label"
                  value={newAlertTypeId}
                  label={t('alerts.fields.type')}
                  onChange={(event: SelectChangeEvent) =>
                    setNewAlertTypeId(event.target.value)
                  }
                >
                  {(alertTypes ?? []).map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {translateAlertTypeName(type.name)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label={t('alerts.fields.title')}
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                required
              />

              <FormControl fullWidth required>
                <InputLabel id="alert-severity-label">
                  {t('alerts.fields.severity')}
                </InputLabel>
                <Select
                  labelId="alert-severity-label"
                  value={newSeverity}
                  label={t('alerts.fields.severity')}
                  onChange={(event: SelectChangeEvent) =>
                    setNewSeverity(event.target.value as AlertSeverity)
                  }
                >
                  {ALERT_SEVERITY_OPTIONS.map((severity) => (
                    <MenuItem key={severity} value={severity}>
                      {t(`alerts.severity.${severity}`)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label={t('alerts.fields.expiresAt')}
                type="datetime-local"
                value={newExpiresAt}
                onChange={(event) => setNewExpiresAt(event.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              <AlertExpiryQuickActions
                value={newExpiresAt}
                onChange={setNewExpiresAt}
                t={t}
              />

              <TextField
                label={t('alerts.fields.content')}
                value={newContent}
                onChange={(event) => setNewContent(event.target.value)}
                multiline
                minRows={4}
                required
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={createAlertMutation.isPending}
                >
                  {createAlertMutation.isPending
                    ? t('alerts.actions.creating')
                    : t('alerts.actions.create')}
                </Button>
              </Box>
            </Box>
          ) : null}

          <Box
            sx={{
              mt: 2,
              display: 'flex',
              gap: 1.5,
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'stretch', md: 'center' },
            }}
          >
            {canManageAlert ? (
              <FormControlLabel
                control={
                  <Switch
                    checked={isCitizenView}
                    onChange={(event) =>
                      setPreviewAsCitizen(event.target.checked)
                    }
                  />
                }
                label={t('alerts.previewAsCitizen')}
              />
            ) : null}

            <TextField
              label={t('alerts.searchLabel')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                }
              }}
              placeholder={t('alerts.searchPlaceholder')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1 }}
            />

            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel id="severity-filter-label">
                {t('alerts.fields.severity')}
              </InputLabel>
              <Select
                labelId="severity-filter-label"
                value={severityFilter}
                label={t('alerts.fields.severity')}
                onChange={(event: SelectChangeEvent) =>
                  setSeverityFilter(
                    event.target.value as
                      | typeof ALERT_SEVERITY_FILTER_ALL
                      | AlertSeverity,
                  )
                }
              >
                <MenuItem value={ALERT_SEVERITY_FILTER_ALL}>
                  {t('alerts.filters.allSeverity')}
                </MenuItem>
                {ALERT_SEVERITY_OPTIONS.map((severity) => (
                  <MenuItem key={severity} value={severity}>
                    {t(`alerts.severity.${severity}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {effectiveCanManageAlert ? (
              <>
                <FormControlLabel
                  control={
                    <Switch
                      checked={includeDeleted}
                      onChange={(event) =>
                        setIncludeDeleted(event.target.checked)
                      }
                    />
                  }
                  label={t('alerts.includeDeleted')}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={onlyActive}
                      onChange={(event) => setOnlyActive(event.target.checked)}
                    />
                  }
                  label={t('alerts.onlyActive')}
                />
              </>
            ) : null}
          </Box>
        </Box>
      ) : null}

      {visibleAlerts.length === 0 ? (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          {t('alerts.empty')}
        </Typography>
      ) : (
        <Grid container spacing={3}>
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
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={alert.id}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderTop: '4px solid',
                    borderTopColor: 'warning.main',
                    borderRadius: 3,
                    bgcolor: alert.deletedAt
                      ? 'rgba(158, 158, 158, 0.08)'
                      : 'transparent',
                  }}
                >
                  <CardContent sx={{ display: 'grid', gap: 1.2, flex: 1 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 1,
                      }}
                    >
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {alert.title}
                      </Typography>
                      {alert.deletedAt ? (
                        <Typography
                          variant="caption"
                          sx={{ color: 'text.secondary', fontWeight: 700 }}
                        >
                          {t('alerts.deletedLabel')}
                        </Typography>
                      ) : null}
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                      {translateAlertTypeName(alert.alertType.name)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t(`alerts.severity.${alert.severity}`)} ·{' '}
                      {`${t('alerts.expiresAtLabel')}: ${
                        alert.expiresAt
                          ? new Date(alert.expiresAt).toLocaleString('uk-UA')
                          : t('alerts.noExpiry')
                      }`}
                    </Typography>

                    <Typography variant="body1">{alert.content}</Typography>

                    <Divider />

                    <Typography variant="caption" color="text.secondary">
                      {formattedDate} · {formattedTime}
                    </Typography>

                    {canManageView && !alert.deletedAt ? (
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        {canUpdateAlert ? (
                          <Button
                            size="small"
                            startIcon={<EditRoundedIcon fontSize="small" />}
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
                          >
                            {t('alerts.actions.edit')}
                          </Button>
                        ) : null}

                        {canDeleteAlert ? (
                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteRoundedIcon fontSize="small" />}
                            onClick={() => onDeleteAlert(alert.id)}
                            disabled={deleteAlertMutation.isPending}
                          >
                            {t('alerts.actions.delete')}
                          </Button>
                        ) : null}
                      </Box>
                    ) : null}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Dialog
        open={Boolean(editingAlertId)}
        onClose={() => setEditingAlertId(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{t('alerts.editTitle')}</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 1.5, pt: 2 }}>
          <FormControl fullWidth required>
            <InputLabel id="edit-alert-type-label">
              {t('alerts.fields.type')}
            </InputLabel>
            <Select
              labelId="edit-alert-type-label"
              value={editingAlertTypeId}
              label={t('alerts.fields.type')}
              onChange={(event: SelectChangeEvent) =>
                setEditingAlertTypeId(event.target.value)
              }
            >
              {(alertTypes ?? []).map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  {translateAlertTypeName(type.name)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label={t('alerts.fields.title')}
            value={editingTitle}
            onChange={(event) => setEditingTitle(event.target.value)}
            fullWidth
          />

          <FormControl fullWidth required>
            <InputLabel id="edit-alert-severity-label">
              {t('alerts.fields.severity')}
            </InputLabel>
            <Select
              labelId="edit-alert-severity-label"
              value={editingSeverity}
              label={t('alerts.fields.severity')}
              onChange={(event: SelectChangeEvent) =>
                setEditingSeverity(event.target.value as AlertSeverity)
              }
            >
              {ALERT_SEVERITY_OPTIONS.map((severity) => (
                <MenuItem key={severity} value={severity}>
                  {t(`alerts.severity.${severity}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label={t('alerts.fields.expiresAt')}
            type="datetime-local"
            value={editingExpiresAt}
            onChange={(event) => setEditingExpiresAt(event.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          <AlertExpiryQuickActions
            value={editingExpiresAt}
            onChange={setEditingExpiresAt}
            t={t}
          />

          <TextField
            label={t('alerts.fields.content')}
            value={editingContent}
            onChange={(event) => setEditingContent(event.target.value)}
            multiline
            minRows={4}
            fullWidth
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setEditingAlertId(null)}>
            {t('alerts.actions.cancel')}
          </Button>
          <Button
            onClick={onSaveEdit}
            variant="contained"
            disabled={updateAlertMutation.isPending}
          >
            {updateAlertMutation.isPending
              ? t('alerts.actions.saving')
              : t('alerts.actions.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
