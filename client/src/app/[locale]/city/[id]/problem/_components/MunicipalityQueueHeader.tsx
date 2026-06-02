'use client';

import { useTranslations } from 'next-intl';
import {
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
} from './problem-workspace.constants';
import type { CityRequestStatus, Department } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MunicipalityQueueHeaderProps {
  filterStatus: CityRequestStatus | 'ALL';
  filterDepartmentId: string;
  filterPriority: string;
  departments: Department[];
  onFilterStatusChange: (value: CityRequestStatus | 'ALL') => void;
  onFilterDepartmentChange: (value: string) => void;
  onFilterPriorityChange: (value: string) => void;
}

export function MunicipalityQueueHeader(props: MunicipalityQueueHeaderProps) {
  const t = useTranslations();
  const {
    filterStatus,
    filterDepartmentId,
    filterPriority,
    departments,
    onFilterStatusChange,
    onFilterDepartmentChange,
    onFilterPriorityChange,
  } = props;

  return (
    <div className="rounded-lg border border-black/10 bg-white p-3">
      <h3 className="mb-1 text-xl">
        {t('cityProblem.municipality.queueTitle')}
      </h3>
      <p className="text-sm text-[var(--muted-foreground)]">
        {t('cityProblem.municipality.queueHint')}
      </p>

      <div className="mt-2 grid gap-2 md:grid-cols-3">
        <Select
          value={filterStatus}
          onValueChange={(value) =>
            onFilterStatusChange(value as CityRequestStatus | 'ALL')
          }
        >
          <SelectTrigger className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">ALL</SelectItem>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filterDepartmentId}
          onValueChange={onFilterDepartmentChange}
        >
          <SelectTrigger className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">ALL</SelectItem>
            {departments.map((department) => (
              <SelectItem key={department.id} value={department.id}>
                {department.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterPriority} onValueChange={onFilterPriorityChange}>
          <SelectTrigger className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((priority) => (
              <SelectItem key={priority} value={priority}>
                {priority}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
