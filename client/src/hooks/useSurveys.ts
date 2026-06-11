import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { queryKeys } from '@/api';
import { citySurveysApi } from '@/api/endpoints/city-surveys.api';
import type {
  CastVotePayload,
  CreateSurveyPayload,
  SurveyListQuery,
  UpdateSurveyPayload,
} from '@/types';

const invalidateSurveyQueries = async (
  queryClient: ReturnType<typeof useQueryClient>,
  cityId: string,
  surveyId?: string,
) => {
  const tasks: Array<Promise<unknown>> = [
    queryClient.invalidateQueries({ queryKey: queryKeys.surveys.all(cityId) }),
  ];
  if (surveyId) {
    tasks.push(
      queryClient.invalidateQueries({
        queryKey: queryKeys.surveys.detail(cityId, surveyId),
      }),
    );
  }
  await Promise.all(tasks);
};

export function useInfiniteCitySurveys(
  cityId: string,
  query?: SurveyListQuery,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;
  const baseQuery = { limit: 40, ...query };

  return useInfiniteQuery({
    queryKey: queryKeys.surveys.list(cityId, baseQuery),
    queryFn: ({ pageParam }) =>
      citySurveysApi.getCitySurveys(cityId, {
        ...baseQuery,
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: enabled && !!cityId,
    placeholderData: (previousData) => previousData,
  });
}

export function useSurveyDetail(
  cityId: string,
  surveyId: string,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: queryKeys.surveys.detail(cityId, surveyId),
    queryFn: () => citySurveysApi.getSurveyById(cityId, surveyId),
    enabled: enabled && Boolean(cityId && surveyId),
  });
}

export function useCreateSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cityId,
      payload,
    }: {
      cityId: string;
      payload: CreateSurveyPayload;
    }) => citySurveysApi.createSurvey(cityId, payload),
    onSuccess: async (_data, variables) => {
      await invalidateSurveyQueries(queryClient, variables.cityId);
    },
  });
}

export function useUpdateSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cityId,
      surveyId,
      payload,
    }: {
      cityId: string;
      surveyId: string;
      payload: UpdateSurveyPayload;
    }) => citySurveysApi.updateSurvey(cityId, surveyId, payload),
    onSuccess: async (_data, variables) => {
      await invalidateSurveyQueries(
        queryClient,
        variables.cityId,
        variables.surveyId,
      );
    },
  });
}

export function useCloseSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cityId, surveyId }: { cityId: string; surveyId: string }) =>
      citySurveysApi.closeSurvey(cityId, surveyId),
    onSuccess: async (_data, variables) => {
      await invalidateSurveyQueries(
        queryClient,
        variables.cityId,
        variables.surveyId,
      );
    },
  });
}

export function useDeleteSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cityId, surveyId }: { cityId: string; surveyId: string }) =>
      citySurveysApi.deleteSurvey(cityId, surveyId),
    onSuccess: async (_data, variables) => {
      await invalidateSurveyQueries(queryClient, variables.cityId);
    },
  });
}

export function useCastVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cityId,
      surveyId,
      payload,
    }: {
      cityId: string;
      surveyId: string;
      payload: CastVotePayload;
    }) => citySurveysApi.castVote(cityId, surveyId, payload),
    onSuccess: async (_data, variables) => {
      await invalidateSurveyQueries(
        queryClient,
        variables.cityId,
        variables.surveyId,
      );
    },
  });
}

export function useRetractVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cityId, surveyId }: { cityId: string; surveyId: string }) =>
      citySurveysApi.retractVote(cityId, surveyId),
    onSuccess: async (_data, variables) => {
      await invalidateSurveyQueries(
        queryClient,
        variables.cityId,
        variables.surveyId,
      );
    },
  });
}
