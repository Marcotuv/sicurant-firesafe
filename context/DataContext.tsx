
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef, useMemo } from 'react';
import {
  Client, Asset, Article, Intervention, Notification, DataContextType, WorkSession, SupabaseConfig, Technician, AttendanceRecord, Note, ApprovalStatus, Quotation, QuotationStatus
} from '../types';
import {
  INITIAL_ASSETS, INITIAL_ARTICLES, INITIAL_INTERVENTIONS, INITIAL_NOTIFICATIONS, SERVICES_LIST, ANOMALIES_LIST, CHECKLIST_TEMPLATES, CATEGORY_ANOMALIES
} from '../data';
import { createClient } from '@supabase/supabase-js';
import { envConfig } from '../config/supabase';
// @ts-ignore
import { get, set } from 'idb-keyval';
import { useClients } from './ClientsContext';
import { useSyncManager } from '../hooks/useSyncManager';
import { getLocalDate, getTimestamp } from '../utils/dates';

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

  const { clients, addClient: addClientCtx, updateClient: updateClientCtx, deleteClient: deleteClientCtx, addClientsBulk: addClientsBulkCtx, refreshClients } = useClients();
  const { safeSync } = useSyncManager();

  const [articles, setArticles] = useState<Article[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [anomalies, setAnomalies] = useState<string[]>([]);
  const [checklistTemplates, setChecklistTemplates] = useState<Record<string, string[]>>(CHECKLIST_TEMPLATES);
  const [categoryAnomalies, setCategoryAnomalies] = useState<Record<string, string[]>>(CATEGORY_ANOMALIES);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);

  const [userNotes, setUserNotes] = useState<Note[]>([]);
  const [userSignature, setUserSignature] = useState<string>("");

  const [isLoading, setIsLoading] = useState(true);
  const [remoteUrl, setRemoteUrlState] = useState<string>('');
  const [supabaseConfig, setSupabaseConfigState] = useState<SupabaseConfig>({
    url: envConfig.url,
    key: envConfig.key
  });

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [
          storedSessions, storedInterventions, storedAssets, storedArticles,
          storedServices, storedAnomalies, storedAttendance, storedQuotations,
          storedSbConfig, storedRemoteUrl,
          storedUserNotes, storedUserSignature
        ] = await Promise.all([
          get('work_sessions'), get('interventions'), get('assets'), get('articles'),
          get('services'), get('anomalies'), get('attendance_history'), get('quotations'),
          get('supabase_config'), get('remote_url'),
          get('user_notes'), get('user_signature')
        ]);

        setSessions(storedSessions || []);
        setInterventions(storedInterventions || INITIAL_INTERVENTIONS);
        setAssets(storedAssets || INITIAL_ASSETS);
        setArticles(storedArticles || INITIAL_ARTICLES);
        setServices(storedServices || SERVICES_LIST);
        setAnomalies(storedAnomalies || ANOMALIES_LIST);
        setAttendanceHistory(storedAttendance || []);
        setQuotations(storedQuotations || []);
        if (storedUserNotes) setUserNotes(storedUserNotes);
        setUserSignature(storedUserSignature || "");
        if (!envConfig.url && storedSbConfig) setSupabaseConfigState(storedSbConfig);
        if (storedRemoteUrl) setRemoteUrlState(storedRemoteUrl);

      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };
    loadData();
  }, []);

  useEffect(() => { if (isInitialized) set('work_sessions', sessions); }, [sessions, isInitialized]);
  useEffect(() => { if (isInitialized) set('interventions', interventions); }, [interventions, isInitialized]);
  useEffect(() => { if (isInitialized) set('assets', assets); }, [assets, isInitialized]);
  useEffect(() => { if (isInitialized) set('quotations', quotations); }, [quotations, isInitialized]);

  // Helper puro per generare il numero basato su una lista esistente
  const generateQuotationNumberInternal = (list: Quotation[]) => {
    const currentYear = new Date().getFullYear();
    const yearQuos = list.filter(q => q.number && q.number.startsWith(currentYear.toString()));
    let maxProgressive = 0;

    yearQuos.forEach(q => {
      const parts = q.number.split('/');
      if (parts.length === 2) {
        const prog = parseInt(parts[1], 10);
        if (!isNaN(prog) && prog > maxProgressive) maxProgressive = prog;
      }
    });

    const nextProg = (maxProgressive + 1).toString().padStart(3, '0');
    return `${currentYear}/${nextProg}`;
  };

  const syncData = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    return safeSync(async () => {
      if (!supabaseConfig.url || !supabaseConfig.key) throw new Error("Cloud non configurato.");
      const supabase = createClient(supabaseConfig.url, supabaseConfig.key);

      // --- 1. INTERVENTIONS ---
      if (interventions.length > 0) {
        const payload = interventions.map(i => ({
          id: i.id,
          client_id: i.clientId,
          asset_id: i.assetId,
          timestamp: i.timestamp,
          services: i.services,
          anomalies: i.anomalies,
          notes: i.notes,
          photos: i.photos,
          internal_comments: i.internalComments,
          technician_signature: i.technicianSignature,
          technician_signature_img: i.technicianSignatureImage,
          client_signature: i.clientSignature,
          client_signature_img: i.clientSignatureImage,
          updated_at: i.updatedAt || new Date().toISOString(),
          json_content: i
        }));
        const { error } = await supabase.from('interventions').upsert(payload);
        if (error) throw error;
      }

      // --- 2. ASSETS ---
      if (assets.length > 0) {
        const payload = assets.map(a => ({
          id: a.id,
          client_id: a.clientId,
          tipo: a.tipo,
          matricola: a.matricola,
          ubicazione: a.ubicazione,
          scadenza: a.scadenza,
          data_ultima_revisione: a.dataUltimaRevisione,
          categoria: a.categoria,
          note: a.note,
          specific_data: a.specificData,
          updated_at: a.updatedAt || new Date().toISOString(),
          json_content: a
        }));
        const { error } = await supabase.from('assets').upsert(payload);
        if (error) throw error;
      }

      // --- 3. SESSIONS ---
      if (sessions.length > 0) {
        const payload = sessions.map(s => ({
          id: s.id,
          client_id: s.clientId,
          statustext: s.status, // Mappato su colonna 'statustext'
          start_timestamp: s.startTimestamp,
          scheduled_date: s.scheduledDate,
          assigned_tech_ids: s.assignedTechIds,
          assigned_tech_name: s.assignedTechName,
          general_notes: s.generalNotes,
          tech_signature: s.technicianSignature,
          tech_signature_img: s.technicianSignatureImage,
          client_signature: s.clientSignature,
          client_signature_img: s.clientSignatureImage,
          intervention_ids: s.interventionIds,
          updated_at: s.updatedAt || new Date().toISOString(),
          json_content: s
        }));
        const { error } = await supabase.from('work_sessions').upsert(payload);
        if (error) throw error;
      }

      // --- 4. QUOTATIONS ---
      if (quotations.length > 0) {
        const payload = quotations.map(q => ({
          id: q.id,
          number: q.number,
          type: q.type,
          category: q.category,
          client_id: q.clientId,
          status: q.status,
          amount: q.amount,
          date: q.date,
          expiry_date: q.expiryDate,
          items: q.items,
          notes: q.notes,
          updated_at: q.updatedAt || new Date().toISOString(),
          json_content: q
        }));
        const { error } = await supabase.from('quotations').upsert(payload);
        if (error) throw error;
      }

      // --- 5. ATTENDANCE ---
      if (attendanceHistory.length > 0) {
        const payload = attendanceHistory.filter(r => !r.synced).map(r => ({
          id: r.id,
          user_id: r.userId,
          user_name: r.userName,
          type: r.type,
          status: r.status,
          timestamp: r.timestamp,
          latitude: r.latitude,
          longitude: r.longitude,
          notes: r.notes,
          approved_by: r.approvedBy,
          approval_timestamp: r.approvalTimestamp,
          synced: true
        }));

        if (payload.length > 0) {
          const { error } = await supabase.from('attendance_history').upsert(payload);
          if (error) throw error;
          // Aggiorna stato locale synced=true
          setAttendanceHistory(prev => prev.map(loc => {
            const sent = payload.find(p => p.id === loc.id);
            return sent ? { ...loc, synced: true } : loc;
          }));
        }
      }

      await refreshClients();
    });
  }, [supabaseConfig, interventions, assets, sessions, quotations, attendanceHistory, safeSync, refreshClients]);

  const value = useMemo(() => ({
    clients, articles, assets, services, anomalies, checklistTemplates, categoryAnomalies, interventions, notifications, sessions, technicians, attendanceHistory, quotations, isLoading,
    userNotes, userSignature, updateUserNotes: setUserNotes, saveUserSignature: setUserSignature,
    remoteUrl, setRemoteUrl: setRemoteUrlState, supabaseConfig, setSupabaseConfig: setSupabaseConfigState, syncData,
    downloadCloudData: async () => {
      if (!supabaseConfig.url || !supabaseConfig.key) return { success: false, message: "Cloud non configurato" };

      try {
        // Retrieve current user to determine role
        const client = createClient(supabaseConfig.url, supabaseConfig.key);
        const currentSession = await client.auth.getSession();
        const userId = currentSession.data.session?.user?.id;
        if (!userId) return { success: false, message: "Utente non loggato" };

        const { data: profile } = await client.from('profiles').select('role').eq('id', userId).single();
        const userRole = profile?.role || 'technician'; // Default safe
        const isAdminOrOffice = userRole === 'admin' || userRole === 'office';

        setIsLoading(true);

        // 1. ASSETS
        // Admin: Tutto. Tecnico: Tutto (per ora, come da piano sicurezza)
        const { data: assetsData } = await client.from('assets').select('*');
        if (assetsData) {
          const mappedAssets: Asset[] = assetsData.map((d: any) => ({
            id: d.id,
            clientId: d.client_id,
            tipo: d.tipo,
            matricola: d.matricola,
            ubicazione: d.ubicazione,
            scadenza: d.scadenza,
            dataUltimaRevisione: d.data_ultima_revisione,
            categoria: d.categoria,
            note: d.note,
            specificData: d.specific_data,
            updatedAt: d.updated_at
          }));
          setAssets(mappedAssets);
        }

        // 2. INTERVENTIONS
        // Admin: Tutto. Tecnico: Solo ultimi 30 giorni
        let intQuery = client.from('interventions').select('*');

        if (!isAdminOrOffice) {
          // Smart Sync: Tecnici vedono solo interventi recenti (ultimi 45 giorni per sicurezza)
          const dateLimit = new Date();
          dateLimit.setDate(dateLimit.getDate() - 45);
          intQuery = intQuery.gte('timestamp', dateLimit.toISOString());
        }

        const { data: intData } = await intQuery;
        if (intData) {
          const mappedInt: Intervention[] = intData.map((d: any) => ({
            id: d.id,
            clientId: d.client_id,
            clientName: '',
            assetId: d.asset_id,
            assetName: '',
            timestamp: d.timestamp,
            services: d.services,
            anomalies: d.anomalies,
            notes: d.notes,
            photos: d.photos,
            internalComments: d.internal_comments,
            technicianSignature: d.technician_signature,
            technicianSignatureImage: d.technician_signature_img,
            clientSignature: d.client_signature,
            clientSignatureImage: d.client_signature_img,
            updatedAt: d.updated_at
          }));
          setInterventions(mappedInt);
        }

        // 3. SESSIONS
        // Admin: Tutto. Tecnico: Solo OPEN o recenti
        let sessQuery = client.from('work_sessions').select('*');
        if (!isAdminOrOffice) {
          // Scarica solo sessioni APERTE oppure CHIUSE di recente
          // Nota: In Supabase 'or' filters sono complessi, per semplicità scarichiamo quelle degli ultimi 45gg
          const dateLimit = new Date();
          dateLimit.setDate(dateLimit.getDate() - 45);
          sessQuery = sessQuery.gte('updated_at', dateLimit.toISOString());
        }

        const { data: sessData } = await sessQuery;
        if (sessData) {
          const mappedSess: WorkSession[] = sessData.map((d: any) => ({
            id: d.id,
            clientId: d.client_id,
            startTimestamp: d.start_timestamp,
            status: d.statustext as any,
            scheduledDate: d.scheduled_date,
            assignedTechIds: d.assigned_tech_ids,
            assignedTechName: d.assigned_tech_name,
            generalNotes: d.general_notes,
            technicianSignature: d.tech_signature,
            technicianSignatureImage: d.tech_signature_img,
            clientSignature: d.client_signature,
            clientSignatureImage: d.client_signature_img,
            draftInterventions: [],
            interventionIds: d.intervention_ids || [],
            updatedAt: d.updated_at
          }));
          // Merge intelligente per non sovrascrivere sessioni locali non syncate che potrebbero essere più nuove?
          // Per ora overwrite come da logica originale, assumendo cloud come source of truth per il download
          setSessions(mappedSess);
        }

        // 4. QUOTATIONS
        const { data: quotData } = await client.from('quotations').select('*');
        if (quotData) {
          const mappedQuot: Quotation[] = quotData.map((d: any) => ({
            id: d.id,
            number: d.number,
            type: d.type,
            category: d.category,
            clientId: d.client_id,
            clientName: '',
            title: '',
            description: '',
            items: d.items,
            amount: d.amount,
            status: d.status,
            date: d.date,
            expiryDate: d.expiry_date,
            notes: d.notes,
            updatedAt: d.updated_at
          }));
          setQuotations(mappedQuot);
        }

        // 5. ATTENDANCE
        const { data: attData } = await client.from('attendance_history').select('*');
        if (attData) {
          const mappedAtt: AttendanceRecord[] = attData.map((d: any) => ({
            id: d.id,
            userId: d.user_id,
            userName: d.user_name,
            type: d.type,
            status: d.status,
            timestamp: d.timestamp,
            latitude: d.latitude,
            longitude: d.longitude,
            notes: d.notes,
            approvedBy: d.approved_by,
            approvalTimestamp: d.approval_timestamp,
            synced: true
          }));
          setAttendanceHistory(mappedAtt);
        }

        // 6. TECHNICIANS (from profiles table)
        const { data: techData } = await client.from('profiles').select('*');
        if (techData) {
          const mappedTech: Technician[] = techData.map((d: any, index: number) => ({
            id: d.id,
            name: d.full_name || d.email.split('@')[0],
            email: d.email,
            color: ['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ea580c', '#0d9488', '#0891b2', '#db2777', '#4f46e5', '#65a30d', '#d97706', '#059669', '#c026d3'][index % 13]
          }));
          setTechnicians(mappedTech);
        }

        await refreshClients();
        return { success: true, message: `Download completato (${userRole})` };
      } catch (error: any) {
        console.error("Download Error", error);
        return { success: false, message: error.message || "Errore download" };
      } finally {
        setIsLoading(false);
      }
    },
    getOpenSession: (clientId: number) => sessions.find(s => s.clientId === clientId && s.status === 'OPEN'),
    createSession: (clientId: number) => {
      const timestamp = getTimestamp();
      const newSession: WorkSession = {
        id: `SESS-${Date.now()}`, clientId, startTimestamp: timestamp, status: 'OPEN',
        generalNotes: '', technicianSignature: '', technicianSignatureImage: '', clientSignature: '', clientSignatureImage: '',
        draftInterventions: [], interventionIds: [], updatedAt: timestamp
      };
      setSessions(prev => [...prev, newSession]);
      return newSession;
    },
    scheduleSession: (clientId: number, date: string, techIds: string[]) => {
      const newSession: WorkSession = {
        id: `PLAN-${Date.now()}`, clientId, startTimestamp: '', status: 'PLANNED', scheduledDate: date,
        assignedTechIds: techIds, assignedTechName: '', generalNotes: '', technicianSignature: '', technicianSignatureImage: '', clientSignature: '', clientSignatureImage: '',
        draftInterventions: [], interventionIds: [], updatedAt: getTimestamp()
      };
      setSessions(prev => [...prev, newSession]);
    },
    updateSession: (clientId: number, data: Partial<WorkSession>) => setSessions(prev => prev.map(s => s.clientId === clientId && s.status === 'OPEN' ? { ...s, ...data, updatedAt: getTimestamp() } : s)),
    updatePlannedSession: (sessionId: string, date: string, techIds: string[]) => setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, scheduledDate: date, assignedTechIds: techIds, updatedAt: getTimestamp() } : s)),
    saveInterventionToSession: (sessionId: string, intervention: Intervention, metadata?: Partial<WorkSession>) => {
      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          const drafts = [...s.draftInterventions];
          const idx = drafts.findIndex(i => i.assetId === intervention.assetId);
          if (idx >= 0) drafts[idx] = intervention; else drafts.push(intervention);
          return { ...s, ...metadata, draftInterventions: drafts, updatedAt: getTimestamp() };
        }
        return s;
      }));
    },
    closeSession: (sessionId: string, finalMetadata?: Partial<WorkSession>) => {
      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          return { ...s, ...finalMetadata, status: 'CLOSED' as const, updatedAt: getTimestamp() };
        }
        return s;
      }));
      const session = sessions.find(s => s.id === sessionId);
      if (session) setInterventions(prev => [...session.draftInterventions, ...prev]);
    },
    reopenSession: (clientId: number) => { },
    deleteSession: (sessionId: string) => setSessions(prev => prev.filter(s => s.id !== sessionId)),
    addIntervention: (i: Intervention) => setInterventions(p => [{ ...i, updatedAt: getTimestamp() }, ...p]),
    addInterventionsBulk: (list: Intervention[]) => setInterventions(p => [...list, ...p]),
    addClient: (c: Client) => addClientCtx(c),
    updateClient: (c: Client) => updateClientCtx(c),
    addClientsBulk: (list: any[]) => addClientsBulkCtx(list),
    deleteClient: (id: number) => deleteClientCtx(id),
    addArticle: (a: Article) => setArticles(p => [...p, a]),
    addArticlesBulk: (list: Article[]) => setArticles(p => [...p, ...list]),
    deleteArticle: (id: string) => setArticles(p => p.filter(a => a.id !== id)),
    addAsset: (a: Asset) => setAssets(p => [...p, a]),
    updateAsset: (a: Asset) => setAssets(p => p.map(o => o.id === a.id ? a : o)),
    deleteAsset: (id: string) => setAssets(p => p.filter(a => a.id !== id)),
    addAssetsBulk: (list: Asset[]) => setAssets(p => [...p, ...list]),
    addService: (s: string) => setServices(p => [...p, s]),
    addAnomaly: (a: string) => setAnomalies(p => [...p, a]),
    deleteService: (s: string) => setServices(p => p.filter(i => i !== s)),
    deleteAnomaly: (a: string) => setAnomalies(p => p.filter(i => i !== a)),
    updateChecklistTemplate: (cat: string, items: string[]) => setChecklistTemplates(p => ({ ...p, [cat]: items })),
    updateCategoryAnomaly: (cat: string, items: string[]) => setCategoryAnomalies(p => ({ ...p, [cat]: items })),
    addNotification: (n: any) => setNotifications(p => [{ id: `N-${Date.now()}`, timestamp: getTimestamp(), readBy: [], ...n }, ...p]),
    markNotificationAsRead: (id: string, userId: string) => setNotifications(p => p.map(n => n.id === id ? { ...n, readBy: [...n.readBy, userId] } : n)),
    clearAllNotifications: () => setNotifications([]),
    addAttendanceRecord: (r: AttendanceRecord) => setAttendanceHistory(p => [r, ...p]),
    updateAttendanceStatus: (id: string, s: ApprovalStatus, u: string) => setAttendanceHistory(p => p.map(r => r.id === id ? { ...r, status: s, approvedBy: u } : r)),
    addQuotation: (q: Quotation) => {
      setQuotations(prevList => {
        const number = q.number || generateQuotationNumberInternal(prevList);
        const id = q.id || `QUO-${Date.now()}`;
        return [{ ...q, id, number }, ...prevList];
      });
    },
    updateQuotation: (id: string, data: Partial<Quotation>) => setQuotations(p => p.map(q => q.id === id ? { ...q, ...data } : q)),
    deleteQuotation: (id: string) => setQuotations(p => p.filter(q => q.id !== id)),
    exportData: () => { },
    importData: (json: string) => true
  }), [clients, articles, assets, interventions, sessions, quotations, isLoading, attendanceHistory, addClientCtx, updateClientCtx, addClientsBulkCtx, deleteClientCtx, refreshClients, safeSync, syncData]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
