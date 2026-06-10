import { apiClient } from '../client';
import { API_ROUTES } from '../routes';
import {
  City,
  CityCreationRequestTracking,
  DomainVerificationData,
  DomainVerificationResult,
  DomainVerificationToken,
} from '@/types';

export const cityApi = {
  generateDomainToken: (domain: string) => {
    return apiClient.post<DomainVerificationToken>(
      API_ROUTES.city.generateDomainToken,
      { domain },
    );
  },
  verifyDomain: (data: DomainVerificationData) => {
    return apiClient.post<DomainVerificationResult>(
      API_ROUTES.city.verifyDomain,
      data,
    );
  },
  initializeCity: (data: FormData) => {
    return apiClient.postFormData(API_ROUTES.city.initializeCity, data);
  },
  getCurrentCityCreationRequest: () => {
    return apiClient.get<CityCreationRequestTracking | null>(
      API_ROUTES.city.currentCreationRequest,
    );
  },
  getAllCities: () => {
    return apiClient.get<City[]>(API_ROUTES.city.getAll);
  },
  getCityById: (id: string) => {
    return apiClient.get<City>(API_ROUTES.city.getById(id));
  },
  joinCity: (id: string) => {
    return apiClient.post(API_ROUTES.city.join(id), {});
  },
};
