import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Authentication Page',
  description: 'Login to your account',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Let middleware handle auth redirects
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {children}
    </div>
  );
}





















