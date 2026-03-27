import { apiClient } from '../client';
import { API_ROUTES } from '../routes';

export const cityApi = {
  generateDomainToken: (domain: string) => {
    return apiClient.post(API_ROUTES.city.generateDomainToken, { domain });
  },
  verifyDomain: (data: { domain: string; token: string }) => {
    return apiClient.post(API_ROUTES.city.verifyDomain, data);
  },
};
