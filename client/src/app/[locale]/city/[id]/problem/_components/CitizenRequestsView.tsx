'use client';

import type { ComponentProps, FormEvent } from 'react';
import { CitizenRequestForm } from './CitizenRequestForm';
import { RequestDetailPanel } from './RequestDetailPanel';
import { RequestListPanel } from './RequestListPanel';

interface CitizenRequestsViewProps {
  form: ComponentProps<typeof CitizenRequestForm>;
  listPanel: ComponentProps<typeof RequestListPanel>;
  listKey: string;
  detailPanel: ComponentProps<typeof RequestDetailPanel>;
  onCreateRequest: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}

export function CitizenRequestsView(props: CitizenRequestsViewProps) {
  const { form, listPanel, listKey, detailPanel, onCreateRequest } = props;

  return (
    <>
      <CitizenRequestForm {...form} onSubmit={onCreateRequest} />
      <div className="flex flex-col gap-3 lg:flex-row">
        <RequestListPanel key={listKey} {...listPanel} viewMode="citizen" />
        <RequestDetailPanel {...detailPanel} viewMode="citizen" />
      </div>
    </>
  );
}
