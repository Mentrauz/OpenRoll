'use client';

import { useEffect, useState } from 'react';

/**
 * Minimal professional loading spinner overlay
 * Clean, accessible, and performant loading indicator
 *
 * Features:
 * - Clean white/gray background with subtle blur
 * - Single elegant spinning ring
 * - Professional typography
 * - Dark mode support
 * - Accessibility compliant
 * - Performance optimized
 *
 * @component
 * @param {boolean} fullScreen - Whether to cover full screen or just content area
 * @example
 * ```tsx
 * import LoadingSpinner from '@/components/LoadingSpinner';
 *
 * // Full screen loading (default)
 * return <LoadingSpinner />;
 *
 * // Content area loading only
 * return <LoadingSpinner fullScreen={false} />;
 * ```
 */
interface LoadingSpinnerProps {
  fullScreen?: boolean;
}

export default function LoadingSpinner({ fullScreen = true }: LoadingSpinnerProps = {}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay to prevent flash on quick loads
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  const containerClasses = fullScreen
    ? "fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50"
    : "absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-10";

  return (
    <div
      className={containerClasses}
      role="dialog"
      aria-modal="true"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center gap-4">
        {/* Clean spinning ring */}
        <div className="relative">
          <div className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-600"></div>
          <div className="w-8 h-8 rounded-full border-2 border-t-gray-800 dark:border-t-white border-r-transparent border-b-transparent border-l-transparent absolute top-0 left-0 animate-spin"></div>
        </div>

        {/* Professional loading text */}
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
          Loading...
        </p>
      </div>
    </div>
  );
}

/**
 * ContentAreaLoadingSpinner - Shows loading only in the content area
 * Used in page layouts to avoid covering the sidebar
 */
export function ContentAreaLoadingSpinner() {
  return <LoadingSpinner fullScreen={false} />;
} 





















