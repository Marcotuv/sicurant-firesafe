
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Database, Plus, Trash2, Edit, X, Save, Upload, Package, MapPin, CreditCard, User, Briefcase, Building, ChevronDown, Lock, AlertCircle } from 'lucide-react';
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

const Anagraphics: React.FC = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();

    // Access Control: Admin or Office Only
    const canAccess = profile?.role === 'admin' || profile?.role === 'office';
    // Delete Control: ONLY Admin
    const canDelete = profile?.role === 'admin';

    useEffect(() => {
        if (!canAccess) {
            const t = setTimeout(() => navigate('/'), 3000);
            return () => clearTimeout(t);
        }
    }, [canAccess, navigate]);

    const {
        clients, articles, assets, services, anomalies, checklistTemplates, categoryAnomalies,
        deleteClient, deleteArticle, deleteAsset, deleteService, deleteAnomaly,
        addClient, updateClient, addClientsBulk, addArticle, addArticlesBulk, addAsset, addAssetsBulk,
        addService, addAnomaly, updateChecklistTemplate, updateCategoryAnomaly
    } = useData();

    const fetchStocks = async () => {
        const { data } = await supabase.from('inventory_items').select('article_id, quantity');
        if (data) {
            const map: Record<string, number> = {};
            data.forEach((item: any) => {
                if (item.article_id) map[item.article_id] = item.quantity;
            });
            setStocks(map);
        }
    };

    useEffect(() => {
        if (activeTab === 'articles') fetchStocks();
    }, [activeTab]);

    const [activeTab, setActiveTab] = useState<Tab>('clients');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
    const [isSimpleModalOpen, setIsSimpleModalOpen] = useState(false);
    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
    const [isInventoryTypeDropdownOpen, setIsInventoryTypeDropdownOpen] = useState(false);
    const [isCustomPaymentInput, setIsCustomPaymentInput] = useState(false);

    const [simpleModalType, setSimpleModalType] = useState<'service' | 'anomaly' | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    const [newClient, setNewClient] = useState<Partial<Client>>({});
    const [editingClientId, setEditingClientId] = useState<number | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const [newArticle, setNewArticle] = useState<Partial<Article>>({});
    const [selectedClientForInventory, setSelectedClientForInventory] = useState<Client | null>(null);
    const [newInventoryAsset, setNewInventoryAsset] = useState<Partial<Asset>>({});
    const [newItemName, setNewItemName] = useState('');
    const [stocks, setStocks] = useState<Record<string, number>>({});

    // MAPPING ETICHETTE ITALIANO
    const tabLabels: Record<Tab, string> = {
        clients: 'Clienti',
        articles: 'Articoli',
        services: 'Servizi (Normative)',
        anomalies: 'Anomalie'
    };

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
    const handleFileChange = (e: any) => { };

    return (
        <div className="space-y-6">
            <div className="border-b border-gray-200 dark:border-slate-700 pb-4 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-primary-700 dark:text-blue-400 flex items-center"><Database className="mr-3" /> Gestione Anagrafiche</h2>
                    {!canDelete && <p className="text-xs text-orange-500 mt-1 flex items-center"><AlertCircle size={12} className="mr-1" /> Modalità Operatore: Cancellazione disabilitata</p>}
                </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

            <div className="flex space-x-2 border-b border-gray-200 dark:border-slate-700 overflow-x-auto">
                {['clients', 'articles', 'services', 'anomalies'].map(t => (
                    <button key={t} onClick={() => setActiveTab(t as Tab)} className={`px-6 py-3 border-b-2 font-medium whitespace-nowrap ${activeTab === t ? 'border-primary-600 text-primary-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                        {tabLabels[t as Tab]}
                    </button>
                ))}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow min-h-[400px] p-6">
                {activeTab === 'clients' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Clienti</h3>
                            <div className="flex gap-2">
                                <button onClick={handleImportClick} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm flex items-center shadow-sm"><Upload size={16} className="mr-2" /> Importa</button>
                                <button onClick={() => handleOpenClientModal()} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded text-sm flex items-center shadow-sm"><Plus size={16} className="mr-2" /> Nuovo</button>
                            </div>
                        </div>
                        <div className="grid gap-4">
                            {clients.map(c => (
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
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Articoli</h3>
                            <button onClick={handleOpenArticleModal} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded text-sm flex items-center shadow-sm"><Plus size={16} className="mr-2" /> Nuovo</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                                <thead className="bg-gray-100 dark:bg-slate-700 text-xs uppercase font-bold">
                                    <tr>
                                        <th className="p-3">ID</th>
                                        <th className="p-3">Categoria</th>
                                        <th className="p-3">Descrizione</th>
                                        <th className="p-3">Giacenza</th>
                                        <th className="p-3">Note</th>
                                        <th className="p-3 text-right">Azioni</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {articles.map(a => (
                                        <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-slate-900">
                                            <td className="p-3 font-mono text-blue-500">{a.id}</td>
                                            <td className="p-3">{a.categoria}</td>
                                            <td className="p-3 font-medium">{a.descrizione}</td>
                                            <td className="p-3">
                                                <span className={`font-bold ${stocks[a.id] !== undefined ? (stocks[a.id] > 0 ? 'text-green-600' : 'text-red-500') : 'text-gray-400'}`}>
                                                    {stocks[a.id] ?? '-'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-gray-400 italic">{a.note}</td>
                                            <td className="p-3 text-right">
                                                {canDelete && <button onClick={() => deleteArticle(a.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Services Tabs */}
                {activeTab === 'services' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Checklist Operative</h3>
                            <p className="text-sm text-gray-500">Gestione normative (Richiede permesso Admin per cancellazione).</p>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            {Object.entries(checklistTemplates).map(([category, items]) => (
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
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Anomalie Ricorrenti</h3>
                        </div>
                        {/* Generic */}
                        <div className="border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-900 overflow-hidden mb-6">
                            <div className="bg-gray-200 dark:bg-slate-800 p-3 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                                <h4 className="font-bold text-gray-800 dark:text-gray-100">Anomalie Generiche</h4>
                                <button onClick={() => openSimpleModal('anomaly', '')} className="text-xs bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 px-3 py-1 rounded hover:bg-gray-50 dark:hover:bg-slate-600 flex items-center">
                                    <Plus size={12} className="mr-1" /> Aggiungi
                                </button>
                            </div>
                            <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                                {anomalies.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center p-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded text-sm group">
                                        <span className="text-gray-700 dark:text-gray-300 mr-2">{item}</span>
                                        {canDelete && (
                                            <button onClick={() => removeAnomalyItem('', item)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Category Specific */}
                        <div className="grid grid-cols-1 gap-6">
                            {Object.entries(categoryAnomalies).map(([category, items]) => (
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
                                    <ul className="absolute z-10 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 w-full max-h-60 overflow-y-auto shadow-lg rounded mt-1">
                                        {filteredArticles.map(a => (
                                            <li key={a.id} className="p-2 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer text-sm text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-slate-700 last:border-0" onClick={() => { setNewInventoryAsset({ ...newInventoryAsset, tipo: a.descrizione, categoria: a.categoria }); setIsInventoryTypeDropdownOpen(false) }}>
                                                <span className="font-bold">{a.descrizione}</span> <span className="text-xs opacity-70 ml-1">({a.categoria})</span>
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
