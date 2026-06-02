'use client';

import { useState } from 'react';
import { useLogin, useRegister } from '@/hooks';
import { useRouter } from '@/i18n/navigation';
import { API_BASE_URL } from '@/config';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AuthPage() {
  const t = useTranslations();
  const [tab, setTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = useLogin();
  const register = useRegister();
  const router = useRouter();

  const isRegister = tab === 0;
  const isPending = login.isPending || register.isPending;
  const error = login.error || register.error;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      register.mutate(
        { name, email, password },
        { onSuccess: () => router.push('/user/profile') },
      );
      return;
    }

    login.mutate(
      { email, password },
      { onSuccess: () => router.push('/user/profile') },
    );
  };

  const handleTabChange = (newValue: number) => {
    setTab(newValue);
    login.reset();
    register.reset();
  };

  return (
    <div className="mx-auto w-full max-w-xs px-4 py-8">
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-[0_12px_30px_rgba(12,38,61,0.12)]">
        <h1 className="mb-1 text-center text-3xl">{t('app.shortName')}</h1>
        <p className="mb-3 text-center text-sm text-[var(--muted-foreground)]">
          {t('app.tagline')}
        </p>

        <div className="mb-3 grid grid-cols-2 rounded-md bg-black/5 p-1">
          <button
            type="button"
            onClick={() => handleTabChange(0)}
            className={`rounded px-3 py-2 text-sm font-semibold transition-colors ${
              tab === 0
                ? 'bg-white text-[var(--primary-light)] shadow-sm'
                : 'text-[var(--muted-foreground)]'
            }`}
          >
            {t('auth.registerTab')}
          </button>
          <button
            type="button"
            onClick={() => handleTabChange(1)}
            className={`rounded px-3 py-2 text-sm font-semibold transition-colors ${
              tab === 1
                ? 'bg-white text-[var(--primary-light)] shadow-sm'
                : 'text-[var(--muted-foreground)]'
            }`}
          >
            {t('auth.loginTab')}
          </button>
        </div>

        {error ? (
          <p className="mb-2 rounded-md border border-[var(--danger-light)] bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger-dark)]">
            {(error as Error).message}
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-2">
          {isRegister ? (
            <label className="block">
              <span className="mb-1 block text-sm text-[var(--muted-foreground)]">
                {t('auth.nameLabel')}
              </span>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                autoComplete="name"
                className="h-11"
              />
            </label>
          ) : null}

          <label className="block">
            <span className="mb-1 block text-sm text-[var(--muted-foreground)]">
              {t('auth.emailLabel')}
            </span>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus={!isRegister}
              className="h-11"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-[var(--muted-foreground)]">
              {t('auth.passwordLabel')}
            </span>
            <div className="flex h-11 items-center rounded-md border border-black/15 px-3 transition-colors focus-within:border-[var(--secondary)]">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                className="h-full w-full border-none bg-transparent text-sm outline-none focus:border-transparent focus:outline-none focus:ring-0"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="ml-2 text-xs text-[var(--muted-foreground)]"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          <Button
            type="submit"
            disabled={isPending}
            size="lg"
            className="mt-1 w-full text-sm"
          >
            {isPending
              ? t('common.processing')
              : isRegister
                ? t('auth.register')
                : t('auth.login')}
          </Button>
        </form>

        <div className="my-3 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <div className="h-px flex-1 bg-black/10" />
          <span>{t('common.or')}</span>
          <div className="h-px flex-1 bg-black/10" />
        </div>

        <Button asChild variant="outline" size="lg" className="w-full text-sm">
          <a href={`${API_BASE_URL}/auth/google`}>
            {t('auth.loginWithGoogle')}
          </a>
        </Button>
      </div>
    </div>
  );
}
