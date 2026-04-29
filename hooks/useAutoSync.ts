import { useEffect, useRef, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export const useAutoSync = (intervalMs: number = 5 * 60 * 1000) => {
    const { syncData, downloadCloudData } = useData();
    const { user } = useAuth();

    // Use a ref to track in-progress state to avoid stale closure issues
    const isSyncingRef = useRef(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const consecutiveFailuresRef = useRef(0);
    const lastFailureTimeRef = useRef(0);

    const getBackoffDelay = () => {
        const failures = consecutiveFailuresRef.current;
        if (failures === 0) return 0;
        // Exponential backoff: 30s, 60s, 120s, 240s... max 10 minutes
        const baseDelay = 30 * 1000;
        return Math.min(baseDelay * Math.pow(2, failures - 1), 10 * 60 * 1000);
    };

    const performSync = useCallback(async (isManualTrigger = false) => {
        if (!navigator.onLine || !user) return;

        // Use ref instead of react state to avoid stale closure
        if (isSyncingRef.current) {
            console.log('[AutoSync] Sync already in progress, skipping...');
            return;
        }

        // Check backoff
        if (!isManualTrigger) {
            const backoffDelay = getBackoffDelay();
            const timeSinceLastFailure = Date.now() - lastFailureTimeRef.current;

            if (consecutiveFailuresRef.current > 0 && timeSinceLastFailure < backoffDelay) {
                const remaining = Math.ceil((backoffDelay - timeSinceLastFailure) / 1000);
                console.warn(`[AutoSync] Sync suppressed due to backoff. Retrying in ${remaining}s. (Failures: ${consecutiveFailuresRef.current})`);
                return;
            }
        }

        isSyncingRef.current = true;
        console.log(`[AutoSync] Starting sync... (Attempt ${consecutiveFailuresRef.current + 1})`);
        try {
            await syncData();
            await downloadCloudData();

            if (consecutiveFailuresRef.current > 0) {
                console.log('[AutoSync] Sync recovered successfully. Resetting backoff.');
            }
            consecutiveFailuresRef.current = 0;
            lastFailureTimeRef.current = 0;

        } catch (err) {
            consecutiveFailuresRef.current += 1;
            lastFailureTimeRef.current = Date.now();
            console.error(`[AutoSync] Sync failed. Failure count: ${consecutiveFailuresRef.current}`, err);
        } finally {
            isSyncingRef.current = false;
        }
    }, [user, syncData, downloadCloudData]);

    useEffect(() => {
        if (!user) return;

        // Run immediately on mount/login
        performSync();

        // Start interval
        timerRef.current = setInterval(() => performSync(), intervalMs);

        // Also sync when coming back online or tab is focused
        const handleSyncTrigger = (event: Event) => {
            if (event.type === 'online' || document.visibilityState === 'visible') {
                console.log('[AutoSync] Tab focused or back online, triggering sync check...');
                performSync();
            }
        };

        window.addEventListener('online', handleSyncTrigger);
        document.addEventListener('visibilitychange', handleSyncTrigger);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            window.removeEventListener('online', handleSyncTrigger);
            document.removeEventListener('visibilitychange', handleSyncTrigger);
        };
        // Intentionally only re-run when user or interval changes.
        // performSync is memoized with useCallback so it's stable.
    }, [user, intervalMs, performSync]);

    return { performSync: () => performSync(true) };
};
