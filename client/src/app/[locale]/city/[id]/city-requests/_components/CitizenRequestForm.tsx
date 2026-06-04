'use client';

import { FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { ProblemLocationPicker } from './Map/ProblemLocationPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/file-upload';

interface CitizenRequestFormProps {
  title: string;
  description: string;
  lat: string;
  lng: string;
  defaultCenter?: { lat: number; lng: number };
  formError: string;
  hasCoordinateError: boolean;
  isSubmitting: boolean;
  isError: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onLatChange: (value: string) => void;
  onLngChange: (value: string) => void;
  files: File[];
  onFilesChange: (files: File[]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}

export function CitizenRequestForm(props: CitizenRequestFormProps) {
  const t = useTranslations();
  const {
    title,
    description,
    lat,
    lng,
    defaultCenter,
    formError,
    hasCoordinateError,
    isSubmitting,
    isError,
    onTitleChange,
    onDescriptionChange,
    onLatChange,
    onLngChange,
    files,
    onFilesChange,
    onSubmit,
  } = props;

  return (
    <div className="rounded-lg border border-black/10 bg-white p-3">
      <h3 className="mb-2 text-xl">{t('cityProblem.createTitle')}</h3>
      <form onSubmit={onSubmit} className="space-y-2">
        {formError ? (
          <p className="rounded-md border border-[var(--warning-dark)] bg-[var(--warning)]/10 px-3 py-2 text-sm text-[var(--warning-dark)]">
            {formError}
          </p>
        ) : null}
        {isError ? (
          <p className="rounded-md border border-[var(--danger-light)] bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger-dark)]">
            {t('cityProblem.errors.createFailed')}
          </p>
        ) : null}
        <Input
          placeholder={t('cityProblem.fields.title')}
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          required
        />
        <Textarea
          placeholder={t('cityProblem.fields.description')}
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          rows={3}
          className="min-h-0"
        />
        <div className="grid gap-2 md:grid-cols-2">
          <Input
            placeholder={t('cityProblem.fields.lat')}
            value={lat}
            onChange={(event) => onLatChange(event.target.value)}
            required
            inputMode="decimal"
            className={
              hasCoordinateError
                ? 'border-[var(--danger-light)] focus:border-[var(--danger-light)] focus:ring-[var(--danger-light)]/20'
                : undefined
            }
          />
          <Input
            placeholder={t('cityProblem.fields.lng')}
            value={lng}
            onChange={(event) => onLngChange(event.target.value)}
            required
            inputMode="decimal"
            className={
              hasCoordinateError
                ? 'border-[var(--danger-light)] focus:border-[var(--danger-light)] focus:ring-[var(--danger-light)]/20'
                : undefined
            }
          />
        </div>
        <ProblemLocationPicker
          lat={lat}
          lng={lng}
          defaultCenter={defaultCenter}
          onLatChange={onLatChange}
          onLngChange={onLngChange}
        />
        <FileUpload
          value={files}
          onChange={onFilesChange}
          maxFiles={5}
          disabled={isSubmitting}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? t('cityProblem.actions.creating')
            : t('cityProblem.actions.create')}
        </Button>
      </form>
    </div>
  );
}
