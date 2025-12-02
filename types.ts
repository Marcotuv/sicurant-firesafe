
export interface Client {
  id: number;
  nome: string;
  indirizzo: string;
  referente: string;
  telefono: string;
  email: string;
  commessa?: string;    
  idCommessa?: string;  
  struttura?: string;   
  idStruttura?: string; 
  note?: string;        
}

// Articolo di Listino / Catalogo (Generico)
export interface Article {
  id: string; // Codice Articolo (es. EST-001)
  categoria: string;
  descrizione: string;
  note: string;
}

// Presidio Installato (Specifico per Cliente)
export interface Asset {
  id: string; // Codice interno / ID Sistema
  clientId: number; // Associazione Obbligatoria al Cliente
  tipo: string; // Es. Estintore 6kg
  matricola?: string; // Seriale univoco
  ubicazione?: string; // Es. Piano Terra, Locale Caldaia
  scadenza: string;
  dataUltimaRevisione?: string;
  categoria?: string;
  note?: string;
}

export interface Intervention {
  id: string;
  timestamp: string;
  clientId: number;
  clientName: string;
  assetId: string;
  assetName: string;
  services: string[];
  anomalies: string[];
  notes: string; // Note specifiche del singolo asset
  
  // Campi Sessione (Dati comuni per il report)
  generalNotes?: string;
  technicianSignature?: string; // Nome Leggibile
  technicianSignatureImage?: string; // Firma Grafica (Base64)
  clientSignature?: string; // Nome Leggibile
  clientSignatureImage?: string; // Firma Grafica (Base64)
}

export interface WorkSession {
  id?: number; 
  clientId: number;
  startTimestamp: string;
  status: 'OPEN' | 'CLOSED';
  
  // Dati di bozza della sessione corrente
  generalNotes: string;
  technicianSignature: string;
  technicianSignatureImage: string;
  clientSignature: string;
  clientSignatureImage: string;
  
  // Lista interventi "in bozza" non ancora sincronizzati nel registro globale
  draftInterventions: Intervention[];
  interventionIds: string[]; // Solo ID per tracking rapido
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  timestamp: string;
  read: boolean;
}

export interface SupabaseConfig {
  url: string;
  key: string;
}

export interface DataContextType {
  clients: Client[];
  articles: Article[];
  assets: Asset[];
  services: string[];
  anomalies: string[];
  interventions: Intervention[]; // Registro Ufficiale
  notifications: Notification[];
  sessions: WorkSession[]; // Stato Sessioni

  // Remote Config
  remoteUrl: string; 
  supabaseConfig: SupabaseConfig;
  setSupabaseConfig: (config: SupabaseConfig) => void;
  setRemoteUrl: (url: string) => void;
  
  // Sync
  syncData: () => Promise<{ success: boolean; message: string }>;
  downloadCloudData: () => Promise<void>;

  // Session Management
  getOpenSession: (clientId: number) => WorkSession | undefined;
  createSession: (clientId: number) => WorkSession;
  updateSession: (clientId: number, data: Partial<WorkSession>) => void;
  saveInterventionToSession: (clientId: number, intervention: Intervention) => void;
  closeSession: (clientId: number) => void;
  
  addIntervention: (intervention: Intervention) => void;
  addInterventionsBulk: (interventions: Intervention[]) => void;
  
  // Clienti
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
  addClientsBulk: (clients: Omit<Client, 'id'>[]) => void;
  deleteClient: (id: number) => void;

  // Articoli (Catalogo)
  addArticle: (article: Article) => void;
  addArticlesBulk: (articles: Article[]) => void;
  deleteArticle: (id: string) => void;

  // Asset (Inventario)
  addAsset: (asset: Asset) => void;
  addAssetsBulk: (assets: Asset[]) => void;
  deleteAsset: (id: string) => void;

  // Utilities
  addService: (service: string) => void;
  addAnomaly: (anomaly: string) => void;
  deleteService: (service: string) => void;
  deleteAnomaly: (anomaly: string) => void;

  // Notifiche
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => void;

  // Data Management (Locale)
  exportData: () => void;
  importData: (jsonData: string) => boolean;
}

export interface User {
  name: string;
  role: 'admin' | 'tech';
  avatarUrl: string;
}
