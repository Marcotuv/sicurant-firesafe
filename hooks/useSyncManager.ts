
import { useState, useRef, useCallback } from 'react';

export const useSyncManager = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const syncLockRef = useRef(false);
  const lastSyncRef = useRef<number>(0);

  const safeSync = useCallback(async (
    syncFn: () => Promise<void>
  ): Promise<{ success: boolean; message: string }> => {
    
    // Previeni sync concorrenti
    if (syncLockRef.current) {
      console.warn('Sync già in corso, richiesta ignorata');
      return { success: false, message: 'Sync in corso' };
    }

    // Debounce: max 1 sync ogni 5 secondi
    const now = Date.now();
    if (now - lastSyncRef.current < 5000) {
      return { success: false, message: 'Attendere 5 secondi tra i sync' };
    }

    try {
      syncLockRef.current = true;
      setIsSyncing(true);
      lastSyncRef.current = now;

      await syncFn();

      return { success: true, message: 'Sync completato' };
    } catch (error: any) {
      console.error('Errore sync:', error);
      return { success: false, message: error.message || 'Errore sync' };
    } finally {
      syncLockRef.current = false;
      setIsSyncing(false);
    }
  }, []);

  return { safeSync, isSyncing };
};
