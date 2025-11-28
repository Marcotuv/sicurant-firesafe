
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Client, Asset, Article, Intervention, Notification, DataContextType, WorkSession 
} from '../types';
import { 
  INITIAL_CLIENTS, INITIAL_ASSETS, INITIAL_ARTICLES, INITIAL_INTERVENTIONS, INITIAL_NOTIFICATIONS, SERVICES_LIST, ANOMALIES_LIST 
} from '../data';

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [services, setServices] = useState<string[]>(SERVICES_LIST);
  const [anomalies, setAnomalies] = useState<string[]>(ANOMALIES_LIST);
  const [interventions, setInterventions] = useState<Intervention[]>(INITIAL_INTERVENTIONS);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  
  // Session State - Persisted in LocalStorage
  const [sessions, setSessions] = useState<WorkSession[]>(() => {
      const saved = localStorage.getItem('work_sessions');
      return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
      localStorage.setItem('work_sessions', JSON.stringify(sessions));
  }, [sessions]);

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
          if (s.clientId === clientId && s.status === 'OPEN') {
              // Check update vs insert
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

      // 1. Finalize interventions with session data
      const finalInterventions = session.draftInterventions.map(i => ({
          ...i,
          generalNotes: session.generalNotes,
          technicianSignature: session.technicianSignature,
          technicianSignatureImage: session.technicianSignatureImage,
          clientSignature: session.clientSignature,
          clientSignatureImage: session.clientSignatureImage
      }));

      // 2. Add to global log
      addInterventionsBulk(finalInterventions);

      // 3. Close session
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
    addNotification({
      title: 'Nuovo Cliente',
      message: `Cliente ${client.nome} aggiunto all'anagrafica.`,
      type: 'info'
    });
  };

  const addClientsBulk = (newClientsData: Omit<Client, 'id'>[]) => {
    setClients(prev => {
      const maxId = prev.reduce((max, c) => (c.id > max ? c.id : max), 0);
      const newClients = newClientsData.map((c, index) => ({
        ...c,
        id: maxId + 1 + index
      }));
      return [...prev, ...newClients];
    });
    addNotification({
      title: 'Import CSV Completato',
      message: `${newClientsData.length} clienti importati con successo.`,
      type: 'success'
    });
  };

  const updateClient = (updatedClient: Client) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    addNotification({
      title: 'Cliente Aggiornato',
      message: `Dati aggiornati per ${updatedClient.nome}.`,
      type: 'success'
    });
  };

  const deleteClient = (id: number) => {
    setClients(prev => prev.filter(c => c.id !== id));
  };

  // --- Articoli (Catalogo) ---
  const addArticle = (article: Article) => {
    setArticles(prev => [...prev, article]);
    addNotification({
      title: 'Nuovo Articolo',
      message: `Articolo ${article.descrizione} aggiunto al listino.`,
      type: 'info'
    });
  };

  const addArticlesBulk = (newArticles: Article[]) => {
    setArticles(prev => [...prev, ...newArticles]);
    addNotification({
      title: 'Import CSV Completato',
      message: `${newArticles.length} articoli importati nel catalogo.`,
      type: 'success'
    });
  };

  const deleteArticle = (id: string) => {
    setArticles(prev => prev.filter(a => a.id !== id));
  };

  // --- Asset (Inventario) ---
  const addAsset = (asset: Asset) => {
    setAssets(prev => [...prev, asset]);
    addNotification({
      title: 'Presidio Aggiunto',
      message: `Presidio ${asset.tipo} aggiunto all'inventario.`,
      type: 'info'
    });
  };

  const addAssetsBulk = (newAssets: Asset[]) => {
    setAssets(prev => [...prev, ...newAssets]);
    addNotification({
      title: 'Import CSV Completato',
      message: `${newAssets.length} presidi importati nell'inventario.`,
      type: 'success'
    });
  };

  const deleteAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  // --- Utilities ---
  const addService = (service: string) => {
    setServices(prev => [...prev, service]);
  };

  const addAnomaly = (anomaly: string) => {
    setAnomalies(prev => [...prev, anomaly]);
  };

  const deleteService = (serviceName: string) => {
    setServices(prev => prev.filter(s => s !== serviceName));
  };

  const deleteAnomaly = (anomalyName: string) => {
    setAnomalies(prev => prev.filter(a => a !== anomalyName));
  };

  // Notification Helpers
  const addNotification = (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => {
    const newNote: Notification = {
      id: `NOT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };
    setNotifications(prev => [newNote, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Simulation of Real-Time Notification
  useEffect(() => {
    const timer = setTimeout(() => {
      addNotification({
        title: 'Nuovo Intervento Assegnato',
        message: 'URGENTE: Malfunzionamento pompa antincendio presso Industria Meccanica SRL.',
        type: 'alert'
      });
    }, 10000); 

    return () => clearTimeout(timer);
  }, []);

  return (
    <DataContext.Provider value={{
      clients,
      articles,
      assets,
      services,
      anomalies,
      interventions,
      notifications,
      sessions, // Export sessions
      getOpenSession,
      createSession,
      updateSession,
      saveInterventionToSession,
      closeSession,
      addIntervention,
      addInterventionsBulk,
      addClient,
      updateClient,
      addClientsBulk,
      addArticle,
      addArticlesBulk,
      deleteArticle,
      addAsset,
      addAssetsBulk,
      deleteClient,
      deleteAsset,
      addService,
      addAnomaly,
      deleteService,
      deleteAnomaly,
      addNotification,
      markNotificationAsRead,
      clearAllNotifications
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
