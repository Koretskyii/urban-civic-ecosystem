'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { authApi } from '@/api/endpoints';
import { Container, Typography } from '@mui/material';
import Link from 'next/link';
import { ERROR_MESSAGES } from '@/constants';

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=lax`;
}

export default function GoogleCallbackPage() {
  const router = useRouter();
  const { setUser } = useAuthStore.getState();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleGoogleAuth() {
      try {
        // 1. Read access token from cookie (set by server during redirect)
        const accessToken = getCookie('access_token');
        if (!accessToken) {
          setError(ERROR_MESSAGES.AUTH.MISSING_TOKEN);
          return;
        }

        // 2. Delete cookie immediately — token now lives only in memory
        deleteCookie('access_token');

        // 3. Store token so apiClient includes auth header
        useAuthStore.setState({ token: accessToken });

        // 4. Fetch user profile
        const user = await authApi.getProfile();

        // 5. Store in auth state (same as local login)
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
        <Typography variant="h1">❌ Google Auth Error</Typography>
        <Typography variant="body1">{error}</Typography>
        <Link href="/auth-test" style={{ textDecoration: 'none' }}>
          ← Повернутися
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
      <Typography variant="body1">
        ⏳ Обробка Google автентифікації...
      </Typography>
    </Container>
  );
}
