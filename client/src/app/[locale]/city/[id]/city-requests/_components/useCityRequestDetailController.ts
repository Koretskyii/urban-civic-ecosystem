'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import {
  useAssignCityRequestDepartment,
  useCityDepartments,
  useCityRequestDetail,
  useCityRequestMessages,
  useCityRequestRealtime,
  useCreateCityRequestMessage,
  useCreateCityRequestReport,
  useUpdateCityRequestStatus,
} from '@/hooks';
import { getCityRequestReportFlowState } from '@/features/city-requests';
import { isForbiddenError } from '@/features/city-requests/helpers/errors.helpers';
import type {
  CityRequestMessage,
  CityRequestStatus,
  Department,
  ReportType,
} from '@/types';

const EMPTY_MESSAGES: CityRequestMessage[] = [];
const EMPTY_DEPARTMENTS: Department[] = [];

interface UseCityRequestDetailControllerParams {
  cityId: string;
  requestId: string;
  canManageRequests: boolean;
  viewMode: 'citizen' | 'municipality';
}

export function useCityRequestDetailController(
  params: UseCityRequestDetailControllerParams,
) {
  const { cityId, requestId, canManageRequests, viewMode } = params;
  const t = useTranslations();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [nextStatus, setNextStatus] = useState<CityRequestStatus>('OPEN');
  const [reportType, setReportType] = useState<ReportType>('PROGRESS');
  const [reportText, setReportText] = useState('');
  const [reportFiles, setReportFiles] = useState<File[]>([]);
  const [municipalityError, setMunicipalityError] = useState('');

  const detailQuery = useCityRequestDetail(cityId, requestId);
  const messagesQuery = useCityRequestMessages(cityId, requestId);
  const departmentsQuery = useCityDepartments(cityId);

  useCityRequestRealtime({
    cityId,
    requestId,
    enabled: Boolean(requestId),
  });

  const createMessageMutation = useCreateCityRequestMessage();
  const assignDepartmentMutation = useAssignCityRequestDepartment();
  const updateStatusMutation = useUpdateCityRequestStatus();
  const createReportMutation = useCreateCityRequestReport();

  const resetControls = useCallback(() => {
    setSelectedDepartmentId('');
    setNextStatus('OPEN');
    setReportType('PROGRESS');
    setReportText('');
    setReportFiles([]);
    setMunicipalityError('');
  }, []);

  useEffect(() => {
    if (
      isForbiddenError(detailQuery.error) ||
      isForbiddenError(messagesQuery.error) ||
      isForbiddenError(departmentsQuery.error)
    ) {
      router.replace('/forbidden');
    }
  }, [departmentsQuery.error, detailQuery.error, messagesQuery.error, router]);

  const detail = detailQuery.data;
  const messages =
    messagesQuery.data ?? detailQuery.data?.chat?.messages ?? EMPTY_MESSAGES;
  const departments = departmentsQuery.data ?? EMPTY_DEPARTMENTS;

  const reportFlow = getCityRequestReportFlowState({
    detail,
    reportType,
    reportText,
    reportFiles,
  });
  const {
    effectiveReportType,
    isReportTextRequired,
    isReportTextEmpty,
    isResolvedOrRejected,
    hasFinalReport,
    canCreateProgressReport,
    canCreateFinalReport,
    isProgressReportUnavailable,
    isFinalReportUnavailable,
    hasTooManyReportAttachments,
  } = reportFlow;
  const isFinalStatus = nextStatus === 'RESOLVED' || nextStatus === 'REJECTED';
  const assignDisabled =
    assignDepartmentMutation.isPending ||
    !selectedDepartmentId ||
    isResolvedOrRejected;
  const statusUpdateDisabled =
    updateStatusMutation.isPending || isFinalStatus || isResolvedOrRejected;
  const createReportDisabled =
    createReportMutation.isPending ||
    isResolvedOrRejected ||
    isProgressReportUnavailable ||
    isFinalReportUnavailable ||
    hasTooManyReportAttachments ||
    (isReportTextRequired && isReportTextEmpty);

  const onSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!requestId || !message.trim()) return;
    try {
      await createMessageMutation.mutateAsync({
        cityId,
        requestId,
        content: message.trim(),
      });
      setMessage('');
    } catch (error) {
      if (isForbiddenError(error)) router.replace('/forbidden');
    }
  };

  const onAssignDepartment = async () => {
    if (!requestId || !selectedDepartmentId) {
      setMunicipalityError(t('cityProblem.errors.departmentRequired'));
      return;
    }
    setMunicipalityError('');
    try {
      await assignDepartmentMutation.mutateAsync({
        cityId,
        requestId,
        departmentId: selectedDepartmentId,
      });
    } catch (error) {
      if (isForbiddenError(error)) {
        router.replace('/forbidden');
        return;
      }
      setMunicipalityError(t('cityProblem.loadError'));
    }
  };

  const onUpdateStatus = async () => {
    if (!requestId) return;
    if (nextStatus === 'RESOLVED' || nextStatus === 'REJECTED') {
      setMunicipalityError(t('cityProblem.errors.useReportForFinalStatus'));
      return;
    }
    setMunicipalityError('');
    try {
      await updateStatusMutation.mutateAsync({
        cityId,
        requestId,
        status: nextStatus,
      });
    } catch (error) {
      if (isForbiddenError(error)) {
        router.replace('/forbidden');
        return;
      }
      setMunicipalityError(t('cityProblem.loadError'));
    }
  };

  const onCreateReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!requestId) return;
    if (
      (effectiveReportType === 'RESOLUTION' ||
        effectiveReportType === 'REJECTION') &&
      !reportText.trim()
    ) {
      setMunicipalityError(t('cityProblem.errors.reportTextRequired'));
      return;
    }
    if (reportFiles.length > 1) {
      setMunicipalityError(t('cityProblem.errors.tooManyReportAttachments'));
      return;
    }
    if (
      effectiveReportType === 'PROGRESS' &&
      detail?.status !== 'IN_PROGRESS'
    ) {
      setMunicipalityError(
        t('cityProblem.errors.progressReportRequiresInProgress'),
      );
      return;
    }
    if (
      (effectiveReportType === 'RESOLUTION' ||
        effectiveReportType === 'REJECTION') &&
      !canCreateFinalReport
    ) {
      setMunicipalityError(t('cityProblem.errors.finalReportAlreadyExists'));
      return;
    }
    setMunicipalityError('');
    try {
      await createReportMutation.mutateAsync({
        cityId,
        requestId,
        payload: {
          type: effectiveReportType,
          status:
            effectiveReportType === 'RESOLUTION'
              ? 'RESOLVED'
              : effectiveReportType === 'REJECTION'
                ? 'REJECTED'
                : undefined,
          description: reportText.trim() || undefined,
        },
        files: reportFiles,
      });
      setReportText('');
      setReportFiles([]);
    } catch (error) {
      if (isForbiddenError(error)) {
        router.replace('/forbidden');
        return;
      }
      setMunicipalityError(t('cityProblem.loadError'));
    }
  };

  const detailPanelProps = {
    cityId,
    viewMode,
    canManageRequests,
    activeRequestId: requestId,
    isLoading: detailQuery.isLoading,
    detail,
    messages,
    messageValue: message,
    onMessageChange: setMessage,
    onSendMessage,
    isSendingMessage: createMessageMutation.isPending,
    isMessageError: createMessageMutation.isError,
    departments,
    selectedDepartmentId,
    onSelectedDepartmentIdChange: setSelectedDepartmentId,
    onAssignDepartment,
    isAssigning: assignDepartmentMutation.isPending,
    nextStatus,
    onNextStatusChange: setNextStatus,
    onUpdateStatus,
    isUpdatingStatus: updateStatusMutation.isPending,
    reportType: effectiveReportType,
    onReportTypeChange: setReportType,
    reportText,
    onReportTextChange: setReportText,
    reportFiles,
    onReportFilesChange: setReportFiles,
    onCreateReport,
    isCreatingReport: createReportMutation.isPending,
    municipalityError,
  };

  return {
    detailQuery,
    messagesQuery,
    departmentsQuery,
    detail,
    messages,
    departments,
    detailPanelProps,
    resetControls,
    controls: {
      municipalityError,
      selectedDepartmentId,
      setSelectedDepartmentId,
      onAssignDepartment,
      assignDisabled,
      nextStatus,
      setNextStatus,
      onUpdateStatus,
      statusUpdateDisabled,
      reportType: effectiveReportType,
      setReportType,
      reportText,
      setReportText,
      reportFiles,
      setReportFiles,
      onCreateReport,
      isCreatingReport: createReportMutation.isPending,
      isFinalStatus,
      isReportTextRequired,
      isReportTextEmpty,
      createReportDisabled,
      hasFinalReport,
      canCreateProgressReport,
      canCreateFinalReport,
    },
    chat: {
      message,
      setMessage,
      onSendMessage,
      isSendingMessage: createMessageMutation.isPending,
      isMessageError: createMessageMutation.isError,
    },
  };
}
