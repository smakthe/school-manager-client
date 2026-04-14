import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { SessionExpiredModal } from './components/shared/SessionExpiredModal';
import { useThemeStore } from './stores/themeStore';

function App() {
  const { theme } = useThemeStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  return (
    <>
      <Outlet />
      <SessionExpiredModal />
      <Toaster />
    </>
  );
}

export default App;
