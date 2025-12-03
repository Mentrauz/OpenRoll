'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function HomePage() {
  useEffect(() => {
    // Use window.location.href for a hard redirect to ensure it works even with
    // stale client-side state or service worker interference.
    const timer = setTimeout(() => {
      window.location.href = '/login';
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#ffffff',
      color: '#000000',
      padding: '20px'
    }}>
      <div style={{ textAlign: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '24px', color: '#000000' }}>
          Redirecting to login...
        </h2>

        <Link
          href="/login"
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            backgroundColor: '#ffffff',
            color: '#000000',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#000000';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb';
          }}
        >
          Click here if not redirected
        </Link>
      </div>
    </div>
  );
}