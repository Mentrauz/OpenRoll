'use client';

import { useEffect } from 'react';

/**
 * Clears all client-side storage and auth cookies when the tab/window is closed
 * or when the page is backgrounded (visibility hidden).
 */
export default function UnloadCleanup() {
  useEffect(() => {
    const clearClientState = () => {
      try {
        localStorage.clear();
      } catch { }
      try {
        sessionStorage.clear();
      } catch { }

      try {
        const expired = 'expires=Thu, 01 Jan 1970 00:00:00 GMT';
        // Attempt to clear all cookies for this domain/path
        const cookiePairs = document.cookie.split('; ');
        const preservedCookies = ['hasVisitedBefore', 'cookieConsent'];

        for (const pair of cookiePairs) {
          const name = pair.split('=')[0];
          if (!name) continue;

          // Skip clearing preserved cookies
          if (preservedCookies.includes(name)) continue;

          document.cookie = `${name}=; path=/; SameSite=Lax; ${expired}`;
        }
      } catch { }

      // Best-effort server notification to clear cookie on the server response as well
      try {
        if (navigator.sendBeacon) {
          const blob = new Blob([], { type: 'application/json' });
          navigator.sendBeacon('/api/auth/logout', blob);
        } else {
          // Fire-and-forget fetch with keepalive for unload
          fetch('/api/auth/logout', { method: 'POST', credentials: 'include', keepalive: true }).catch(() => { });
        }
      } catch { }
    };

    const handleBeforeUnload = () => {
      clearClientState();
    };

    const handlePageHide = () => {
      clearClientState();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  return null;
}























