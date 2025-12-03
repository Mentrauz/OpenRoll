'use client';

import { useState, useEffect } from 'react';

export default function PendingApprovalsBadge() {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingCount();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchPendingCount = async () => {
    try {
      const response = await fetch('/api/pending-changes/stats');
      const data = await response.json();
      
      if (data.success) {
        setPendingCount(data.stats.total.pending);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  if (loading || pendingCount === 0) {
    return null;
  }

  return (
    <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-700 rounded-full">
      {pendingCount}
    </span>
  );
}






















