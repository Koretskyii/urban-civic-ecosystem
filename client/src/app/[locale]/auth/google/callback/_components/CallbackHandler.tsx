'use client';

import { useEffect, useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuthStore } from '@/store';
import { authApi } from '@/api/endpoints';
import { ERROR_MESSAGES } from '@/constants';
import { useTranslations } from 'next-intl';

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export default function GoogleCallbackPage() {
  const t = useTranslations();
  const router = useRouter();
  const { setUser } = useAuthStore.getState();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleGoogleAuth() {
      try {
        const accessToken = getCookie('access_token');
        if (!accessToken) {
          setError(ERROR_MESSAGES.AUTH.MISSING_TOKEN);
          return;
        }
        useAuthStore.setState({ token: accessToken });
        const user = await authApi.getProfile();
        setUser(user, accessToken);
        router.replace('/user/profile');
      } catch {
        setError(ERROR_MESSAGES.AUTH.GOOGLE_AUTH_FAILED);
      }
    }
    void handleGoogleAuth();
  }, [router, setUser]);

  if (error) {
    return (
      <div className="mx-auto mt-10 max-w-[520px]">
        <h1 className="text-3xl">{t('googleCallback.errorTitle')}</h1>
        <p className="mt-2 text-sm">{error}</p>
        <Link href="/user/auth" className="mt-3 inline-block underline">
          {t('googleCallback.back')}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-10 max-w-[520px] text-center">
      <p className="text-sm">{t('googleCallback.processing')}</p>
    </div>
  );
}
