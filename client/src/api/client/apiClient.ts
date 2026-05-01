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

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = useAuthStore.getState().token;

    return token ? { Authorization: `Bearer ${token}` } : {};
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
