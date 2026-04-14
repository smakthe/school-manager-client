import { create } from 'zustand';

interface UIState {
  sessionExpired: boolean;
  setSessionExpired: (expired: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sessionExpired: false,
  setSessionExpired: (expired) => set({ sessionExpired: expired }),
}));
