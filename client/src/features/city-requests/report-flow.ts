import type { CityRequestDetail, ReportType } from '@/types';

interface GetCityRequestReportFlowStateParams {
  detail?: CityRequestDetail;
  reportType: ReportType;
  reportText: string;
  reportFiles: File[];
}

export function getCityRequestReportFlowState(
  params: GetCityRequestReportFlowStateParams,
) {
  const { detail, reportType, reportText, reportFiles } = params;
  const isResolvedOrRejected =
    detail?.status === 'RESOLVED' || detail?.status === 'REJECTED';
  const hasFinalReport = Boolean(
    detail?.reports.some(
      (report) => report.type === 'RESOLUTION' || report.type === 'REJECTION',
    ),
  );
  const canCreateProgressReport =
    detail?.status === 'IN_PROGRESS' && !hasFinalReport;
  const canCreateFinalReport = Boolean(
    detail && !hasFinalReport && !isResolvedOrRejected,
  );
  const effectiveReportType =
    reportType === 'PROGRESS' &&
    !canCreateProgressReport &&
    canCreateFinalReport
      ? 'RESOLUTION'
      : reportType;
  const isReportTextRequired =
    effectiveReportType === 'RESOLUTION' || effectiveReportType === 'REJECTION';
  const isReportTextEmpty = reportText.trim().length === 0;
  const isProgressReportUnavailable =
    effectiveReportType === 'PROGRESS' && !canCreateProgressReport;
  const isFinalReportUnavailable =
    (effectiveReportType === 'RESOLUTION' ||
      effectiveReportType === 'REJECTION') &&
    !canCreateFinalReport;

  return {
    effectiveReportType,
    isReportTextRequired,
    isReportTextEmpty,
    isResolvedOrRejected,
    hasFinalReport,
    canCreateProgressReport,
    canCreateFinalReport,
    isProgressReportUnavailable,
    isFinalReportUnavailable,
    hasTooManyReportAttachments: reportFiles.length > 1,
  };
}
