import { create } from 'zustand';

type Theme = 'dark' | 'light' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set) => {
  const savedTheme = localStorage.getItem('theme') as Theme | null;
  
  return {
    theme: savedTheme || 'system',
    setTheme: (theme: Theme) => {
      localStorage.setItem('theme', theme);
      set({ theme });
    },
  };
});
