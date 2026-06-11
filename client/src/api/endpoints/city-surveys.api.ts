import type {
  CastVotePayload,
  CreateSurveyPayload,
  PaginatedResponse,
  Survey,
  SurveyListQuery,
  UpdateSurveyPayload,
} from '@/types';
import { apiClient } from '..';
import { API_ROUTES } from '../routes';

const buildSurveysQuery = (query?: SurveyListQuery): string => {
  if (!query) return '';

  const params = new URLSearchParams();
  if (query.includeDeleted !== undefined) {
    params.set('includeDeleted', String(query.includeDeleted));
  }
  if (query.status) params.set('status', query.status);
  if (query.search) params.set('search', query.search);
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.cursor) params.set('cursor', query.cursor);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortOrder) params.set('sortOrder', query.sortOrder);

  const qs = params.toString();
  return qs ? `?${qs}` : '';
};

export const buildSurveysListPath = (cityId: string, query?: SurveyListQuery) =>
  `${API_ROUTES.surveys.all(cityId)}${buildSurveysQuery(query)}`;

export const citySurveysApi = {
  getCitySurveys: (cityId: string, query?: SurveyListQuery) =>
    apiClient.get<PaginatedResponse<Survey>>(
      buildSurveysListPath(cityId, query),
    ),

  getSurveyById: (cityId: string, surveyId: string) =>
    apiClient.get<Survey>(API_ROUTES.surveys.detail(cityId, surveyId)),

  createSurvey: (cityId: string, payload: CreateSurveyPayload) =>
    apiClient.post<Survey>(API_ROUTES.surveys.all(cityId), payload),

  updateSurvey: (
    cityId: string,
    surveyId: string,
    payload: UpdateSurveyPayload,
  ) =>
    apiClient.patch<Survey>(
      API_ROUTES.surveys.detail(cityId, surveyId),
      payload,
    ),

  closeSurvey: (cityId: string, surveyId: string) =>
    apiClient.post<{ success: boolean; alreadyClosed: boolean }>(
      API_ROUTES.surveys.close(cityId, surveyId),
      {},
    ),

  deleteSurvey: (cityId: string, surveyId: string) =>
    apiClient.delete<{ success: boolean; deleted: boolean }>(
      API_ROUTES.surveys.detail(cityId, surveyId),
    ),

  castVote: (cityId: string, surveyId: string, payload: CastVotePayload) =>
    apiClient.post<{ success: boolean; changed: boolean }>(
      API_ROUTES.surveys.vote(cityId, surveyId),
      payload,
    ),

  retractVote: (cityId: string, surveyId: string) =>
    apiClient.delete<{ success: boolean; retracted: boolean }>(
      API_ROUTES.surveys.vote(cityId, surveyId),
    ),
};
