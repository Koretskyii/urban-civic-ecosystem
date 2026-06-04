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
  search: string;
  sortBy: 'createdAt' | 'updatedAt' | 'priority' | 'status';
  sortOrder: 'asc' | 'desc';
  departments: Department[];
  isDepartmentsLoading: boolean;
  onFilterStatusChange: (value: CityRequestStatus | 'ALL') => void;
  onFilterDepartmentChange: (value: string) => void;
  onFilterPriorityChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onSortByChange: (
    value: 'createdAt' | 'updatedAt' | 'priority' | 'status',
  ) => void;
  onSortOrderChange: (value: 'asc' | 'desc') => void;
}

export function MunicipalityQueueHeader(props: MunicipalityQueueHeaderProps) {
  const t = useTranslations();
  const {
    filterStatus,
    filterDepartmentId,
    filterPriority,
    search,
    sortBy,
    sortOrder,
    departments,
    isDepartmentsLoading,
    onFilterStatusChange,
    onFilterDepartmentChange,
    onFilterPriorityChange,
    onSearchChange,
    onSortByChange,
    onSortOrderChange,
  } = props;

  return (
    <div className="rounded-lg border border-black/10 bg-white p-3">
      <h3 className="mb-1 text-xl">
        {t('cityProblem.municipality.queueTitle')}
      </h3>
      <p className="text-sm text-[var(--muted-foreground)]">
        {t('cityProblem.municipality.queueHint')}
      </p>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <label className="space-y-1">
          <span className="text-xs font-semibold text-[var(--muted-foreground)]">
            {t('cityProblem.municipality.searchPlaceholder')}
          </span>
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t('cityProblem.municipality.searchPlaceholder')}
            className="h-10 w-full rounded-md border border-black/15 px-3 text-sm outline-none focus:border-[var(--secondary)]"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold text-[var(--muted-foreground)]">
            {t('cityProblem.fields.status')}
          </span>
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
              <SelectItem value="ALL">
                {t('cityProblem.municipality.filters.allStatuses')}
              </SelectItem>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`cityProblem.statuses.${status}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold text-[var(--muted-foreground)]">
            {t('cityProblem.fields.department')}
          </span>
          <Select
            value={filterDepartmentId}
            onValueChange={onFilterDepartmentChange}
          >
            <SelectTrigger className="h-10">
              <SelectValue
                placeholder={t(
                  'cityProblem.municipality.filters.allDepartments',
                )}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">
                {t('cityProblem.municipality.filters.allDepartments')}
              </SelectItem>
              {isDepartmentsLoading ? (
                <SelectItem value="__departments_loading__" disabled>
                  {t('cityProblem.loading')}
                </SelectItem>
              ) : departments.length === 0 ? (
                <SelectItem value="__departments_empty__" disabled>
                  {t('cityProblem.municipality.filters.noDepartments')}
                </SelectItem>
              ) : (
                departments.map((department) => (
                  <SelectItem key={department.id} value={department.id}>
                    {department.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold text-[var(--muted-foreground)]">
            {t('cityProblem.municipality.table.priority')}
          </span>
          <Select value={filterPriority} onValueChange={onFilterPriorityChange}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority === 'ALL'
                    ? t('cityProblem.municipality.filters.allPriorities')
                    : `P${priority}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold text-[var(--muted-foreground)]">
            {t('cityProblem.municipality.sortBy')}
          </span>
          <Select
            value={sortBy}
            onValueChange={(value) =>
              onSortByChange(
                value as 'createdAt' | 'updatedAt' | 'priority' | 'status',
              )
            }
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">
                {t('cityProblem.municipality.sortFields.createdAt')}
              </SelectItem>
              <SelectItem value="updatedAt">
                {t('cityProblem.municipality.sortFields.updatedAt')}
              </SelectItem>
              <SelectItem value="priority">
                {t('cityProblem.municipality.sortFields.priority')}
              </SelectItem>
              <SelectItem value="status">
                {t('cityProblem.municipality.sortFields.status')}
              </SelectItem>
            </SelectContent>
          </Select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold text-[var(--muted-foreground)]">
            {t('cityProblem.municipality.sortOrder')}
          </span>
          <Select
            value={sortOrder}
            onValueChange={(value) =>
              onSortOrderChange(value as 'asc' | 'desc')
            }
          >
            <SelectTrigger className="h-10 whitespace-nowrap">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">
                {t('common.sortDirections.desc')}
              </SelectItem>
              <SelectItem value="asc">
                {t('common.sortDirections.asc')}
              </SelectItem>
            </SelectContent>
          </Select>
        </label>
      </div>
    </div>
  );
}
