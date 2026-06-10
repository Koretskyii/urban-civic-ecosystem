import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/config';

export class ServerFetchError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ServerFetchError';
  }
}

/**
 * Server-side fetch to the API, authenticated via the `access_token` cookie.
 * Returns the raw JSON body — the same shape the browser `apiClient` produces —
 * so results can be dehydrated into React Query and hydrated on the client.
 * Throws {@link ServerFetchError} (with the HTTP status) on a non-OK response.
 */
export async function serverApiFetch<T>(path: string): Promise<T> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: accessToken ? { Cookie: `access_token=${accessToken}` } : {},
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new ServerFetchError(
      response.status,
      `Server fetch failed (${response.status}): ${path}`,
    );
  }

  return response.json() as Promise<T>;
}
