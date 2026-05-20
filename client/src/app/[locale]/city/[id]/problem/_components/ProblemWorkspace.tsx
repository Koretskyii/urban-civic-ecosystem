'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Stack, Typography } from '@mui/material';
import { useTranslations } from 'next-intl';
import {
  usePermission,
  useCityRequestDetail,
  useCityRequestMessages,
  useCityRequestRealtime,
  useCityRequestsList,
  useCityDepartments,
  useAssignCityRequestDepartment,
  useCreateCityRequest,
  useCreateCityRequestMessage,
  useCreateCityRequestReport,
  useUpdateCityRequestStatus,
} from '@/hooks';
import { PERMISSION_GROUPS } from '@/constants/rbac.const';
import type { CityRequestStatus, ReportType } from '@/types';
import { CitizenCreateRequestForm } from './CitizenCreateRequestForm';
import { MunicipalityQueueHeader } from './MunicipalityQueueHeader';
import { ProblemModeSwitcher } from './ProblemModeSwitcher';
import { RequestDetailPanel } from './RequestDetailPanel';
import { RequestListPanel } from './RequestListPanel';

interface ProblemWorkspaceProps {
  cityId: string;
}

export default function ProblemWorkspace({ cityId }: ProblemWorkspaceProps) {
  const t = useTranslations();

  const [selectedRequestId, setSelectedRequestId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState<string>('');
  const [viewMode, setViewMode] = useState<'citizen' | 'municipality'>(
    'citizen',
  );
  const [filterStatus, setFilterStatus] = useState<CityRequestStatus | 'ALL'>(
    'ALL',
  );
  const [filterDepartmentId, setFilterDepartmentId] = useState<'ALL' | string>(
    'ALL',
  );
  const [filterPriority, setFilterPriority] = useState<'ALL' | string>('ALL');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [nextStatus, setNextStatus] =
    useState<CityRequestStatus>('IN_PROGRESS');
  const [reportType, setReportType] = useState<ReportType>('PROGRESS');
  const [reportText, setReportText] = useState('');
  const [municipalityError, setMunicipalityError] = useState('');

  const { can: canManageRequests, isLoading: isPermissionLoading } =
    usePermission(PERMISSION_GROUPS.CITY_REQUEST.MANAGE, { cityId });

  const requestsQuery = useCityRequestsList(cityId, {
    scope: viewMode === 'municipality' ? 'all' : 'mine',
    status:
      viewMode === 'municipality' && filterStatus !== 'ALL'
        ? filterStatus
        : undefined,
    departmentId:
      viewMode === 'municipality' && filterDepartmentId !== 'ALL'
        ? filterDepartmentId
        : undefined,
  });

  const requests = useMemo(() => {
    const baseRequests = requestsQuery.data ?? [];
    if (viewMode !== 'municipality' || filterPriority === 'ALL') {
      return baseRequests;
    }

    return baseRequests.filter(
      (request) => String(request.priority) === filterPriority,
    );
  }, [requestsQuery.data, viewMode, filterPriority]);

  const activeRequestId = selectedRequestId || requests[0]?.id || '';

  const detailQuery = useCityRequestDetail(cityId, activeRequestId);
  const messagesQuery = useCityRequestMessages(cityId, activeRequestId);
  const departmentsQuery = useCityDepartments(cityId);

  useCityRequestRealtime({
    cityId,
    requestId: activeRequestId,
    enabled: Boolean(activeRequestId),
  });

  const createRequestMutation = useCreateCityRequest();
  const createMessageMutation = useCreateCityRequestMessage();
  const assignDepartmentMutation = useAssignCityRequestDepartment();
  const updateStatusMutation = useUpdateCityRequestStatus();
  const createReportMutation = useCreateCityRequestReport();

  const onCreateRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    if (!title.trim() || !lat.trim() || !lng.trim()) {
      setFormError(t('cityProblem.errors.required'));
      return;
    }

    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
      setFormError(t('cityProblem.errors.coordinatesInvalid'));
      return;
    }

    await createRequestMutation.mutateAsync({
      cityId,
      payload: {
        title: title.trim(),
        description: description.trim() || undefined,
        locationLat: parsedLat,
        locationLng: parsedLng,
      },
    });

    setTitle('');
    setDescription('');
    setLat('');
    setLng('');
  };

  const onSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!activeRequestId || !message.trim()) {
      return;
    }

    await createMessageMutation.mutateAsync({
      cityId,
      requestId: activeRequestId,
      content: message.trim(),
    });

    setMessage('');
  };

  const onAssignDepartment = async () => {
    if (!activeRequestId || !selectedDepartmentId) {
      setMunicipalityError(t('cityProblem.errors.departmentRequired'));
      return;
    }

    setMunicipalityError('');
    await assignDepartmentMutation.mutateAsync({
      cityId,
      requestId: activeRequestId,
      departmentId: selectedDepartmentId,
    });
  };

  const onUpdateStatus = async () => {
    if (!activeRequestId) {
      return;
    }

    if (nextStatus === 'RESOLVED' || nextStatus === 'REJECTED') {
      setMunicipalityError(t('cityProblem.errors.useReportForFinalStatus'));
      return;
    }

    setMunicipalityError('');
    await updateStatusMutation.mutateAsync({
      cityId,
      requestId: activeRequestId,
      status: nextStatus,
    });
  };

  const onCreateReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeRequestId) {
      return;
    }

    if (
      (reportType === 'RESOLUTION' || reportType === 'REJECTION') &&
      !reportText.trim()
    ) {
      setMunicipalityError(t('cityProblem.errors.reportTextRequired'));
      return;
    }

    setMunicipalityError('');
    await createReportMutation.mutateAsync({
      cityId,
      requestId: activeRequestId,
      payload: {
        type: reportType,
        status:
          reportType === 'RESOLUTION'
            ? 'RESOLVED'
            : reportType === 'REJECTION'
              ? 'REJECTED'
              : undefined,
        description: reportText.trim() || undefined,
      },
    });

    setReportText('');
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h2">{t('cityProblem.title')}</Typography>

      <ProblemModeSwitcher
        value={viewMode}
        canManageRequests={canManageRequests}
        isPermissionLoading={isPermissionLoading}
        onChange={(value) => setViewMode(value)}
      />

      {viewMode === 'citizen' ? (
        <CitizenCreateRequestForm
          title={title}
          description={description}
          lat={lat}
          lng={lng}
          formError={formError}
          isSubmitting={createRequestMutation.isPending}
          isError={createRequestMutation.isError}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
          onLatChange={setLat}
          onLngChange={setLng}
          onSubmit={onCreateRequest}
        />
      ) : (
        <MunicipalityQueueHeader
          filterStatus={filterStatus}
          filterDepartmentId={filterDepartmentId}
          filterPriority={filterPriority}
          departments={departmentsQuery.data ?? []}
          onFilterStatusChange={setFilterStatus}
          onFilterDepartmentChange={setFilterDepartmentId}
          onFilterPriorityChange={setFilterPriority}
        />
      )}

      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={3}
        alignItems="stretch"
      >
        <RequestListPanel
          requests={requests}
          isLoading={requestsQuery.isLoading}
          viewMode={viewMode}
          activeRequestId={activeRequestId}
          onSelect={setSelectedRequestId}
        />

        <RequestDetailPanel
          cityId={cityId}
          viewMode={viewMode}
          canManageRequests={canManageRequests}
          activeRequestId={activeRequestId}
          isLoading={detailQuery.isLoading}
          detail={detailQuery.data}
          messages={
            messagesQuery.data ?? detailQuery.data?.chat?.messages ?? []
          }
          messageValue={message}
          onMessageChange={setMessage}
          onSendMessage={onSendMessage}
          isSendingMessage={createMessageMutation.isPending}
          isMessageError={createMessageMutation.isError}
          departments={departmentsQuery.data ?? []}
          selectedDepartmentId={selectedDepartmentId}
          onSelectedDepartmentIdChange={setSelectedDepartmentId}
          onAssignDepartment={onAssignDepartment}
          isAssigning={assignDepartmentMutation.isPending}
          nextStatus={nextStatus}
          onNextStatusChange={setNextStatus}
          onUpdateStatus={onUpdateStatus}
          isUpdatingStatus={updateStatusMutation.isPending}
          reportType={reportType}
          onReportTypeChange={setReportType}
          reportText={reportText}
          onReportTextChange={setReportText}
          onCreateReport={onCreateReport}
          isCreatingReport={createReportMutation.isPending}
          municipalityError={municipalityError}
        />
      </Stack>
    </Stack>
  );
}
