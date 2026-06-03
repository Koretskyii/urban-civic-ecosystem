'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cityRequestsApi } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';
import {
  invalidateCityRequestQueries,
  type AssignDepartmentInput,
  type CreateCityRequestInput,
  type CreateMessageInput,
  type CreateReportInput,
  type UpdateStatusInput,
} from '@/features/city-requests';
import type { GetCityRequestsQuery } from '@/types';

export function useCityRequestsList(
  cityId: string,
  query?: GetCityRequestsQuery,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: queryKeys.cityRequests.list(cityId, query),
    queryFn: () => cityRequestsApi.getRequests(cityId, query),
    enabled: Boolean(cityId && enabled),
  });
}

export function useCityRequestDetail(cityId: string, requestId: string) {
  return useQuery({
    queryKey: queryKeys.cityRequests.detail(cityId, requestId),
    queryFn: () => cityRequestsApi.getRequestDetail(cityId, requestId),
    enabled: Boolean(cityId && requestId),
  });
}

export function useCityRequestMessages(cityId: string, requestId: string) {
  return useQuery({
    queryKey: queryKeys.cityRequests.messages(cityId, requestId),
    queryFn: () => cityRequestsApi.getMessages(cityId, requestId),
    enabled: Boolean(cityId && requestId),
  });
}

export function useCityDepartments(cityId: string) {
  return useQuery({
    queryKey: queryKeys.cityRequests.departments(cityId),
    queryFn: () => cityRequestsApi.getDepartments(cityId),
    enabled: Boolean(cityId),
  });
}

export function useCreateCityRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cityId, payload, files }: CreateCityRequestInput) => {
      const formData = cityRequestsApi.buildCreateRequestFormData(
        payload,
        files,
      );
      return cityRequestsApi.createRequest(cityId, formData);
    },
    onSuccess: (_created, variables) => {
      invalidateCityRequestQueries(queryClient, variables.cityId);
    },
  });
}

export function useAssignCityRequestDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cityId, requestId, departmentId }: AssignDepartmentInput) =>
      cityRequestsApi.assignDepartment(cityId, requestId, { departmentId }),
    onSuccess: (_updated, variables) => {
      invalidateCityRequestQueries(
        queryClient,
        variables.cityId,
        variables.requestId,
      );
    },
  });
}

export function useUpdateCityRequestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cityId, requestId, status }: UpdateStatusInput) =>
      cityRequestsApi.updateStatus(cityId, requestId, { status }),
    onSuccess: (_updated, variables) => {
      invalidateCityRequestQueries(
        queryClient,
        variables.cityId,
        variables.requestId,
      );
    },
  });
}

export function useCreateCityRequestReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cityId, requestId, payload, files }: CreateReportInput) => {
      const formData = cityRequestsApi.buildCreateReportFormData(
        payload,
        files,
      );
      return cityRequestsApi.createReport(cityId, requestId, formData);
    },
    onSuccess: (_report, variables) => {
      invalidateCityRequestQueries(
        queryClient,
        variables.cityId,
        variables.requestId,
      );
    },
  });
}

export function useCreateCityRequestMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cityId, requestId, content }: CreateMessageInput) =>
      cityRequestsApi.createMessage(cityId, requestId, { content }),
    onSuccess: (_message, variables) => {
      invalidateCityRequestQueries(
        queryClient,
        variables.cityId,
        variables.requestId,
      );
    },
  });
}
