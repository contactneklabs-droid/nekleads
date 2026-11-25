import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchGoogleSheetsLeads, getLastSyncTime } from '../lib/googleSheets';

export const useAutoRefresh = (intervalMs = 60000) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(getLastSyncTime());
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  const performSync = useCallback(async () => {
    if (isFetchingRef.current || !navigator.onLine) return;
    isFetchingRef.current = true;
    setIsSyncing(true);
    setError(null);

    try {
      await fetchGoogleSheetsLeads();
      setLastSync(getLastSyncTime());
    } catch (err: any) {
      setError(err.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Initial fetch on mount / app open
    performSync();

    // Auto periodic refresh (default 60s)
    const timer = setInterval(() => {
      performSync();
    }, intervalMs);

    // Refresh when user returns to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        performSync();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Refresh when network connectivity is restored
    const handleOnline = () => performSync();
    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [performSync, intervalMs]);

  return {
    isSyncing,
    lastSync,
    error,
    refreshNow: performSync
  };
};
