import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';

type CityRequestRealtimeMutationEvent =
  | 'message.created'
  | 'report.created'
  | 'status.updated'
  | 'assignment.updated';

export function invalidateCityRequestQueries(
  queryClient: QueryClient,
  cityId: string,
  requestId?: string,
) {
  queryClient.invalidateQueries({
    queryKey: queryKeys.cityRequests.all(cityId),
  });

  if (!requestId) {
    return;
  }

  queryClient.invalidateQueries({
    queryKey: queryKeys.cityRequests.detail(cityId, requestId),
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.cityRequests.messages(cityId, requestId),
  });
}

export function invalidateCityRequestRealtimeEventQueries(
  queryClient: QueryClient,
  cityId: string,
  requestId: string,
  eventName: CityRequestRealtimeMutationEvent,
) {
  if (eventName === 'message.created') {
    queryClient.invalidateQueries({
      queryKey: queryKeys.cityRequests.messages(cityId, requestId),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.cityRequests.detail(cityId, requestId),
    });
    return;
  }

  invalidateCityRequestQueries(queryClient, cityId, requestId);
}
