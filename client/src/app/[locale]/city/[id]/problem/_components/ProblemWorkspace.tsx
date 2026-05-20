'use client';

import { FormEvent, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import {
  useCityRequestDetail,
  useCityRequestMessages,
  useCityRequestRealtime,
  useCityRequestsList,
  useCreateCityRequest,
  useCreateCityRequestMessage,
} from '@/hooks';

interface ProblemWorkspaceProps {
  cityId: string;
}

export default function ProblemWorkspace({ cityId }: ProblemWorkspaceProps) {
  const t = useTranslations();

  const [selectedRequestId, setSelectedRequestId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState<string>('');

  const requestsQuery = useCityRequestsList(cityId, { scope: 'all' });
  const requests = useMemo(
    () => requestsQuery.data ?? [],
    [requestsQuery.data],
  );

  const activeRequestId = selectedRequestId || requests[0]?.id || '';

  const detailQuery = useCityRequestDetail(cityId, activeRequestId);
  const messagesQuery = useCityRequestMessages(cityId, activeRequestId);

  useCityRequestRealtime({
    cityId,
    requestId: activeRequestId,
    enabled: Boolean(activeRequestId),
  });

  const createRequestMutation = useCreateCityRequest();
  const createMessageMutation = useCreateCityRequestMessage();

  const onCreateRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    if (!title.trim() || !lat.trim() || !lng.trim()) {
      setFormError(t('cityProblem.errors.required'));
      return;
    }

    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
      setFormError(t('cityProblem.errors.coordinatesInvalid'));
      return;
    }

    await createRequestMutation.mutateAsync({
      cityId,
      payload: {
        title: title.trim(),
        description: description.trim() || undefined,
        locationLat: parsedLat,
        locationLng: parsedLng,
      },
    });

    setTitle('');
    setDescription('');
    setLat('');
    setLng('');
  };

  const onSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!activeRequestId || !message.trim()) {
      return;
    }

    await createMessageMutation.mutateAsync({
      cityId,
      requestId: activeRequestId,
      content: message.trim(),
    });

    setMessage('');
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h2">{t('cityProblem.title')}</Typography>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          {t('cityProblem.createTitle')}
        </Typography>
        <Box component="form" onSubmit={onCreateRequest}>
          <Stack spacing={2}>
            {formError ? <Alert severity="warning">{formError}</Alert> : null}
            {createRequestMutation.isError ? (
              <Alert severity="error">
                {t('cityProblem.errors.createFailed')}
              </Alert>
            ) : null}
            <TextField
              label={t('cityProblem.fields.title')}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
            <TextField
              label={t('cityProblem.fields.description')}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              multiline
              minRows={3}
            />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label={t('cityProblem.fields.lat')}
                value={lat}
                onChange={(event) => setLat(event.target.value)}
                required
              />
              <TextField
                label={t('cityProblem.fields.lng')}
                value={lng}
                onChange={(event) => setLng(event.target.value)}
                required
              />
            </Stack>
            <Button
              type="submit"
              variant="contained"
              disabled={createRequestMutation.isPending}
            >
              {createRequestMutation.isPending
                ? t('cityProblem.actions.creating')
                : t('cityProblem.actions.create')}
            </Button>
          </Stack>
        </Box>
      </Paper>

      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={3}
        alignItems="stretch"
      >
        <Paper sx={{ p: 2, flex: 1, minHeight: 420 }}>
          <Typography variant="h4" sx={{ mb: 2 }}>
            {t('cityProblem.listTitle')}
          </Typography>

          {requestsQuery.isLoading ? (
            <Typography>{t('cityProblem.loading')}</Typography>
          ) : requests.length === 0 ? (
            <Typography>{t('cityProblem.empty')}</Typography>
          ) : (
            <List>
              {requests.map((request) => (
                <ListItemButton
                  key={request.id}
                  selected={request.id === activeRequestId}
                  onClick={() => setSelectedRequestId(request.id)}
                >
                  <ListItemText
                    primary={request.title}
                    secondary={`${request.user.name} - ${request.status}`}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </Paper>

        <Paper sx={{ p: 2, flex: 2, minHeight: 420 }}>
          <Typography variant="h4" sx={{ mb: 2 }}>
            {t('cityProblem.detailTitle')}
          </Typography>

          {!activeRequestId ? (
            <Typography>{t('cityProblem.selectPrompt')}</Typography>
          ) : detailQuery.isLoading ? (
            <Typography>{t('cityProblem.loading')}</Typography>
          ) : detailQuery.data ? (
            <Stack spacing={2}>
              <Typography variant="h5">{detailQuery.data.title}</Typography>
              <Stack direction="row" spacing={1}>
                <Chip
                  label={detailQuery.data.status}
                  color="primary"
                  size="small"
                />
                {detailQuery.data.assignedDepartment?.name ? (
                  <Chip
                    label={detailQuery.data.assignedDepartment.name}
                    size="small"
                    color="secondary"
                  />
                ) : null}
              </Stack>
              <Typography color="text.secondary">
                {detailQuery.data.description || t('cityProblem.noDescription')}
              </Typography>

              <Divider />

              <Typography variant="h6">{t('cityProblem.chatTitle')}</Typography>
              {createMessageMutation.isError ? (
                <Alert severity="error">
                  {t('cityProblem.errors.messageFailed')}
                </Alert>
              ) : null}

              <Box sx={{ maxHeight: 220, overflow: 'auto', pr: 1 }}>
                <Stack spacing={1.5}>
                  {(
                    messagesQuery.data ??
                    detailQuery.data.chat?.messages ??
                    []
                  ).map((item) => (
                    <Box key={item.id}>
                      <Typography variant="subtitle2">
                        {item.author.name}
                      </Typography>
                      <Typography variant="body2">{item.content}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>

              <Box component="form" onSubmit={onSendMessage}>
                <Stack direction="row" spacing={1}>
                  <TextField
                    fullWidth
                    size="small"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder={t('cityProblem.fields.message')}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={createMessageMutation.isPending}
                  >
                    {t('cityProblem.actions.send')}
                  </Button>
                </Stack>
              </Box>
            </Stack>
          ) : (
            <Alert severity="error">{t('cityProblem.loadError')}</Alert>
          )}
        </Paper>
      </Stack>
    </Stack>
  );
}
