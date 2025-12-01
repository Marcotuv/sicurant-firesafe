import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { 
  Client, Asset, Article, Intervention, Notification, DataContextType, WorkSession, SupabaseConfig 
} from '../types';
import { 
  INITIAL_CLIENTS, INITIAL_ASSETS, INITIAL_ARTICLES, INITIAL_INTERVENTIONS, INITIAL_NOTIFICATIONS, SERVICES_LIST, ANOMALIES_LIST 
} from '../data';
import { getSupabaseClient } from '../lib/supabaseClient';

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  
  // --- LOCAL STATE ---
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [services, setServices] = useState<string[]>(SERVICES_LIST);
  const [anomalies, setAnomalies] = useState<string[]>(ANOMALIES_LIST);
  const [interventions, setInterventions] = useState<Intervention[]>(INITIAL_INTERVENTIONS);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  
  // Configuration for Remote Sync
  const [remoteUrl, setRemoteUrlState] = useState<string>('');
  const [supabaseConfig, setSupabaseConfigState] = useState<SupabaseConfig>({ url: '', key: '' });
  const [isInitialized, setIsInitialized] = useState(false);

  // --- INITIALIZATION ---
  useEffect(() => {
      // Load everything from LocalStorage if available
      const savedSessions = localStorage.getItem('work_sessions');
      if (savedSessions) setSessions(JSON.parse(savedSessions));

      const savedInterventions = localStorage.getItem('interventions');
      if (savedInterventions) setInterventions(JSON.parse(savedInterventions));

      const savedClients = localStorage.getItem('clients');
      if (savedClients) setClients(JSON.parse(savedClients));

      const savedAssets = localStorage.getItem('assets');
      if (savedAssets) setAssets(JSON.parse(savedAssets));
      
      const savedArticles = localStorage.getItem('articles');
      if (savedArticles) setArticles(JSON.parse(savedArticles));

      const savedRemoteUrl = localStorage.getItem('remote_url');
      if (savedRemoteUrl) setRemoteUrlState(savedRemoteUrl);

      const savedSbConfig = localStorage.getItem('supabase_config');
      if (savedSbConfig) setSupabaseConfigState(JSON.parse(savedSbConfig));

      setIsInitialized(true);
  }, []);

  // --- PERSISTENCE ---
  useEffect(() => { if(isInitialized) localStorage.setItem('work_sessions', JSON.stringify(sessions)); }, [sessions, isInitialized]);
  useEffect(() => { if(isInitialized) localStorage.setItem('interventions', JSON.stringify(interventions)); }, [interventions, isInitialized]);
  useEffect(() => { if(isInitialized) localStorage.setItem('clients', JSON.stringify(clients)); }, [clients, isInitialized]);
  useEffect(() => { if(isInitialized) localStorage.setItem('assets', JSON.stringify(assets)); }, [assets, isInitialized]);
  useEffect(() => { if(isInitialized) localStorage.setItem('articles', JSON.stringify(articles)); }, [articles, isInitialized]);

  const setRemoteUrl = (url: string) => {
      setRemoteUrlState(url);
      localStorage.setItem('remote_url', url);
  };

  const setSupabaseConfig = (config: SupabaseConfig) => {
      setSupabaseConfigState(config);
      localStorage.setItem('supabase_config', JSON.stringify(config));
  }

  // --- DOWNLOAD CLOUD DATA (PULL ONLY) ---
  const downloadCloudData = useCallback(async () => {
      if (!supabaseConfig.url || !supabaseConfig.key) return;
      const supabase = getSupabaseClient(supabaseConfig.url, supabaseConfig.key);
      if (!supabase) return;

      console.log("Tentativo download dati Cloud...");

      try {
          // 1. Pull Interventions
          const { data: remoteInterventions } = await supabase.from('interventions').select('json_content');
          if (remoteInterventions) {
              setInterventions(prev => {
                  const existingIds = new Set(prev.map(i => i.id));
                  const newItems = remoteInterventions
                    .map((r: any) => r.json_content)
                    .filter((i: Intervention) => !existingIds.has(i.id));
                  
                  if (newItems.length > 0) {
                      console.log(`Scaricati ${newItems.length} nuovi interventi.`);
                      return [...newItems, ...prev].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                  }
                  return prev;
              });
          }

          // 2. Pull Clients
          const { data: remoteClients } = await supabase.from('clients').select('json_content');
          if (remoteClients) {
              setClients(prev => {
                  const existingIds = new Set(prev.map(c => c.id));
                  const newItems = remoteClients
                    .map((r: any) => r.json_content)
                    .filter((c: Client) => !existingIds.has(c.id));
                  return newItems.length > 0 ? [...prev, ...newItems] : prev;
              });
          }

          // 3. Pull Assets
          const { data: remoteAssets } = await supabase.from('assets').select('json_content');
          if (remoteAssets) {
              setAssets(prev => {
                  const existingIds = new Set(prev.map(a => a.id));
                  const newItems = remoteAssets
                    .map((r: any) => r.json_content)
                    .filter((a: Asset) => !existingIds.has(a.id));
                  return newItems.length > 0 ? [...prev, ...newItems] : prev;
              });
          }

      } catch (error) {
          console.error("Errore download automatico:", error);
      }
  }, [supabaseConfig]);

  // --- AUTO-SYNC ON LOAD ---
  // Scarica i dati automaticamente quando viene caricata una configurazione valida
  useEffect(() => {
      if (isInitialized && supabaseConfig.url && supabaseConfig.key) {
          downloadCloudData();
      }
  }, [isInitialized, supabaseConfig.url, supabaseConfig.key, downloadCloudData]);


  // --- SYNC (PUSH & PULL) ---
  const syncData = async (): Promise<{ success: boolean; message: string }> => {
      // 1. Controlla se Supabase è configurato
      if (supabaseConfig.url && supabaseConfig.key) {
          const supabase = getSupabaseClient(supabaseConfig.url, supabaseConfig.key);
          if (!supabase) return { success: false, message: "Client Supabase non valido." };

          try {
              // --- A. UPLOAD (PUSH) ---
              // Carichiamo i dati locali nel Cloud (Upsert)
              
              if (interventions.length > 0) {
                  const { error } = await supabase
                      .from('interventions')
                      .upsert(interventions.map(i => ({ id: i.id, json_content: i })), { onConflict: 'id' });
                  if (error) throw error;
              }

              if (clients.length > 0) {
                 const { error } = await supabase
                    .from('clients')
                    .upsert(clients.map(c => ({ id: c.id, json_content: c })), { onConflict: 'id' });
                 if (error) throw error;
              }

              if (assets.length > 0) {
                 const { error } = await supabase
                    .from('assets')
                    .upsert(assets.map(a => ({ id: a.id, json_content: a })), { onConflict: 'id' });
                 if (error) throw error;
              }

              // --- B. DOWNLOAD (PULL) ---
              await downloadCloudData();

              addNotification({
                  title: 'Cloud Sync Completato',
                  message: 'Database sincronizzato bidirezionalmente con Supabase.',
                  type: 'success'
              });
              return { success: true, message: "Sincronizzazione Cloud Riuscita." };

          } catch (error: any) {
              console.error("Supabase Sync Error:", error);
              return { success: false, message: `Errore Supabase: ${error.message}` };
          }
      } 
      
      // 2. Fallback al vecchio metodo HTTP Post
      else if (remoteUrl) {
        const backup = prepareBackupData();
        try {
            const response = await fetch(remoteUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(backup),
            });
            if (response.ok) {
                addNotification({ title: 'Backup HTTP Inviato', message: 'Dati inviati al server.', type: 'success' });
                return { success: true, message: "Inviato a server remoto." };
            } else {
                throw new Error(`Status ${response.status}`);
            }
        } catch (error: any) {
             addNotification({ title: 'Errore Backup', message: error.message, type: 'warning' });
             return { success: false, message: error.message };
        }
      }

      return { success: false, message: "Nessun endpoint configurato." };
  };

  const prepareBackupData = () => {
      return {
          timestamp: new Date().toISOString(),
          clients,
          articles,
          assets,
          services,
          anomalies,
          interventions,
          sessions
      };
  };

  const exportData = () => {
      const backup = prepareBackupData();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `sicurant_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const importData = (jsonData: string): boolean => {
      try {
          const data = JSON.parse(jsonData);
          
          if(data.clients) setClients(data.clients);
          if(data.assets) setAssets(data.assets);
          if(data.interventions) setInterventions(data.interventions);
          if(data.sessions) setSessions(data.sessions);
          if(data.articles) setArticles(data.articles);
          
          addNotification({ 
              title: "Importazione Completata", 
              message: "Il database è stato aggiornato con i dati del file di backup.", 
              type: "success" 
          });
          return true;
      } catch (e) {
          console.error(e);
          addNotification({ 
              title: "Errore Importazione", 
              message: "Il file non è valido o è corrotto.", 
              type: "alert" 
          });
          return false;
      }
  };


  // --- SESSION MANAGEMENT ---

  const getOpenSession = (clientId: number) => {
      return sessions.find(s => s.clientId === clientId && s.status === 'OPEN');
  };

  const createSession = (clientId: number) => {
      const existing = getOpenSession(clientId);
      if (existing) return existing;

      const newSession: WorkSession = {
          clientId,
          startTimestamp: new Date().toISOString(),
          status: 'OPEN',
          generalNotes: '',
          technicianSignature: '',
          technicianSignatureImage: '',
          clientSignature: '',
          clientSignatureImage: '',
          draftInterventions: [],
          interventionIds: []
      };
      
      setSessions(prev => [...prev, newSession]);
      return newSession;
  };

  const updateSession = (clientId: number, data: Partial<WorkSession>) => {
      setSessions(prev => prev.map(s => 
          s.clientId === clientId && s.status === 'OPEN' ? { ...s, ...data } : s
      ));
  };

  const saveInterventionToSession = (clientId: number, intervention: Intervention) => {
      setSessions(prev => prev.map(s => {
          if (s.clientId === clientId && s.status === 'CLOSED') {
               console.warn("Tentativo di modifica su sessione chiusa bloccato.");
               return s;
          }
          if (s.clientId === clientId && s.status === 'OPEN') {
              const exists = s.draftInterventions.find(i => i.id === intervention.id);
              let newDrafts = s.draftInterventions;
              if (exists) {
                  newDrafts = s.draftInterventions.map(i => i.id === intervention.id ? intervention : i);
              } else {
                  newDrafts = [...s.draftInterventions, intervention];
              }
              
              return {
                  ...s,
                  draftInterventions: newDrafts,
                  interventionIds: newDrafts.map(i => i.id)
              };
          }
          return s;
      }));
  };

  const closeSession = (clientId: number) => {
      const session = getOpenSession(clientId);
      if (!session) return;

      const finalInterventions = session.draftInterventions.map(i => ({
          ...i,
          generalNotes: session.generalNotes,
          technicianSignature: session.technicianSignature,
          technicianSignatureImage: session.technicianSignatureImage,
          clientSignature: session.clientSignature,
          clientSignatureImage: session.clientSignatureImage
      }));

      // 1. Add to Global Log
      addInterventionsBulk(finalInterventions);

      // 2. Close Session
      setSessions(prev => prev.map(s => 
          s.clientId === clientId && s.status === 'OPEN' ? { ...s, status: 'CLOSED' } : s
      ));

      addNotification({
          title: 'Intervento Chiuso',
          message: `Manutenzione completata per Cliente ID ${clientId}.`,
          type: 'success'
      });
  };


  // --- Standard Methods ---

  const addIntervention = (intervention: Intervention) => {
    setInterventions(prev => [intervention, ...prev]);
  };

  const addInterventionsBulk = (newInterventions: Intervention[]) => {
    setInterventions(prev => {
        const existingIds = new Set(prev.map(i => i.id));
        const uniqueNew = newInterventions.filter(i => !existingIds.has(i.id));
        return [...uniqueNew, ...prev];
    });
  };

  // --- Clienti ---
  const addClient = (client: Client) => {
    setClients(prev => [...prev, client]);
    addNotification({ title: 'Nuovo Cliente', message: `Cliente ${client.nome} aggiunto.`, type: 'info' });
  };

  const addClientsBulk = (newClientsData: Omit<Client, 'id'>[]) => {
    setClients(prev => {
      const maxId = prev.reduce((max, c) => (c.id > max ? c.id : max), 0);
      const newClients = newClientsData.map((c, index) => ({ ...c, id: maxId + 1 + index }));
      return [...prev, ...newClients];
    });
    addNotification({ title: 'Import CSV', message: `${newClientsData.length} clienti importati.`, type: 'success' });
  };

  const updateClient = (updatedClient: Client) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    addNotification({ title: 'Cliente Aggiornato', message: `Dati aggiornati per ${updatedClient.nome}.`, type: 'success' });
  };

  const deleteClient = (id: number) => {
    setClients(prev => prev.filter(c => c.id !== id));
  };

  // --- Articoli & Asset ---
  const addArticle = (article: Article) => setArticles(prev => [...prev, article]);
  const addArticlesBulk = (newArticles: Article[]) => setArticles(prev => [...prev, ...newArticles]);
  const deleteArticle = (id: string) => setArticles(prev => prev.filter(a => a.id !== id));
  
  const addAsset = (asset: Asset) => setAssets(prev => [...prev, asset]);
  const addAssetsBulk = (newAssets: Asset[]) => setAssets(prev => [...prev, ...newAssets]);
  const deleteAsset = (id: string) => setAssets(prev => prev.filter(a => a.id !== id));

  // --- Utilities ---
  const addService = (s: string) => setServices(prev => [...prev, s]);
  const addAnomaly = (a: string) => setAnomalies(prev => [...prev, a]);
  const deleteService = (s: string) => setServices(prev => prev.filter(i => i !== s));
  const deleteAnomaly = (a: string) => setAnomalies(prev => prev.filter(i => i !== a));

  const addNotification = (n: Omit<Notification, 'id' | 'read' | 'timestamp'>) => {
    setNotifications(prev => [{ id: `NOT-${Date.now()}`, timestamp: new Date().toISOString(), read: false, ...n }, ...prev]);
  };
  const markNotificationAsRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const clearAllNotifications = () => setNotifications([]);

  return (
    <DataContext.Provider value={{
      clients, articles, assets, services, anomalies, interventions, notifications, sessions,
      remoteUrl, setRemoteUrl, supabaseConfig, setSupabaseConfig, syncData, downloadCloudData,
      getOpenSession, createSession, updateSession, saveInterventionToSession, closeSession,
      addIntervention, addInterventionsBulk, addClient, updateClient, addClientsBulk, deleteClient,
      addArticle, addArticlesBulk, deleteArticle, addAsset, addAssetsBulk, deleteAsset,
      addService, addAnomaly, deleteService, deleteAnomaly,
      addNotification, markNotificationAsRead, clearAllNotifications,
      exportData, importData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
