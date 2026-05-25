import { apiClient } from '../client';
import { API_ROUTES } from '../routes';
import {
  City,
  Alert,
  News,
  NewsListQuery,
  CreateNewsPayload,
  UpdateNewsPayload,
  Post,
  Community,
  DomainVerificationData,
} from '@/types';

const buildNewsQuery = (query?: NewsListQuery) => {
  if (!query) {
    return '';
  }

  const params = new URLSearchParams();
  if (query.includeDeleted !== undefined) {
    params.set('includeDeleted', String(query.includeDeleted));
  }
  if (query.search) {
    params.set('search', query.search);
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

export const cityApi = {
  generateDomainToken: (domain: string) => {
    return apiClient.post(API_ROUTES.city.generateDomainToken, { domain });
  },
  verifyDomain: (data: DomainVerificationData) => {
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
  joinCity: (id: string) => {
    return apiClient.post(API_ROUTES.city.join(id), {});
  },
  getCityAlerts: (cityId: string) => {
    return apiClient.get<Alert[]>(API_ROUTES.alerts.all(cityId));
  },
  getCityNews: (cityId: string, query?: NewsListQuery) => {
    return apiClient.get<News[]>(
      `${API_ROUTES.news.all(cityId)}${buildNewsQuery(query)}`,
    );
  },
  getCityNewsById: (cityId: string, newsId: string) => {
    return apiClient.get<News>(API_ROUTES.news.detail(cityId, newsId));
  },
  createCityNews: (cityId: string, payload: CreateNewsPayload) => {
    return apiClient.post<News>(API_ROUTES.news.all(cityId), payload);
  },
  updateCityNews: (
    cityId: string,
    newsId: string,
    payload: UpdateNewsPayload,
  ) => {
    return apiClient.patch<News>(
      API_ROUTES.news.detail(cityId, newsId),
      payload,
    );
  },
  deleteCityNews: (cityId: string, newsId: string) => {
    return apiClient.delete<{ success: boolean; deleted: boolean }>(
      API_ROUTES.news.detail(cityId, newsId),
    );
  },
  getCityPosts: (cityId: string) => {
    return apiClient.get<Post[]>(API_ROUTES.posts.all(cityId));
  },
  getCityCommunity: (cityId: string) => {
    return apiClient.get<Community>(API_ROUTES.community.detail(cityId));
  },
};
