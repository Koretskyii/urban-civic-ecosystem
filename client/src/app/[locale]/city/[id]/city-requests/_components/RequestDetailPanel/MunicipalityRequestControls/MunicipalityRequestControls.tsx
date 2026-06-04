'use client';

import type { FormEvent } from 'react';
import type { CityRequestStatus, Department, ReportType } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileUpload } from '@/components/ui/file-upload';
import {
  EDITABLE_STATUS_OPTIONS,
  REPORT_TYPE_OPTIONS,
} from '../../problem-workspace.constants';

interface MunicipalityRequestControlsProps {
  title: string;
  error: string;
  departmentLabel: string;
  assignLabel: string;
  updateStatusLabel: string;
  createReportLabel: string;
  useReportForFinalStatusLabel: string;
  reportTextLabel: string;
  reportTextRequiredHint: string;
  departments: Department[];
  selectedDepartmentId: string;
  onSelectedDepartmentIdChange: (value: string) => void;
  onAssignDepartment: () => Promise<void>;
  assignDisabled: boolean;
  nextStatus: CityRequestStatus;
  onNextStatusChange: (value: CityRequestStatus) => void;
  onUpdateStatus: () => Promise<void>;
  statusUpdateDisabled: boolean;
  reportType: ReportType;
  onReportTypeChange: (value: ReportType) => void;
  reportText: string;
  onReportTextChange: (value: string) => void;
  reportFiles: File[];
  onReportFilesChange: (files: File[]) => void;
  onCreateReport: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  isCreatingReport: boolean;
  isFinalStatus: boolean;
  isReportTextRequired: boolean;
  isReportTextEmpty: boolean;
  createReportDisabled: boolean;
  translateStatus: (status: CityRequestStatus) => string;
  translateReportType: (type: ReportType) => string;
}

const DEPARTMENT_PLACEHOLDER = '__department_placeholder__';

export function MunicipalityRequestControls(
  props: MunicipalityRequestControlsProps,
) {
  const {
    title,
    error,
    departmentLabel,
    assignLabel,
    updateStatusLabel,
    createReportLabel,
    useReportForFinalStatusLabel,
    reportTextLabel,
    reportTextRequiredHint,
    departments,
    selectedDepartmentId,
    onSelectedDepartmentIdChange,
    onAssignDepartment,
    assignDisabled,
    nextStatus,
    onNextStatusChange,
    onUpdateStatus,
    statusUpdateDisabled,
    reportType,
    onReportTypeChange,
    reportText,
    onReportTextChange,
    reportFiles,
    onReportFilesChange,
    onCreateReport,
    isCreatingReport,
    isFinalStatus,
    isReportTextRequired,
    isReportTextEmpty,
    createReportDisabled,
    translateStatus,
    translateReportType,
  } = props;

  return (
    <div className="rounded-lg border border-black/10 p-3">
      <div className="space-y-2">
        <p className="font-semibold">{title}</p>
        {error ? (
          <p className="rounded-md border border-[var(--warning-dark)] bg-[var(--warning)]/10 px-3 py-2 text-sm text-[var(--warning-dark)]">
            {error}
          </p>
        ) : null}

        <div className="grid gap-2 md:grid-cols-[1fr_auto]">
          <Select
            value={selectedDepartmentId || DEPARTMENT_PLACEHOLDER}
            onValueChange={(value) => {
              if (value !== DEPARTMENT_PLACEHOLDER) {
                onSelectedDepartmentIdChange(value);
              }
            }}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder={departmentLabel} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DEPARTMENT_PLACEHOLDER} disabled>
                {departmentLabel}
              </SelectItem>
              {departments.map((department) => (
                <SelectItem key={department.id} value={department.id}>
                  {department.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            type="button"
            onClick={onAssignDepartment}
            disabled={assignDisabled}
            className="h-10 rounded-md border border-black/15 px-3 text-sm disabled:opacity-60"
          >
            {assignLabel}
          </button>
        </div>

        <div className="grid gap-2 md:grid-cols-[1fr_auto]">
          <Select
            value={nextStatus}
            onValueChange={(value) =>
              onNextStatusChange(value as CityRequestStatus)
            }
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EDITABLE_STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {translateStatus(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            type="button"
            onClick={onUpdateStatus}
            disabled={statusUpdateDisabled}
            className="h-10 rounded-md border border-black/15 px-3 text-sm disabled:opacity-60"
          >
            {updateStatusLabel}
          </button>
        </div>
        {isFinalStatus ? (
          <p className="rounded-md border border-[var(--secondary)] bg-[var(--secondary)]/10 px-3 py-2 text-sm text-[var(--secondary-dark)]">
            {useReportForFinalStatusLabel}
          </p>
        ) : null}

        <form onSubmit={onCreateReport} className="space-y-2">
          <Select
            value={reportType}
            onValueChange={(value) => onReportTypeChange(value as ReportType)}
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REPORT_TYPE_OPTIONS.map((type) => (
                <SelectItem key={type} value={type}>
                  {translateReportType(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <textarea
            value={reportText}
            onChange={(event) => onReportTextChange(event.target.value)}
            rows={3}
            required={isReportTextRequired}
            className={`w-full rounded-md border px-3 py-2 text-sm outline-none ${
              isReportTextRequired && isReportTextEmpty
                ? 'border-[var(--danger-light)]'
                : 'border-black/15 focus:border-[var(--secondary)]'
            }`}
            placeholder={reportTextLabel}
          />
          {isReportTextRequired ? (
            <p className="text-xs text-[var(--muted-foreground)]">
              {reportTextRequiredHint}
            </p>
          ) : null}
          <FileUpload
            value={reportFiles}
            onChange={onReportFilesChange}
            maxFiles={5}
            disabled={isCreatingReport}
          />
          <button
            type="submit"
            disabled={createReportDisabled}
            className="rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {createReportLabel}
          </button>
        </form>
      </div>
    </div>
  );
}
