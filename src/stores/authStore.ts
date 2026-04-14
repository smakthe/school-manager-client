import { create } from 'zustand';
import type { User } from '../types/api';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string, rememberMe: boolean) => void;
  logout: () => void;
  rehydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,

  login: (user, token, rememberMe) => {
    if (rememberMe) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));
    }
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    set({ user: null, token: null });
  },

  rehydrate: () => {
    const localToken = localStorage.getItem('token');
    const localUserStr = localStorage.getItem('user');

    const sessionToken = sessionStorage.getItem('token');
    const sessionUserStr = sessionStorage.getItem('user');

    if (localToken && localUserStr) {
      try {
        set({ token: localToken, user: JSON.parse(localUserStr) });
        return;
      } catch (e) {
        // failed parse
      }
    }

    if (sessionToken && sessionUserStr) {
      try {
        set({ token: sessionToken, user: JSON.parse(sessionUserStr) });
      } catch (e) {
        // failed parse
      }
    }
  },
}));
