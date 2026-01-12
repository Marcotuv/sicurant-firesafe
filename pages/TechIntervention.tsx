
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { CheckCircle, AlertTriangle, FileText, Wrench, Save, X, Search, Eraser, FileCheck, Printer, Loader2, ClipboardCheck, FileOutput, Database, ChevronDown, ChevronUp, Calendar, MapPin, ArrowRight, Briefcase, User, Building, MessageSquare, Camera, Plus, Send } from 'lucide-react';
import { Asset, Intervention, Client, InternalComment } from '../types';
import { CATEGORY_STANDARDS } from '../lib/constants';
import { getLocalDate, isAssetExpired, addMonthsToDate } from '../utils/dates';
import { SignaturePad } from '../components/SignaturePad';
import { useAuth } from '../context/AuthContext';
// import { uploadPhoto } from '../utils/storage'; // Attivare quando storage configurato

// Debounce Hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
}

// ... (ASSET SCHEMAS AS BEFORE) ...
// --- DEFINIZIONE SCHEMI REGISTRI TECNICI ---
type FieldType = 'text' | 'number' | 'date' | 'boolean' | 'select' | 'header';

interface SchemaField {
    key: string;
    label: string;
    type: FieldType;
    options?: string[]; // Per select
    width?: 'full' | 'half' | 'third';
}

const ASSET_SCHEMAS: Record<string, SchemaField[]> = {
    "Estintori": [
        { key: 'anno_costruzione', label: 'Anno Costruzione', type: 'number', width: 'half' },
        { key: 'scadenza_serbatoio', label: 'Scadenza Serbatoio', type: 'date', width: 'half' },
        { key: 'prossimo_controllo', label: 'Data Prossimo Controllo (+6 Mesi)', type: 'date', width: 'third' },
        { key: 'prossima_revisione', label: 'Data Prossima Revisione (Calc. UNI 9994)', type: 'date', width: 'third' },
        { key: 'prossimo_collaudo', label: 'Data Prossimo Collaudo (Calc. UNI 9994)', type: 'date', width: 'third' },
    ],
    "Idranti": [
        { key: 'cassetta', label: 'Cassetta', type: 'boolean', width: 'third' },
        { key: 'lastra', label: 'Lastra', type: 'boolean', width: 'third' },
        { key: 'manichetta', label: 'Manichetta', type: 'boolean', width: 'third' },
        { key: 'lancia', label: 'Lancia', type: 'boolean', width: 'third' },
        { key: 'rubinetto', label: 'Rubinetto', type: 'boolean', width: 'third' },
        { key: 'chiave_manovra', label: 'Chiave di Manovra', type: 'boolean', width: 'third' },
        { key: 'pressione_statica', label: 'Pressione Statica (bar)', type: 'number', width: 'half' },
        { key: 'pressione_dinamica', label: 'Pressione Dinamica (bar)', type: 'number', width: 'half' },
    ],
    "Porte REI / US": [
        { key: 'tipo_porta', label: 'Tipo Porta', type: 'select', options: ['US (Uscita Sicurezza)', 'REI 60', 'REI 90', 'REI 120', 'Portone Scorrevole', 'Portone a Libro'], width: 'half' },
        { key: 'n_ante', label: 'N. Ante', type: 'number', width: 'half' },
        { key: 'oblo', label: 'Presenza Oblò', type: 'boolean', width: 'third' },
        { key: 'maniglione', label: 'Maniglione Antipanico', type: 'select', options: ['Assente', 'Barra', 'Push-Bar', 'Maniglia'], width: 'third' },
        { key: 'fermo_porta', label: 'Fermo Porta', type: 'boolean', width: 'third' },
        { key: 'serratura', label: 'Serratura', type: 'boolean', width: 'third' },
        { key: 'allarme', label: 'Allarme', type: 'boolean', width: 'third' },
        { key: 'bloccaggio', label: 'Bloccaggio (Chiudiporta)', type: 'boolean', width: 'third' },
        { key: 'magneti', label: 'Magneti (Fermo Elettrom.)', type: 'boolean', width: 'third' },
        { key: 'scrocchi', label: 'Scrocchi', type: 'boolean', width: 'third' },
        { key: 'chiudiporta', label: 'Chiudiporta Aereo', type: 'boolean', width: 'third' },
    ],
    "Pompaggio": [
        // Pompa Pilota
        { key: 'h_pilota', label: '--- ELETTROPOMPA PILOTA ---', type: 'header', width: 'full' },
        { key: 'pilota_marca', label: 'Marca', type: 'text', width: 'third' },
        { key: 'pilota_sn', label: 'S/N', type: 'text', width: 'third' },
        { key: 'pilota_kw', label: 'Kw / Volt', type: 'text', width: 'third' },
        // Pompa 1
        { key: 'h_p1', label: '--- ELETTROPOMPA 1 ---', type: 'header', width: 'full' },
        { key: 'p1_marca', label: 'Marca', type: 'text', width: 'third' },
        { key: 'p1_sn', label: 'S/N', type: 'text', width: 'third' },
        { key: 'p1_kw', label: 'Kw / Volt', type: 'text', width: 'third' },
        // Pompa 2
        { key: 'h_p2', label: '--- ELETTROPOMPA 2 ---', type: 'header', width: 'full' },
        { key: 'p2_marca', label: 'Marca', type: 'text', width: 'third' },
        { key: 'p2_sn', label: 'S/N', type: 'text', width: 'third' },
        { key: 'p2_kw', label: 'Kw / Volt', type: 'text', width: 'third' },
        // Motopompa
        { key: 'h_pd', label: '--- MOTOPOMPA DIESEL ---', type: 'header', width: 'full' },
        { key: 'pd_marca', label: 'Marca', type: 'text', width: 'third' },
        { key: 'pd_sn', label: 'S/N', type: 'text', width: 'third' },
        { key: 'pd_kw', label: 'Kw / Volt', type: 'text', width: 'third' },
        // Altro
        { key: 'h_comp', label: '--- COMPONENTI & ALLARMI ---', type: 'header', width: 'full' },
        { key: 'valvole_sprinkler', label: 'Valvole Sprinkler', type: 'boolean', width: 'third' },
        { key: 'sirena', label: 'Sirena Rosso/Gialla', type: 'boolean', width: 'third' },
        { key: 'batteria_motopompa', label: 'Batteria Motopompa', type: 'boolean', width: 'third' },
        { key: 'lampada_emergenza', label: 'Lampada Emergenza', type: 'boolean', width: 'third' },
        { key: 'rimandi', label: 'Rimandi Allarme', type: 'boolean', width: 'third' },
    ],
    "Rivelazione": [
        { key: 'tipo_centrale', label: 'Tipo Centrale', type: 'select', options: ['Convenzionale', 'Indirizzata', 'Analogica'], width: 'half' },
        { key: 'marca', label: 'Marca', type: 'text', width: 'half' },
        { key: 'modello', label: 'Modello', type: 'text', width: 'third' },
        { key: 'anno_produzione', label: 'Anno Produzione', type: 'number', width: 'third' },
        { key: 'n_loop', label: 'Numero Loop/Zone', type: 'number', width: 'third' },
        { key: 'h_comp', label: '--- COMPONENTI ---', type: 'header', width: 'full' },
        { key: 'n_sens_fumo', label: 'N. Rilevatori Fumo', type: 'number', width: 'third' },
        { key: 'n_sens_calore', label: 'N. Rilevatori Calore', type: 'number', width: 'third' },
        { key: 'n_pulsanti', label: 'N. Pulsanti', type: 'number', width: 'third' },
        { key: 'n_targhe', label: 'N. Targhe Ottico/Acustiche', type: 'number', width: 'third' },
        { key: 'sirena_esterna', label: 'Sirena Esterna', type: 'boolean', width: 'third' },
        { key: 'rimandi', label: 'Rimandi Allarme', type: 'boolean', width: 'third' },
        { key: 'evacuatori', label: 'Comando Evacuatori', type: 'boolean', width: 'third' },
        { key: 'bombole', label: 'Comando Bombole', type: 'boolean', width: 'third' },
        { key: 'cavo', label: 'Tipo Cavo / Sezione', type: 'text', width: 'full' },
    ]
};

// --- ROW COMPONENT (Standard implementation, no virtualization) ---
const AssetRow = React.memo(({ asset, isDraft, onSelect }: { asset: Asset, isDraft: boolean, onSelect: (a: Asset) => void }) => {
    // Safety check
    if (!asset) return null;

    const isExpired = !isDraft && isAssetExpired(asset.scadenza);

    return (
        <div className="p-1">
            <div className={`flex justify-between items-center p-3 border rounded-lg shadow-sm transition-colors ${isDraft ? 'bg-green-50 border-green-500' : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800 dark:text-gray-100">{asset.tipo}</span>
                        {isDraft && <span className="text-xs bg-green-100 text-green-700 px-2 rounded font-bold">ESEGUITO</span>}
                        {isExpired && <span className="text-xs bg-red-100 text-red-600 px-2 rounded font-bold animate-pulse">SCADUTO</span>}
                    </div>
                    <div className="text-xs text-gray-500 flex gap-4 mt-1">
                        <span>Matr: {asset.matricola}</span>
                        <span>{asset.ubicazione}</span>
                    </div>
                </div>
                <button onClick={() => onSelect(asset)} className={`px-4 py-2 rounded-md text-sm font-medium ${isDraft ? 'border border-green-500 text-green-700' : 'bg-primary-600 text-white hover:bg-primary-700'}`}>
                    <Wrench size={16} />
                </button>
            </div>
        </div>
    );
});

const semesterOptions = [
    { value: "0", label: "GEN - LUG" },
    { value: "1", label: "FEB - AGO" },
    { value: "2", label: "MAR - SET" },
    { value: "3", label: "APR - OTT" },
    { value: "4", label: "MAG - NOV" },
    { value: "5", label: "GIU - DIC" },
];

const TechIntervention: React.FC = () => {
    const {
        clients, assets, anomalies: genericAnomalies, checklistTemplates, categoryAnomalies, sessions, technicians, createSession, updateSession, saveInterventionToSession,
        closeSession, updateAsset, isLoading, supabaseConfig, syncData, remoteUrl, addNotification, userSignature: savedUserSignature
    } = useData();
    const { profile, user } = useAuth();
    const navigate = useNavigate();

    const [selectedClientId, setSelectedClientId] = useState<number | string>("");
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [modalTab, setModalTab] = useState<'intervention' | 'data' | 'comments'>('intervention'); // NEW: Comments Tab

    // New State for Print Confirmation
    const [isPrintConfirmOpen, setIsPrintConfirmOpen] = useState(false);

    const [isSessionComplete, setIsSessionComplete] = useState(false);
    const [isDraftSaved, setIsDraftSaved] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const [clientSearchTerm, setClientSearchTerm] = useState("");
    const [selectedSemester, setSelectedSemester] = useState<string>(""); // NEW: Semester Filter
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
    const debouncedClientSearch = useDebounce(clientSearchTerm, 300);

    const [searchTerm, setSearchTerm] = useState("");
    const debouncedAssetSearch = useDebounce(searchTerm, 300);
    const [filterCategory, setFilterCategory] = useState<string>("All");
    const [filterLocation, setFilterLocation] = useState<string>("All");

    const [generalNotes, setGeneralNotes] = useState("");
    const [technicianSignature, setTechnicianSignature] = useState("");
    const [clientSignature, setClientSignature] = useState("");
    const [techSigImage, setTechSigImage] = useState<string>("");
    const [clientSigImage, setClientSigImage] = useState<string>("");
    const [lastLoadedSessionId, setLastLoadedSessionId] = useState<string>("");

    const [checkedServices, setCheckedServices] = useState<string[]>([]);
    const [checkedAnomalies, setCheckedAnomalies] = useState<string[]>([]);
    const [notes, setNotes] = useState("");
    const [activeChecklist, setActiveChecklist] = useState<string[]>([]);
    const [activeStandard, setActiveStandard] = useState<string>("");
    const [specificAnomalies, setSpecificAnomalies] = useState<string[]>([]);

    // NEW: State for specific data
    const [tempSpecificData, setTempSpecificData] = useState<Record<string, any>>({});

    // NEW: State for Internal Comments
    const [internalComments, setInternalComments] = useState<InternalComment[]>([]);
    const [newCommentText, setNewCommentText] = useState("");

    // --- LOGICA FILTRO PER "I MIEI INTERVENTI" ---
    const loggedInTechId = useMemo(() => {
        if (!profile?.email) return null;
        const tech = technicians.find(t => t.email.toLowerCase() === profile.email.toLowerCase());
        return tech ? tech.id : null;
    }, [profile, technicians]);

    const myPlannedSessions = useMemo(() => {
        if (!loggedInTechId) return [];
        return sessions.filter(s =>
            (s.status === 'PLANNED' || s.status === 'OPEN') &&
            s.assignedTechIds?.includes(loggedInTechId)
        ).sort((a, b) => (a.scheduledDate || '').localeCompare(b.scheduledDate || ''));
    }, [sessions, loggedInTechId]);

    // Filtered Clients Logic (ENHANCED)
    const filteredClients = useMemo(() => {
        // Se non c'è ricerca e nessun semestre selezionato, non mostrare nulla
        if (!debouncedClientSearch.trim() && selectedSemester === "") return [];

        let results = clients;
        const term = debouncedClientSearch.toLowerCase().trim();

        // 1. Filtro Testuale Avanzato
        if (term) {
            results = results.filter(c =>
                c.nome.toLowerCase().includes(term) ||
                c.indirizzo.toLowerCase().includes(term) ||
                (c.commessa && c.commessa.toLowerCase().includes(term)) ||
                (c.referente && c.referente.toLowerCase().includes(term)) ||
                (c.struttura && c.struttura.toLowerCase().includes(term))
            );
        }

        // 2. Filtro Semestre
        if (selectedSemester !== "") {
            const targetMonth1 = parseInt(selectedSemester);
            const targetMonth2 = targetMonth1 + 6;

            results = results.filter(c => {
                // Ottieni gli asset del cliente
                const clientAssets = assets.filter(a => a.clientId === c.id);
                // Controlla se almeno un asset scade in uno dei due mesi del semestre
                return clientAssets.some(a => {
                    if (!a.scadenza) return false;
                    // Parsing sicuro del mese dalla stringa (YYYY-MM-DD)
                    // Evita problemi di fuso orario con new Date()
                    const parts = a.scadenza.split('-');
                    if (parts.length < 2) return false;
                    const m = parseInt(parts[1], 10) - 1; // 0-11
                    return m === targetMonth1 || m === targetMonth2;
                });
            });
        }

        return results.slice(0, 20); // Limit results for performance
    }, [clients, assets, debouncedClientSearch, selectedSemester]);

    const currentSession = useMemo(() => {
        if (!selectedClientId) return undefined;
        const clientSessions = sessions.filter(s => s.clientId === Number(selectedClientId));
        const openSession = clientSessions.find(s => s.status === 'OPEN');
        if (openSession) return openSession;
        if (clientSessions.length > 0) return clientSessions[clientSessions.length - 1];
        return undefined;
    }, [sessions, selectedClientId]);

    useEffect(() => {
        if (currentSession) {
            if (currentSession.id !== lastLoadedSessionId) {
                setGeneralNotes(currentSession.generalNotes || "");
                setTechnicianSignature(currentSession.technicianSignature || "");
                setClientSignature(currentSession.clientSignature || "");
                setTechSigImage(currentSession.technicianSignatureImage || "");
                setClientSigImage(currentSession.clientSignatureImage || "");
                setLastLoadedSessionId(currentSession.id);
            }
            setIsSessionComplete(currentSession.status === 'CLOSED');
        } else {
            setLastLoadedSessionId("");
            setIsSessionComplete(false);
        }
    }, [currentSession, lastLoadedSessionId]);

    // AUTO-LOAD SIGNATURE WHEN OPENING SIGN MODAL
    useEffect(() => {
        if (isSignatureModalOpen) {
            if (!technicianSignature && profile?.full_name) {
                setTechnicianSignature(profile.full_name);
            }
            if (!techSigImage && savedUserSignature) {
                setTechSigImage(savedUserSignature);
            }
        }
    }, [isSignatureModalOpen, savedUserSignature, profile, technicianSignature, techSigImage]);

    const handleSelectClient = (client: Client) => {
        setSelectedClientId(client.id);
        setClientSearchTerm(client.nome);
        setIsClientDropdownOpen(false);
        setSelectedAsset(null);
        setIsSessionComplete(false);
        setIsDraftSaved(false);
        setLastLoadedSessionId("");
        setSearchTerm("");
        setFilterCategory("All");
        setFilterLocation("All");
        createSession(client.id); // Questo converte PLANNED -> OPEN se esiste per oggi
    };

    const openInterventionModal = (asset: Asset) => {
        setSelectedAsset(asset);
        const category = asset.categoria || "Generico";
        const checklist = checklistTemplates[category] || checklistTemplates["Generico"] || [];
        setActiveChecklist(checklist);
        setActiveStandard(CATEGORY_STANDARDS[category] || "");
        setSpecificAnomalies(categoryAnomalies[category] || []);

        const existing = currentSession?.draftInterventions.find(i => i.assetId === asset.id);
        if (existing) {
            setCheckedServices(existing.services);
            setCheckedAnomalies(existing.anomalies);
            setNotes(existing.notes);
            setInternalComments(existing.internalComments || []);
        } else {
            setCheckedServices([]);
            setCheckedAnomalies([]);
            setNotes("");
            setInternalComments([]);
        }

        // Inizializza i dati specifici (dal DB o vuoti)
        setTempSpecificData(asset.specificData || {});
        setModalTab('intervention'); // Reset tab
        setIsModalOpen(true);
    };

    const handleSaveAssetIntervention = () => {
        if (!selectedAsset || !currentSession) return;
        const client = clients.find(c => c.id === Number(selectedClientId));
        const existing = currentSession?.draftInterventions.find(i => i.assetId === selectedAsset.id);
        const id = existing ? existing.id : `INT-${String(Date.now()).slice(-6)}`;

        const newIntervention: Intervention = {
            id: id,
            timestamp: new Date().toISOString(),
            clientId: Number(selectedClientId),
            clientName: client?.nome || 'Unknown',
            assetId: selectedAsset.id,
            assetName: selectedAsset.tipo,
            services: checkedServices,
            anomalies: checkedAnomalies,
            notes: notes,
            internalComments: internalComments // Save comments
        };

        const currentSessionMetadata = { generalNotes, technicianSignature, clientSignature, technicianSignatureImage: techSigImage, clientSignatureImage: clientSigImage };
        saveInterventionToSession(currentSession.id, newIntervention, currentSessionMetadata);

        // CALCOLO AUTOMATICO SCADENZE UNI 9994-1 (ESTINTORI)
        let updatedSpecificData = { ...tempSpecificData };
        let nextExpiryStr = addMonthsToDate(new Date(), 6); // Default Controllo: +6 Mesi

        if (selectedAsset.categoria === "Estintori") {
            // Aggiorna data prossimo controllo (sempre 6 mesi da oggi in fase di verifica)
            updatedSpecificData.prossimo_controllo = nextExpiryStr;

            const anno = parseInt(updatedSpecificData.anno_costruzione);
            if (!isNaN(anno)) {
                const tipo = selectedAsset.tipo.toLowerCase();
                let intRev = 36; // Mesi Revisione (Polvere) - Default Pre-2025
                let intColl = 144; // Mesi Collaudo (12 Anni) - Default Pre-2025

                // NUOVA LOGICA: Per estintori prodotti dal 2025 in poi
                if (anno >= 2025) {
                    intRev = 60;  // 5 Anni Revisione
                    intColl = 120; // 10 Anni Collaudo
                } else {
                    // LOGICA VECCHIA (Pre-2025)
                    if (tipo.includes('co2') || tipo.includes('anidride')) {
                        intRev = 60;
                        intColl = 120; // 10 Anni per CO2
                    } else if (tipo.includes('idrico') || tipo.includes('schiuma')) {
                        intRev = 24;
                        intColl = 72; // 6 Anni per Idrici (Serbatoio non inox)
                    }
                }

                const currentYear = new Date().getFullYear();
                const currentMonth = new Date().getMonth() + 1; // 1-12

                // Calcolo Prossima Revisione (Ciclica da Anno Costruzione)
                // BUGFIX: Assicuriamo che la prossima revisione sia nel FUTURO rispetto all'anno corrente
                let nextRevYear = anno + (intRev / 12);
                while (nextRevYear <= currentYear) {
                    nextRevYear += (intRev / 12);
                }

                // Calcolo Prossimo Collaudo
                let nextCollYear = anno + (intColl / 12);
                while (nextCollYear <= currentYear) {
                    nextCollYear += (intColl / 12);
                }

                // Impostiamo la data al fine mese corrente dell'anno di scadenza
                const monthStr = String(currentMonth).padStart(2, '0');
                updatedSpecificData.prossima_revisione = `${nextRevYear}-${monthStr}-28`;
                updatedSpecificData.prossimo_collaudo = `${nextCollYear}-${monthStr}-28`;
            }
        }

        // Aggiorna l'asset con la scadenza E i dati specifici modificati (inclusi i calcoli)
        updateAsset({
            ...selectedAsset,
            dataUltimaRevisione: getLocalDate(),
            scadenza: nextExpiryStr,
            specificData: updatedSpecificData
        });

        setIsModalOpen(false);
    };

    const handleAddComment = () => {
        if (!newCommentText.trim()) return;
        const comment: InternalComment = {
            id: Date.now().toString(),
            text: newCommentText,
            author: profile?.full_name || user?.email || 'Tecnico',
            timestamp: new Date().toISOString()
        };
        setInternalComments([...internalComments, comment]);
        setNewCommentText("");
    };

    /* 
    // FUTURE IMPLEMENTATION: PHOTO UPLOAD
    const fileInputRef = useRef<HTMLInputElement>(null);
    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Placeholder for upload logic (using utils/storage)
        // const url = await uploadPhoto(file);
        // if (url) { ... add to state ... }
        
        alert("Funzionalità caricamento foto non ancora attiva.");
    };
    */

    const handlePartialSave = async () => {
        if (!selectedClientId) return;
        updateSession(Number(selectedClientId), { generalNotes, technicianSignature, clientSignature, technicianSignatureImage: techSigImage, clientSignatureImage: clientSigImage });
        if (remoteUrl) { setIsSyncing(true); await syncData(); setIsSyncing(false); }
        addNotification({ title: "Sessione Salvata", message: "Salvataggio locale effettuato.", type: "success" });
        setIsDraftSaved(true);
    };

    const handleGlobalSave = async () => {
        if (!currentSession) { alert("Errore: Sessione non valida."); return; }
        if (currentSession.draftInterventions.length === 0) { alert("Nessun intervento eseguito."); return; }

        setIsSyncing(true);
        try {
            // 1. Chiudi la sessione localmente (update state sincrono nel context)
            // Questo farà scattare useEffect -> setIsSessionComplete(true) -> Cambia view a Report
            closeSession(currentSession.id, {
                generalNotes, technicianSignature, clientSignature,
                technicianSignatureImage: techSigImage, clientSignatureImage: clientSigImage
            });

            // 2. Chiudi la modale
            setIsSignatureModalOpen(false);
            window.scrollTo(0, 0);

            // 3. Sincronizza in background (se configurato)
            if (remoteUrl || (supabaseConfig.url && supabaseConfig.key)) {
                await syncData();
            }
        } catch (error) {
            console.error("Errore durante il salvataggio:", error);
            alert("Errore salvataggio. Riprova.");
        } finally {
            setIsSyncing(false);
        }
    };

    // --- PRINT LOGIC ---
    const handlePrintRequest = () => {
        setIsPrintConfirmOpen(true);
    };

    const executePrint = () => {
        // 1. Chiudiamo la modale prima di stampare per pulire il DOM
        setIsPrintConfirmOpen(false);

        // 2. Diamo tempo a React di aggiornare il DOM (rimuovere la modale) e poi lanciamo la stampa
        setTimeout(() => {
            window.print();
        }, 100);
    };

    // --- FILTERS ---
    const allClientAssets = useMemo(() => selectedClientId ? assets.filter(a => a.clientId === Number(selectedClientId)) : [], [assets, selectedClientId]);
    const categories = useMemo(() => Array.from(new Set(allClientAssets.map(a => a.categoria || 'Altro'))).sort(), [allClientAssets]);

    const filteredAssets = useMemo(() => {
        return allClientAssets.filter(asset => {
            const s = debouncedAssetSearch.toLowerCase();
            const matchesSearch = !s || asset.tipo.toLowerCase().includes(s) || asset.matricola?.toLowerCase().includes(s) || asset.id.toLowerCase().includes(s);
            const matchesCategory = filterCategory === "All" || asset.categoria === filterCategory;
            const matchesLocation = filterLocation === "All" || (asset.ubicazione && asset.ubicazione.startsWith(filterLocation));
            return matchesSearch && matchesCategory && matchesLocation;
        });
    }, [allClientAssets, debouncedAssetSearch, filterCategory, filterLocation]);

    const draftAssetIds = useMemo(() => currentSession ? currentSession.draftInterventions.map(i => i.assetId) : [], [currentSession]);
    const completedCount = filteredAssets.filter(a => draftAssetIds.includes(a.id)).length;
    const progress = filteredAssets.length > 0 ? Math.round((completedCount / filteredAssets.length) * 100) : 0;

    // --- FORM RENDERING LOGIC ---
    const renderSpecificDataForm = () => {
        if (!selectedAsset || !selectedAsset.categoria) return <p className="text-gray-500 italic p-4">Nessun dato specifico configurabile per questa categoria.</p>;

        const schema = ASSET_SCHEMAS[selectedAsset.categoria];
        // Mappatura per il caso "Pompaggio" che nel data.ts è "Pompaggio" ma qui lo gestiamo
        // Se la categoria non ha schema, mostriamo messaggio.
        // Le chiavi in ASSET_SCHEMAS devono coincidere con i valori in asset.categoria
        if (!schema) {
            // Fallback per categorie parziali (es. "Rivelazione" vs "Rivelazione Fumi")
            const partialKey = Object.keys(ASSET_SCHEMAS).find(k => selectedAsset.categoria?.includes(k));
            if (!partialKey) return <p className="text-gray-500 italic p-4">Nessun registro tecnico definito per: {selectedAsset.categoria}</p>;
            // Usa lo schema trovato parzialmente
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
                    {ASSET_SCHEMAS[partialKey].map((field) => renderField(field))}
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-1">
                {schema.map((field) => renderField(field))}
            </div>
        );
    };

    const renderField = (field: SchemaField) => {
        const widthClass = field.width === 'full' ? 'md:col-span-6' : field.width === 'half' ? 'md:col-span-3' : 'md:col-span-2';

        if (field.type === 'header') {
            return (
                <div key={field.key} className={`${widthClass} mt-4 mb-2 pb-1 border-b border-gray-200 dark:border-slate-700`}>
                    <h5 className="font-bold text-gray-700 dark:text-gray-300 uppercase text-xs tracking-wider">{field.label}</h5>
                </div>
            );
        }

        return (
            <div key={field.key} className={`${widthClass}`}>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{field.label}</label>
                {field.type === 'select' ? (
                    <select
                        className="w-full p-2 border rounded bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-sm"
                        value={tempSpecificData[field.key] || ''}
                        onChange={(e) => setTempSpecificData({ ...tempSpecificData, [field.key]: e.target.value })}
                    >
                        <option value="">- Seleziona -</option>
                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                ) : field.type === 'boolean' ? (
                    <div className="flex items-center space-x-4 mt-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="radio"
                                name={field.key}
                                checked={tempSpecificData[field.key] === true}
                                onChange={() => setTempSpecificData({ ...tempSpecificData, [field.key]: true })}
                                className="text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm">Sì / Presente</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="radio"
                                name={field.key}
                                checked={tempSpecificData[field.key] === false}
                                onChange={() => setTempSpecificData({ ...tempSpecificData, [field.key]: false })}
                                className="text-red-600 focus:ring-red-500"
                            />
                            <span className="text-sm">No / Assente</span>
                        </label>
                    </div>
                ) : (
                    <input
                        type={field.type}
                        className="w-full p-2 border rounded bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-sm"
                        value={tempSpecificData[field.key] || ''}
                        onChange={(e) => setTempSpecificData({ ...tempSpecificData, [field.key]: e.target.value })}
                    />
                )}
            </div>
        );
    };

    // --- VIEWS ---
    if (isLoading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-primary-600" /></div>;

    if (isDraftSaved) return (
        <div className="max-w-4xl mx-auto py-10 space-y-6">
            <div className="bg-orange-50 border-l-4 border-orange-500 p-8 rounded text-center">
                <h2 className="text-2xl font-bold mb-4">Salvataggio Locale Effettuato</h2>
                <div className="flex justify-center gap-4">
                    <button onClick={() => navigate('/')} className="bg-gray-200 px-6 py-3 rounded">Dashboard</button>
                    <button onClick={() => setIsDraftSaved(false)} className="bg-orange-500 text-white px-6 py-3 rounded">Continua</button>
                </div>
            </div>
        </div>
    );

    if (isSessionComplete) {
        return (
            <div className="max-w-4xl mx-auto space-y-6 relative">
                <div className="no-print bg-emerald-50 border-l-4 border-emerald-500 p-6 rounded flex justify-between items-center">
                    <div><h2 className="text-2xl font-bold text-gray-800">Intervento Concluso</h2><p className="text-gray-600">Dati salvati correttamente.</p></div>
                    <div className="flex gap-2">
                        <button onClick={handlePrintRequest} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center shadow-lg transform hover:scale-105 transition-transform"><Printer size={18} className="mr-2" /> Stampa / PDF</button>
                        <button onClick={() => navigate('/')} className="bg-gray-200 px-4 py-2 rounded">Esci</button>
                    </div>
                </div>

                {/* PRINT CONFIRMATION MODAL */}
                {isPrintConfirmOpen && (
                    <div className="no-print fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-sm p-6 text-center">
                            <div className="mb-4 text-blue-500 bg-blue-50 p-3 rounded-full inline-block">
                                <FileOutput size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Generazione Report</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">Vuoi estrapolare il report dell'intervento?</p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setIsPrintConfirmOpen(false)}
                                    className="px-6 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                                >
                                    No
                                </button>
                                <button
                                    onClick={executePrint}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md"
                                >
                                    Sì
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white p-8 shadow-lg print:shadow-none print:absolute print:top-0 print:left-0 print:w-full print:m-0 print:z-[100]" id="report">
                    <div className="border-b-2 border-red-600 pb-4 mb-6 flex justify-between items-start">
                        <div><h1 className="text-3xl font-bold text-gray-900">RAPPORTO INTERVENTO</h1><p className="text-gray-500">Sicur. Ant Antincendio</p></div>
                        <div className="text-right">
                            <p className="font-bold text-xl text-gray-800">{clients.find(c => c.id === Number(selectedClientId))?.nome}</p>
                            <p className="text-sm text-gray-600">{clients.find(c => c.id === Number(selectedClientId))?.indirizzo}</p>
                            <p className="mt-2 text-gray-500">Data: {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="font-bold text-lg border-b border-gray-300 mb-3 pb-1">Dettaglio Attività</h3>
                        <table className="w-full text-sm">
                            <thead><tr className="bg-gray-100 text-gray-700"><th className="p-2 border text-left">Asset</th><th className="p-2 border text-left">Lavorazioni</th><th className="p-2 border text-left">Anomalie</th></tr></thead>
                            <tbody>
                                {currentSession?.draftInterventions.map((int, i) => (
                                    <tr key={i} className="break-inside-avoid">
                                        <td className="p-2 border align-top"><strong>{int.assetName}</strong><br /><span className="text-xs text-gray-500">{int.assetId}</span></td>
                                        <td className="p-2 border align-top"><ul className="list-disc pl-4">{int.services.map((s, idx) => <li key={idx}>{s}</li>)}</ul></td>
                                        <td className="p-2 border text-red-600 align-top">{int.anomalies.length > 0 ? <ul className="list-disc pl-4">{int.anomalies.map((a, idx) => <li key={idx}>{a}</li>)}</ul> : <span className="text-green-600">Nessuna</span>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="border border-gray-300 p-4 mb-8 bg-gray-50 break-inside-avoid">
                        <h4 className="font-bold mb-2 text-gray-800">Note Generali</h4>
                        <p className="text-gray-700 min-h-[40px]">{generalNotes || "-"}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-10 mt-10 break-inside-avoid">
                        <div className="text-center border-t border-gray-400 pt-4">
                            <p className="font-bold mb-1 text-gray-600 uppercase text-xs">Firma Tecnico</p>
                            {technicianSignature && <p className="text-sm font-bold">{technicianSignature}</p>}
                            {techSigImage ? <img src={techSigImage} className="h-24 mx-auto object-contain" alt="Firma Tecnico" /> : <div className="h-24 flex items-center justify-center text-gray-300 italic">Non firmato</div>}
                        </div>
                        <div className="text-center border-t border-gray-400 pt-4">
                            <p className="font-bold mb-1 text-gray-600 uppercase text-xs">Firma Cliente</p>
                            {clientSignature && <p className="text-sm font-bold">{clientSignature}</p>}
                            {clientSigImage ? <img src={clientSigImage} className="h-24 mx-auto object-contain" alt="Firma Cliente" /> : <div className="h-24 flex items-center justify-center text-gray-300 italic">Non firmato</div>}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 h-full flex flex-col relative">
            <div className="no-print border-b pb-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-red-600 flex items-center"><Wrench className="mr-3" /> Gestione Interventi Assegnati</h2>
                {selectedClientId && <button onClick={() => setSelectedClientId("")} className="text-sm text-gray-500">Annulla</button>}
            </div>

            {!selectedClientId ? (
                <div className="max-w-4xl mx-auto w-full">
                    <div className="relative mb-8 flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-4 text-gray-400" />
                            <input
                                type="text"
                                className="w-full p-4 pl-12 border rounded-lg shadow-sm text-lg outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white bg-white dark:bg-slate-800 dark:border-slate-700"
                                placeholder="Cerca cliente, indirizzo, commessa, referente..."
                                value={clientSearchTerm}
                                onChange={(e) => { setClientSearchTerm(e.target.value); setIsClientDropdownOpen(true); }}
                                onFocus={() => setIsClientDropdownOpen(true)}
                            />
                        </div>

                        <div className="relative min-w-[180px]">
                            <div className="absolute left-3 top-4 text-gray-400 pointer-events-none">
                                <Calendar size={20} />
                            </div>
                            <select
                                className="w-full p-4 pl-10 border rounded-lg shadow-sm text-base outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white bg-white dark:bg-slate-800 dark:border-slate-700 cursor-pointer appearance-none"
                                value={selectedSemester}
                                onChange={(e) => { setSelectedSemester(e.target.value); setIsClientDropdownOpen(true); }}
                            >
                                <option value="">Tutti i mesi</option>
                                {semesterOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-4 top-5 text-gray-400 pointer-events-none" />
                        </div>

                        {isClientDropdownOpen && filteredClients.length > 0 && (
                            <ul className="absolute top-[110%] w-full bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-xl max-h-96 overflow-y-auto z-50">
                                {filteredClients.map(c => (
                                    <li key={c.id} onClick={() => handleSelectClient(c)} className="p-4 border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors group">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <span className="font-bold block text-gray-900 dark:text-gray-100 text-lg mb-1 group-hover:text-primary-600 transition-colors">{c.nome}</span>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="flex items-center"><MapPin size={14} className="mr-1.5 flex-shrink-0" /> {c.indirizzo}</span>
                                                    {c.struttura && <span className="flex items-center text-gray-600 dark:text-gray-300"><Building size={14} className="mr-1.5 flex-shrink-0" /> {c.struttura}</span>}
                                                    {c.commessa && <span className="flex items-center"><Briefcase size={14} className="mr-1.5 flex-shrink-0" /> {c.commessa}</span>}
                                                    {c.referente && <span className="flex items-center"><User size={14} className="mr-1.5 flex-shrink-0" /> {c.referente}</span>}
                                                </div>
                                            </div>
                                            <ArrowRight size={20} className="text-gray-300 group-hover:text-primary-600 mt-2" />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* SEZIONE NUOVA: I MIEI INTERVENTI */}
                    {myPlannedSessions.length > 0 && (
                        <div className="animate-fade-in">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                                <Calendar size={20} className="mr-2 text-primary-600" /> I Tuoi Interventi in Programma
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {myPlannedSessions.map(session => {
                                    const client = clients.find(c => c.id === session.clientId);
                                    if (!client) return null;
                                    const isToday = session.scheduledDate === getLocalDate();

                                    return (
                                        <div
                                            key={session.id}
                                            onClick={() => handleSelectClient(client)}
                                            className={`
                                        p-4 rounded-lg border shadow-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-1 group relative overflow-hidden
                                        ${isToday ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-700'}
                                    `}
                                        >
                                            {isToday && <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl">OGGI</div>}
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold text-gray-800 dark:text-gray-100 group-hover:text-primary-600 transition-colors">
                                                        {client.nome}
                                                    </h4>
                                                    <p className="text-sm text-gray-500 flex items-center mt-1">
                                                        <MapPin size={14} className="mr-1" /> {client.indirizzo}
                                                    </p>
                                                    <div className="mt-2 flex items-center text-xs font-semibold">
                                                        <span className={`px-2 py-1 rounded flex items-center ${isToday ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                                            <Calendar size={12} className="mr-1" />
                                                            {new Date(session.scheduledDate || '').toLocaleDateString('it-IT')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="bg-white dark:bg-slate-700 p-2 rounded-full shadow-sm text-gray-400 group-hover:text-primary-600 transition-colors mt-2">
                                                    <ArrowRight size={20} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col h-full gap-4">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow flex justify-between items-center">
                        <div><h3 className="font-bold text-primary-700">{clients.find(c => c.id === Number(selectedClientId))?.nome}</h3><p className="text-xs text-gray-500">{progress}% Completato</p></div>
                        <div className="w-1/3 bg-gray-200 h-2 rounded-full overflow-hidden"><div className="bg-primary-600 h-full transition-all" style={{ width: `${progress}%` }}></div></div>
                    </div>

                    <div className="flex gap-2">
                        <input type="text" placeholder="Cerca asset..." className="flex-1 p-2 border rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white border-gray-300 dark:border-slate-700" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        <select className="p-2 border rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white border-gray-300 dark:border-slate-700" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                            <option value="All">Tutte Categorie</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="flex-1 border rounded-lg bg-gray-50 dark:bg-slate-900 overflow-y-auto custom-scrollbar" style={{ minHeight: '400px' }}>
                        {filteredAssets.length > 0 ? (
                            filteredAssets.map((asset, index) => (
                                <AssetRow
                                    key={asset.id}
                                    asset={asset}
                                    isDraft={draftAssetIds.includes(asset.id)}
                                    onSelect={openInterventionModal}
                                />
                            ))
                        ) : (
                            <div className="p-10 text-center text-gray-400">Nessun asset trovato</div>
                        )}
                    </div>
                </div>
            )}

            {isModalOpen && selectedAsset && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto flex flex-col">
                        <div className="flex justify-between items-start mb-4 border-b pb-2 flex-shrink-0">
                            <div>
                                <h3 className="text-xl font-bold flex items-center">{selectedAsset.tipo}<span className="ml-2 text-sm bg-gray-100 dark:bg-slate-700 px-2 rounded">{selectedAsset.matricola}</span></h3>
                                <p className="text-sm text-gray-500">{selectedAsset.ubicazione} | <span className="font-semibold text-primary-600">{selectedAsset.categoria}</span></p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500"><X size={24} /></button>
                        </div>

                        {/* TABS NAVIGATION */}
                        <div className="flex space-x-2 border-b border-gray-200 dark:border-slate-700 mb-4 flex-shrink-0">
                            <button
                                onClick={() => setModalTab('intervention')}
                                className={`px-4 py-2 text-sm font-bold flex items-center border-b-2 transition-colors ${modalTab === 'intervention' ? 'border-primary-600 text-primary-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                <Wrench size={16} className="mr-2" /> Intervento
                            </button>
                            <button
                                onClick={() => setModalTab('data')}
                                className={`px-4 py-2 text-sm font-bold flex items-center border-b-2 transition-colors ${modalTab === 'data' ? 'border-primary-600 text-primary-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                <Database size={16} className="mr-2" /> Registro / Dati
                            </button>
                            <button
                                onClick={() => setModalTab('comments')}
                                className={`px-4 py-2 text-sm font-bold flex items-center border-b-2 transition-colors ${modalTab === 'comments' ? 'border-primary-600 text-primary-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                <MessageSquare size={16} className="mr-2" /> Chat Contestuale
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {modalTab === 'intervention' ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="font-bold text-primary-700 dark:text-blue-400 mb-3 flex items-center border-b pb-1"><ClipboardCheck size={18} className="mr-2" /> Checklist</h4>
                                            <div className="space-y-2">
                                                {activeChecklist.map((item, idx) => (
                                                    <label key={idx} className="flex items-start space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded cursor-pointer">
                                                        <input type="checkbox" className="mt-1 w-4 h-4 text-primary-600 rounded" checked={checkedServices.includes(item)} onChange={(e) => { if (e.target.checked) setCheckedServices([...checkedServices, item]); else setCheckedServices(checkedServices.filter(s => s !== item)); }} />
                                                        <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-red-600 dark:text-red-400 mb-3 flex items-center border-b pb-1"><AlertTriangle size={18} className="mr-2" /> Anomalie</h4>
                                            <div className="space-y-2">
                                                {specificAnomalies.length > 0 && <div className="mb-2"><p className="text-xs font-bold text-gray-400 uppercase mb-1">Specifiche</p>{specificAnomalies.map((item, idx) => (<label key={`spec-${idx}`} className="flex items-start space-x-3 p-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded cursor-pointer"><input type="checkbox" className="mt-1 w-4 h-4 text-red-600 rounded" checked={checkedAnomalies.includes(item)} onChange={(e) => { if (e.target.checked) setCheckedAnomalies([...checkedAnomalies, item]); else setCheckedAnomalies(checkedAnomalies.filter(s => s !== item)); }} /><span className="text-sm text-gray-700 dark:text-gray-300">{item}</span></label>))}</div>}
                                                <div><p className="text-xs font-bold text-gray-400 uppercase mb-1">Generiche</p>{genericAnomalies.map((item, idx) => (<label key={`gen-${idx}`} className="flex items-start space-x-3 p-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded cursor-pointer"><input type="checkbox" className="mt-1 w-4 h-4 text-red-600 rounded" checked={checkedAnomalies.includes(item)} onChange={(e) => { if (e.target.checked) setCheckedAnomalies([...checkedAnomalies, item]); else setCheckedAnomalies(checkedAnomalies.filter(s => s !== item)); }} /><span className="text-sm text-gray-700 dark:text-gray-300">{item}</span></label>))}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* --- PHOTO UPLOAD SECTION (HIDDEN BUT PREPARED) --- */}
                                    {/* 
                            <div className="border-t pt-4">
                                <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center"><Camera size={18} className="mr-2"/> Foto Allegale</h4>
                                <div className="flex gap-2">
                                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
                                    <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 border rounded flex items-center text-sm hover:bg-gray-50"><Plus size={16} className="mr-1"/> Aggiungi Foto</button>
                                </div>
                            </div> 
                            */}

                                    <div className="mt-6"><label className="block text-sm font-bold mb-2">Note Intervento</label><textarea className="w-full p-3 border rounded bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
                                </div>
                            ) : modalTab === 'data' ? (
                                <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                                    <div className="mb-4">
                                        <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2">Anagrafica Tecnica Specifica</h4>
                                        <p className="text-xs text-gray-500 mb-4">Compila i dati del registro per {selectedAsset.categoria}. Le modifiche verranno salvate nell'anagrafica del presidio.</p>
                                        {renderSpecificDataForm()}
                                    </div>
                                </div>
                            ) : (
                                // --- CHAT CONTESTUALE ---
                                <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-700 h-[400px] flex flex-col">
                                    <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center">
                                        <MessageSquare size={18} className="mr-2 text-primary-600" /> Note Interne & Chat
                                    </h4>
                                    <p className="text-xs text-gray-500 mb-4">Comunicazioni tra tecnici e ufficio su questo specifico intervento. Non visibili al cliente.</p>

                                    <div className="flex-1 overflow-y-auto mb-4 space-y-3 p-2 bg-white dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700">
                                        {internalComments.length === 0 ? (
                                            <div className="text-center text-gray-400 text-sm mt-10 italic">Nessun commento presente.</div>
                                        ) : (
                                            internalComments.map(c => (
                                                <div key={c.id} className="bg-gray-100 dark:bg-slate-700 p-2 rounded text-sm">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-bold text-primary-700 dark:text-primary-300">{c.author}</span>
                                                        <span className="text-[10px] text-gray-500">{new Date(c.timestamp).toLocaleString()}</span>
                                                    </div>
                                                    <p className="text-gray-800 dark:text-gray-200">{c.text}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="flex-1 p-2 border rounded text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                            placeholder="Scrivi un commento interno..."
                                            value={newCommentText}
                                            onChange={(e) => setNewCommentText(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                                        />
                                        <button onClick={handleAddComment} className="bg-primary-600 text-white p-2 rounded hover:bg-primary-700">
                                            <Send size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 flex justify-end space-x-4 flex-shrink-0 pt-4 border-t"><button onClick={() => setIsModalOpen(false)} className="px-6 py-2 border rounded">Annulla</button><button onClick={handleSaveAssetIntervention} className="px-8 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded font-bold flex items-center"><Save size={18} className="mr-2" /> Salva</button></div>
                    </div>
                </div>
            )}

            {/* SIGNATURE MODAL - AGGIUNTO */}
            {isSignatureModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6 border-b pb-2">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Firma e Chiusura Intervento</h3>
                            <button onClick={() => setIsSignatureModalOpen(false)} className="text-gray-400 hover:text-red-500"><X size={24} /></button>
                        </div>

                        <div className="space-y-6">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Verifica i dati e raccogli le firme per concludere la sessione di lavoro presso <strong>{clients.find(c => c.id === Number(selectedClientId))?.nome}</strong>.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Nome Tecnico</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border rounded mb-2 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white"
                                        value={technicianSignature}
                                        onChange={(e) => setTechnicianSignature(e.target.value)}
                                        placeholder="Nome Cognome"
                                    />
                                    <SignaturePad label="Firma Tecnico" value={techSigImage} onChange={setTechSigImage} />
                                    {savedUserSignature && !techSigImage && <p className="text-xs text-blue-500 mt-1">* Firma caricata dal profilo</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Nome Cliente</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border rounded mb-2 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white"
                                        value={clientSignature}
                                        onChange={(e) => setClientSignature(e.target.value)}
                                        placeholder="Nome Cognome"
                                    />
                                    <SignaturePad label="Firma Cliente" value={clientSigImage} onChange={setClientSigImage} />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-slate-700">
                                <button onClick={() => setIsSignatureModalOpen(false)} className="px-6 py-2 border border-gray-300 dark:border-slate-600 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700">Annulla</button>
                                <button
                                    onClick={handleGlobalSave}
                                    disabled={isSyncing}
                                    className="px-8 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold shadow-md flex items-center transition-colors"
                                >
                                    {isSyncing ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle size={18} className="mr-2" />}
                                    Conferma e Chiudi
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedClientId && (
                <div className="no-print bg-white dark:bg-slate-800 border-t p-4 shadow-lg sticky bottom-0 z-10">
                    <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="w-full md:w-1/2 flex items-center gap-2"><FileText className="text-gray-400" size={20} /><input type="text" placeholder="Note Generali Sessione..." className="flex-1 p-2 border rounded bg-gray-50 dark:bg-slate-900 text-sm text-gray-900 dark:text-white border-gray-300 dark:border-slate-700" value={generalNotes} onChange={(e) => setGeneralNotes(e.target.value)} /></div>
                        <div className="flex gap-2">
                            <button onClick={handlePartialSave} disabled={isSyncing} className="bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded flex items-center hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors">{isSyncing ? <Loader2 className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />} Salva Bozza</button>
                            <button onClick={() => setIsSignatureModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded font-bold shadow-md flex items-center transition-colors"><FileCheck size={18} className="mr-2" /> Chiudi Intervento</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TechIntervention;
