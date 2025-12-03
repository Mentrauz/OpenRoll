'use client';

import { useEffect } from 'react';

export default function PWAInstall() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            // Service worker registered successfully
          },
          (err) => {
            // Service worker registration failed
          }
        );
      });
    }
  }, []);

  return null;
} 





















