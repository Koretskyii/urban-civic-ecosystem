import { apiClient } from '../client';
import { API_ROUTES } from '../routes';
import { City } from '@/store';

export const cityApi = {
  generateDomainToken: (domain: string) => {
    return apiClient.post(API_ROUTES.city.generateDomainToken, { domain });
  },
  verifyDomain: (data: { domain: string; token: string }) => {
    return apiClient.post(API_ROUTES.city.verifyDomain, data);
  },
  initializeCity: (data: FormData) => {
    return apiClient.postFormData(API_ROUTES.city.initializeCity, data);
  },
  getAllCities: () => {
    return apiClient.get<City[]>(API_ROUTES.city.getAll);
  },
};
