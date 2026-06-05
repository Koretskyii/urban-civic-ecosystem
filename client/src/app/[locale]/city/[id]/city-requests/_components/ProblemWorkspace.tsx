'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  usePermission,
  useCityById,
  useCreateCityRequest,
  useInfiniteCityRequestsList,
  useRoleUiMode,
} from '@/hooks';
import { PERMISSION_GROUPS } from '@/constants/rbac.const';
import { RoleModeSwitcher } from '@/components';
import {
  DEFAULT_CITY_MAP_CENTER,
  normalizeCoordinate,
  validateCoordinates,
} from '@/features/city-requests';
import type { CityRequestStatus, Department } from '@/types';
import { CitizenRequestsView } from './CitizenRequestsView';
import { ManageRequestsView } from './ManageRequestsView';
import { isForbiddenError } from '@/features/city-requests/helpers/errors.helpers';
import { useCityRequestDetailController } from './useCityRequestDetailController';

interface ProblemWorkspaceProps {
  cityId: string;
}

type CreateRequestErrorKey =
  | ''
  | 'required'
  | 'coordinatesInvalid'
  | 'coordinatesOutOfRange'
  | 'tooManyAttachments'
  | 'invalidAttachmentType';

const EMPTY_DEPARTMENTS: Department[] = [];

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
  const { can: canManageRequests, isLoading: isPermissionLoading } =
    usePermission(PERMISSION_GROUPS.CITY_REQUEST.MANAGE, { cityId });
  const { mode: uiMode, setMode: setUiMode } = useRoleUiMode(
    canManageRequests,
    isPermissionLoading,
  );
  const viewMode: 'citizen' | 'municipality' =
    uiMode === 'manage' ? 'municipality' : 'citizen';
  const debouncedSearch = useDebouncedValue(search, 450);

  const requestListQuery = useMemo(
    () => ({
      scope: 'all' as const,
      search: debouncedSearch.trim() || undefined,
      status: filterStatus !== 'ALL' ? filterStatus : undefined,
      departmentId:
        filterDepartmentId !== 'ALL' ? filterDepartmentId : undefined,
      priority: filterPriority !== 'ALL' ? Number(filterPriority) : undefined,
      sortBy,
      sortOrder,
    }),
    [
      debouncedSearch,
      filterStatus,
      filterDepartmentId,
      filterPriority,
      sortBy,
      sortOrder,
    ],
  );

  const requestsQuery = useInfiniteCityRequestsList(cityId, requestListQuery);
  const fetchNextRequestsPage = requestsQuery.fetchNextPage;

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

  const requestDetailController = useCityRequestDetailController({
    cityId,
    requestId: activeRequestId,
    canManageRequests,
    viewMode,
  });
  const { resetControls } = requestDetailController;

  const createRequestMutation = useCreateCityRequest();
  const formError = createRequestError
    ? t(`cityProblem.errors.${createRequestError}`)
    : '';
  const hasCoordinateError =
    createRequestError === 'coordinatesInvalid' ||
    createRequestError === 'coordinatesOutOfRange';

  useEffect(() => {
    if (
      isForbiddenError(requestsQuery.error) ||
      isForbiddenError(cityQuery.error)
    ) {
      router.replace('/forbidden');
    }
  }, [requestsQuery.error, cityQuery.error, router]);

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
      if (requestFiles.length > 1) {
        setCreateRequestError('tooManyAttachments');
        return;
      }
      if (requestFiles.some((file) => !file.type.startsWith('image/'))) {
        setCreateRequestError('invalidAttachmentType');
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

  const onSelectRequest = useCallback(
    (requestId: string) => {
      resetControls();
      setSelectedRequestId(requestId);
    },
    [resetControls],
  );
  const loadMoreRequests = useCallback(() => {
    void fetchNextRequestsPage();
  }, [fetchNextRequestsPage]);

  const requestListKey = [
    viewMode,
    filterStatus,
    filterDepartmentId,
    filterPriority,
    sortBy,
    sortOrder,
    debouncedSearch,
  ].join('-');
  const requestFiltersProps = {
    filterStatus,
    filterDepartmentId,
    filterPriority,
    search,
    sortBy,
    sortOrder,
    departments: requestDetailController.departments ?? EMPTY_DEPARTMENTS,
    isDepartmentsLoading: requestDetailController.departmentsQuery.isLoading,
    onFilterStatusChange: setFilterStatus,
    onFilterDepartmentChange: setFilterDepartmentId,
    onFilterPriorityChange: setFilterPriority,
    onSearchChange: setSearch,
    onSortByChange: setSortBy,
    onSortOrderChange: setSortOrder,
  };
  const requestListPanelProps = {
    requests,
    isLoading: requestsQuery.isLoading,
    hasNextPage: requestsQuery.hasNextPage,
    isFetchingNextPage: requestsQuery.isFetchingNextPage,
    onLoadMore: loadMoreRequests,
    viewMode,
    activeRequestId,
    onSelect: onSelectRequest,
  };

  const requestDetailPanelProps = {
    ...requestDetailController.detailPanelProps,
    showFullPageAction: true,
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
          filters={requestFiltersProps}
          listPanel={requestListPanelProps}
          listKey={requestListKey}
          detailPanel={requestDetailPanelProps}
          onCreateRequest={onCreateRequest}
        />
      ) : (
        <ManageRequestsView
          filters={requestFiltersProps}
          listPanel={requestListPanelProps}
          listKey={requestListKey}
          detailPanel={requestDetailPanelProps}
        />
      )}
    </div>
  );
}
