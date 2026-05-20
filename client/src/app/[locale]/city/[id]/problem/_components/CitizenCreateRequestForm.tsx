'use client';

import { FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useTranslations } from 'next-intl';

interface CitizenCreateRequestFormProps {
  title: string;
  description: string;
  lat: string;
  lng: string;
  formError: string;
  isSubmitting: boolean;
  isError: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onLatChange: (value: string) => void;
  onLngChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}

export function CitizenCreateRequestForm(props: CitizenCreateRequestFormProps) {
  const t = useTranslations();
  const {
    title,
    description,
    lat,
    lng,
    formError,
    isSubmitting,
    isError,
    onTitleChange,
    onDescriptionChange,
    onLatChange,
    onLngChange,
    onSubmit,
  } = props;

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        {t('cityProblem.createTitle')}
      </Typography>
      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2}>
          {formError ? <Alert severity="warning">{formError}</Alert> : null}
          {isError ? (
            <Alert severity="error">
              {t('cityProblem.errors.createFailed')}
            </Alert>
          ) : null}
          <TextField
            label={t('cityProblem.fields.title')}
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            required
          />
          <TextField
            label={t('cityProblem.fields.description')}
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            multiline
            minRows={3}
          />
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label={t('cityProblem.fields.lat')}
              value={lat}
              onChange={(event) => onLatChange(event.target.value)}
              required
            />
            <TextField
              label={t('cityProblem.fields.lng')}
              value={lng}
              onChange={(event) => onLngChange(event.target.value)}
              required
            />
          </Stack>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting
              ? t('cityProblem.actions.creating')
              : t('cityProblem.actions.create')}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
