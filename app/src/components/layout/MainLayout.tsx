import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden text-slate-800 font-sans">
      <Sidebar />
      <div className="flex flex-col flex-1 relative h-full">
        <Header />
        <main className="flex-1 overflow-hidden p-6 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
