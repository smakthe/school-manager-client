import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import type { ApiValidationError } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const { token } = useAuthStore.getState();

  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    useUIStore.getState().setSessionExpired(true);
    throw new Error('Unauthorized');
  }

  if (response.status === 403) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Forbidden');
  }

  if (response.status === 422) {
    const data: ApiValidationError = await response.json();
    throw data; // Throw the structured error object
  }

  if (response.status === 204) {
    return {} as T;
  }

  if (!response.ok) {
    let errorMsg = `Server error: ${response.status}`;
    try {
      const data = await response.json();
      if (data.error) errorMsg = data.error;
    } catch (e) {
      // Ignore
    }
    throw new Error(errorMsg);
  }

  return response.json();
}
