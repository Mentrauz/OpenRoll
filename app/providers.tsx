'use client';

import { DropdownProvider } from '@/components/AnimatedSelect';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DropdownProvider>
      {children}
    </DropdownProvider>
  );
} 





















