
export interface Client {
  id: number;
  nome: string;
  indirizzo: string;
  piva?: string;
  codiceUnivoco?: string;
  pec?: string;
  referente: string;
  telefono: string;
  email: string;
  commessa?: string;
  idCommessa?: string;
  struttura?: string;
  indirizzoStruttura?: string;
  idStruttura?: string;
  referenteCommessa?: string;
  recapitoCommessa?: string;
  pagamento?: string;
  note?: string;
  updatedAt?: string;
  synced?: boolean; // New Delta Sync flag
}

export interface Article {
  id: string;
  categoria: string;
  descrizione: string;
  note: string;
  updatedAt?: string;
  synced?: boolean;
}

export interface Asset {
  id: string;
  clientId: number;
  tipo: string;
  matricola?: string;
  ubicazione?: string;
  scadenza: string;
  dataUltimaRevisione?: string;
  categoria?: string;
  note?: string;
  specificData?: Record<string, any>;
  updatedAt?: string;
  synced?: boolean;
}

export interface InternalComment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
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
  notes: string;
  photos?: string[];
  internalComments?: InternalComment[];
  generalNotes?: string;
  technicianSignature?: string;
  technicianSignatureImage?: string;
  clientSignature?: string;
  clientSignatureImage?: string;
  progressive_code?: string;
  asset_id?: string;
  updatedAt?: string;
  synced?: boolean;
}

export interface WorkSession {
  id: string;
  clientId: number;
  startTimestamp: string;
  status: 'PLANNED' | 'OPEN' | 'CLOSED';
  scheduledDate?: string;
  assignedTechId?: string;
  assignedTechIds?: string[];
  assignedTechName?: string;
  generalNotes: string;
  technicianSignature: string;
  technicianSignatureImage: string;
  clientSignature: string;
  clientSignatureImage: string;
  draftInterventions: Intervention[];
  interventionIds: string[];
  updatedAt?: string;
  synced?: boolean;
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  color: string;
}

export type FieldType = 'text' | 'number' | 'date' | 'boolean' | 'select' | 'header';

export interface SchemaField {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  width?: 'full' | 'half' | 'third';
}

export interface NotificationAttachment {
  name: string;
  type: 'image' | 'pdf';
  url: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  category?: 'Avviso' | 'Comunicazione' | 'Circolare';
  type: 'info' | 'warning' | 'success' | 'alert';
  timestamp: string;
  readBy: string[];
  clearedBy?: string[];
  targetUserId?: string | 'ALL';
  attachment?: NotificationAttachment;
}

export type AttendanceType = 'ENTRATA' | 'USCITA' | 'FERIE' | 'ROL' | 'MALATTIA' | 'PERMESSO';
export type ApprovalStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  type: AttendanceType;
  status: ApprovalStatus;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  approvedBy?: string;
  approvalTimestamp?: string;
  synced?: boolean;
}

export type QuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED_TO_PLAN' | 'ACCEPTED_PLANNED' | 'CLOSED' | 'REJECTED' | 'EXPIRED';
export type QuotationType = 'PREVENTIVO' | 'CONSUNTIVO';
export type QuotationCategory = 'FORNITURA' | 'MANUTENZIONE_ORDINARIA' | 'MANUTENZIONE_STRAORDINARIA';

export interface QuotationItem {
  id: string;
  type: 'ARTICLE' | 'SERVICE' | 'CUSTOM';
  description: string;
  refId?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Quotation {
  id: string;
  number: string; // Numero progressivo (es. 2025/001)
  type: QuotationType;
  category: QuotationCategory;
  clientId: number;
  clientName: string;
  title: string;
  description: string;
  items: QuotationItem[];
  amount: number;
  status: QuotationStatus;
  date: string;
  expiryDate: string;
  notes?: string;
  updatedAt?: string;
  interventionRefId?: string; // ID della sessione o intervento collegato
  synced?: boolean;
}

export interface Note {
  id: string;
  text: string;
  color: 'yellow' | 'blue' | 'green' | 'pink' | 'purple';
  date: string;
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
  checklistTemplates: Record<string, string[]>;
  categoryAnomalies: Record<string, string[]>;
  interventions: Intervention[];
  notifications: Notification[];
  sessions: WorkSession[];
  technicians: Technician[];
  attendanceHistory: AttendanceRecord[];
  quotations: Quotation[];
  isLoading: boolean;
  syncStatus: 'synced' | 'syncing' | 'error' | 'offline';
  lastSyncTime: string | null;

  userNotes: Note[];
  userSignature: string;
  updateUserNotes: (notes: Note[]) => void;
  saveUserSignature: (signature: string) => void;

  remoteUrl: string;
  supabaseConfig: SupabaseConfig;
  setSupabaseConfig: (config: SupabaseConfig) => void;
  setRemoteUrl: (url: string) => void;

  syncData: (options?: { forceRemoteMerge?: boolean }) => Promise<{ success: boolean; message: string }>;
  downloadCloudData: () => Promise<{ success: boolean; message?: string }>;
  checkConflict: (table: string, id: string | number, localUpdatedAt?: string) => Promise<boolean>;

  getOpenSession: (clientId: number) => WorkSession | undefined;
  createSession: (clientId: number) => WorkSession;
  scheduleSession: (clientId: number, date: string, techIds: string[]) => void;
  updateSession: (clientId: number, data: Partial<WorkSession>) => void;
  updatePlannedSession: (sessionId: string, date: string, techIds: string[]) => void;

  saveInterventionToSession: (sessionId: string, intervention: Intervention, metadata?: Partial<WorkSession>) => void;
  closeSession: (sessionId: string, finalMetadata?: Partial<WorkSession>) => void;
  reopenSession: (clientId: number) => void;
  deleteSession: (sessionId: string) => void;

  addIntervention: (intervention: Intervention) => void;
  addInterventionsBulk: (interventions: Intervention[]) => void;

  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
  addClientsBulk: (clients: Omit<Client, 'id'>[]) => void;
  deleteClient: (id: number) => void;

  addArticle: (article: Article) => void;
  addArticlesBulk: (articles: Article[]) => void;
  deleteArticle: (id: string) => void;

  addAsset: (asset: Asset) => void;
  addAssetsBulk: (assets: Asset[]) => void;
  updateAsset: (asset: Asset) => void;
  deleteAsset: (id: string) => void;

  addService: (service: string) => void;
  addAnomaly: (anomaly: string) => void;
  deleteService: (service: string) => void;
  deleteAnomaly: (anomaly: string) => void;

  updateChecklistTemplate: (category: string, items: string[]) => void;
  updateCategoryAnomaly: (category: string, items: string[]) => void;

  markNotificationAsRead: (id: string, userId: string) => void;
  clearAllNotifications: (userId?: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'readBy' | 'timestamp'>) => void;

  addAttendanceRecord: (record: AttendanceRecord) => void;
  updateAttendanceStatus: (recordId: string, status: ApprovalStatus, officeUserId: string) => void;

  addQuotation: (q: Quotation) => void;
  updateQuotation: (id: string, data: Partial<Quotation>) => void;
  deleteQuotation: (id: string) => void;

  exportData: () => void;
  importData: (jsonData: string) => boolean;
  clearAllDataLocal: () => Promise<void>;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'technician' | 'office' | 'viewer';
  avatar_url?: string;
  created_at?: string;
}
