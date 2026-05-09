import { useQuery } from '@tanstack/react-query';
import { cityApi } from '@/api/endpoints/city.api';
import { queryKeys } from '@/api/queryKeys';
import { City } from '@/types';

export function useCities() {
  return useQuery({
    queryKey: queryKeys.cities.all(),
    queryFn: async () => {
      const response: City[] = await cityApi.getAllCities();
      console.log(response)
      return response;
    },
  });
}

export function useCityById(id: string) {
  return useQuery({
    queryKey: queryKeys.cities.detail(id),
    queryFn: () => cityApi.getCityById(id),
    enabled: !!id,
  });
}
