import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Navbar />
      <main className="flex-1 p-6 md:p-8 container mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
