'use client'
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Create a global loading state that can be accessed across components
export let globalLoadingState = {
  isLoading: false,
  setIsLoading: (value: boolean) => {},
  isDataLoading: false,
  setDataLoading: (value: boolean) => {}
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setDataLoading] = useState(false);
  const pathname = usePathname();

  // Update global loading state
  globalLoadingState.isLoading = isLoading || isDataLoading;
  globalLoadingState.setIsLoading = setIsLoading;
  globalLoadingState.isDataLoading = isDataLoading;
  globalLoadingState.setDataLoading = setDataLoading;

  return (
    <div>
      {children}
    </div>
  );
} 





















