'use client';

import type { ComponentProps, FormEvent } from 'react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CitizenRequestForm } from './CitizenRequestForm';
import { RequestFiltersPanel } from './RequestFiltersPanel';
import { RequestDetailPanel } from './RequestDetailPanel/RequestDetailPanel';
import { RequestListPanel } from './RequestListPanel';

interface CitizenRequestsViewProps {
  form: ComponentProps<typeof CitizenRequestForm>;
  filters: ComponentProps<typeof RequestFiltersPanel>;
  listPanel: ComponentProps<typeof RequestListPanel>;
  listKey: string;
  detailPanel: ComponentProps<typeof RequestDetailPanel>;
  onCreateRequest: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}

export function CitizenRequestsView(props: CitizenRequestsViewProps) {
  const { form, filters, listPanel, listKey, detailPanel, onCreateRequest } =
    props;
  const t = useTranslations();
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);

  return (
    <>
      <div className="flex justify-end">
        <Button
          type="button"
          variant={isCreateFormOpen ? 'outline' : 'default'}
          onClick={() => setIsCreateFormOpen((value) => !value)}
          className="gap-2"
        >
          {isCreateFormOpen ? <X size={16} /> : <Plus size={16} />}
          {isCreateFormOpen
            ? t('cityProblem.actions.hideCreateForm')
            : t('cityProblem.actions.newRequest')}
        </Button>
      </div>

      {isCreateFormOpen ? (
        <CitizenRequestForm {...form} onSubmit={onCreateRequest} />
      ) : null}

      <RequestFiltersPanel {...filters} />

      <div className="flex flex-col gap-3 lg:flex-row">
        <RequestListPanel key={listKey} {...listPanel} viewMode="citizen" />
        <RequestDetailPanel {...detailPanel} viewMode="citizen" />
      </div>
    </>
  );
}
