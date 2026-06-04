'use client';

import type { ComponentProps, FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { DebouncedSearchInput } from '@/components';
import { CitizenRequestForm } from './CitizenRequestForm';
import { RequestDetailPanel } from './RequestDetailPanel/RequestDetailPanel';
import { RequestListPanel } from './RequestListPanel';

interface CitizenRequestsViewProps {
  form: ComponentProps<typeof CitizenRequestForm>;
  listPanel: ComponentProps<typeof RequestListPanel>;
  listKey: string;
  detailPanel: ComponentProps<typeof RequestDetailPanel>;
  search: string;
  onSearchChange: (value: string) => void;
  onCreateRequest: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}

export function CitizenRequestsView(props: CitizenRequestsViewProps) {
  const {
    form,
    listPanel,
    listKey,
    detailPanel,
    search,
    onSearchChange,
    onCreateRequest,
  } = props;
  const t = useTranslations();

  return (
    <>
      <CitizenRequestForm {...form} onSubmit={onCreateRequest} />
      <div className="rounded-lg border border-black/10 bg-white p-3">
        <label className="space-y-1">
          <span className="text-xs font-semibold text-[var(--muted-foreground)]">
            {t('cityProblem.municipality.searchPlaceholder')}
          </span>
          <DebouncedSearchInput
            value={search}
            onValueChange={onSearchChange}
            placeholder={t('cityProblem.municipality.searchPlaceholder')}
            className="h-10 w-full rounded-md border border-black/15 px-3 text-sm outline-none focus:border-[var(--secondary)]"
          />
        </label>
      </div>
      <div className="flex flex-col gap-3 lg:flex-row">
        <RequestListPanel key={listKey} {...listPanel} viewMode="citizen" />
        <RequestDetailPanel {...detailPanel} viewMode="citizen" />
      </div>
    </>
  );
}
