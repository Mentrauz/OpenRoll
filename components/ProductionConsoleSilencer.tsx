'use client';

import { useEffect } from 'react';

export default function ProductionConsoleSilencer() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      try {
        // Preserve error and warn, silence log/debug/info
        // eslint-disable-next-line no-console
        console.log = () => {};
        // eslint-disable-next-line no-console
        console.debug = () => {};
        // eslint-disable-next-line no-console
        console.info = () => {};
      } catch {}
    }
  }, []);

  return null;
}























