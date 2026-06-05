'use client';

import type { FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { getCityRequestReportFlowState } from '@/features/city-requests';
import type {
  CityRequestDetail,
  CityRequestMessage,
  CityRequestStatus,
  Department,
  ReportType,
} from '@/types';
import { MunicipalityRequestControls } from './MunicipalityRequestControls/MunicipalityRequestControls';
import { RequestAttachmentsSection } from './RequestAttachmentsSection/RequestAttachmentsSection';
import { RequestChatSection } from './RequestChatSection/RequestChatSection';
import { RequestSummarySection } from './RequestSummarySection/RequestSummarySection';
import { RequestTimelineSection } from './RequestTimelineSection/RequestTimelineSection';

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
  showFullPageAction?: boolean;
}

export function RequestDetailPanel(props: RequestDetailPanelProps) {
  const t = useTranslations();
  const router = useRouter();
  const {
    cityId,
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
    showFullPageAction = false,
  } = props;

  const isFinalStatus = nextStatus === 'RESOLVED' || nextStatus === 'REJECTED';
  const {
    isReportTextRequired,
    isReportTextEmpty,
    isResolvedOrRejected,
    hasFinalReport,
    canCreateProgressReport,
    canCreateFinalReport,
    isProgressReportUnavailable,
    isFinalReportUnavailable,
    hasTooManyReportAttachments,
  } = getCityRequestReportFlowState({
    detail,
    reportType,
    reportText,
    reportFiles,
  });
  const assignDisabled =
    isAssigning || !selectedDepartmentId || isResolvedOrRejected;
  const statusUpdateDisabled =
    isUpdatingStatus || isFinalStatus || isResolvedOrRejected;
  const createReportDisabled =
    isCreatingReport ||
    isResolvedOrRejected ||
    isProgressReportUnavailable ||
    isFinalReportUnavailable ||
    hasTooManyReportAttachments ||
    (isReportTextRequired && isReportTextEmpty);

  return (
    <div
      className={
        viewMode === 'municipality'
          ? 'flex-[2] rounded-lg border border-black/10 bg-white p-3'
          : 'min-h-[420px] flex-[2] rounded-lg border border-black/10 bg-white p-3'
      }
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xl">{t('cityProblem.detailTitle')}</h3>
        {showFullPageAction && activeRequestId ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              router.push(`/city/${cityId}/city-requests/${activeRequestId}`)
            }
            className="gap-2"
          >
            {t('cityProblem.actions.openFullPage')}
            <ArrowRight size={15} className="ml-1" />
          </Button>
        ) : null}
      </div>
      {!activeRequestId ? (
        <p className="text-sm">{t('cityProblem.selectPrompt')}</p>
      ) : isLoading ? (
        <p className="text-sm">{t('cityProblem.loading')}</p>
      ) : detail ? (
        <div className="space-y-3">
          <RequestSummarySection
            detail={detail}
            noDescriptionLabel={t('cityProblem.noDescription')}
          />

          <div className="h-px bg-black/10" />
          <RequestTimelineSection
            reports={detail.reports}
            title={t('cityProblem.timelineTitle')}
            emptyLabel={t('cityProblem.timelineEmpty')}
            noDescriptionLabel={t('cityProblem.timelineNoDescription')}
          />

          <RequestAttachmentsSection
            attachments={detail.attachments}
            title={t('cityProblem.attachmentsTitle')}
            emptyLabel={t('cityProblem.attachmentsEmpty')}
          />

          <div className="h-px bg-black/10" />
          {viewMode === 'municipality' && canManageRequests ? (
            <MunicipalityRequestControls
              title={t('cityProblem.municipality.controlsTitle')}
              error={municipalityError}
              departmentLabel={t('cityProblem.fields.department')}
              assignLabel={t('cityProblem.actions.assign')}
              updateStatusLabel={t('cityProblem.actions.updateStatus')}
              createReportLabel={t('cityProblem.actions.createReport')}
              useReportForFinalStatusLabel={t(
                'cityProblem.errors.useReportForFinalStatus',
              )}
              reportTextLabel={t('cityProblem.fields.reportText')}
              reportTextRequiredHint={t(
                'cityProblem.municipality.reportTextRequiredHint',
              )}
              departments={departments}
              selectedDepartmentId={selectedDepartmentId}
              onSelectedDepartmentIdChange={onSelectedDepartmentIdChange}
              onAssignDepartment={onAssignDepartment}
              assignDisabled={assignDisabled}
              nextStatus={nextStatus}
              onNextStatusChange={onNextStatusChange}
              onUpdateStatus={onUpdateStatus}
              statusUpdateDisabled={statusUpdateDisabled}
              reportType={reportType}
              onReportTypeChange={onReportTypeChange}
              reportText={reportText}
              onReportTextChange={onReportTextChange}
              reportFiles={reportFiles}
              onReportFilesChange={onReportFilesChange}
              onCreateReport={onCreateReport}
              isCreatingReport={isCreatingReport}
              isFinalStatus={isFinalStatus}
              isReportTextRequired={isReportTextRequired}
              isReportTextEmpty={isReportTextEmpty}
              createReportDisabled={createReportDisabled}
              hasFinalReport={hasFinalReport}
              canCreateProgressReport={canCreateProgressReport}
              canCreateFinalReport={canCreateFinalReport}
              translateStatus={(status) => t(`cityProblem.statuses.${status}`)}
              translateReportType={(type) =>
                t(`cityProblem.reportTypes.${type}`)
              }
            />
          ) : null}

          <div className="h-px bg-black/10" />
          <RequestChatSection
            title={t('cityProblem.chatTitle')}
            messages={messages}
            messageValue={messageValue}
            onMessageChange={onMessageChange}
            onSendMessage={onSendMessage}
            isSendingMessage={isSendingMessage}
            isMessageError={isMessageError}
            messageFailedLabel={t('cityProblem.errors.messageFailed')}
            messagePlaceholder={t('cityProblem.fields.message')}
            sendLabel={t('cityProblem.actions.send')}
          />
        </div>
      ) : (
        <p className="rounded-md border border-[var(--danger-light)] bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger-dark)]">
          {t('cityProblem.loadError')}
        </p>
      )}
    </div>
  );
}
