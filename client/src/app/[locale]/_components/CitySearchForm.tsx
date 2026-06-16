'use client';

import { useMemo, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useCities } from '@/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export default function CitySearchForm() {
  const t = useTranslations();
  const [selectedCityId, setSelectedCityId] = useState('');
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: cities = [], isLoading } = useCities();

  const sortedCities = useMemo(
    () =>
      [...cities].sort((a, b) =>
        `${a.name} ${a.region}`.localeCompare(`${b.name} ${b.region}`, 'uk'),
      ),
    [cities],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCityId) {
      router.push(`/city/${selectedCityId}`);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center gap-4">
        <h2 className="text-2xl font-bold">{t('citySearch.title')}</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          {t('citySearch.loginRequired')}
        </p>
        <Button size="lg" onClick={() => router.push('/user/auth')}>
          {t('auth.loginTab')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-2xl font-bold">{t('citySearch.title')}</h2>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 rounded-2xl border border-black/10 bg-white p-4 shadow-sm sm:flex-row"
      >
        <div className="flex min-w-[300px] flex-col gap-2">
          <Select
            value={selectedCityId || undefined}
            onValueChange={setSelectedCityId}
            disabled={isLoading}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder={t('common.select')} />
            </SelectTrigger>
            <SelectContent>
              {sortedCities.map((city) => (
                <SelectItem
                  key={city.id}
                  value={city.id}
                  className="py-2 pl-10 pr-3 text-base"
                >
                  {`${city.name} (${city.region})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!isLoading && sortedCities.length === 0 ? (
            <p className="text-xs text-[var(--muted-foreground)]">
              {t('citySearch.noOptions')}
            </p>
          ) : null}
          {isLoading ? (
            <p className="text-xs text-[var(--muted-foreground)]">
              {t('citySearch.loading')}
            </p>
          ) : null}
        </div>
        <Button
          type="submit"
          disabled={isLoading}
          size="lg"
          className="text-sm"
        >
          {t('common.select')}
        </Button>
      </form>
    </div>
  );
}
