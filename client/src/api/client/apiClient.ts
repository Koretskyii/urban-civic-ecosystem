import { API_BASE_URL } from '@/config';
import { HTTP_METHODS } from '@/constants';
import { useAuthStore } from '@/store';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
};

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = useAuthStore.getState().token;

    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const error = await res
        .json()
        .catch(() => ({ message: 'Network error' }));
      throw new ApiError(res.status, error.message || 'Something went wrong');
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
