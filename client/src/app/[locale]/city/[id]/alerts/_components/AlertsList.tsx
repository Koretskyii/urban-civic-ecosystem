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

interface AlertsListProps {
  cityId: string;
}

export default function AlertsList(props: AlertsListProps) {
  const t = useTranslations();
  const { cityId } = props;

  const [search, setSearch] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const [newAlertTypeId, setNewAlertTypeId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const [editingAlertTypeId, setEditingAlertTypeId] = useState('');
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

  const listQuery = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      includeDeleted: canManageAlert ? includeDeleted : false,
    }),
    [debouncedSearch, canManageAlert, includeDeleted],
  );

  const { data: alerts, isLoading, error } = useCityAlerts(cityId, listQuery);

  const { data: alertTypes } = useCityAlertTypes(cityId);

  const createAlertMutation = useCreateAlert();
  const updateAlertMutation = useUpdateAlert();
  const deleteAlertMutation = useDeleteAlert();

  const canManageView = canCreateAlert || canUpdateAlert || canDeleteAlert;

  const visibleAlerts = useMemo(() => {
    if (!alerts) {
      return [];
    }

    if (canManageAlert) {
      return alerts;
    }

    return alerts.filter((item) => !item.deletedAt);
  }, [alerts, canManageAlert]);

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
          title,
          content,
        },
      });

      setNewAlertTypeId('');
      setNewTitle('');
      setNewContent('');
    } catch {
      setFormError(t('alerts.createError'));
    }
  };

  const startEdit = (item: {
    id: string;
    alertTypeId: string;
    title: string;
    content: string;
  }) => {
    setEditingAlertId(item.id);
    setEditingAlertTypeId(item.alertTypeId);
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
          title,
          content,
        },
      });

      setEditingAlertId(null);
      setEditingAlertTypeId('');
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

      {canManageView ? (
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
                      {type.name}
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

            {canManageAlert ? (
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
                      {alert.alertType.name}
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
                  {type.name}
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
