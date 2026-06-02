'use client';

import { useCurrentUser, useLogout } from '@/hooks';
import { useAuthStore } from '@/store';
import { useRouter } from '@/i18n/navigation';
import { useState } from 'react';
import ChangePasswordDialog from '@/components/ChangePasswordDialog';
import { useLocale, useTranslations } from 'next-intl';
import { Shield } from 'lucide-react';

interface InfoRowProps {
  label: string;
  value: string;
  mono?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateString: string, locale: string): string {
  return new Date(dateString).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-6">
      <div className="rounded-xl border border-black/10 bg-white p-6">
        <div className="mx-auto h-24 w-24 animate-pulse rounded-full bg-black/10" />
        <div className="mx-auto mt-3 h-8 w-44 animate-pulse rounded bg-black/10" />
        <div className="mx-auto mt-2 h-5 w-56 animate-pulse rounded bg-black/10" />
        <div className="my-4 h-px bg-black/10" />
        <div className="space-y-2">
          <div className="h-14 animate-pulse rounded-lg bg-black/10" />
          <div className="h-14 animate-pulse rounded-lg bg-black/10" />
          <div className="h-14 animate-pulse rounded-lg bg-black/10" />
        </div>
      </div>
    </div>
  );
}

export default function UserProfilePage() {
  const t = useTranslations();
  const locale = useLocale();
  const { data: profile, isLoading } = useCurrentUser();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useLogout();
  const router = useRouter();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => router.replace('/user/auth'),
    });
  };

  if (isLoading) return <ProfileSkeleton />;

  if (!isAuthenticated || !profile) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-6 text-center">
        <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-2 flex justify-center text-black/40">
            <Shield size={56} />
          </div>
          <h2 className="text-2xl">{t('profile.authRequiredTitle')}</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            {t('profile.authRequiredSubtitle')}
          </p>
          <button
            type="button"
            onClick={() => router.push('/user/auth')}
            className="mt-4 h-10 rounded-md bg-[var(--primary)] px-4 text-sm font-semibold text-white"
          >
            {t('profile.loginAction')}
          </button>
        </div>
      </div>
    );
  }

  const isGoogleUser = profile.provider === 'google';

  return (
    <>
      <div className="mx-auto w-full max-w-xl px-4 py-6">
        <div className="rounded-xl border border-black/10 bg-gradient-to-br from-[#0C263D08] to-[#3F88C512] p-6 shadow-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--primary)] text-3xl font-bold text-white shadow-[0_4px_14px_rgba(12,38,61,0.25)]">
              {getInitials(profile.name)}
            </div>
            <h1 className="text-center text-3xl">{profile.name}</h1>
            <div
              className={`rounded-full border px-3 py-1 text-xs ${
                isGoogleUser
                  ? 'border-[var(--secondary)] text-[var(--secondary-dark)]'
                  : 'border-[var(--success)] text-[var(--success)]'
              }`}
            >
              {isGoogleUser
                ? t('profile.googleAccount')
                : t('profile.localAccount')}
            </div>
          </div>

          <div className="my-4 h-px bg-black/10" />

          <div className="space-y-2">
            <InfoRow label={t('profile.emailLabel')} value={profile.email} />
            <InfoRow label={t('profile.idLabel')} value={profile.id} mono />
            {profile.createdAt ? (
              <InfoRow
                label={t('profile.registeredLabel')}
                value={formatDate(profile.createdAt, locale)}
              />
            ) : null}
          </div>

          <div className="my-4 h-px bg-black/10" />

          <div className="space-y-2">
            {!isGoogleUser ? (
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="h-11 w-full rounded-md border border-black/20 px-4 text-sm font-semibold"
              >
                {t('profile.changePassword')}
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleLogout}
              disabled={logout.isPending}
              className="h-11 w-full rounded-md border border-[var(--danger)] px-4 text-sm font-semibold text-[var(--danger)] disabled:opacity-60"
            >
              {logout.isPending
                ? t('profile.logoutPending')
                : t('profile.logout')}
            </button>
          </div>
        </div>
      </div>
      <ChangePasswordDialog
        isOpenValue={isPasswordModalOpen}
        setIsOpenValue={setIsPasswordModalOpen}
      />
    </>
  );
}

function InfoRow({ label, value, mono = false }: InfoRowProps) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-3">
      <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
      <p
        className={`truncate text-sm ${mono ? 'font-mono text-xs' : 'font-normal'}`}
      >
        {value}
      </p>
    </div>
  );
}
