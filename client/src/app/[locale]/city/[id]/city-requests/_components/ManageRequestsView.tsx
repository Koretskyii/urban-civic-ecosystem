'use client';

import type { ComponentProps } from 'react';
import { RequestDetailPanel } from './RequestDetailPanel/RequestDetailPanel';
import { RequestListPanel } from './RequestListPanel';
import { RequestFiltersPanel } from './RequestFiltersPanel';

interface ManageRequestsViewProps {
  filters: ComponentProps<typeof RequestFiltersPanel>;
  listPanel: ComponentProps<typeof RequestListPanel>;
  listKey: string;
  detailPanel: ComponentProps<typeof RequestDetailPanel>;
}

export function ManageRequestsView(props: ManageRequestsViewProps) {
  const { filters, listPanel, listKey, detailPanel } = props;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <RequestFiltersPanel {...filters} />
      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row lg:items-stretch">
        <RequestListPanel
          key={listKey}
          {...listPanel}
          viewMode="municipality"
        />
        <RequestDetailPanel {...detailPanel} viewMode="municipality" />
      </div>
    </div>
  );
}
