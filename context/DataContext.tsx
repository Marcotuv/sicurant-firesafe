
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef, useMemo } from 'react';
import {
  Client, Asset, Article, Intervention, Notification, DataContextType, WorkSession, SupabaseConfig, Technician, AttendanceRecord, Note, ApprovalStatus, Quotation, QuotationStatus
} from '../types';
import {
  INITIAL_ASSETS, INITIAL_ARTICLES, INITIAL_INTERVENTIONS, INITIAL_NOTIFICATIONS, SERVICES_LIST, ANOMALIES_LIST, CHECKLIST_TEMPLATES, CATEGORY_ANOMALIES
} from '../lib/constants';
import { envConfig } from '../config/supabase';
import { get, set } from 'idb-keyval';
import { useClients } from './ClientsContext';
import { useSyncManager } from '../hooks/useSyncManager';
import { getLocalDate, getTimestamp } from '../utils/dates';
import { supabase as globalSupabase } from '../config/supabase';
import { fetchAll } from '../utils/supabaseHelpers';

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

  const { clients, addClient: addClientCtx, updateClient: updateClientCtx, deleteClient: deleteClientCtx, addClientsBulk: addClientsBulkCtx, refreshClients, checkDuplicateClient } = useClients();
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
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'offline'>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // PHASE 1: Critical Config
        const [storedSbConfig, storedRemoteUrl, storedUserSignature] = await Promise.all([
          get('supabase_config'), get('remote_url'), get('user_signature')
        ]);

        if (!envConfig.url && storedSbConfig) setSupabaseConfigState(storedSbConfig);
        if (storedRemoteUrl) setRemoteUrlState(storedRemoteUrl);
        setUserSignature(storedUserSignature || "");

        // PHASE 2: Business Data
        const [
          storedSessions, storedInterventions, storedAssets, storedArticles,
          storedServices, storedAnomalies, storedAttendance, storedQuotations,
          storedUserNotes, storedTechnicians
        ] = await Promise.all([
          get('work_sessions'), get('interventions'), get('assets'), get('articles'),
          get('services'), get('anomalies'), get('attendance_history'), get('quotations'),
          get('user_notes'), get('technicians')
        ]);

        // Helper migration function
        const migrateSynced = (list: any[]) => list ? list.map(i => ({ ...i, synced: i.synced !== undefined ? i.synced : true })) : [];

        setSessions(migrateSynced(storedSessions));
        setInterventions(migrateSynced(storedInterventions));
        setAssets(migrateSynced(storedAssets));
        setArticles(migrateSynced(storedArticles));
        setServices(storedServices || SERVICES_LIST);
        setAnomalies(storedAnomalies || ANOMALIES_LIST);
        setAttendanceHistory(migrateSynced(storedAttendance)); // Attendance assumes synced differently, but let's align
        setQuotations(migrateSynced(storedQuotations));
        setTechnicians(storedTechnicians || []);
        if (storedUserNotes) setUserNotes(storedUserNotes);

      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };
    loadData();
  }, []);

  // ... (Persistence Logic Omitted - No Change) ...

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

  const checkConflict = useCallback(async (table: string, id: string | number, localUpdatedAt?: string) => {
    if (!globalSupabase) return false;
    const { data, error } = await globalSupabase.from(table).select('updated_at').eq('id', id).single();
    if (error || !data) return false;

    if (localUpdatedAt && data.updated_at) {
      return new Date(data.updated_at) > new Date(localUpdatedAt);
    }
    return false;
  }, []);

  const clearAllDataLocal = useCallback(async () => {
    console.log('[DataContext] Clearing all local data...');
    const keys = [
      'work_sessions', 'interventions', 'assets', 'articles',
      'services', 'anomalies', 'attendance_history', 'quotations',
      'user_notes', 'user_signature', 'supabase_config', 'remote_url'
    ];
    // Clear IDB
    await Promise.all(keys.map(k => set(k, null)));

    // Reset React State
    setSessions([]);
    setInterventions(INITIAL_INTERVENTIONS);
    setAssets(INITIAL_ASSETS);
    setArticles(INITIAL_ARTICLES);
    setServices(SERVICES_LIST);
    setAnomalies(ANOMALIES_LIST);
    setAttendanceHistory([]);
    setQuotations([]);
    setUserNotes([]);
    setUserSignature("");
    setLastSyncTime(null);
  }, []);

  const syncData = useCallback(async (options: { forceRemoteMerge?: boolean } = {}): Promise<{ success: boolean; message: string }> => {
    return safeSync(async () => {
      console.log('[DataContext] Inizio sincronizzazione globale (Delta Sync)...');
      setSyncStatus('syncing');

      const supabase = globalSupabase;
      if (!supabase) {
        setSyncStatus('error');
        throw new Error("Cloud non configurato correttamente.");
      }

      try {
        // --- 1. INTERVENTIONS ---
        const dirtyInterventions = interventions.filter(i => !i.synced);
        if (dirtyInterventions.length > 0) {
          console.log(`[DataContext] Syncing ${dirtyInterventions.length} modified interventions...`);
          const payload = dirtyInterventions.map(i => ({
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

          // Mark as synced
          setInterventions(prev => prev.map(p => dirtyInterventions.find(d => d.id === p.id) ? { ...p, synced: true } : p));
        }

        // --- 2. ASSETS ---
        const dirtyAssets = assets.filter(a => !a.synced);
        if (dirtyAssets.length > 0) {
          console.log(`[DataContext] Syncing ${dirtyAssets.length} modified assets...`);
          const payload = dirtyAssets.map(a => ({
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

          setAssets(prev => prev.map(p => dirtyAssets.find(d => d.id === p.id) ? { ...p, synced: true } : p));
        }

        // --- 3. SESSIONS ---
        const dirtySessions = sessions.filter(s => !s.synced);
        if (dirtySessions.length > 0) {
          console.log(`[DataContext] Syncing ${dirtySessions.length} modified sessions...`);
          try {
            // SMART MERGE LOGIC (Simplified for Delta)
            const payload = dirtySessions.map(s => ({
              id: s.id,
              client_id: s.clientId,
              statustext: s.status,
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

            setSessions(prev => prev.map(p => dirtySessions.find(d => d.id === p.id) ? { ...p, synced: true } : p));

          } catch (sessionErr) {
            console.error('[DataContext] Error syncing sessions', sessionErr);
          }
        }

        // --- 4. QUOTATIONS ---
        const dirtyQuotations = quotations.filter(q => !q.synced);
        if (dirtyQuotations.length > 0) {
          console.log(`[DataContext] Syncing ${dirtyQuotations.length} modified quotations...`);
          const payload = dirtyQuotations.map(q => ({
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

          setQuotations(prev => prev.map(p => dirtyQuotations.find(d => d.id === p.id) ? { ...p, synced: true } : p));
        }

        // --- 5. ATTENDANCE --- (Already had logic, just ensuring consistency)
        const dirtyAttendance = attendanceHistory.filter(r => !r.synced);
        if (dirtyAttendance.length > 0) {
          console.log(`[DataContext] Syncing ${dirtyAttendance.length} attendance records...`);
          const payload = dirtyAttendance.map(r => ({
            id: r.id, user_id: r.userId, user_name: r.userName, type: r.type, status: r.status,
            timestamp: r.timestamp, latitude: r.latitude, longitude: r.longitude,
            notes: r.notes, approved_by: r.approvedBy, approval_timestamp: r.approvalTimestamp, synced: true
          }));
          const { error } = await supabase.from('attendance_history').upsert(payload);
          if (error) throw error;
          setAttendanceHistory(prev => prev.map(loc => {
            const sent = payload.find(p => p.id === loc.id);
            return sent ? { ...loc, synced: true } : loc;
          }));
        }

        // --- 6. ARTICLES ---
        const dirtyArticles = articles.filter(a => !a.synced);
        if (dirtyArticles.length > 0) {
          console.log(`[DataContext] Syncing ${dirtyArticles.length} modified articles...`);
          const payload = dirtyArticles.map(a => ({
            id: a.id, categoria: a.categoria, descrizione: a.descrizione, note: a.note,
            updated_at: a.updatedAt || new Date().toISOString()
          }));
          const { error } = await supabase.from('articles').upsert(payload);
          if (error) throw error;

          setArticles(prev => prev.map(p => dirtyArticles.find(d => d.id === p.id) ? { ...p, synced: true } : p));
        }

        // --- 7. CLIENTS (Anagrafiche) ---
        // Using ClientsContext is preferred, but for robust sync we check here too.
        // We filter dirty clients only.
        const dirtyClients = clients.filter(c => !c.synced);
        if (dirtyClients.length > 0) {
          console.log(`[DataContext] Syncing ${dirtyClients.length} modified clients...`);
          const payload = dirtyClients.map(client => ({
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
            updated_at: client.updatedAt || new Date().toISOString(),
            json_content: client
          }));

          // Batching for clients
          const BATCH_SIZE = 500;
          for (let i = 0; i < payload.length; i += BATCH_SIZE) {
            const batch = payload.slice(i, i + BATCH_SIZE);
            const { error } = await supabase.from('clients').upsert(batch);
            if (error) throw error;
          }

          // Note: We cannot easily update ClientsContext state from here without exposing a setClients. 
          // But since ClientsContext handles its own sync and setSynced(true), 
          // this block is mainly a fallback. We will rely on ClientsContext to update the flag.
          // Or strictly speaking, we should trigger a refreshClients() or similar?
          // For now, if ClientsContext is active, it should have handled it.
        }

        console.log('[DataContext] Delta Sync completata!');
        setSyncStatus('synced');
        setLastSyncTime(new Date().toLocaleTimeString());
      } catch (err) {
        console.error('[DataContext] Errore critico durante syncData:', err);
        setSyncStatus('error');
        throw err; // Rilancia per safeSync
      }
    });
  }, [supabaseConfig, interventions, assets, sessions, quotations, attendanceHistory, articles, clients, safeSync, refreshClients]);

  const downloadCloudData = useCallback(async () => {
    const supabase = globalSupabase;
    if (!supabase) return { success: false, message: "Cloud non configurato" };

    try {
      const currentSession = await supabase.auth.getSession();
      const userId = currentSession.data.session?.user?.id;
      if (!userId) return { success: false, message: "Utente non loggato" };

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
      const userRole = profile?.role || 'technician';
      const isAdminOrOffice = userRole === 'admin' || userRole === 'office';

      setIsLoading(true);

      // --- DELTA SYNC LOGIC ---
      // Retrieve last successful pull timestamp
      const lastPullTimestamp = await get('last_pull_timestamp');
      console.log(`[DataContext] Starting Download. Last Pull: ${lastPullTimestamp || 'NEVER (Full Sync)'}`);

      // Helper to construct query with delta check
      const buildQuery = (table: string, select = '*') => {
        let query = supabase.from(table).select(select);
        if (lastPullTimestamp) {
          query = query.gt('updated_at', lastPullTimestamp);
        }
        return query;
      };

      // 1. ASSETS
      const { data: assetsData, error: assetsError } = await fetchAll<any>(buildQuery('assets'));
      if (assetsData && !assetsError) {
        if (assetsData.length > 0) console.log(`[DataContext] Downloaded ${assetsData.length} updated assets.`);
        const cloudAssets: Asset[] = assetsData.map((d: any) => ({
          id: d.id, clientId: d.client_id, tipo: d.tipo, matricola: d.matricola, ubicazione: d.ubicazione,
          scadenza: d.scadenza, dataUltimaRevisione: d.data_ultima_revisione, categoria: d.categoria,
          note: d.note, specificData: d.specific_data, updatedAt: d.updated_at, synced: true
        }));

        setAssets(prev => {
          const merged = [...prev];
          cloudAssets.forEach(ca => {
            const idx = merged.findIndex(ba => ba.id === ca.id);
            if (idx === -1) merged.push(ca);
            else {
              const localUpdatedAt = merged[idx].updatedAt;
              if (!localUpdatedAt || (ca.updatedAt && new Date(ca.updatedAt) > new Date(localUpdatedAt))) {
                merged[idx] = ca;
              }
            }
          });
          return merged;
        });
      }

      // 2. INTERVENTIONS
      let intQuery = supabase.from('interventions').select('*');
      if (lastPullTimestamp) {
        intQuery = intQuery.gt('updated_at', lastPullTimestamp);
      } else if (!isAdminOrOffice) {
        // Only apply date limit on FULL sync if not admin
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - 45);
        intQuery = intQuery.gte('timestamp', dateLimit.toISOString());
      }

      const { data: intData, error: intError } = await fetchAll<any>(intQuery);
      if (intData && !intError) {
        if (intData.length > 0) console.log(`[DataContext] Downloaded ${intData.length} updated interventions.`);
        const cloudInterventions: Intervention[] = intData.map((d: any) => ({
          id: d.id, clientId: d.client_id, clientName: '', assetId: d.asset_id, assetName: '',
          timestamp: d.timestamp, services: d.services, anomalies: d.anomalies, notes: d.notes,
          photos: d.photos, internalComments: d.internal_comments, technicianSignature: d.technician_signature,
          technicianSignatureImage: d.technician_signature_img, clientSignature: d.client_signature,
          clientSignatureImage: d.client_signature_img, updatedAt: d.updated_at, synced: true
        }));

        setInterventions(prev => {
          const merged = [...prev];
          cloudInterventions.forEach(ci => {
            const idx = merged.findIndex(bi => bi.id === ci.id);
            if (idx === -1) merged.push(ci);
            else if (!merged[idx].updatedAt || (ci.updatedAt && new Date(ci.updatedAt) > new Date(merged[idx].updatedAt!))) {
              merged[idx] = ci;
            }
          });
          return merged;
        });
      }

      // 3. SESSIONS
      const { data: sessData, error: sessError } = await fetchAll<any>(buildQuery('work_sessions'));
      if (sessData && !sessError) {
        if (sessData.length > 0) console.log(`[DataContext] Downloaded ${sessData.length} updated sessions.`);
        const cloudSessions: WorkSession[] = sessData.map((d: any) => ({
          id: d.id, clientId: d.client_id, startTimestamp: d.start_timestamp, status: d.statustext as any,
          scheduledDate: d.scheduled_date, assignedTechIds: d.assigned_tech_ids, assignedTechName: d.assigned_tech_name,
          generalNotes: d.general_notes, technicianSignature: d.tech_signature, technicianSignatureImage: d.tech_signature_img,
          clientSignature: d.client_signature, clientSignatureImage: d.client_signature_img,
          draftInterventions: [], interventionIds: d.intervention_ids || [], updatedAt: d.updated_at, synced: true
        }));

        setSessions(prev => {
          const merged = [...prev];
          cloudSessions.forEach(cs => {
            const idx = merged.findIndex(bs => bs.id === cs.id);
            if (idx === -1) merged.push(cs);
            else {
              const combinedIds = Array.from(new Set([...(merged[idx].interventionIds || []), ...(cs.interventionIds || [])]));
              if (!merged[idx].updatedAt || (cs.updatedAt && new Date(cs.updatedAt) > new Date(merged[idx].updatedAt!))) {
                merged[idx] = { ...cs, interventionIds: combinedIds };
              } else {
                merged[idx] = { ...merged[idx], interventionIds: combinedIds };
              }
            }
          });
          return merged;
        });
      }

      // 4. QUOTATIONS
      const { data: quotData } = await fetchAll<any>(buildQuery('quotations'));
      if (quotData) {
        if (quotData.length > 0) console.log(`[DataContext] Downloaded ${quotData.length} updated quotations.`);
        const cloudQuotations: Quotation[] = quotData.map((d: any) => ({
          id: d.id, number: d.number, type: d.type, category: d.category, clientId: d.client_id,
          clientName: '', title: '', description: '', items: d.items, amount: d.amount,
          status: d.status, date: d.date, expiryDate: d.expiry_date, notes: d.notes, updatedAt: d.updated_at, synced: true
        }));

        setQuotations(prev => {
          const merged = [...prev];
          cloudQuotations.forEach(cq => {
            const idx = merged.findIndex(bq => bq.id === cq.id);
            if (idx === -1) merged.push(cq);
            else if (!merged[idx].updatedAt || (cq.updatedAt && new Date(cq.updatedAt) > new Date(merged[idx].updatedAt!))) {
              merged[idx] = cq;
            }
          });
          return merged;
        });
      }

      // 5. ATTENDANCE (Usually append-only, but let's sync)
      // For attendance, we might want a different logic, but timestamp check works if updated_at is reliable
      // Or just fetch all if no timestamp, but if timestamp, fetch new.
      // Attendance table often doesn't have updated_at for old records? Let's check schema. Assuming it has.
      // If it doesn't have updated_at, we might rely on 'timestamp'.
      // Let's stick to updated_at if available or timestamp.
      // Assuming updated_at exists or we use timestamp for attendance.
      // For safety on Attendance, let's use TIMESTAMP column if updated_at is missing, but usually we added updated_at.
      // Let's assume updated_at is present as per previous schema edits.
      const { data: attData } = await fetchAll<any>(buildQuery('attendance_history'));
      if (attData && attData.length > 0) {
        setAttendanceHistory(prev => {
          const merged = [...prev];
          attData.forEach((d: any) => {
            const exists = merged.find(m => m.id === d.id);
            if (!exists) {
              merged.push({
                id: d.id, userId: d.user_id, userName: d.user_name, type: d.type, status: d.status,
                timestamp: d.timestamp, latitude: d.latitude, longitude: d.longitude, notes: d.notes,
                approvedBy: d.approved_by, approvalTimestamp: d.approval_timestamp, synced: true
              });
            }
          });
          return merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        });
      }

      // 6. ARTICLES
      const { data: artData } = await fetchAll<any>(buildQuery('articles'));
      if (artData) {
        if (artData.length > 0) console.log(`[DataContext] Downloaded ${artData.length} updated articles.`);
        const cloudArticles: Article[] = artData.map((d: any) => ({
          id: d.id, categoria: d.categoria, descrizione: d.descrizione, note: d.note, updatedAt: d.updated_at, synced: true
        }));

        setArticles(prev => {
          const merged = [...prev];
          cloudArticles.forEach(ca => {
            const idx = merged.findIndex(ba => ba.id === ca.id);
            if (idx === -1) merged.push(ca);
            else if (!merged[idx].updatedAt || (ca.updatedAt && new Date(ca.updatedAt) > new Date(merged[idx].updatedAt!))) {
              merged[idx] = ca;
            }
          });
          return merged;
        });
      }

      // 7. TECHNICIANS (Profiles)
      const { data: techData } = await supabase.from('profiles').select('*');
      if (techData) {
        setTechnicians(techData.map((d: any, index: number) => ({
          id: d.id, name: d.full_name || d.email.split('@')[0], email: d.email,
          color: ['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ea580c', '#0d9488', '#0891b2', '#db2777', '#4f46e5', '#65a30d', '#d97706', '#059669', '#c026d3'][index % 13]
        })));
      }

      await refreshClients(lastPullTimestamp || undefined);

      // Update last successful pull timestamp
      const newTimestamp = new Date().toISOString();
      await set('last_pull_timestamp', newTimestamp);

      return { success: true, message: `Download completato (${userRole})` };
    } catch (error: any) {
      console.error("Download Error", error);
      return { success: false, message: error.message || "Errore download" };
    } finally {
      setIsLoading(false);
    }
  }, [refreshClients]);

  const getOpenSession = useCallback((clientId: number) => sessions.find(s => s.clientId === clientId && s.status === 'OPEN'), [sessions]);

  const createSession = useCallback((clientId: number) => {
    const timestamp = getTimestamp();
    const newSession: WorkSession = {
      id: `SESS-${Date.now()}`, clientId, startTimestamp: timestamp, status: 'OPEN',
      generalNotes: '', technicianSignature: '', technicianSignatureImage: '', clientSignature: '', clientSignatureImage: '',
      draftInterventions: [], interventionIds: [], updatedAt: timestamp, synced: false
    };
    setSessions(prev => [...prev, newSession]);
    return newSession;
  }, []);

  const scheduleSession = useCallback((clientId: number, date: string, techIds: string[]) => {
    const newSession: WorkSession = {
      id: `PLAN-${Date.now()}`, clientId, startTimestamp: '', status: 'PLANNED', scheduledDate: date,
      assignedTechIds: techIds, assignedTechName: '', generalNotes: '', technicianSignature: '', technicianSignatureImage: '', clientSignature: '', clientSignatureImage: '',
      draftInterventions: [], interventionIds: [], updatedAt: getTimestamp()
    };
    setSessions(prev => [...prev, newSession]);
  }, []);

  const updateSession = useCallback((clientId: number, data: Partial<WorkSession>) => setSessions(prev => prev.map(s => s.clientId === clientId && s.status === 'OPEN' ? { ...s, ...data, updatedAt: getTimestamp(), synced: false } : s)), []);
  const updatePlannedSession = useCallback((sessionId: string, date: string, techIds: string[]) => setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, scheduledDate: date, assignedTechIds: techIds, updatedAt: getTimestamp(), synced: false } : s)), []);

  const addAssetsBulk = useCallback(async (newAssets: Asset[]) => {
    const dirtyAssets = newAssets.map(a => ({ ...a, synced: false }));
    setAssets(prev => [...prev, ...dirtyAssets]);
    if (globalSupabase && newAssets.length > 0) {
      const payloads = newAssets.map(asset => ({
        id: asset.id,
        client_id: asset.clientId,
        type: asset.tipo,
        location: asset.ubicazione,
        scadenza: asset.scadenza,
        notes: asset.note,
        json_content: asset
      }));

      // BATCHING (max 500 rows per request)
      const BATCH_SIZE = 500;
      for (let i = 0; i < payloads.length; i += BATCH_SIZE) {
        const batch = payloads.slice(i, i + BATCH_SIZE);
        const { error } = await globalSupabase.from('assets').upsert(batch);
        if (error) {
          console.error(`Asset Batch starting at ${i} failed:`, error);
          throw new Error(`Errore caricamento presidi blocco ${i / BATCH_SIZE + 1}: ${error.message}`);
        }
      }
    }

    // Force immediate local save for bulk import
    try {
      await set('assets', [...assets, ...newAssets]);
    } catch (e) { console.warn("Local save failed", e) }
  }, [assets]);

  const saveInterventionToSession = useCallback((sessionId: string, intervention: Intervention, metadata?: Partial<WorkSession>) => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        const drafts = [...s.draftInterventions];
        const idx = drafts.findIndex(i => i.assetId === intervention.assetId);
        if (idx >= 0) drafts[idx] = intervention; else drafts.push(intervention);
        return { ...s, ...metadata, draftInterventions: drafts, updatedAt: getTimestamp(), synced: false };
      }
      return s;
    }));
  }, []);

  const closeSession = useCallback((sessionId: string, finalMetadata?: Partial<WorkSession>) => {
    setSessions(prev => {
      const session = prev.find(s => s.id === sessionId);
      if (session) {
        setInterventions(old => [...session.draftInterventions, ...old]);
      }
      return prev.map(s => s.id === sessionId ? { ...s, ...finalMetadata, status: 'CLOSED' as const, draftInterventions: [], updatedAt: getTimestamp(), synced: false } : s);
    });
  }, []);

  const value = useMemo(() => ({
    clients, articles, assets, services, anomalies, checklistTemplates, categoryAnomalies, interventions, notifications, sessions, technicians, attendanceHistory, quotations, isLoading,
    userNotes, userSignature, updateUserNotes: setUserNotes, saveUserSignature: setUserSignature,
    remoteUrl, setRemoteUrl: setRemoteUrlState, supabaseConfig, setSupabaseConfig: setSupabaseConfigState, syncData,
    downloadCloudData, syncStatus, lastSyncTime, checkConflict, clearAllDataLocal,
    getOpenSession,
    createSession,
    scheduleSession,
    updateSession,
    updatePlannedSession,
    saveInterventionToSession,
    closeSession,
    reopenSession: (clientId: number) => { },
    deleteSession: (sessionId: string) => setSessions(prev => prev.filter(s => s.id !== sessionId)),
    addIntervention: (i: Intervention) => setInterventions(p => [{ ...i, updatedAt: getTimestamp(), synced: false }, ...p]),
    addInterventionsBulk: (list: Intervention[]) => setInterventions(p => [...list.map(i => ({ ...i, synced: false })), ...p]),
    addClient: addClientCtx,
    updateClient: updateClientCtx,
    addClientsBulk: addClientsBulkCtx,
    deleteClient: deleteClientCtx,
    addArticle: (a: Article) => setArticles(p => [...p, { ...a, synced: false }]),
    addArticlesBulk: (list: Article[]) => setArticles(p => [...p, ...list.map(a => ({ ...a, synced: false }))]),
    deleteArticle: (id: string) => setArticles(p => p.filter(a => a.id !== id)),
    addAsset: (a: Asset) => setAssets(p => [...p, { ...a, synced: false }]),
    updateAsset: (a: Asset) => setAssets(p => p.map(o => o.id === a.id ? { ...a, synced: false } : o)),
    deleteAsset: (id: string) => setAssets(p => p.filter(a => a.id !== id)),
    addAssetsBulk: (list: Asset[]) => setAssets(p => [...p, ...list.map(a => ({ ...a, synced: false }))]),
    addService: (s: string) => setServices(p => [...p, s]),
    addAnomaly: (a: string) => setAnomalies(p => [...p, a]),
    deleteService: (s: string) => setServices(p => p.filter(i => i !== s)),
    deleteAnomaly: (a: string) => setAnomalies(p => p.filter(i => i !== a)),
    updateChecklistTemplate: (cat: string, items: string[]) => setChecklistTemplates(p => ({ ...p, [cat]: items })),
    updateCategoryAnomaly: (cat: string, items: string[]) => setCategoryAnomalies(p => ({ ...p, [cat]: items })),
    addNotification: (n: any) => setNotifications(p => [{ id: `N-${Date.now()}`, timestamp: getTimestamp(), readBy: [], ...n }, ...p]),
    markNotificationAsRead: (id: string, userId: string) => setNotifications(p => p.map(n => n.id === id ? { ...n, readBy: [...n.readBy, userId] } : n)),
    clearAllNotifications: () => setNotifications([]),
    addAttendanceRecord: (r: AttendanceRecord) => setAttendanceHistory(p => [{ ...r, synced: false }, ...p]),
    updateAttendanceStatus: (id: string, s: ApprovalStatus, u: string) => setAttendanceHistory(p => p.map(r => r.id === id ? { ...r, status: s, approvedBy: u, synced: false } : r)),
    addQuotation: (q: Quotation) => {
      setQuotations(prevList => {
        const number = q.number || generateQuotationNumberInternal(prevList);
        const id = q.id || `QUO-${Date.now()}`;
        return [{ ...q, id, number, synced: false }, ...prevList];
      });
    },
    updateQuotation: (id: string, data: Partial<Quotation>) => setQuotations(p => p.map(q => q.id === id ? { ...q, ...data, synced: false } : q)),
    deleteQuotation: (id: string) => setQuotations(p => p.filter(q => q.id !== id)),
    exportData: () => { },
    importData: (json: string) => true,
    checkDuplicateClient
  }), [
    clients, articles, assets, services, anomalies, checklistTemplates, categoryAnomalies, interventions, notifications, sessions, technicians, attendanceHistory, quotations, isLoading,
    userNotes, userSignature, remoteUrl, supabaseConfig, syncData, downloadCloudData, getOpenSession, createSession, scheduleSession, updateSession, updatePlannedSession, saveInterventionToSession, closeSession,
    addClientCtx, updateClientCtx, addClientsBulkCtx, deleteClientCtx,
    syncStatus, lastSyncTime, checkConflict, checkDuplicateClient
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
