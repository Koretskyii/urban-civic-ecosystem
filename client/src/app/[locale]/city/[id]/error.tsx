'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/feedback/ErrorState';

export default function CityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorState reset={reset} />;
}
