'use client';

import { useRouter } from '@/i18n/navigation';
import { useCityById, useJoinCity, useRBAC } from '@/hooks';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';
import {
  Newspaper,
  Bell,
  FileText,
  Users,
  GitBranch,
  TriangleAlert,
  Building2,
  CheckCircle2,
} from 'lucide-react';

interface CityHomeViewProps {
  cityId: string;
}

const SECTIONS = [
  {
    key: 'news',
    icon: <Newspaper size={28} />,
    path: '/news',
    color: 'var(--secondary)',
    bg: 'rgba(63,136,197,0.08)',
  },
  {
    key: 'alerts',
    icon: <Bell size={28} />,
    path: '/alerts',
    color: 'var(--warning-dark)',
    bg: 'rgba(255,186,8,0.08)',
  },
  {
    key: 'posts',
    icon: <FileText size={28} />,
    path: '/posts',
    color: 'var(--success)',
    bg: 'rgba(49,107,80,0.08)',
  },
  {
    key: 'community',
    icon: <Users size={28} />,
    path: '/community',
    color: 'var(--secondary-dark)',
    bg: 'rgba(63,136,197,0.06)',
  },
  {
    key: 'projects',
    icon: <GitBranch size={28} />,
    path: '/projects',
    color: 'var(--success-light)',
    bg: 'rgba(49,107,80,0.06)',
  },
  {
    key: 'problem',
    icon: <TriangleAlert size={28} />,
    path: '/problem',
    color: 'var(--danger)',
    bg: 'rgba(208,0,0,0.06)',
    featured: true,
  },
];

export default function CityHomeView(props: CityHomeViewProps) {
  const { cityId } = props;
  const t = useTranslations();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: city, isLoading } = useCityById(cityId);
  const { permissions, isLoading: isRbacLoading } = useRBAC({ cityId });
  const { mutate: joinCity, isPending: isJoining } = useJoinCity();
  const baseRoute = `/city/${cityId}`;
  const isMember = permissions && permissions.length > 0;

  const handleJoin = () => {
    joinCity(cityId, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.rbac.permissions(cityId),
        });
      },
    });
  };

  if (isLoading || isRbacLoading || !city) {
    return (
      <div className="mt-8 text-center text-sm text-[var(--muted-foreground)]">
        Loading...
      </div>
    );
  }

  return (
    <div>
      <section className="relative mb-5 flex flex-col justify-between gap-3 overflow-hidden rounded-2xl border border-black/10 bg-white p-5 text-[var(--primary)] shadow-[0_14px_30px_rgba(12,38,61,0.12)] md:flex-row md:items-center">
        <div className="absolute -left-14 -top-16 h-56 w-56 rounded-full bg-[var(--secondary)]/12 blur-2xl" />
        <div className="absolute -right-14 -bottom-20 h-56 w-56 rounded-full bg-[var(--success)]/12 blur-2xl" />
        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2">
            <Building2 size={40} className="text-[var(--secondary)]" />
            <div>
              <h1 className="text-4xl leading-tight">{city.name}</h1>
              <span className="mt-0.5 inline-flex rounded-full bg-[var(--secondary)]/12 px-2 py-0.5 text-xs text-[var(--secondary-dark)]">
                {city.region}
              </span>
            </div>
          </div>
          <p className="max-w-[520px] text-sm text-[var(--primary-light)]">
            {t('cityHome.heroText')}
          </p>
        </div>

        <div className="relative z-10">
          {!isMember ? (
            <button
              type="button"
              onClick={handleJoin}
              disabled={isJoining}
              className="rounded-lg bg-[linear-gradient(90deg,var(--secondary)_0%,var(--success)_100%)] px-4 py-2 text-sm font-bold text-white shadow-md transition hover:brightness-105 disabled:opacity-60"
            >
              {isJoining ? t('common.processing') : t('cityHome.joinCity')}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-lg bg-[linear-gradient(90deg,var(--success)_0%,var(--secondary-dark)_100%)] px-3 py-2 text-sm font-bold text-white shadow-sm">
              <CheckCircle2 size={16} />
              {t('cityHome.joined')}
            </span>
          )}
        </div>
      </section>

      <h2 className="mb-0.5 text-2xl">{t('cityHome.sectionsTitle')}</h2>
      <p className="mb-3 text-sm text-[var(--muted-foreground)]">
        {t('cityHome.sectionsSubtitle')}
      </p>
      <div className="mb-4 h-px bg-black/10" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {SECTIONS.map((section) => (
          <button
            key={section.path}
            type="button"
            onClick={() => router.push(`${baseRoute}${section.path}`)}
            className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(15,23,42,0.14)] ${
              section.featured
                ? 'border-[var(--danger)] bg-[rgba(208,0,0,0.03)] sm:col-span-2 xl:col-span-3'
                : 'border-black/10 bg-white'
            }`}
          >
            <div
              className={`mb-2 inline-flex rounded-lg p-2`}
              style={{ background: section.bg, color: section.color }}
            >
              {section.icon}
            </div>
            <h3
              className={`mb-1 text-xl ${section.featured ? 'font-bold text-[var(--danger)]' : ''}`}
            >
              {t(`cityHome.sections.${section.key}.title`)}
            </h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              {t(`cityHome.sections.${section.key}.description`)}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
