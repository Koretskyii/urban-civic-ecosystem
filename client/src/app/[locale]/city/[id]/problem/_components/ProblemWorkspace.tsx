'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Stack, Typography } from '@mui/material';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import {
  usePermission,
  useCityRequestDetail,
  useCityRequestMessages,
  useCityById,
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
import {
  DEFAULT_CITY_MAP_CENTER,
  normalizeCoordinate,
  validateCoordinates,
} from '@/features/city-requests';
import type { CityRequestStatus, ReportType } from '@/types';
import { CitizenCreateRequestForm } from './CitizenCreateRequestForm';
import { MunicipalityQueueHeader } from './MunicipalityQueueHeader';
import { ProblemModeSwitcher } from './ProblemModeSwitcher';
import { RequestDetailPanel } from './RequestDetailPanel';
import { RequestListPanel } from './RequestListPanel';
import { isForbiddenError } from '@/features/city-requests/helpers/errors.helpers';

interface ProblemWorkspaceProps {
  cityId: string;
}

type CreateRequestErrorKey =
  | ''
  | 'required'
  | 'coordinatesInvalid'
  | 'coordinatesOutOfRange';

const isUsableCityCenter = (lat: unknown, lng: unknown): boolean => {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return false;
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return false;
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return false;
  }

  if (lat === 0 || lng === 0) {
    return false;
  }

  return true;
};

export default function ProblemWorkspace({ cityId }: ProblemWorkspaceProps) {
  const t = useTranslations();
  const router = useRouter();

  const [selectedRequestId, setSelectedRequestId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [message, setMessage] = useState('');
  const [createRequestError, setCreateRequestError] =
    useState<CreateRequestErrorKey>('');
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
  const cityQuery = useCityById(cityId);
  const cityDefaultCenter = useMemo(() => {
    const centerLat = cityQuery.data?.centerLat;
    const centerLng = cityQuery.data?.centerLng;

    if (
      typeof centerLat === 'number' &&
      typeof centerLng === 'number' &&
      isUsableCityCenter(centerLat, centerLng)
    ) {
      return { lat: centerLat, lng: centerLng };
    }

    return undefined;
  }, [cityQuery.data]);
  const effectiveDefaultCenter = cityDefaultCenter ?? DEFAULT_CITY_MAP_CENTER;
  const fallbackLat = useMemo(
    () => normalizeCoordinate(effectiveDefaultCenter.lat),
    [effectiveDefaultCenter.lat],
  );
  const fallbackLng = useMemo(
    () => normalizeCoordinate(effectiveDefaultCenter.lng),
    [effectiveDefaultCenter.lng],
  );
  const resolvedLat = lat.trim() ? lat : fallbackLat;
  const resolvedLng = lng.trim() ? lng : fallbackLng;

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
  const formError = createRequestError
    ? t(`cityProblem.errors.${createRequestError}`)
    : '';
  const hasCoordinateError =
    createRequestError === 'coordinatesInvalid' ||
    createRequestError === 'coordinatesOutOfRange';

  useEffect(() => {
    if (
      isForbiddenError(requestsQuery.error) ||
      isForbiddenError(cityQuery.error) ||
      isForbiddenError(detailQuery.error) ||
      isForbiddenError(messagesQuery.error) ||
      isForbiddenError(departmentsQuery.error)
    ) {
      router.replace('/forbidden');
    }
  }, [
    requestsQuery.error,
    cityQuery.error,
    detailQuery.error,
    messagesQuery.error,
    departmentsQuery.error,
    router,
  ]);

  const onCreateRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateRequestError('');

    try {
      if (!title.trim() || !resolvedLat.trim() || !resolvedLng.trim()) {
        setCreateRequestError('required');
        return;
      }

      const coordinateValidation = validateCoordinates(
        resolvedLat.trim(),
        resolvedLng.trim(),
      );
      if (!coordinateValidation.ok) {
        setCreateRequestError(
          coordinateValidation.reason === 'invalid_number'
            ? 'coordinatesInvalid'
            : 'coordinatesOutOfRange',
        );
        return;
      }

      setLat(coordinateValidation.normalizedLat);
      setLng(coordinateValidation.normalizedLng);

      await createRequestMutation.mutateAsync({
        cityId,
        payload: {
          title: title.trim(),
          description: description.trim() || undefined,
          locationLat: coordinateValidation.lat,
          locationLng: coordinateValidation.lng,
        },
      });

      setTitle('');
      setDescription('');
      setLat('');
      setLng('');
      setCreateRequestError('');
    } catch (error) {
      if (isForbiddenError(error)) {
        router.replace('/forbidden');
        return;
      }
      return;
    }
  };

  const onSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!activeRequestId || !message.trim()) {
      return;
    }

    try {
      await createMessageMutation.mutateAsync({
        cityId,
        requestId: activeRequestId,
        content: message.trim(),
      });

      setMessage('');
    } catch (error) {
      if (isForbiddenError(error)) {
        router.replace('/forbidden');
        return;
      }
      return;
    }
  };

  const onAssignDepartment = async () => {
    if (!activeRequestId || !selectedDepartmentId) {
      setMunicipalityError(t('cityProblem.errors.departmentRequired'));
      return;
    }

    setMunicipalityError('');

    try {
      await assignDepartmentMutation.mutateAsync({
        cityId,
        requestId: activeRequestId,
        departmentId: selectedDepartmentId,
      });
    } catch (error) {
      if (isForbiddenError(error)) {
        router.replace('/forbidden');
        return;
      }
      setMunicipalityError(t('cityProblem.loadError'));
      return;
    }
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

    try {
      await updateStatusMutation.mutateAsync({
        cityId,
        requestId: activeRequestId,
        status: nextStatus,
      });
    } catch (error) {
      if (isForbiddenError(error)) {
        router.replace('/forbidden');
        return;
      }
      setMunicipalityError(t('cityProblem.loadError'));
      return;
    }
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

    try {
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
    } catch (error) {
      if (isForbiddenError(error)) {
        router.replace('/forbidden');
        return;
      }
      setMunicipalityError(t('cityProblem.loadError'));
      return;
    }
  };

  const onSelectRequest = useCallback((requestId: string) => {
    setSelectedRequestId(requestId);
    setSelectedDepartmentId('');
    setNextStatus('IN_PROGRESS');
    setMunicipalityError('');
  }, []);
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
          lat={resolvedLat}
          lng={resolvedLng}
          defaultCenter={effectiveDefaultCenter}
          formError={formError}
          hasCoordinateError={hasCoordinateError}
          isSubmitting={createRequestMutation.isPending}
          isError={createRequestMutation.isError}
          onTitleChange={(value) => {
            setTitle(value);
            setCreateRequestError('');
          }}
          onDescriptionChange={(value) => {
            setDescription(value);
            setCreateRequestError('');
          }}
          onLatChange={(value) => {
            setLat(value);
            setCreateRequestError('');
          }}
          onLngChange={(value) => {
            setLng(value);
            setCreateRequestError('');
          }}
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
          key={`${viewMode}-${filterStatus}-${filterDepartmentId}-${filterPriority}`}
          requests={requests}
          isLoading={requestsQuery.isLoading}
          viewMode={viewMode}
          activeRequestId={activeRequestId}
          onSelect={onSelectRequest}
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
