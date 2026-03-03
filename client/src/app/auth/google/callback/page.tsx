'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';

export default function GoogleCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setUser } = useAuthStore.getState();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const userParam = searchParams.get('user');

    if (accessToken && userParam) {
      try {
        const user = JSON.parse(userParam);
        setUser(user, accessToken);
        router.replace('/auth-test');
      } catch {
        setError('Помилка обробки даних від Google');
      }
    } else {
      setError('Токен або дані користувача відсутні');
    }
  }, [searchParams, router, setUser]);

  if (error) {
    return (
      <div
        style={{ maxWidth: 520, margin: '40px auto', fontFamily: 'monospace' }}
      >
        <h1>❌ Google Auth Error</h1>
        <p>{error}</p>
        <a href="/auth-test">← Повернутися</a>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 520,
        margin: '40px auto',
        fontFamily: 'monospace',
        textAlign: 'center',
      }}
    >
      <p>⏳ Обробка Google автентифікації...</p>
    </div>
  );
}
