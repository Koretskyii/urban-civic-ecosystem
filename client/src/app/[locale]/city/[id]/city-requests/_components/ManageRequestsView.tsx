'use client';

import type { ComponentProps } from 'react';
import { MunicipalityQueueHeader } from './MunicipalityQueueHeader';
import { RequestDetailPanel } from './RequestDetailPanel/RequestDetailPanel';
import { RequestListPanel } from './RequestListPanel';

interface ManageRequestsViewProps {
  header: ComponentProps<typeof MunicipalityQueueHeader>;
  listPanel: ComponentProps<typeof RequestListPanel>;
  listKey: string;
  detailPanel: ComponentProps<typeof RequestDetailPanel>;
}

export function ManageRequestsView(props: ManageRequestsViewProps) {
  const { header, listPanel, listKey, detailPanel } = props;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <MunicipalityQueueHeader {...header} />
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
