'use client';

import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { useJoinCity } from '@/hooks';
import { queryKeys } from '@/api/queryKeys';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Users } from 'lucide-react';

interface CityJoinGateProps {
  cityId: string;
  cityName?: string;
  cityRegion?: string;
}

export function CityJoinGate({
  cityId,
  cityName,
  cityRegion,
}: CityJoinGateProps) {
  const t = useTranslations('cityJoinGate');
  const queryClient = useQueryClient();
  const { mutate: joinCity, isPending } = useJoinCity();

  const handleJoin = () => {
    joinCity(cityId, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.rbac.permissions(cityId),
        });
      },
    });
  };

  return (
    <div className="flex min-h-[80vh] flex-1 items-center justify-center bg-white p-6">
      <div className="w-full max-w-md rounded-2xl border border-[var(--secondary)]/15 bg-[var(--surface-1)] p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--secondary)]/12 text-[var(--secondary)]">
          <Building2 size={28} />
        </div>
        {cityName ? (
          <h1 className="text-2xl font-semibold text-[var(--primary)]">
            {cityName}
          </h1>
        ) : null}
        {cityRegion ? (
          <div className="mt-2">
            <Badge variant="secondary">{cityRegion}</Badge>
          </div>
        ) : null}
        <p className="mt-4 text-sm text-[var(--primary-light)]">
          {t('description')}
        </p>
        <Button className="mt-6" onClick={handleJoin} disabled={isPending}>
          <Users size={16} className="mr-2" />
          {isPending ? t('joining') : t('join')}
        </Button>
      </div>
    </div>
  );
}
