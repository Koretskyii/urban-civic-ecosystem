import { API_BASE_URL } from '@/config';
import { HTTP_METHODS } from '@/constants/constants';
import { ERROR_MESSAGES } from '@/constants';
import { useAuthStore } from '@/store';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  isFormData?: boolean;
};

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = useAuthStore.getState().token;

    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async forceLogout(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {}
    useAuthStore.getState().logout();
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const res = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
          await this.forceLogout();
          return null;
        }

        const data = (await res.json()) as { accessToken: string };
        useAuthStore.getState().setToken(data.accessToken);
        return data.accessToken;
      } catch (error) {
        console.error('Token refresh failed:', error);
        await this.forceLogout();
        return null;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, isFormData = false } = options;

    const requestHeaders: Record<string, string> = {
      ...this.getAuthHeaders(),
      ...headers,
    };

    if (!isFormData) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      credentials: 'include',
      headers: requestHeaders,
      body: body
        ? isFormData
          ? (body as FormData)
          : JSON.stringify(body)
        : undefined,
    });

    if (!res.ok) {
      const error = await res
        .json()
        .catch(() => ({ message: ERROR_MESSAGES.NETWORK_ERROR }));

      // Handle 401: try to refresh token
      if (res.status === 401) {
        const newToken = await this.refreshAccessToken();
        if (newToken) {
          // Retry the original request with new token
          const retryHeaders: Record<string, string> = {
            Authorization: `Bearer ${newToken}`,
            ...headers,
          };
          if (!isFormData) {
            retryHeaders['Content-Type'] = 'application/json';
          }

          const retryRes = await fetch(`${this.baseUrl}${endpoint}`, {
            method,
            credentials: 'include',
            headers: retryHeaders,
            body: body
              ? isFormData
                ? (body as FormData)
                : JSON.stringify(body)
              : undefined,
          });

          if (retryRes.ok) {
            if (retryRes.status === 204) return undefined as T;
            return retryRes.json();
          }
        }
        await this.forceLogout();
      }

      throw new ApiError(
        res.status,
        error.message || ERROR_MESSAGES.UNKNOWN_ERROR,
      );
    }

    if (res.status === 204) return undefined as T;

    return res.json();
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint);
  }

  post<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, { method: HTTP_METHODS.POST, body });
  }

  postFormData<T>(endpoint: string, body: FormData) {
    return this.request<T>(endpoint, {
      method: HTTP_METHODS.POST,
      body,
      isFormData: true,
    });
  }

  put<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, { method: HTTP_METHODS.PUT, body });
  }

  patch<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, { method: HTTP_METHODS.PATCH, body });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: HTTP_METHODS.DELETE });
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
