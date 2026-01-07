import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../config/supabase';
import { Client } from '../types';
import { INITIAL_CLIENTS } from '../data';
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
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined);

// Fix: Explicitly type ClientsProvider as React.FC to resolve children prop typing issue in App.tsx
export const ClientsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Salva in IndexedDB quando cambiano
  useEffect(() => {
    if (!loading) {
      set('clients', clients).catch(err => console.warn("IDB Save Error", err));
    }
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
        json_content: client
      }));
      await supabase.from('clients').upsert(payloads)
        .then(({ error }) => { if (error) console.error("Cloud bulk add failed", error); });
    }
  }, []);

  const refreshClients = useCallback(async () => {
    if (!supabase) return;
    // Selezioniamo tutto (*) ora che abbiamo colonne
    const { data, error } = await supabase.from('clients').select('*');
    if (!error && data) {
      // Mappiamo da SQL a Oggetto TS
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
      setClients(remoteClients);
    }
  }, []);

  return (
    <ClientsContext.Provider value={{
      clients,
      loading,
      error,
      addClient,
      updateClient,
      deleteClient,
      addClientsBulk,
      refreshClients
    }}>
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
