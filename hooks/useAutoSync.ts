import { useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export const useAutoSync = (intervalMs: number = 5 * 60 * 1000) => {
    const { syncData, downloadCloudData, syncStatus } = useData();
    const { user } = useAuth();
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const performSync = async () => {
        if (!navigator.onLine || !user) return;
        console.log('[AutoSync] Starting sync...');
        try {
            await syncData();
            await downloadCloudData();
        } catch (err) {
            console.error('[AutoSync] Sync failed', err);
        }
    };

    useEffect(() => {
        if (!user) return;

        // Start interval
        timerRef.current = setInterval(performSync, intervalMs);

        // Also sync when coming back online or focus
        const handleSyncTrigger = () => {
            if (document.visibilityState === 'visible') {
                console.log('[AutoSync] Tab focused or back online, triggering sync...');
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
    }, [intervalMs, syncData, downloadCloudData, user]);

    return { performSync };
};
