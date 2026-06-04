'use client';

import { ProblemLocationPicker } from '../../Map/ProblemLocationPicker';
import type { CityRequestDetail } from '@/types';

interface RequestSummarySectionProps {
  detail: CityRequestDetail;
  noDescriptionLabel: string;
}

export function RequestSummarySection(props: RequestSummarySectionProps) {
  const { detail, noDescriptionLabel } = props;

  return (
    <>
      <h4 className="text-lg font-semibold">{detail.title}</h4>
      <div className="flex gap-1">
        <span className="rounded-full bg-[var(--primary)] px-2 py-0.5 text-xs text-white">
          {detail.status}
        </span>
        {detail.assignedDepartment?.name ? (
          <span className="rounded-full bg-[var(--secondary)] px-2 py-0.5 text-xs text-white">
            {detail.assignedDepartment.name}
          </span>
        ) : null}
      </div>
      <p className="text-sm text-[var(--muted-foreground)]">
        {detail.description || noDescriptionLabel}
      </p>

      <ProblemLocationPicker
        lat={String(detail.locationLat ?? '')}
        lng={String(detail.locationLng ?? '')}
        readOnly
        titleKey="cityProblem.map.previewTitle"
        hintKey="cityProblem.map.previewHint"
      />
    </>
  );
}
