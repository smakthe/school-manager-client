import { apiFetch } from './client';
import type { LoginResponse } from '../types/api';

export const authApi = {
  login: (email: string, password: string): Promise<LoginResponse> => {
    return apiFetch<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
};
