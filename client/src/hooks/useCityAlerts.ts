import { queryKeys } from '@/api';
import { cityAlertsApi } from '@/api/endpoints/city-alerts.api';
import {
  AlertListQuery,
  CreateAlertPayload,
  UpdateAlertPayload,
} from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const invalidateAlertQueries = async (
  queryClient: ReturnType<typeof useQueryClient>,
  cityId: string,
  alertId?: string,
) => {
  const tasks: Array<Promise<unknown>> = [
    queryClient.invalidateQueries({
      queryKey: queryKeys.alerts.all(cityId),
    }),
  ];

  if (alertId) {
    tasks.push(
      queryClient.invalidateQueries({
        queryKey: queryKeys.alerts.detail(cityId, alertId),
      }),
    );
  }

  await Promise.all(tasks);
};

export function useCityAlerts(cityId: string, query?: AlertListQuery) {
  return useQuery({
    queryKey: queryKeys.alerts.list(cityId, query),
    queryFn: () => cityAlertsApi.getCityAlerts(cityId, query),
    enabled: !!cityId,
    placeholderData: (previousData) => previousData,
  });
}

export function useCityAlertTypes(cityId: string) {
  return useQuery({
    queryKey: queryKeys.alerts.types(cityId),
    queryFn: () => cityAlertsApi.getCityAlertTypes(cityId),
    enabled: !!cityId,
  });
}

export function useCreateAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cityId,
      payload,
    }: {
      cityId: string;
      payload: CreateAlertPayload;
    }) => cityAlertsApi.createCityAlert(cityId, payload),
    onSuccess: async (_data, variables) => {
      await invalidateAlertQueries(queryClient, variables.cityId);
    },
  });
}

export function useUpdateAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cityId,
      alertId,
      payload,
    }: {
      cityId: string;
      alertId: string;
      payload: UpdateAlertPayload;
    }) => cityAlertsApi.updateCityAlert(cityId, alertId, payload),
    onSuccess: async (_data, variables) => {
      await invalidateAlertQueries(
        queryClient,
        variables.cityId,
        variables.alertId,
      );
    },
  });
}

export function useDeleteAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cityId, alertId }: { cityId: string; alertId: string }) =>
      cityAlertsApi.deleteCityAlert(cityId, alertId),
    onSuccess: async (_data, variables) => {
      await invalidateAlertQueries(
        queryClient,
        variables.cityId,
        variables.alertId,
      );
    },
  });
}
