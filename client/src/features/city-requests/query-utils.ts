import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';

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
