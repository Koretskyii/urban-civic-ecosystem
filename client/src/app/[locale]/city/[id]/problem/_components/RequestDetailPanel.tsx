'use client';

import { FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import type {
  CityRequestDetail,
  CityRequestMessage,
  CityRequestStatus,
  Department,
  ReportType,
} from '@/types';
import {
  EDITABLE_STATUS_OPTIONS,
  REPORT_TYPE_OPTIONS,
} from './problem-workspace.constants';
import { ProblemLocationPicker } from './Map/ProblemLocationPicker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FilePreviewList } from '@/components/ui/file-preview-list';
import { FileUpload } from '@/components/ui/file-upload';

interface RequestDetailPanelProps {
  cityId: string;
  viewMode: 'citizen' | 'municipality';
  canManageRequests: boolean;
  activeRequestId: string;
  isLoading: boolean;
  detail?: CityRequestDetail;
  messages: CityRequestMessage[];
  messageValue: string;
  onMessageChange: (value: string) => void;
  onSendMessage: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  isSendingMessage: boolean;
  isMessageError: boolean;
  departments: Department[];
  selectedDepartmentId: string;
  onSelectedDepartmentIdChange: (value: string) => void;
  onAssignDepartment: () => Promise<void>;
  isAssigning: boolean;
  nextStatus: CityRequestStatus;
  onNextStatusChange: (value: CityRequestStatus) => void;
  onUpdateStatus: () => Promise<void>;
  isUpdatingStatus: boolean;
  reportType: ReportType;
  onReportTypeChange: (value: ReportType) => void;
  reportText: string;
  onReportTextChange: (value: string) => void;
  reportFiles: File[];
  onReportFilesChange: (files: File[]) => void;
  onCreateReport: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  isCreatingReport: boolean;
  municipalityError: string;
}

// Remove AttachmentLinks since we use FilePreviewList

export function RequestDetailPanel(props: RequestDetailPanelProps) {
  const t = useTranslations();
  const {
    viewMode,
    canManageRequests,
    activeRequestId,
    isLoading,
    detail,
    messages,
    messageValue,
    onMessageChange,
    onSendMessage,
    isSendingMessage,
    isMessageError,
    departments,
    selectedDepartmentId,
    onSelectedDepartmentIdChange,
    onAssignDepartment,
    isAssigning,
    nextStatus,
    onNextStatusChange,
    onUpdateStatus,
    isUpdatingStatus,
    reportType,
    onReportTypeChange,
    reportText,
    onReportTextChange,
    reportFiles,
    onReportFilesChange,
    onCreateReport,
    isCreatingReport,
    municipalityError,
  } = props;

  const isFinalStatus = nextStatus === 'RESOLVED' || nextStatus === 'REJECTED';
  const isReportTextRequired =
    reportType === 'RESOLUTION' || reportType === 'REJECTION';
  const isReportTextEmpty = reportText.trim().length === 0;
  const isResolvedOrRejected =
    detail?.status === 'RESOLVED' || detail?.status === 'REJECTED';
  const assignDisabled =
    isAssigning || !selectedDepartmentId || isResolvedOrRejected;
  const statusUpdateDisabled =
    isUpdatingStatus || isFinalStatus || isResolvedOrRejected;
  const createReportDisabled =
    isCreatingReport || (isReportTextRequired && isReportTextEmpty);

  return (
    <div className="min-h-[420px] flex-[2] rounded-lg border border-black/10 bg-white p-3">
      <h3 className="mb-2 text-xl">{t('cityProblem.detailTitle')}</h3>
      {!activeRequestId ? (
        <p className="text-sm">{t('cityProblem.selectPrompt')}</p>
      ) : isLoading ? (
        <p className="text-sm">{t('cityProblem.loading')}</p>
      ) : detail ? (
        <div className="space-y-3">
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
            {detail.description || t('cityProblem.noDescription')}
          </p>

          <ProblemLocationPicker
            lat={String(detail.locationLat ?? '')}
            lng={String(detail.locationLng ?? '')}
            readOnly
            titleKey="cityProblem.map.previewTitle"
            hintKey="cityProblem.map.previewHint"
          />

          <div className="h-px bg-black/10" />
          <div className="rounded-lg border border-black/10 p-3">
            <p className="mb-1 text-base font-semibold">
              {t('cityProblem.timelineTitle')}
            </p>
            {detail.reports.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                {t('cityProblem.timelineEmpty')}
              </p>
            ) : (
              <div className="space-y-2">
                {detail.reports.map((report) => (
                  <div key={report.id}>
                    <p className="text-sm font-semibold">
                      {report.type}
                      {report.status ? ` - ${report.status}` : ''}
                    </p>
                    <p className="text-sm">
                      {report.description ||
                        t('cityProblem.timelineNoDescription')}
                    </p>
                    {report.attachments.length > 0 ? (
                      <div className="mt-2">
                        <FilePreviewList attachments={report.attachments} />
                      </div>
                    ) : null}
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {report.author.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-black/10 p-3">
            <p className="mb-1 text-base font-semibold">
              {t('cityProblem.attachmentsTitle')}
            </p>
            {detail.attachments.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                {t('cityProblem.attachmentsEmpty')}
              </p>
            ) : (
              <div className="mt-2">
                <FilePreviewList attachments={detail.attachments} />
              </div>
            )}
          </div>

          <div className="h-px bg-black/10" />
          {viewMode === 'municipality' && canManageRequests ? (
            <div className="rounded-lg border border-black/10 p-3">
              <div className="space-y-2">
                <p className="font-semibold">
                  {t('cityProblem.municipality.controlsTitle')}
                </p>
                {municipalityError ? (
                  <p className="rounded-md border border-[var(--warning-dark)] bg-[var(--warning)]/10 px-3 py-2 text-sm text-[var(--warning-dark)]">
                    {municipalityError}
                  </p>
                ) : null}

                <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                  <Select
                    value={selectedDepartmentId || undefined}
                    onValueChange={onSelectedDepartmentIdChange}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue
                        placeholder={t('cityProblem.fields.department')}
                      />
                    </SelectTrigger>
                    <SelectContent>
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
                    {t('cityProblem.actions.assign')}
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
                          {status}
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
                    {t('cityProblem.actions.updateStatus')}
                  </button>
                </div>
                {isFinalStatus ? (
                  <p className="rounded-md border border-[var(--secondary)] bg-[var(--secondary)]/10 px-3 py-2 text-sm text-[var(--secondary-dark)]">
                    {t('cityProblem.errors.useReportForFinalStatus')}
                  </p>
                ) : null}

                <form onSubmit={onCreateReport} className="space-y-2">
                  <Select
                    value={reportType}
                    onValueChange={(value) =>
                      onReportTypeChange(value as ReportType)
                    }
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REPORT_TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
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
                    placeholder={t('cityProblem.fields.reportText')}
                  />
                  {isReportTextRequired ? (
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {t('cityProblem.municipality.reportTextRequiredHint')}
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
                    {t('cityProblem.actions.createReport')}
                  </button>
                </form>
              </div>
            </div>
          ) : null}

          <div className="h-px bg-black/10" />
          <p className="text-base font-semibold">
            {t('cityProblem.chatTitle')}
          </p>
          {isMessageError ? (
            <p className="rounded-md border border-[var(--danger-light)] bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger-dark)]">
              {t('cityProblem.errors.messageFailed')}
            </p>
          ) : null}
          <div className="max-h-[220px] overflow-auto pr-1">
            <div className="space-y-2">
              {messages.map((item) => (
                <div key={item.id}>
                  <p className="text-sm font-semibold">{item.author.name}</p>
                  <p className="text-sm">{item.content}</p>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={onSendMessage} className="flex gap-2">
            <input
              value={messageValue}
              onChange={(event) => onMessageChange(event.target.value)}
              placeholder={t('cityProblem.fields.message')}
              className="h-9 w-full rounded-md border border-black/15 px-3 text-sm outline-none focus:border-[var(--secondary)]"
            />
            <button
              type="submit"
              disabled={isSendingMessage}
              className="rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {t('cityProblem.actions.send')}
            </button>
          </form>
        </div>
      ) : (
        <p className="rounded-md border border-[var(--danger-light)] bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger-dark)]">
          {t('cityProblem.loadError')}
        </p>
      )}
    </div>
  );
}
