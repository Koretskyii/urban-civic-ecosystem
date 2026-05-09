import { apiClient } from '../client';
import { API_ROUTES } from '../routes';
import { City, Alert, News, Post, Community } from '@/types';

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
  getCityById: (id: string) => {
    return apiClient.get<City>(API_ROUTES.city.getById(id));
  },
  getCityAlerts: (cityId: string) => {
    return apiClient.get<Alert[]>(API_ROUTES.alerts.all(cityId));
  },
  getCityNews: (cityId: string) => {
    return apiClient.get<News[]>(API_ROUTES.news.all(cityId));
  },
  getCityPosts: (cityId: string) => {
    return apiClient.get<Post[]>(API_ROUTES.posts.all(cityId));
  },
  getCityCommunity: (cityId: string) => {
    return apiClient.get<Community>(API_ROUTES.community.detail(cityId));
  },
};
