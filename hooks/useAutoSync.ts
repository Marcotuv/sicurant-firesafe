import { useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export const useAutoSync = (intervalMs: number = 5 * 60 * 1000) => {
    const { syncData, downloadCloudData, syncStatus } = useData();
    const { user } = useAuth();

    // Refs for backoff logic
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const consecutiveFailuresRef = useRef(0);
    const lastFailureTimeRef = useRef(0);

    const getBackoffDelay = () => {
        const failures = consecutiveFailuresRef.current;
        if (failures === 0) return 0;
        // Exponential backoff: 30s, 60s, 120s, 240s... max 10 minutes
        const baseDelay = 30 * 1000;
        const delay = Math.min(baseDelay * Math.pow(2, failures - 1), 10 * 60 * 1000);
        return delay;
    };

    const performSync = async (isManualTrigger = false) => {
        if (!navigator.onLine || !user) return;

        // Don't start a new sync if one is already in progress
        if (syncStatus === 'syncing') {
            console.log('[AutoSync] Sync already in progress, skipping...');
            return;
        }

        // Check backoff unless manually forced (optional, here we treat event listeners as non-manual)
        if (!isManualTrigger) {
            const backoffDelay = getBackoffDelay();
            const timeSinceLastFailure = Date.now() - lastFailureTimeRef.current;

            if (consecutiveFailuresRef.current > 0 && timeSinceLastFailure < backoffDelay) {
                const remaining = Math.ceil((backoffDelay - timeSinceLastFailure) / 1000);
                console.warn(`[AutoSync] Sync suppressed due to backoff. Retrying in ${remaining}s. (Failures: ${consecutiveFailuresRef.current})`);
                return;
            }
        }

        console.log(`[AutoSync] Starting sync... (Attempt ${consecutiveFailuresRef.current + 1})`);
        try {
            await syncData();
            await downloadCloudData();

            // On success, reset failures
            if (consecutiveFailuresRef.current > 0) {
                console.log('[AutoSync] Sync recovered successfully. Resetting backoff.');
            }
            consecutiveFailuresRef.current = 0;
            lastFailureTimeRef.current = 0;

        } catch (err) {
            consecutiveFailuresRef.current += 1;
            lastFailureTimeRef.current = Date.now();
            console.error(`[AutoSync] Sync failed. Failure count: ${consecutiveFailuresRef.current}`, err);
        }
    };

    useEffect(() => {
        if (!user) return;

        // Esegui sync immediato all'avvio/login (resetting any previous backoff state usually desirable on fresh mount, but kept refs persist if component doesn't unmount)
        // For fresh mount, refs are 0.
        performSync();

        // Start interval
        timerRef.current = setInterval(() => performSync(), intervalMs);

        // Also sync when coming back online or focus
        const handleSyncTrigger = () => {
            if (document.visibilityState === 'visible' || navigator.onLine) {
                console.log('[AutoSync] Tab focused or back online, triggering sync check...');
                performSync();
            }
        };

        window.addEventListener('online', handleSyncTrigger);
        window.addEventListener('visibilitychange', handleSyncTrigger);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            window.removeEventListener('online', handleSyncTrigger);
            window.removeEventListener('visibilitychange', handleSyncTrigger);
        };
    }, [intervalMs, syncData, downloadCloudData, user, syncStatus]);

    return { performSync: () => performSync(true) }; // Allow manual trigger to bypass checks if valid
};
