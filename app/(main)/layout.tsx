'use client';
import Sidebar from '@/components/Sidebar';
import RouteGuard from '@/components/RouteGuard';
import CopilotWidget from '@/components/CopilotWidget';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard>
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Sidebar />
        <main className="transition-all duration-300 ease-in-out md:ml-[280px]">
          {children}
        </main>
        <CopilotWidget />
      </div>
    </RouteGuard>
  );
} 





















