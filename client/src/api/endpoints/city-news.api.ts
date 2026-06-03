import {
  CreateNewsPayload,
  News,
  NewsListQuery,
  UpdateNewsPayload,
} from '@/types';
import { apiClient } from '..';
import { API_ROUTES } from '../routes';

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

export const cityNewsApi = {
  getCityNews: (cityId: string, query?: NewsListQuery) => {
    return apiClient.get<News[]>(
      `${API_ROUTES.news.all(cityId)}${buildNewsQuery(query)}`,
    );
  },
  getCityNewsById: (cityId: string, newsId: string) => {
    return apiClient.get<News>(API_ROUTES.news.detail(cityId, newsId));
  },
  createCityNews: (cityId: string, formData: FormData) => {
    return apiClient.postFormData<News>(API_ROUTES.news.all(cityId), formData);
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
  buildCreateNewsFormData: (payload: CreateNewsPayload, files: File[] = []) => {
    const formData = new FormData();
    formData.set('title', payload.title);
    formData.set('content', payload.content);
    files.forEach((file) => formData.append('files', file));
    return formData;
  },
};
