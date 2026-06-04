'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  usePermission,
  useCityRequestDetail,
  useCityRequestMessages,
  useCityById,
  useCityRequestRealtime,
  useCityDepartments,
  useAssignCityRequestDepartment,
  useCreateCityRequest,
  useCreateCityRequestMessage,
  useCreateCityRequestReport,
  useInfiniteCityRequestsList,
  useUpdateCityRequestStatus,
  useRoleUiMode,
} from '@/hooks';
import { PERMISSION_GROUPS } from '@/constants/rbac.const';
import { RoleModeSwitcher } from '@/components';
import {
  DEFAULT_CITY_MAP_CENTER,
  normalizeCoordinate,
  validateCoordinates,
} from '@/features/city-requests';
import type { CityRequestStatus, ReportType } from '@/types';
import { CitizenRequestsView } from './CitizenRequestsView';
import { ManageRequestsView } from './ManageRequestsView';
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
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  if (lat === 0 || lng === 0) return false;
  return true;
};

export default function ProblemWorkspace({ cityId }: ProblemWorkspaceProps) {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRequestId = searchParams.get('requestId') ?? '';
  const [selectedRequestId, setSelectedRequestId] =
    useState<string>(initialRequestId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [requestFiles, setRequestFiles] = useState<File[]>([]);
  const [message, setMessage] = useState('');
  const [createRequestError, setCreateRequestError] =
    useState<CreateRequestErrorKey>('');
  const [filterStatus, setFilterStatus] = useState<CityRequestStatus | 'ALL'>(
    'ALL',
  );
  const [filterDepartmentId, setFilterDepartmentId] = useState<'ALL' | string>(
    'ALL',
  );
  const [filterPriority, setFilterPriority] = useState<'ALL' | string>('ALL');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<
    'createdAt' | 'updatedAt' | 'priority' | 'status'
  >('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [nextStatus, setNextStatus] =
    useState<CityRequestStatus>('IN_PROGRESS');
  const [reportType, setReportType] = useState<ReportType>('PROGRESS');
  const [reportText, setReportText] = useState('');
  const [reportFiles, setReportFiles] = useState<File[]>([]);
  const [municipalityError, setMunicipalityError] = useState('');

  const { can: canManageRequests, isLoading: isPermissionLoading } =
    usePermission(PERMISSION_GROUPS.CITY_REQUEST.MANAGE, { cityId });
  const { mode: uiMode, setMode: setUiMode } = useRoleUiMode(
    canManageRequests,
    isPermissionLoading,
  );
  const viewMode: 'citizen' | 'municipality' =
    uiMode === 'manage' ? 'municipality' : 'citizen';
  const debouncedSearch = useDebouncedValue(search, 450);

  const requestsQuery = useInfiniteCityRequestsList(cityId, {
    scope: 'all',
    search: debouncedSearch.trim() || undefined,
    status:
      uiMode === 'manage' && filterStatus !== 'ALL' ? filterStatus : undefined,
    departmentId:
      uiMode === 'manage' && filterDepartmentId !== 'ALL'
        ? filterDepartmentId
        : undefined,
    priority:
      uiMode === 'manage' && filterPriority !== 'ALL'
        ? Number(filterPriority)
        : undefined,
    sortBy,
    sortOrder,
  });

  const requests = useMemo(() => {
    return requestsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  }, [requestsQuery.data]);

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
        files: requestFiles,
      });
      setTitle('');
      setDescription('');
      setLat('');
      setLng('');
      setRequestFiles([]);
      setCreateRequestError('');
    } catch (error) {
      if (isForbiddenError(error)) router.replace('/forbidden');
      return;
    }
  };

  const onSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeRequestId || !message.trim()) return;
    try {
      await createMessageMutation.mutateAsync({
        cityId,
        requestId: activeRequestId,
        content: message.trim(),
      });
      setMessage('');
    } catch (error) {
      if (isForbiddenError(error)) router.replace('/forbidden');
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
    if (!activeRequestId) return;
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
    if (!activeRequestId) return;
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
      return;
    }
  };

  const onSelectRequest = useCallback((requestId: string) => {
    setSelectedRequestId(requestId);
    setSelectedDepartmentId('');
    setNextStatus('IN_PROGRESS');
    setMunicipalityError('');
  }, []);

  const requestListKey = `${viewMode}-${filterStatus}-${filterDepartmentId}-${filterPriority}`;
  const requestListPanelProps = {
    requests,
    isLoading: requestsQuery.isLoading,
    hasNextPage: requestsQuery.hasNextPage,
    isFetchingNextPage: requestsQuery.isFetchingNextPage,
    onLoadMore: () => requestsQuery.fetchNextPage(),
    viewMode,
    activeRequestId,
    onSelect: onSelectRequest,
  };

  const requestDetailPanelProps = {
    cityId,
    viewMode,
    canManageRequests,
    activeRequestId,
    isLoading: detailQuery.isLoading,
    detail: detailQuery.data,
    messages: messagesQuery.data ?? detailQuery.data?.chat?.messages ?? [],
    messageValue: message,
    onMessageChange: setMessage,
    onSendMessage,
    isSendingMessage: createMessageMutation.isPending,
    isMessageError: createMessageMutation.isError,
    departments: departmentsQuery.data ?? [],
    selectedDepartmentId,
    onSelectedDepartmentIdChange: setSelectedDepartmentId,
    onAssignDepartment,
    isAssigning: assignDepartmentMutation.isPending,
    nextStatus,
    onNextStatusChange: setNextStatus,
    onUpdateStatus,
    isUpdatingStatus: updateStatusMutation.isPending,
    reportType,
    onReportTypeChange: setReportType,
    reportText,
    onReportTextChange: setReportText,
    reportFiles,
    onReportFilesChange: setReportFiles,
    onCreateReport,
    isCreatingReport: createReportMutation.isPending,
    municipalityError,
  };

  return (
    <div
      className={
        viewMode === 'municipality'
          ? 'flex min-h-[calc(100dvh-8rem)] flex-col gap-3'
          : 'space-y-3'
      }
    >
      <h2 className="text-3xl">{t('cityProblem.title')}</h2>
      <RoleModeSwitcher
        value={uiMode}
        canManage={canManageRequests}
        isPermissionLoading={isPermissionLoading}
        citizenLabel={t('cityProblem.viewModes.citizen')}
        manageLabel={t('cityProblem.viewModes.municipality')}
        onChange={setUiMode}
      />

      {viewMode === 'citizen' ? (
        <CitizenRequestsView
          form={{
            title,
            description,
            lat: resolvedLat,
            lng: resolvedLng,
            defaultCenter: effectiveDefaultCenter,
            formError,
            hasCoordinateError,
            isSubmitting: createRequestMutation.isPending,
            isError: createRequestMutation.isError,
            onTitleChange: (value: string) => {
              setTitle(value);
              setCreateRequestError('');
            },
            onDescriptionChange: (value: string) => {
              setDescription(value);
              setCreateRequestError('');
            },
            onLatChange: (value: string) => {
              setLat(value);
              setCreateRequestError('');
            },
            onLngChange: (value: string) => {
              setLng(value);
              setCreateRequestError('');
            },
            files: requestFiles,
            onFilesChange: setRequestFiles,
            onSubmit: onCreateRequest,
          }}
          listPanel={requestListPanelProps}
          listKey={requestListKey}
          detailPanel={requestDetailPanelProps}
          onCreateRequest={onCreateRequest}
        />
      ) : (
        <ManageRequestsView
          header={{
            filterStatus,
            filterDepartmentId,
            filterPriority,
            search,
            sortBy,
            sortOrder,
            departments: departmentsQuery.data ?? [],
            isDepartmentsLoading: departmentsQuery.isLoading,
            onFilterStatusChange: setFilterStatus,
            onFilterDepartmentChange: setFilterDepartmentId,
            onFilterPriorityChange: setFilterPriority,
            onSearchChange: setSearch,
            onSortByChange: setSortBy,
            onSortOrderChange: setSortOrder,
          }}
          listPanel={requestListPanelProps}
          listKey={requestListKey}
          detailPanel={requestDetailPanelProps}
        />
      )}
    </div>
  );
}
