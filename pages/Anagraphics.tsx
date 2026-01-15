
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';
import { Database, Plus, Trash2, Edit, X, Save, Upload, Package, MapPin, CreditCard, User, Briefcase, Building, ChevronDown, Lock, AlertCircle, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Client, Asset, Article } from '../types';
import { PAYMENT_METHODS } from '../lib/constants';
// @ts-ignore
import { z } from 'zod';

// ZOD SCHEMAS
const ClientSchema = z.object({
    nome: z.string().min(2, "Ragione Sociale richiesta"),
    indirizzo: z.string().min(5, "Indirizzo richiesto"),
    piva: z.string().optional(),
    codiceUnivoco: z.string().optional(),
    email: z.string().email("Email non valida").optional().or(z.literal("")),
    pec: z.string().email("PEC non valida").optional().or(z.literal("")),
    telefono: z.string().optional().or(z.literal("")),
    referente: z.string().optional(),
    commessa: z.string().optional(),
    idCommessa: z.string().optional(),
    struttura: z.string().optional(),
    indirizzoStruttura: z.string().optional(),
    idStruttura: z.string().optional(),
    referenteCommessa: z.string().optional(),
    recapitoCommessa: z.string().optional(),
});

type Tab = 'clients' | 'articles' | 'services' | 'anomalies';

// MAPPING ETICHETTE ITALIANO - Moved outside to prevent re-creation and potential TDZ
const TAB_LABELS: Record<Tab, string> = {
    clients: 'Clienti',
    articles: 'Articoli',
    services: 'Servizi (Normative)',
    anomalies: 'Anomalie'
};

const Anagraphics: React.FC = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const {
        clients, articles, assets, services, anomalies, checklistTemplates, categoryAnomalies,
        deleteClient, deleteArticle, deleteAsset, deleteService, deleteAnomaly,
        addClient, updateClient, addClientsBulk, addArticle, addArticlesBulk, addAsset, addAssetsBulk,
        addService, addAnomaly, updateChecklistTemplate, updateCategoryAnomaly
    } = useData();

    // 1. ALL STATE HOOKS AT THE TOP
    const [activeTab, setActiveTab] = useState<Tab>('clients');
    const [stocks, setStocks] = useState<Record<string, number>>({});
    const [newItemName, setNewItemName] = useState('');

    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [editingClientId, setEditingClientId] = useState<number | null>(null);
    const [newClient, setNewClient] = useState<Partial<Client>>({});
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [isCustomPaymentInput, setIsCustomPaymentInput] = useState(false);

    const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
    const [newArticle, setNewArticle] = useState<Partial<Article>>({});

    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
    const [selectedClientForInventory, setSelectedClientForInventory] = useState<Client | null>(null);
    const [newInventoryAsset, setNewInventoryAsset] = useState<Partial<Asset>>({});
    const [isInventoryTypeDropdownOpen, setIsInventoryTypeDropdownOpen] = useState(false);

    const [isSimpleModalOpen, setIsSimpleModalOpen] = useState(false);
    const [simpleModalType, setSimpleModalType] = useState<'service' | 'anomaly'>('service');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [globalSearchTerm, setGlobalSearchTerm] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    // 2. LOGIC VARIABLES (Derived from state/profile)
    const canAccess = profile?.role === 'admin' || profile?.role === 'office';
    const canDelete = profile?.role === 'admin';

    // 3. MEMIZED LOGIC
    const filteredArticles = useMemo(() => {
        const term = (newInventoryAsset.tipo || '').toLowerCase();
        if (!isInventoryTypeDropdownOpen && !term) return [];

        const list = articles.filter(a =>
            a.descrizione.toLowerCase().includes(term) ||
            a.categoria.toLowerCase().includes(term) ||
            a.id.toLowerCase().includes(term)
        );

        return list.slice(0, 50);
    }, [articles, newInventoryAsset.tipo, isInventoryTypeDropdownOpen]);

    const displayClients = useMemo(() => {
        if (!globalSearchTerm) return clients;
        const term = globalSearchTerm.toLowerCase();
        return clients.filter(c =>
            c.nome.toLowerCase().includes(term) ||
            c.indirizzo.toLowerCase().includes(term) ||
            (c.piva && c.piva.toLowerCase().includes(term)) ||
            (c.email && c.email.toLowerCase().includes(term))
        );
    }, [clients, globalSearchTerm]);

    const displayArticles = useMemo(() => {
        if (!globalSearchTerm) return articles;
        const term = globalSearchTerm.toLowerCase();
        return articles.filter(a =>
            a.descrizione.toLowerCase().includes(term) ||
            a.categoria.toLowerCase().includes(term) ||
            a.id.toLowerCase().includes(term)
        );
    }, [articles, globalSearchTerm]);

    const displayServices = useMemo(() => {
        if (!globalSearchTerm) return checklistTemplates;
        const term = globalSearchTerm.toLowerCase();
        const filtered: Record<string, string[]> = {};

        Object.entries(checklistTemplates).forEach(([category, items]) => {
            const matchesCategory = category.toLowerCase().includes(term);
            const filteredItems = (items as string[]).filter(i => i.toLowerCase().includes(term));

            if (matchesCategory || filteredItems.length > 0) {
                filtered[category] = matchesCategory ? (items as string[]) : filteredItems;
            }
        });

        return filtered;
    }, [checklistTemplates, globalSearchTerm]);

    const displayGenericAnomalies = useMemo(() => {
        if (!globalSearchTerm) return anomalies;
        const term = globalSearchTerm.toLowerCase();
        return anomalies.filter(a => a.toLowerCase().includes(term));
    }, [anomalies, globalSearchTerm]);

    const displayAnomalies = useMemo(() => {
        if (!globalSearchTerm) return categoryAnomalies;
        const term = globalSearchTerm.toLowerCase();
        const filtered: Record<string, string[]> = {};

        Object.entries(categoryAnomalies).forEach(([category, items]) => {
            const matchesCategory = category.toLowerCase().includes(term);
            const filteredItems = (items as string[]).filter(i => i.toLowerCase().includes(term));

            if (matchesCategory || filteredItems.length > 0) {
                filtered[category] = matchesCategory ? (items as string[]) : filteredItems;
            }
        });

        return filtered;
    }, [categoryAnomalies, globalSearchTerm]);

    // 4. EFFECTS
    useEffect(() => {
        const fetchStocks = async () => {
            try {
                const { data } = await supabase.from('inventory_items').select('article_id, quantity');
                if (data) {
                    const map: Record<string, number> = {};
                    data.forEach((item: any) => {
                        if (item.article_id) map[item.article_id] = item.quantity;
                    });
                    setStocks(map);
                }
            } catch (e) {
                console.error("Error fetching stocks:", e);
            }
        };

        if (activeTab === 'articles' || isInventoryModalOpen) {
            fetchStocks();
        }
    }, [activeTab, isInventoryModalOpen]);

    useEffect(() => {
        if (!canAccess) {
            const t = setTimeout(() => navigate('/'), 3000);
            return () => clearTimeout(t);
        }
    }, [canAccess, navigate]);


    // --- ACCESS DENIED RENDER ---
    if (!canAccess) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <div className="bg-red-100 p-4 rounded-full mb-4">
                    <Lock size={48} className="text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Accesso Negato</h2>
                <p className="text-gray-500 mt-2">Non hai i permessi per gestire le anagrafiche.</p>
                <p className="text-sm text-gray-400 mt-4">Verrai reindirizzato alla Dashboard...</p>
            </div>
        );
    }

    const handleOpenClientModal = (client?: Client) => {
        setValidationErrors({});
        if (client) {
            setNewClient({ ...client });
            const payment = client.pagamento || '';
            const isCustom = payment && !PAYMENT_METHODS.filter(p => p !== 'Altro').includes(payment);
            setIsCustomPaymentInput(!!isCustom);
            if (payment === 'Altro') {
                setNewClient(prev => ({ ...prev, pagamento: '' }));
            }
            setEditingClientId(client.id);
        } else {
            setNewClient({
                nome: '', indirizzo: '', piva: '', codiceUnivoco: '',
                referente: '', telefono: '', email: '', pec: '',
                commessa: '', idCommessa: '', struttura: '', indirizzoStruttura: '', idStruttura: '',
                referenteCommessa: '', recapitoCommessa: '',
                note: '', pagamento: ''
            });
            setIsCustomPaymentInput(false);
            setEditingClientId(null);
        }
        setIsClientModalOpen(true);
    };

    const handleSaveClient = () => {
        const result = ClientSchema.safeParse(newClient);
        if (!result.success) {
            const errors: Record<string, string> = {};
            result.error.issues.forEach(issue => {
                if (issue.path[0]) errors[issue.path[0].toString()] = issue.message;
            });
            setValidationErrors(errors);
            return;
        }

        const clientData = { ...newClient } as Client;
        if (editingClientId !== null) updateClient(clientData);
        else {
            const maxId = clients.reduce((max, c) => Math.max(c.id, max), 0);
            addClient({ ...clientData, id: maxId + 1 });
        }
        setIsClientModalOpen(false);
    };

    const handleOpenArticleModal = () => { setNewArticle({ id: '', categoria: '', descrizione: '', note: '' }); setIsArticleModalOpen(true); };
    const handleSaveArticle = () => { if (!newArticle.descrizione) { alert("Descrizione obbligatoria"); return; } addArticle({ ...newArticle, id: newArticle.id || `ART-${Date.now()}` } as Article); setIsArticleModalOpen(false); };
    const handleOpenInventoryModal = (client: Client) => { setSelectedClientForInventory(client); setNewInventoryAsset({ tipo: '', matricola: '', ubicazione: '', scadenza: '', categoria: '' }); setIsInventoryModalOpen(true); };
    const handleSaveInventoryAsset = () => { if (!newInventoryAsset.tipo) return; addAsset({ ...newInventoryAsset, id: newInventoryAsset.id || `A-${Date.now()}`, clientId: selectedClientForInventory!.id } as Asset); setNewInventoryAsset({}); };

    const openSimpleModal = (t: 'service' | 'anomaly', category: string = '') => {
        setSimpleModalType(t);
        setSelectedCategory(category);
        setNewItemName('');
        setIsSimpleModalOpen(true);
    };

    const handleSaveSimpleItem = () => {
        if (!newItemName) return;
        if (simpleModalType === 'service') {
            if (selectedCategory && checklistTemplates[selectedCategory]) {
                updateChecklistTemplate(selectedCategory, [...checklistTemplates[selectedCategory], newItemName]);
            } else {
                addService(newItemName);
            }
        } else {
            if (selectedCategory && categoryAnomalies[selectedCategory]) {
                updateCategoryAnomaly(selectedCategory, [...categoryAnomalies[selectedCategory], newItemName]);
            } else {
                addAnomaly(newItemName);
            }
        }
        setIsSimpleModalOpen(false);
    };

    const removeServiceItem = (category: string, item: string) => {
        if (checklistTemplates[category]) {
            updateChecklistTemplate(category, checklistTemplates[category].filter(i => i !== item));
        }
    };

    const removeAnomalyItem = (category: string, item: string) => {
        if (category && categoryAnomalies[category]) {
            updateCategoryAnomaly(category, categoryAnomalies[category].filter(i => i !== item));
        } else {
            deleteAnomaly(item);
        }
    };

    const inputClass = (name: string) => `w-full p-2 border rounded text-sm outline-none transition-colors ${validationErrors[name] ? 'border-red-500 bg-red-50 text-red-900' : 'border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500'}`;
    const handleImportClick = () => fileInputRef.current?.click();
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = (event.target?.result as string) || "";
                // Rimuovi BOM se presente (carattere invisibile all'inizio di alcuni file Excel/CSV)
                const cleanText = text.replace(/^\ufeff/g, '');
                const lines = cleanText.split(/\r?\n/).filter(l => l.trim());

                if (lines.length < 2) {
                    alert("Il file sembra vuoto o contiene solo l'intestazione.");
                    return;
                }

                // Rileva separatore (punto e virgola o virgola)
                const firstLine = lines[0];
                const sep = firstLine.includes(';') ? ';' : ',';
                console.log(`[Import] Separatore rilevato: "${sep}"`);

                const parseLine = (l: string) => {
                    // Regex robusta per CSV che ignora i separatori dentro le virgolette (es: "Via Roma, 1")
                    // Utilizza il separatore rilevato dinamicamente
                    const regex = new RegExp(`${sep}(?=(?:(?:[^"]*"){2})*[^"]*$)`);
                    return l.split(regex).map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
                };

                const headers = parseLine(firstLine).map(h => h.toLowerCase());
                console.log("[Import] Intestazioni trovate:", headers);

                const importedClients: any[] = lines.slice(1).map((line, rowIdx) => {
                    const values = parseLine(line);
                    const c: any = { id: Date.now() + rowIdx };

                    if (values.length < 2) {
                        console.warn(`[Import] Riga ${rowIdx + 2} saltata: troppo corta.`);
                        return c;
                    }

                    headers.forEach((h, i) => {
                        const v = values[i];
                        if (!v) return;

                        // Mapping flessibile ITA/ENG per massima compatibilità
                        if (h.includes('ragione') || h.includes('nome') || h.includes('company') || h.includes('customer')) c.nome = v;
                        else if ((h.includes('indirizzo') || h.includes('sede') || h.includes('address')) && !h.includes('struttura')) c.indirizzo = v;
                        else if (h.includes('piva') || h.includes('p.iva') || h.includes('vat') || h.includes('tax')) c.piva = v;
                        else if (h.includes('sdi') || h.includes('univoco')) c.codiceUnivoco = v;
                        else if (h.includes('pec')) c.pec = v;
                        else if (h.includes('referente') && (h.includes('amm') || h.includes('contatto') || h.includes('admin'))) c.referente = v;
                        else if (h.includes('telefono') || h.includes('cell') || h.includes('phone') || h.includes('tel')) c.telefono = v;
                        else if (h.includes('email') || h.includes('mail')) c.email = v;
                        else if (h.includes('pagamento') || h.includes('payment')) c.pagamento = v;
                        else if (h.includes('note')) c.note = v;
                        else if (h.includes('commessa') || h.includes('job')) c.commessa = v;
                        else if (h.includes('contratto') || h.includes('contract')) c.idCommessa = v;
                        else if (h.includes('struttura') || h.includes('building') || h.includes('site')) {
                            if (h.includes('indirizzo') || h.includes('address')) c.indirizzoStruttura = v;
                            else if (h.includes('id')) c.idStruttura = v;
                            else c.struttura = v;
                        }
                        else if (h.includes('loco') || h.includes('referente')) {
                            if (h.includes('tel') || h.includes('recapito') || h.includes('phone')) c.recapitoCommessa = v;
                            else if (h.includes('nome') || h.includes('name')) c.referenteCommessa = v;
                        }
                    });
                    return c;
                }).filter(c => c.nome && c.indirizzo);

                if (importedClients.length > 0) {
                    try {
                        console.log(`[Import] Tentativo di importazione di ${importedClients.length} clienti...`);
                        await addClientsBulk(importedClients);
                        alert(`✅ Importazione completata con successo!\n\nRighe lette: ${lines.length - 1}\nClienti validi importati: ${importedClients.length}\n\nNota: i clienti senza Nome o Indirizzo sono stati ignorati.`);
                    } catch (err: any) {
                        console.error("Sync Error", err);
                        alert(`❌ Errore durante il caricamento:\n${err.message || 'Errore di connessione o formato dati.'}\n\nPossibile causa: Il file potrebbe contenere caratteri speciali non supportati o il database è temporaneamente occupato.`);
                    }
                } else {
                    alert('⚠️ Nessun dato valido trovato.\n\nAssicurati che:\n1. Le colonne "Ragione Sociale" e "Indirizzo" siano presenti nella prima riga.\n2. Almeno queste due colonne siano compilate per ogni riga.\n3. Il separatore (virgola o punto e virgola) sia coerente.');
                }
            } catch (err: any) {
                console.error("Import Parser Error", err);
                alert('Errore durante la lettura del file: ' + err.message);
            }
            e.target.value = ''; // Reset per permettere ricaricamento dello stesso file
        };
        reader.onerror = () => alert("Errore hardware o di sistema durante la lettura del file.");
        reader.readAsText(file);
    };

    return (
        <div className="space-y-6">
            <div className="border-b border-gray-200 dark:border-slate-700 pb-4 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-primary-700 dark:text-blue-400 flex items-center"><Database className="mr-3" /> Gestione Anagrafiche</h2>
                    {!canDelete && <p className="text-xs text-orange-500 mt-1 flex items-center"><AlertCircle size={12} className="mr-1" /> Modalità Operatore: Cancellazione disabilitata</p>}
                </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

            <div className="flex flex-col sm:flex-row gap-4 items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder={`Cerca nei ${TAB_LABELS[activeTab].toLowerCase()}...`}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm"
                        value={globalSearchTerm}
                        onChange={(e) => setGlobalSearchTerm(e.target.value)}
                    />
                    {globalSearchTerm && (
                        <button
                            onClick={() => setGlobalSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
                <div className="flex space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                    {['clients', 'articles', 'services', 'anomalies'].map(t => (
                        <button
                            key={t}
                            onClick={() => { setActiveTab(t as Tab); setGlobalSearchTerm(''); }}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${activeTab === t ? 'bg-primary-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                        >
                            {TAB_LABELS[t as Tab]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg min-h-[400px] border border-gray-100 dark:border-slate-700 overflow-hidden">
                {activeTab === 'clients' && (
                    <div className="p-6 space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100 dark:border-slate-700 mb-2">
                            <h3 className="font-black text-lg text-gray-800 dark:text-gray-200 uppercase tracking-tight">Elenco Clienti <span className="text-primary-500 text-sm ml-2 font-medium">({displayClients.length})</span></h3>
                            <div className="flex gap-2">
                                <button onClick={handleImportClick} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center shadow-lg transition-transform active:scale-95"><Upload size={16} className="mr-2" /> Importa</button>
                                <button onClick={() => handleOpenClientModal()} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center shadow-lg transition-transform active:scale-95"><Plus size={16} className="mr-2" /> Nuovo</button>
                            </div>
                        </div>
                        <div className="grid gap-4">
                            {displayClients.map(c => (
                                <div key={c.id} className="p-4 border border-gray-200 dark:border-slate-700 rounded bg-gray-50 dark:bg-slate-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div><h4 className="font-bold text-gray-800 dark:text-gray-100">{c.nome}</h4><p className="text-sm text-gray-500 dark:text-gray-400">{c.indirizzo}</p></div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button onClick={() => handleOpenInventoryModal(c)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm flex-1 sm:flex-none flex justify-center"><Package size={16} /></button>
                                        <button onClick={() => handleOpenClientModal(c)} className="p-2 border border-gray-300 dark:border-slate-600 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-blue-500"><Edit size={16} /></button>
                                        {canDelete && (
                                            <button onClick={() => deleteClient(c.id)} className="p-2 border border-gray-300 dark:border-slate-600 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-red-500"><Trash2 size={16} /></button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Articles Tab */}
                {activeTab === 'articles' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 italic">Lista Articoli Master</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Questi articoli definiscono il catalogo utilizzabile nel Magazzino</p>
                            </div>
                            <button onClick={handleOpenArticleModal} className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center shadow-lg transition-transform active:scale-95">
                                <Plus size={18} className="mr-2" /> Nuovo Articolo
                            </button>
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-slate-700">
                            <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                                <thead className="bg-gray-50 dark:bg-slate-900/80 text-xs uppercase font-black tracking-widest text-gray-500 dark:text-gray-400">
                                    <tr>
                                        <th className="p-4">SKU / ID</th>
                                        <th className="p-4">Tipologia/Categoria</th>
                                        <th className="p-4">Descrizione</th>
                                        <th className="p-4 text-center">Giacenza Web</th>
                                        <th className="p-4">Informazioni Varie</th>
                                        <th className="p-4 text-right">Azioni</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {displayArticles.map(a => (
                                        <tr key={a.id} className="hover:bg-primary-50/30 dark:hover:bg-slate-700/30 transition-colors group">
                                            <td className="p-4 font-mono text-primary-600 dark:text-blue-400 font-bold">{a.id}</td>
                                            <td className="p-4">
                                                <span className="bg-gray-100 dark:bg-slate-900 px-2 py-1 rounded text-[10px] font-black uppercase text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-700">
                                                    {a.categoria}
                                                </span>
                                            </td>
                                            <td className="p-4 font-bold text-gray-900 dark:text-gray-100">{a.descrizione}</td>
                                            <td className="p-4 text-center">
                                                <div className={`text-lg font-black inline-flex items-center px-3 py-1 rounded-lg ${stocks[a.id] !== undefined ? (stocks[a.id] > 0 ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'text-red-500 bg-red-50 dark:bg-red-900/20') : 'text-gray-300'}`}>
                                                    {stocks[a.id] ?? '-'}
                                                </div>
                                            </td>
                                            <td className="p-4 text-gray-400 italic text-xs max-w-xs truncate">{a.note}</td>
                                            <td className="p-4 text-right">
                                                {canDelete && (
                                                    <button
                                                        onClick={() => { if (confirm("Eliminare definitivamente questo articolo?")) deleteArticle(a.id) }}
                                                        className="text-gray-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {displayArticles.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-10 text-center text-gray-400 italic">
                                                Nessun articolo trovato. prova a cambiare i termini di ricerca.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Services Tabs */}
                {activeTab === 'services' && (
                    <div className="p-6 space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 uppercase tracking-tight">Checklist Operative</h3>
                            <p className="text-xs text-gray-500 font-medium">Gestione normative (Richiede permesso Admin per cancellazione).</p>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            {Object.entries(displayServices).map(([category, items]) => (
                                <div key={category} className="border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-900 overflow-hidden">
                                    <div className="bg-gray-100 dark:bg-slate-800 p-3 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                                        <h4 className="font-bold text-primary-700 dark:text-blue-400">{category}</h4>
                                        <button onClick={() => openSimpleModal('service', category)} className="text-xs bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 px-3 py-1 rounded hover:bg-gray-50 dark:hover:bg-slate-600 flex items-center">
                                            <Plus size={12} className="mr-1" /> Aggiungi Voce
                                        </button>
                                    </div>
                                    <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {(items as string[]).map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded text-sm group">
                                                <span className="text-gray-700 dark:text-gray-300 mr-2">{item}</span>
                                                {canDelete && (
                                                    <button onClick={() => removeServiceItem(category, item)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Anomalies Tab */}
                {activeTab === 'anomalies' && (
                    <div className="p-6 space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/20">
                            <div>
                                <h3 className="font-black text-lg text-red-600 dark:text-red-400 uppercase tracking-tighter italic">Database Anomalie</h3>
                                <p className="text-xs text-red-500/80 font-medium tracking-tight">Voci selezionabili durante le ispezioni tecniche per segnalare difformità.</p>
                            </div>
                            <button onClick={() => openSimpleModal('anomaly')} className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center shadow-lg transition-all active:scale-95">
                                <Plus size={18} className="mr-2" /> Nuova Anomalia
                            </button>
                        </div>

                        {/* Generic Anomalies */}
                        {displayGenericAnomalies.length > 0 && (
                            <div className="border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-900 overflow-hidden mb-6">
                                <div className="bg-gray-200 dark:bg-slate-800 p-3 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                                    <h4 className="font-bold text-gray-800 dark:text-gray-100">Anomalie Generiche</h4>
                                    <button onClick={() => openSimpleModal('anomaly', '')} className="text-xs bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 px-3 py-1 rounded hover:bg-gray-50 dark:hover:bg-slate-600 flex items-center">
                                        <Plus size={12} className="mr-1" /> Aggiungi
                                    </button>
                                </div>
                                <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {displayGenericAnomalies.map((item, i) => (
                                        <div key={i} className="flex justify-between items-center p-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded text-sm group">
                                            <span className="text-gray-700 dark:text-gray-300 mr-2">{item}</span>
                                            {canDelete && (
                                                <button onClick={() => removeAnomalyItem('', item)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Category Specific */}
                        <div className="grid grid-cols-1 gap-6">
                            {Object.entries(displayAnomalies).map(([category, items]) => (
                                <div key={category} className="border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-900 overflow-hidden">
                                    <div className="bg-gray-100 dark:bg-slate-800 p-3 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                                        <h4 className="font-bold text-red-600 dark:text-red-400">{category}</h4>
                                        <button onClick={() => openSimpleModal('anomaly', category)} className="text-xs bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 px-3 py-1 rounded hover:bg-gray-50 dark:hover:bg-slate-600 flex items-center">
                                            <Plus size={12} className="mr-1" /> Aggiungi Voce
                                        </button>
                                    </div>
                                    <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {(items as string[]).map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded text-sm group">
                                                <span className="text-gray-700 dark:text-gray-300 mr-2">{item}</span>
                                                {canDelete && (
                                                    <button onClick={() => removeAnomalyItem(category, item)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* MODALS AND OTHER COMPONENTS SAME AS BEFORE ... */}
            {isClientModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between mb-6 border-b border-gray-100 dark:border-slate-700 pb-2">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">Dati Cliente</h3>
                            <button onClick={() => setIsClientModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* LEFT COLUMN */}
                            <div className="space-y-4">
                                <div className="flex items-center text-primary-600 dark:text-blue-400 font-bold border-b border-gray-100 dark:border-slate-700 pb-1 mb-2">
                                    <Database size={16} className="mr-2" /> Dati Aziendali
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Ragione Sociale *</label>
                                    <input className={inputClass('nome')} value={newClient.nome || ''} onChange={e => setNewClient({ ...newClient, nome: e.target.value })} placeholder="Es. Azienda SPA" />
                                    {validationErrors.nome && <p className="text-xs text-red-500 mt-1">{validationErrors.nome}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Indirizzo Sede Legale *</label>
                                    <input className={inputClass('indirizzo')} value={newClient.indirizzo || ''} onChange={e => setNewClient({ ...newClient, indirizzo: e.target.value })} placeholder="Es. Via Roma 1, Milano" />
                                    {validationErrors.indirizzo && <p className="text-xs text-red-500 mt-1">{validationErrors.indirizzo}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">P.IVA / CF</label><input className={inputClass('piva')} value={newClient.piva || ''} onChange={e => setNewClient({ ...newClient, piva: e.target.value })} /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Codice Univoco</label><input className={inputClass('codiceUnivoco')} value={newClient.codiceUnivoco || ''} onChange={e => setNewClient({ ...newClient, codiceUnivoco: e.target.value })} placeholder="SDI" /></div>
                                </div>

                                <div className="flex items-center text-primary-600 dark:text-blue-400 font-bold border-b border-gray-100 dark:border-slate-700 pb-1 mb-2 mt-4">
                                    <User size={16} className="mr-2" /> Contatti Amministrativi
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Referente Amm.</label><input className={inputClass('referente')} value={newClient.referente || ''} onChange={e => setNewClient({ ...newClient, referente: e.target.value })} /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Telefono</label><input className={inputClass('telefono')} value={newClient.telefono || ''} onChange={e => setNewClient({ ...newClient, telefono: e.target.value })} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Email</label><input className={inputClass('email')} value={newClient.email || ''} onChange={e => setNewClient({ ...newClient, email: e.target.value })} /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">PEC</label><input className={inputClass('pec')} value={newClient.pec || ''} onChange={e => setNewClient({ ...newClient, pec: e.target.value })} /></div>
                                </div>

                                <div className="flex items-center text-primary-600 dark:text-blue-400 font-bold border-b border-gray-100 dark:border-slate-700 pb-1 mb-2 mt-4">
                                    <CreditCard size={16} className="mr-2" /> Pagamenti & Note
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Metodo di Pagamento</label>
                                    {!isCustomPaymentInput ? (
                                        <select
                                            className={inputClass('pagamento')}
                                            value={newClient.pagamento || ''}
                                            onChange={e => {
                                                if (e.target.value === 'Altro') {
                                                    setIsCustomPaymentInput(true);
                                                    setNewClient({ ...newClient, pagamento: '' });
                                                } else {
                                                    setNewClient({ ...newClient, pagamento: e.target.value });
                                                }
                                            }}
                                        >
                                            <option value="">Seleziona...</option>
                                            {PAYMENT_METHODS.filter(p => p !== 'Altro').map(p => <option key={p} value={p}>{p}</option>)}
                                            <option value="Altro">Altro / Personalizzato...</option>
                                        </select>
                                    ) : (
                                        <div className="flex gap-2">
                                            <input className={inputClass('pagamento')} value={newClient.pagamento || ''} onChange={e => setNewClient({ ...newClient, pagamento: e.target.value })} placeholder="Specifica pagamento..." autoFocus />
                                            <button onClick={() => setIsCustomPaymentInput(false)} className="px-2 border rounded hover:bg-gray-100"><X size={14} /></button>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Note Interne</label>
                                    <textarea className={inputClass('note')} rows={2} value={newClient.note || ''} onChange={e => setNewClient({ ...newClient, note: e.target.value })} />
                                </div>
                            </div>

                            {/* RIGHT COLUMN */}
                            <div className="space-y-4">
                                <div className="flex items-center text-primary-600 dark:text-blue-400 font-bold border-b border-gray-100 dark:border-slate-700 pb-1 mb-2">
                                    <Briefcase size={16} className="mr-2" /> Dati Commessa / Contratto
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Codice Commessa</label><input className={inputClass('commessa')} value={newClient.commessa || ''} onChange={e => setNewClient({ ...newClient, commessa: e.target.value })} placeholder="Es. MAN-2024" /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">ID Contratto</label><input className={inputClass('idCommessa')} value={newClient.idCommessa || ''} onChange={e => setNewClient({ ...newClient, idCommessa: e.target.value })} placeholder="Es. CNT-001" /></div>
                                </div>

                                <div className="flex items-center text-primary-600 dark:text-blue-400 font-bold border-b border-gray-100 dark:border-slate-700 pb-1 mb-2 mt-4">
                                    <Building size={16} className="mr-2" /> Sede Operativa / Struttura
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Nome Struttura</label>
                                    <input className={inputClass('struttura')} value={newClient.struttura || ''} onChange={e => setNewClient({ ...newClient, struttura: e.target.value })} placeholder="Es. Plesso A" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Indirizzo Struttura (se diverso)</label>
                                    <input className={inputClass('indirizzoStruttura')} value={newClient.indirizzoStruttura || ''} onChange={e => setNewClient({ ...newClient, indirizzoStruttura: e.target.value })} placeholder="Es. Via dell'Industria 5" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">ID Struttura</label>
                                    <input className={inputClass('idStruttura')} value={newClient.idStruttura || ''} onChange={e => setNewClient({ ...newClient, idStruttura: e.target.value })} placeholder="Es. STR-001" />
                                </div>

                                <div className="flex items-center text-primary-600 dark:text-blue-400 font-bold border-b border-gray-100 dark:border-slate-700 pb-1 mb-2 mt-4">
                                    <User size={16} className="mr-2" /> Referente in Loco
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Nome Referente</label><input className={inputClass('referenteCommessa')} value={newClient.referenteCommessa || ''} onChange={e => setNewClient({ ...newClient, referenteCommessa: e.target.value })} /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Recapito (Tel/Cell)</label><input className={inputClass('recapitoCommessa')} value={newClient.recapitoCommessa || ''} onChange={e => setNewClient({ ...newClient, recapitoCommessa: e.target.value })} /></div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-4 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-3">
                            <button onClick={() => setIsClientModalOpen(false)} className="px-6 py-2 border border-gray-300 dark:border-slate-600 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700">Annulla</button>
                            <button onClick={handleSaveClient} className="px-8 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded font-bold shadow-md transition-all flex items-center"><Save size={18} className="mr-2" /> Salva Cliente</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Article Modal */}
            {isArticleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between mb-6 border-b border-gray-100 dark:border-slate-700 pb-2"><h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">Nuovo Articolo</h3><button onClick={() => setIsArticleModalOpen(false)} className="text-gray-400"><X size={20} /></button></div>
                        <div className="space-y-4">
                            <input className={inputClass('id')} placeholder="Codice ID" value={newArticle.id || ''} onChange={e => setNewArticle({ ...newArticle, id: e.target.value })} />
                            <input className={inputClass('categoria')} placeholder="Categoria" value={newArticle.categoria || ''} onChange={e => setNewArticle({ ...newArticle, categoria: e.target.value })} />
                            <input className={inputClass('descrizione')} placeholder="Descrizione" value={newArticle.descrizione || ''} onChange={e => setNewArticle({ ...newArticle, descrizione: e.target.value })} />
                            <textarea className={inputClass('note')} rows={2} placeholder="Note" value={newArticle.note || ''} onChange={e => setNewArticle({ ...newArticle, note: e.target.value })} />
                            <button onClick={handleSaveArticle} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded font-bold shadow-md">Salva</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Inventory Modal */}
            {isInventoryModalOpen && selectedClientForInventory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex justify-between mb-4 border-b border-gray-100 dark:border-slate-700 pb-2">
                            <h3 className="font-bold text-gray-800 dark:text-gray-100">Inventario: <span className="text-primary-600 dark:text-blue-400">{selectedClientForInventory.nome}</span></h3>
                            <button onClick={() => setIsInventoryModalOpen(false)} className="text-gray-400 hover:text-red-500"><X size={24} /></button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-6 bg-gray-50 dark:bg-slate-900 p-4 rounded border border-gray-200 dark:border-slate-700">
                            <div className="relative">
                                <input
                                    className="w-full p-2 pr-8 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-sm"
                                    placeholder="Tipo..."
                                    value={newInventoryAsset.tipo || ''}
                                    onFocus={() => setIsInventoryTypeDropdownOpen(true)}
                                    onBlur={() => setTimeout(() => setIsInventoryTypeDropdownOpen(false), 200)}
                                    onChange={e => { setNewInventoryAsset({ ...newInventoryAsset, tipo: e.target.value }); setIsInventoryTypeDropdownOpen(true) }}
                                />
                                <ChevronDown size={16} className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" />
                                {isInventoryTypeDropdownOpen && filteredArticles.length > 0 && (
                                    <ul className="absolute z-50 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 w-full max-h-60 overflow-y-auto shadow-2xl rounded-xl mt-2 backdrop-blur-md">
                                        {filteredArticles.map(a => (
                                            <li key={a.id} className="p-3 hover:bg-primary-50 dark:hover:bg-slate-700 cursor-pointer text-sm text-gray-800 dark:text-gray-200 border-b border-gray-50 dark:border-slate-700 last:border-0" onClick={() => { setNewInventoryAsset({ ...newInventoryAsset, tipo: a.descrizione, categoria: a.categoria }); setIsInventoryTypeDropdownOpen(false) }}>
                                                <div className="font-bold text-gray-900 dark:text-white">{a.descrizione}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between mt-1">
                                                    <span>{a.categoria}</span>
                                                    <span className="opacity-50">Stock: {stocks[a.id] ?? 0}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <input className="p-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-sm" placeholder="Matricola" value={newInventoryAsset.matricola || ''} onChange={e => setNewInventoryAsset({ ...newInventoryAsset, matricola: e.target.value })} />
                            <input className="p-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-sm" placeholder="Ubicazione" value={newInventoryAsset.ubicazione || ''} onChange={e => setNewInventoryAsset({ ...newInventoryAsset, ubicazione: e.target.value })} />
                            <button onClick={handleSaveInventoryAsset} className="md:col-span-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded font-bold py-2 shadow-sm text-sm">Aggiungi Presidio</button>
                        </div>

                        <table className="w-full text-sm text-left border-collapse">
                            <thead><tr className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                                <th className="p-3 border-b dark:border-slate-600">Tipo</th>
                                <th className="p-3 border-b dark:border-slate-600">Matricola</th>
                                <th className="p-3 border-b dark:border-slate-600">Ubicazione</th>
                                <th className="p-3 border-b dark:border-slate-600 text-right">Azioni</th>
                            </tr></thead>
                            <tbody>
                                {assets.filter(a => a.clientId === selectedClientForInventory.id).map(a => (
                                    <tr key={a.id} className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-900">
                                        <td className="p-3 text-gray-800 dark:text-gray-200 font-medium">{a.tipo}</td>
                                        <td className="p-3 text-gray-600 dark:text-gray-400 font-mono">{a.matricola}</td>
                                        <td className="p-3 text-gray-600 dark:text-gray-400">{a.ubicazione}</td>
                                        <td className="p-3 text-right">
                                            {canDelete && <button onClick={() => deleteAsset(a.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>}
                                        </td>
                                    </tr>
                                ))}
                                {assets.filter(a => a.clientId === selectedClientForInventory.id).length === 0 && (
                                    <tr><td colSpan={4} className="p-6 text-center text-gray-400 italic">Nessun presidio registrato.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Simple Modal */}
            {isSimpleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-sm p-6">
                        <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-100">
                            {simpleModalType === 'service' ? `Nuovo Servizio: ${selectedCategory}` : (selectedCategory ? `Nuova Anomalia: ${selectedCategory}` : 'Nuova Anomalia Generica')}
                        </h3>
                        <input className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 mb-4" placeholder="Descrizione..." value={newItemName} onChange={e => setNewItemName(e.target.value)} autoFocus />
                        <div className="flex gap-2">
                            <button onClick={() => setIsSimpleModalOpen(false)} className="flex-1 py-2 border border-gray-300 dark:border-slate-600 rounded text-gray-600 dark:text-gray-400">Annulla</button>
                            <button onClick={handleSaveSimpleItem} className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded font-bold">Salva</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Anagraphics;
