import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { supabase } from '../config/supabase';
import { Client } from '../types';
import { INITIAL_CLIENTS } from '../lib/constants';
// @ts-ignore
import { get, set } from 'idb-keyval';
import { fetchAll } from '../utils/supabaseHelpers';

interface ClientsContextType {
  clients: Client[];
  loading: boolean;
  error: string | null;
  addClient: (client: Client) => Promise<void>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: number) => Promise<void>;
  addClientsBulk: (clients: Client[]) => Promise<void>;
  refreshClients: (since?: string) => Promise<void>;
  clearClientsData: () => Promise<void>;
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined);

// Fix: Explicitly type ClientsProvider as React.FC to resolve children prop typing issue in App.tsx
export const ClientsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFirstLoad = useRef(true);

  // Carica da IndexedDB all'avvio + MIGRAZIONE DELTA SYNC
  useEffect(() => {
    const loadClients = async () => {
      try {
        const stored = await get('clients');
        if (stored && Array.isArray(stored)) {
          // MIGRAZIONE: Se manca il flag 'synced', lo imposto a true (assumo siano già in cloud)
          const migratedAndDeduped = stored.map((c: any) => ({
            ...c,
            synced: typeof c.synced === 'boolean' ? c.synced : true // Default to true for legacy data
          }));

          // Deduplicate on load (fix for potential previous duplication bugs)
          const uniqueClientsMap = new Map<string, Client>();
          migratedAndDeduped.forEach((c: Client) => uniqueClientsMap.set(String(c.id), c));
          const finalClients = Array.from(uniqueClientsMap.values());

          setClients(finalClients);

          // Se ho fatto modifiche di migrazione o deduplicazione, salvo subito
          if (JSON.stringify(stored) !== JSON.stringify(finalClients)) {
            set('clients', finalClients).catch(console.warn);
          }
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

  // ... (Multi-Tab Sync omitted, no changes needed) ...

  // Salva in IndexedDB quando cambiano con DEBOUNCE (omitted, no changes needed)

  const addClient = useCallback(async (client: Client) => {
    // 1. Mark as dirty locally
    const clientWithFlag = { ...client, synced: false };
    setClients(prev => [...prev, clientWithFlag]);

    if (supabase) {
      // Mappa campi espliciti
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
      // 2. Try immediate upload
      await supabase.from('clients').upsert(payload)
        .then(({ error }) => {
          if (error) {
            console.error("Cloud add failed", error);
            // Remains dirty (synced: false)
          } else {
            // 3. Mark as clean on success
            setClients(prev => prev.map(c => c.id === client.id ? { ...c, synced: true } : c));
          }
        });
    }
  }, []);

  const updateClient = useCallback(async (client: Client) => {
    // 1. Mark as dirty locally
    const clientWithFlag = { ...client, synced: false };
    setClients(prev => prev.map(c => c.id === client.id ? clientWithFlag : c));

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
        .then(({ error }) => {
          if (error) {
            console.error("Cloud update failed", error);
          } else {
            // Mark clean
            setClients(prev => prev.map(c => c.id === client.id ? { ...c, synced: true } : c));
          }
        });
    }
  }, []);

  const deleteClient = useCallback(async (id: number) => {
    // Deletion is tricky for sync - we remove locally.
    // Ideally we should have a 'deleted' flag or 'tombstone' for robust sync, 
    // but for now we keep immediate remote delete.
    setClients(prev => prev.filter(c => c.id !== id));
    if (supabase) {
      await supabase.from('clients').delete().eq('id', id)
        .then(({ error }) => { if (error) console.error("Cloud delete failed", error); });
    }
  }, []);

  const addClientsBulk = useCallback(async (newClients: Client[]) => {
    // FILTER DUPLICATES BEFORE ADDING
    const uniqueNewClients: Client[] = [];
    let skippedCount = 0;

    for (const client of newClients) {
      // Reuse the check logic
      let isDuplicate = false;

      // Check local clients for duplication
      if (client.piva) {
        if (clients.some(c => c.piva && c.piva.toLowerCase() === client.piva?.toLowerCase())) isDuplicate = true;
      } else if (client.nome) {
        if (clients.some(c => c.nome.toLowerCase() === client.nome?.toLowerCase())) isDuplicate = true;
      }

      if (!isDuplicate) {
        uniqueNewClients.push(client);
      } else {
        skippedCount++;
      }
    }

    if (uniqueNewClients.length === 0) {
      if (skippedCount > 0) alert(`Tutti i ${skippedCount} clienti importati sono già presenti nel database.`);
      return;
    }

    if (skippedCount > 0) {
      alert(`${skippedCount} clienti sono stati saltati perché già presenti. Caricamento di ${uniqueNewClients.length} nuovi clienti...`);
    }

    // Assume bulk import is DIRTY unless we know otherwise. 
    const dirtyClients = uniqueNewClients.map(c => ({ ...c, synced: false }));
    setClients(prev => [...prev, ...dirtyClients]);

    if (supabase && uniqueNewClients.length > 0) {
      const timestamp = new Date().toISOString();
      const payloads = uniqueNewClients.map(client => ({
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

      // If successful, mark all as clean
      setClients(prev => {
        const ids = new Set(uniqueNewClients.map(c => c.id));
        return prev.map(c => ids.has(c.id) ? { ...c, synced: true } : c);
      });
    }

  }, [clients]);

  const checkDuplicateClient = useCallback((newClient: Partial<Client>) => {
    // 1. Check P.IVA / Codice Fiscale (Strong signal)
    if (newClient.piva) {
      const match = clients.find(c => c.piva && c.piva.toLowerCase() === newClient.piva?.toLowerCase() && c.id !== newClient.id);
      if (match) return { isDuplicate: true, reason: `Esiste già un cliente con P.IVA: ${newClient.piva} (${match.nome})` };
    }

    // 2. Check Name (Strong signal for companies without PIVA)
    if (newClient.nome) {
      const match = clients.find(c => c.nome.toLowerCase() === newClient.nome?.toLowerCase() && c.id !== newClient.id);
      if (match) return { isDuplicate: true, reason: `Esiste già un cliente con Ragione Sociale: ${newClient.nome}` };
    }

    return { isDuplicate: false };
  }, [clients]);

  const refreshClients = useCallback(async (since?: string) => {
    if (!supabase) return;

    let query = supabase.from('clients').select('*');
    if (since) {
      query = query.gt('updated_at', since);
    }

    // Use pagination to fetch (either ALL or DELTA)
    const { data, error } = await fetchAll<any>(query);

    if (!error && data) {
      if (data.length > 0) console.log(`[ClientsContext] Downloaded ${data.length} updated clients.`);

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
        updatedAt: d.updated_at,
        synced: true // From cloud = clean
      }));

      setClients(prev => {
        // use Map to ensure uniqueness by ID (converted to string to handle number vs string type mismatches)
        const clientMap = new Map<string, Client>();

        // 1. Load local clients first
        prev.forEach(c => clientMap.set(String(c.id), c));

        // 2. Merge remote clients
        remoteClients.forEach(rc => {
          const idStr = String(rc.id);
          const local = clientMap.get(idStr);

          if (!local) {
            // New from cloud
            clientMap.set(idStr, rc);
          } else {
            // Conflict Resolution: Remote Wins if newer or if local has no timestamp
            const localDate = local.updatedAt ? new Date(local.updatedAt) : new Date(0);
            const remoteDate = rc.updatedAt ? new Date(rc.updatedAt) : new Date(0);

            if (remoteDate > localDate) {
              clientMap.set(idStr, rc);
            }
          }
        });

        return Array.from(clientMap.values());
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
    clearClientsData,
    checkDuplicateClient
  }), [clients, loading, error, addClient, updateClient, deleteClient, addClientsBulk, refreshClients, clearClientsData, checkDuplicateClient]);

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
