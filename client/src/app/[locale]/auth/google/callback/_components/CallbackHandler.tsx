'use client';

import { useEffect, useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuthStore } from '@/store';
import { authApi } from '@/api/endpoints';
import { Container, Typography } from '@mui/material';
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

    handleGoogleAuth();
  }, [router, setUser]);

  if (error) {
    return (
      <Container sx={{ maxWidth: 520, margin: '40px auto' }}>
        <Typography variant="h1">{t('googleCallback.errorTitle')}</Typography>
        <Typography variant="body1">{error}</Typography>
        <Link href="/user/auth" style={{ textDecoration: 'none' }}>
          {t('googleCallback.back')}
        </Link>
      </Container>
    );
  }

  return (
    <Container
      sx={{
        maxWidth: 520,
        margin: '40px auto',
        textAlign: 'center',
      }}
    >
      <Typography variant="body1">{t('googleCallback.processing')}</Typography>
    </Container>
  );
}
