
import { useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';

export const useAutoSync = (intervalMs: number = 5 * 60 * 1000) => {
    const { syncData, downloadCloudData, syncStatus } = useData();
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const performSync = async () => {
        if (!navigator.onLine) return;
        console.log('[AutoSync] Starting background sync...');
        try {
            await syncData();
            await downloadCloudData();
        } catch (err) {
            console.error('[AutoSync] Sync failed', err);
        }
    };

    useEffect(() => {
        // Start interval
        timerRef.current = setInterval(performSync, intervalMs);

        // Also sync when coming back online
        const handleOnline = () => {
            console.log('[AutoSync] Back online, triggering sync...');
            performSync();
        };

        window.addEventListener('online', handleOnline);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            window.removeEventListener('online', handleOnline);
        };
    }, [intervalMs, syncData, downloadCloudData]);

    return { performSync };
};
