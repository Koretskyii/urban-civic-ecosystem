'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';
import {
  useCityAlerts,
  useCityById,
  useCityNews,
  useCityRequestsList,
  useJoinCity,
  useRBAC,
} from '@/hooks';
import { queryKeys } from '@/api/queryKeys';
import { inferRoleFromPermissions } from '@/constants/rbac.const';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Bell,
  Building2,
  ClipboardList,
  MapPinned,
  Newspaper,
  Users,
} from 'lucide-react';
import type { Alert, CityRequestListItem, News } from '@/types';
import { AsyncListState } from './_components/AsyncListState/AsyncListState';
import { AlertPreview } from './_components/AlertPreview/AlertPreview';
import { ContentCard } from './_components/ContentCard/ContentCard';
import { NewsPreview } from './_components/NewsPreview/NewsPreview';
import { RequestPreview } from './_components/RequestPreview/RequestPreview';
import { RolePanel } from './_components/RolePanel/RolePanel';
import type { CityHomeViewProps } from './types/CityHomeView.types';

const CityRequestsOverviewMap = dynamic(
  () =>
    import('./_components/CityRequestsOverviewMap/CityRequestsOverviewMap').then(
      (module) => module.CityRequestsOverviewMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-[var(--muted-foreground)]">
        Loading...
      </div>
    ),
  },
);

const isUsableCityCenter = (lat: unknown, lng: unknown) => {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    lat !== 0 &&
    lng !== 0
  );
};

const hasValidRequestCoordinates = (request: CityRequestListItem) => {
  return (
    typeof request.locationLat === 'number' &&
    typeof request.locationLng === 'number' &&
    Number.isFinite(request.locationLat) &&
    Number.isFinite(request.locationLng) &&
    request.locationLat >= -90 &&
    request.locationLat <= 90 &&
    request.locationLng >= -180 &&
    request.locationLng <= 180
  );
};

export default function CityHomeView({ cityId }: CityHomeViewProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: city, isLoading: isCityLoading } = useCityById(cityId);
  const { permissions, role, isLoading: isRbacLoading } = useRBAC({ cityId });
  const effectiveRole = role ?? inferRoleFromPermissions(permissions);
  const isMember = Boolean(effectiveRole || permissions.length > 0);
  const { mutate: joinCity, isPending: isJoining } = useJoinCity();
  const contentEnabled = Boolean(cityId && isMember);

  const newsQuery = useCityNews(
    cityId,
    { includeDeleted: false },
    { enabled: contentEnabled },
  );
  const alertsQuery = useCityAlerts(
    cityId,
    { includeDeleted: false, onlyActive: true },
    { enabled: contentEnabled },
  );
  const requestsQuery = useCityRequestsList(
    cityId,
    { scope: 'all' },
    { enabled: contentEnabled },
  );

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    [locale],
  );
  const latestNews = (newsQuery.data ?? []).slice(0, 4);
  const activeAlerts = (alertsQuery.data ?? []).slice(0, 5);
  const latestRequests = (requestsQuery.data ?? []).slice(0, 3);
  const requestsWithCoordinates = (requestsQuery.data ?? []).filter(
    hasValidRequestCoordinates,
  );
  const cityDefaultCenter = useMemo(() => {
    if (isUsableCityCenter(city?.centerLat, city?.centerLng)) {
      return { lat: city?.centerLat as number, lng: city?.centerLng as number };
    }
    return undefined;
  }, [city?.centerLat, city?.centerLng]);

  const baseRoute = `/city/${cityId}`;
  const handleJoin = () => {
    joinCity(cityId, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.rbac.permissions(cityId),
        });
      },
    });
  };
  const openRequest = (requestId: string) => {
    router.push(`${baseRoute}/city-requests/${requestId}`);
  };

  if (isCityLoading || isRbacLoading || !city) {
    return (
      <div className="mt-8 text-center text-sm text-[var(--muted-foreground)]">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_14px_30px_rgba(12,38,61,0.10)]">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)]">
          <div className="p-5 md:p-6">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{city.region}</Badge>
              <Badge variant={isMember ? 'success' : 'outline'}>
                {isMember ? t('cityHome.joined') : t('cityHome.notJoined')}
              </Badge>
            </div>
            <div className="mb-4 flex items-start gap-3">
              <div className="rounded-lg bg-[var(--secondary)]/12 p-2 text-[var(--secondary)]">
                <Building2 size={34} />
              </div>
              <div>
                <h1 className="text-4xl leading-tight text-[var(--primary)]">
                  {city.name}
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-[var(--primary-light)]">
                  {t('cityHome.heroText')}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {!isMember ? (
                <Button onClick={handleJoin} disabled={isJoining}>
                  <Users size={16} className="mr-2" />
                  {isJoining ? t('common.processing') : t('cityHome.joinCity')}
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => router.push(`${baseRoute}/city-requests`)}
                  >
                    <ClipboardList size={16} className="mr-2" />
                    {t('cityHome.actions.reportProblem')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`${baseRoute}/news`)}
                  >
                    <Newspaper size={16} className="mr-2" />
                    {t('cityHome.actions.readNews')}
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="border-t border-black/10 bg-[var(--surface-2)] p-5 lg:border-l lg:border-t-0">
            <RolePanel role={effectiveRole} isMember={isMember} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <ContentCard
          title={t('cityHome.latestNews.title')}
          description={t('cityHome.latestNews.description')}
          icon={<Newspaper size={18} />}
          actionLabel={t('cityHome.actions.openNews')}
          onAction={() => router.push(`${baseRoute}/news`)}
        >
          <AsyncListState
            enabled={contentEnabled}
            isLoading={newsQuery.isLoading}
            isError={newsQuery.isError}
            empty={latestNews.length === 0}
            disabledText={t('cityHome.privateContentHint')}
            emptyText={t('news.empty')}
            errorText={t('news.loadError')}
          >
            <div className="grid gap-3 md:grid-cols-2">
              {latestNews.map((item: News) => (
                <NewsPreview
                  key={item.id}
                  item={item}
                  dateFormatter={dateFormatter}
                  onOpen={() => router.push(`${baseRoute}/news/${item.id}`)}
                />
              ))}
            </div>
          </AsyncListState>
        </ContentCard>

        <ContentCard
          title={t('cityHome.activeAlerts.title')}
          description={t('cityHome.activeAlerts.description')}
          icon={<Bell size={18} />}
          actionLabel={t('cityHome.actions.openAlerts')}
          onAction={() => router.push(`${baseRoute}/alerts`)}
        >
          <AsyncListState
            enabled={contentEnabled}
            isLoading={alertsQuery.isLoading}
            isError={alertsQuery.isError}
            empty={activeAlerts.length === 0}
            disabledText={t('cityHome.privateContentHint')}
            emptyText={t('alerts.empty')}
            errorText={t('alerts.loadError')}
          >
            <div className="space-y-2">
              {activeAlerts.map((item: Alert) => (
                <AlertPreview
                  key={item.id}
                  item={item}
                  onOpen={() => router.push(`${baseRoute}/alerts/${item.id}`)}
                />
              ))}
            </div>
          </AsyncListState>
        </ContentCard>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <ContentCard
          title={t('cityHome.latestRequests.title')}
          description={t('cityHome.latestRequests.description')}
          icon={<ClipboardList size={18} />}
          actionLabel={t('cityHome.actions.openRequests')}
          onAction={() => router.push(`${baseRoute}/city-requests`)}
        >
          <AsyncListState
            enabled={contentEnabled}
            isLoading={requestsQuery.isLoading}
            isError={requestsQuery.isError}
            empty={latestRequests.length === 0}
            disabledText={t('cityHome.privateContentHint')}
            emptyText={t('cityProblem.empty')}
            errorText={t('cityProblem.loadError')}
          >
            <div className="space-y-2">
              {latestRequests.map((item: CityRequestListItem) => (
                <RequestPreview
                  key={item.id}
                  item={item}
                  dateFormatter={dateFormatter}
                  onOpen={openRequest}
                />
              ))}
            </div>
          </AsyncListState>
        </ContentCard>

        <ContentCard
          title={t('cityHome.requestsMap.title')}
          description={t('cityHome.requestsMap.description')}
          icon={<MapPinned size={18} />}
          actionLabel={t('cityHome.actions.openRequests')}
          onAction={() => router.push(`${baseRoute}/city-requests`)}
        >
          <AsyncListState
            enabled={contentEnabled}
            isLoading={requestsQuery.isLoading}
            isError={requestsQuery.isError}
            empty={requestsWithCoordinates.length === 0}
            disabledText={t('cityHome.privateContentHint')}
            emptyText={t('cityHome.requestsMap.empty')}
            errorText={t('cityProblem.loadError')}
          >
            <div className="h-[360px] overflow-hidden rounded-lg border border-black/10">
              <CityRequestsOverviewMap
                requests={requestsWithCoordinates}
                defaultCenter={cityDefaultCenter}
                onRequestOpen={openRequest}
              />
            </div>
          </AsyncListState>
        </ContentCard>
      </section>
    </div>
  );
}
