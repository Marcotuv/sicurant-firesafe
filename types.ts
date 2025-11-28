
export interface Client {
  id: number;
  nome: string;
  indirizzo: string;
  referente: string;
  telefono: string;
  email: string;
  commessa?: string;    // Colonna B
  idCommessa?: string;  // Colonna C
  struttura?: string;   // Colonna E
  idStruttura?: string; // Colonna F
  note?: string;        // Colonna L (Nuovo)
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
  tipo: string; // Es. Estintore 6kg (spesso copiato da Article.descrizione)
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
  
  // Campi Sessione (Step 3)
  generalNotes?: string;
  technicianSignature?: string; // Nome Leggibile
  technicianSignatureImage?: string; // Firma Grafica (Base64)
  clientSignature?: string; // Nome Leggibile
  clientSignatureImage?: string; // Firma Grafica (Base64)
}

export interface WorkSession {
  clientId: number;
  startTimestamp: string;
  status: 'OPEN' | 'CLOSED';
  
  // Dati di bozza (Step 3)
  generalNotes: string;
  technicianSignature: string;
  technicianSignatureImage: string;
  clientSignature: string;
  clientSignatureImage: string;
  
  // Lista interventi "in bozza"
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

export interface DataContextType {
  clients: Client[];
  articles: Article[];
  assets: Asset[];
  services: string[];
  anomalies: string[];
  interventions: Intervention[]; // Registro Ufficiale
  notifications: Notification[];
  sessions: WorkSession[]; // Stato Sessioni

  // Session Management (Nuovo)
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
}

export interface User {
  name: string;
  role: 'admin' | 'tech';
  avatarUrl: string;
}
