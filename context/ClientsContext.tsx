import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { supabase } from '../config/supabase';
import { Client } from '../types';
import { INITIAL_CLIENTS } from '../lib/constants';
// @ts-ignore
import { get, set } from 'idb-keyval';

interface ClientsContextType {
  clients: Client[];
  loading: boolean;
  error: string | null;
  addClient: (client: Client) => Promise<void>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: number) => Promise<void>;
  addClientsBulk: (clients: Client[]) => Promise<void>;
  refreshClients: () => Promise<void>;
  clearClientsData: () => Promise<void>;
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined);

// Fix: Explicitly type ClientsProvider as React.FC to resolve children prop typing issue in App.tsx
export const ClientsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFirstLoad = useRef(true);

  // Carica da IndexedDB all'avvio
  useEffect(() => {
    const loadClients = async () => {
      try {
        const stored = await get('clients');
        if (stored && Array.isArray(stored)) {
          setClients(stored);
        } else {
          setClients(INITIAL_CLIENTS);
        }
      } catch (err) {
        console.error('Errore caricamento clienti:', err);
        setError('Errore caricamento dati locali');
        // Fallback in caso di errore critico IDB
        setClients(INITIAL_CLIENTS);
      } finally {
        setLoading(false);
      }
    };
    loadClients();
  }, []);

  // --- Multi-Tab Sync ---
  const broadcastRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    broadcastRef.current = new BroadcastChannel('sicurant_clients_sync');
    broadcastRef.current.onmessage = (event) => {
      if (event.data === 'clients_updated') {
        console.log('[ClientsContext] Refreshing from local IDB (cross-tab sync)');
        get('clients').then(stored => {
          if (stored && Array.isArray(stored)) setClients(stored);
        });
      }
    };
    return () => broadcastRef.current?.close();
  }, []);

  // Salva in IndexedDB quando cambiano con DEBOUNCE
  useEffect(() => {
    // Skip save during initial load
    if (loading) return;

    // On first load completion, mark as ready
    if (isFirstLoad.current) {
      if (!loading) isFirstLoad.current = false;
      return;
    }

    const timer = setTimeout(() => {
      set('clients', clients)
        .then(() => {
          broadcastRef.current?.postMessage('clients_updated');
        })
        .catch(err => console.warn("IDB Save Error", err));
    }, 1000); // 1 second debounce
    return () => clearTimeout(timer);
  }, [clients, loading]);

  const addClient = useCallback(async (client: Client) => {
    setClients(prev => [...prev, client]);
    if (supabase) {
      // Mappa campi espliciti + json_content per backup
      const payload = {
        id: client.id,
        nome: client.nome,
        indirizzo: client.indirizzo,
        piva: client.piva,
        codice_univoco: client.codiceUnivoco,
        pec: client.pec,
        referente: client.referente,
        telefono: client.telefono,
        email: client.email,
        commessa: client.commessa,
        id_commessa: client.idCommessa,
        struttura: client.struttura,
        indirizzo_struttura: client.indirizzoStruttura,
        id_struttura: client.idStruttura,
        referente_commessa: client.referenteCommessa,
        recapito_commessa: client.recapitoCommessa,
        pagamento: client.pagamento,
        note: client.note,
        json_content: client
      };
      await supabase.from('clients').upsert(payload)
        .then(({ error }) => { if (error) console.error("Cloud add failed", error); });
    }
  }, []);

  const updateClient = useCallback(async (client: Client) => {
    setClients(prev => prev.map(c => c.id === client.id ? client : c));
    if (supabase) {
      const payload = {
        nome: client.nome,
        indirizzo: client.indirizzo,
        piva: client.piva,
        codice_univoco: client.codiceUnivoco,
        pec: client.pec,
        referente: client.referente,
        telefono: client.telefono,
        email: client.email,
        commessa: client.commessa,
        id_commessa: client.idCommessa,
        struttura: client.struttura,
        indirizzo_struttura: client.indirizzoStruttura,
        id_struttura: client.idStruttura,
        referente_commessa: client.referenteCommessa,
        recapito_commessa: client.recapitoCommessa,
        pagamento: client.pagamento,
        note: client.note,
        updated_at: new Date().toISOString(),
        json_content: client
      };
      await supabase.from('clients').update(payload).eq('id', client.id)
        .then(({ error }) => { if (error) console.error("Cloud update failed", error); });
    }
  }, []);

  const deleteClient = useCallback(async (id: number) => {
    setClients(prev => prev.filter(c => c.id !== id));
    if (supabase) {
      await supabase.from('clients').delete().eq('id', id)
        .then(({ error }) => { if (error) console.error("Cloud delete failed", error); });
    }
  }, []);

  const addClientsBulk = useCallback(async (newClients: Client[]) => {
    setClients(prev => [...prev, ...newClients]);
    if (supabase && newClients.length > 0) {
      const timestamp = new Date().toISOString();
      const payloads = newClients.map(client => ({
        id: client.id,
        nome: client.nome,
        indirizzo: client.indirizzo,
        piva: client.piva,
        codice_univoco: client.codiceUnivoco,
        pec: client.pec,
        referente: client.referente,
        telefono: client.telefono,
        email: client.email,
        commessa: client.commessa,
        id_commessa: client.idCommessa,
        struttura: client.struttura,
        indirizzo_struttura: client.indirizzoStruttura,
        id_struttura: client.idStruttura,
        referente_commessa: client.referenteCommessa,
        recapito_commessa: client.recapitoCommessa,
        pagamento: client.pagamento,
        note: client.note,
        updated_at: timestamp,
        json_content: { ...client, updatedAt: timestamp }
      }));

      // BATCHING: Supabase has limits on payload size/rows
      const BATCH_SIZE = 500;
      for (let i = 0; i < payloads.length; i += BATCH_SIZE) {
        const batch = payloads.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('clients').upsert(batch);
        if (error) {
          console.error(`Batch starting at ${i} failed:`, error);
          throw new Error(`Errore nel caricamento del blocco ${i / BATCH_SIZE + 1}: ${error.message}`);
        }
      }
    }

    // Force immediate local save for bulk import - get latest state to avoid race conditions
    setClients(prev => {
      const updated = [...prev];
      set('clients', updated).catch(e => console.warn("Local save failed", e));
      return updated;
    });

  }, [clients]);

  const refreshClients = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from('clients').select('*');
    if (!error && data) {
      const remoteClients: Client[] = data.map((d: any) => ({
        id: d.id,
        nome: d.nome,
        indirizzo: d.indirizzo,
        piva: d.piva,
        codiceUnivoco: d.codice_univoco,
        pec: d.pec,
        referente: d.referente,
        telefono: d.telefono,
        email: d.email,
        commessa: d.commessa,
        idCommessa: d.id_commessa,
        struttura: d.struttura,
        indirizzoStruttura: d.indirizzo_struttura,
        idStruttura: d.id_struttura,
        referenteCommessa: d.referente_commessa,
        recapitoCommessa: d.recapito_commessa,
        pagamento: d.pagamento,
        note: d.note,
        updatedAt: d.updated_at
      }));

      setClients(prev => {
        const merged = [...prev];
        remoteClients.forEach(rc => {
          const idx = merged.findIndex(bc => bc.id === rc.id);
          if (idx === -1) merged.push(rc);
          else {
            const localUpdatedAt = merged[idx].updatedAt;
            // Update only if remote is newer
            if (!localUpdatedAt || (rc.updatedAt && new Date(rc.updatedAt) > new Date(localUpdatedAt))) {
              merged[idx] = rc;
            }
          }
        });
        return merged;
      });
    }
  }, []);

  const clearClientsData = useCallback(async () => {
    await set('clients', null);
    setClients([]);
  }, []);

  const value = React.useMemo(() => ({
    clients,
    loading,
    error,
    addClient,
    updateClient,
    deleteClient,
    addClientsBulk,
    refreshClients,
    clearClientsData
  }), [clients, loading, error, addClient, updateClient, deleteClient, addClientsBulk, refreshClients, clearClientsData]);

  return (
    <ClientsContext.Provider value={value}>
      {children}
    </ClientsContext.Provider>
  );
};

export const useClients = () => {
  const context = useContext(ClientsContext);
  if (!context) {
    throw new Error('useClients deve essere usato dentro ClientsProvider');
  }
  return context;
};
