
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { 
    ReceiptEuro, Plus, Search, Filter, 
    Trash2, X, ShieldCheck, Box, Settings, HardHat, FileDigit, Briefcase, Info, ListPlus, PackageSearch, ChevronDown, User, CheckCircle2
} from 'lucide-react';
import { Quotation, QuotationStatus, QuotationItem, QuotationCategory, Article, Client } from '../types';
import { getLocalDate, addDaysToDate } from '../utils/dates';

const Quotations: React.FC = () => {
    const { 
        quotations, clients, articles, services, anomalies, addQuotation, deleteQuotation, addNotification 
    } = useData();
    const { profile } = useAuth();
    const location = useLocation();
    
    // Stati per la vista principale
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<QuotationStatus | 'ALL'>('ALL');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCatalogOpen, setIsCatalogOpen] = useState(false);
    
    // Stati per la ricerca cliente nel Modal
    const [clientSearchInput, setClientSearchInput] = useState("");
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
    const clientSearchRef = useRef<HTMLDivElement>(null);

    // Stato per i suggerimenti nelle righe della tabella
    const [activeSuggestionRow, setActiveSuggestionRow] = useState<number | null>(null);
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

    const [newQuo, setNewQuo] = useState<Partial<Quotation>>({
        type: 'PREVENTIVO', 
        category: 'FORNITURA',
        title: '', 
        description: '',
        clientId: 0, 
        clientName: '',
        amount: 0, 
        items: [], 
        status: 'DRAFT', 
        date: getLocalDate(),
        expiryDate: addDaysToDate(new Date(), 30)
    });

    // Gestione clic fuori dai dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (clientSearchRef.current && !clientSearchRef.current.contains(event.target as Node)) {
                setIsClientDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const state = location.state as any;
        if (state?.prefill) {
            setNewQuo({
                type: state.prefill.type || 'PREVENTIVO',
                category: state.prefill.items?.some((i: any) => i.description.includes('RIPRISTINO')) ? 'MANUTENZIONE_STRAORDINARIA' : 'MANUTENZIONE_ORDINARIA',
                title: state.prefill.title || '',
                description: '',
                clientId: state.prefill.clientId,
                clientName: state.prefill.clientName,
                status: 'DRAFT',
                date: getLocalDate(),
                expiryDate: addDaysToDate(new Date(), 30),
                items: state.prefill.items || [],
                amount: 0,
                interventionRefId: state.prefill.interventionRefId
            });
            setClientSearchInput(state.prefill.clientName || "");
            setIsModalOpen(true);
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const currentTotal = useMemo(() => (newQuo.items || []).reduce((sum, item) => sum + (item.total || 0), 0), [newQuo.items]);
    
    const filteredQuotations = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        return quotations.filter(q => 
            (!term || q.clientName.toLowerCase().includes(term) || q.title.toLowerCase().includes(term)) && 
            (statusFilter === 'ALL' || q.status === statusFilter)
        ).sort((a, b) => b.date.localeCompare(a.date));
    }, [quotations, searchTerm, statusFilter]);

    const filteredClientsAutocomplete = useMemo(() => {
        const term = clientSearchInput.toLowerCase().trim();
        if (!term || newQuo.clientId) return []; // Non mostrare se già selezionato o vuoto
        return clients.filter(c => 
            c.nome.toLowerCase().includes(term) || 
            c.indirizzo.toLowerCase().includes(term) ||
            c.commessa?.toLowerCase().includes(term)
        ).slice(0, 10);
    }, [clients, clientSearchInput, newQuo.clientId]);

    if (profile?.role !== 'admin' && profile?.role !== 'office') return <div className="p-10 text-center">Accesso Riservato Ufficio.</div>;

    // LOGICA AGGIORNAMENTO RIGHE
    const updateItem = (idx: number, updates: Partial<QuotationItem>) => {
        setNewQuo(prev => {
            const currentItems = prev.items ? [...prev.items] : [];
            const item = { ...currentItems[idx], ...updates };
            
            // Calcolo totale riga con sanitizzazione input
            const qty = parseFloat(item.quantity as any) || 0;
            const price = parseFloat(item.unitPrice as any) || 0;
            item.total = qty * price;
            
            currentItems[idx] = item;
            return { ...prev, items: currentItems };
        });
    };

    const removeItem = (idx: number) => {
        setNewQuo(prev => {
            const items = prev.items ? [...prev.items] : [];
            items.splice(idx, 1);
            return { ...prev, items };
        });
    };

    const addManualRow = () => {
        setNewQuo(prev => ({
            ...prev,
            items: [...(prev.items || []), { 
                id: `ITEM-${Date.now()}`, 
                type: 'CUSTOM', 
                description: '', 
                quantity: 1, 
                unitPrice: 0, 
                total: 0 
            }]
        }));
    };

    const addFromCatalog = (article: Article) => {
        setNewQuo(prev => ({
            ...prev,
            items: [...(prev.items || []), { 
                id: `ART-${Date.now()}`, 
                type: 'ARTICLE', 
                description: article.descrizione, 
                quantity: 1, 
                unitPrice: 0, 
                total: 0 
            }]
        }));
        setIsCatalogOpen(false);
    };

    const handleDescriptionChange = (idx: number, value: string) => {
        updateItem(idx, { description: value });
        
        if (value.length < 2) {
            setActiveSuggestionRow(null);
            return;
        }

        const term = value.toLowerCase();
        const matches: string[] = [];

        articles.forEach(a => { if (a.descrizione.toLowerCase().includes(term)) matches.push(a.descrizione); });
        services.forEach(s => { if (s.toLowerCase().includes(term)) matches.push(s); });
        if (term.includes('rip') || term.includes('ano')) {
            anomalies.forEach(ano => {
                const suggestion = `RIPRISTINO: ${ano}`;
                if (suggestion.toLowerCase().includes(term)) matches.push(suggestion);
            });
        }

        setFilteredSuggestions(Array.from(new Set(matches)).slice(0, 8));
        setActiveSuggestionRow(idx);
    };

    const handleSelectClient = (client: Client) => {
        setNewQuo(prev => ({ ...prev, clientId: client.id, clientName: client.nome }));
        setClientSearchInput(client.nome);
        setIsClientDropdownOpen(false);
    };

    const resetClientSelection = () => {
        setNewQuo(prev => ({ ...prev, clientId: 0, clientName: '' }));
        setClientSearchInput("");
    };

    const handleSaveDocument = () => {
        // Validazione rigorosa
        if (!newQuo.clientId) { alert("Seleziona un cliente valido dalla lista suggerimenti."); return; }
        if (!newQuo.title?.trim()) { alert("Inserisci l'oggetto del preventivo."); return; }
        if (!newQuo.items || newQuo.items.length === 0) { alert("Aggiungi almeno una riga di prestazione."); return; }
        
        const hasEmptyRows = newQuo.items.some(i => !i.description.trim());
        if (hasEmptyRows) { alert("Tutte le righe devono avere una descrizione."); return; }

        // Salvataggio con tutti i campi richiesti dall'interfaccia Quotation
        const finalQuotation: Quotation = {
            id: `QUO-${Date.now()}`,
            number: '', // Verrà assegnato dal DataContext
            type: newQuo.type as any,
            category: newQuo.category as any,
            clientId: newQuo.clientId as number,
            clientName: newQuo.clientName as string,
            title: newQuo.title as string,
            description: newQuo.description || '',
            items: newQuo.items as QuotationItem[],
            amount: currentTotal,
            status: newQuo.status as any,
            date: newQuo.date as string,
            expiryDate: newQuo.expiryDate || addDaysToDate(new Date(), 30),
            interventionRefId: newQuo.interventionRefId,
            updatedAt: new Date().toISOString()
        };

        addQuotation(finalQuotation);
        setIsModalOpen(false);
        addNotification({ 
            title: 'Preventivo Creato', 
            message: `Registrato ${finalQuotation.type} per ${finalQuotation.clientName} - Totale € ${currentTotal.toFixed(2)}`, 
            type: 'success' 
        });
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b dark:border-slate-700 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-primary-700 dark:text-blue-400 flex items-center tracking-tight">
                        <ReceiptEuro className="mr-3" /> Gestione Commerciale
                    </h2>
                    <p className="text-sm text-gray-500 font-medium">Archivio preventivi e cataloghi aziendali.</p>
                </div>
                <button onClick={() => {
                    setNewQuo({ type: 'PREVENTIVO', category: 'FORNITURA', title: '', description: '', clientId: 0, clientName: '', amount: 0, items: [], status: 'DRAFT', date: getLocalDate(), expiryDate: addDaysToDate(new Date(), 30) });
                    setClientSearchInput("");
                    setIsModalOpen(true);
                }} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl flex items-center font-bold shadow-lg shadow-primary-500/20 transition-all active:scale-95">
                    <Plus size={20} className="mr-2"/> Crea Preventivo
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative col-span-2">
                    <Search className="absolute left-3.5 top-3.5 text-gray-400" size={18}/>
                    <input type="text" placeholder="Cerca per cliente o oggetto..." className="w-full pl-11 pr-4 py-3 border rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white border-gray-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                </div>
                <div className="relative col-span-2">
                    <Filter className="absolute left-3.5 top-3.5 text-gray-400" size={18}/>
                    <select className="w-full pl-11 pr-10 py-3 border rounded-xl bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-primary-500 appearance-none font-bold" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
                        <option value="ALL">Tutti gli stati</option>
                        <option value="DRAFT">Bozza</option>
                        <option value="SENT">Inviato</option>
                        <option value="ACCEPTED_TO_PLAN">Accettato</option>
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-slate-900/50 text-gray-400 text-[10px] uppercase font-bold tracking-widest border-b dark:border-slate-700">
                                <th className="p-5">Nr. Protocollo</th>
                                <th className="p-5">Documento</th>
                                <th className="p-5">Cliente</th>
                                <th className="p-5">Totale Imponibile</th>
                                <th className="p-5">Stato</th>
                                <th className="p-5 text-right">Azioni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {filteredQuotations.map(quo => (
                                <tr key={quo.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group">
                                    <td className="p-5">
                                        <div className="flex flex-col">
                                            <span className="font-black text-primary-700 dark:text-blue-400 text-sm tracking-tighter">{quo.number}</span>
                                            <span className="text-[10px] text-gray-400 font-mono">{new Date(quo.date).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${quo.type === 'CONSUNTIVO' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}>{quo.type}</span>
                                            {quo.category && <span className="bg-blue-50 text-blue-600 text-[9px] px-2 py-0.5 rounded-full font-black border border-blue-100 uppercase">{quo.category.replace('_',' ')}</span>}
                                        </div>
                                        <div className="font-bold text-gray-800 dark:text-white truncate max-w-[250px]">{quo.title}</div>
                                    </td>
                                    <td className="p-5"><div className="font-bold text-gray-600 dark:text-blue-300">{quo.clientName}</div></td>
                                    <td className="p-5 font-black text-lg text-primary-600 dark:text-blue-400">€ {quo.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
                                    <td className="p-5">
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                                            quo.status === 'ACCEPTED_TO_PLAN' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600 border border-gray-200'
                                        }`}>{quo.status}</span>
                                    </td>
                                    <td className="p-5 text-right">
                                        <button onClick={() => { if(confirm("Eliminare definitivamente il preventivo?")) deleteQuotation(quo.id) }} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl p-8 flex flex-col max-h-[95vh] border border-white/20">
                        <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-slate-700">
                             <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-2xl shadow-inner"><ShieldCheck className="text-primary-500" size={28}/></div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Preparazione Offerta Economica</h3>
                                    <p className="text-xs text-gray-500 font-medium italic">I dati verranno salvati nel registro commerciale aziendale.</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-3">
                                <button onClick={() => setIsCatalogOpen(true)} className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-100 transition-all border border-blue-200 shadow-sm"><PackageSearch size={16} className="mr-2"/> Catalogo Articoli</button>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors bg-gray-100 rounded-full p-1"><X size={28}/></button>
                             </div>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                                <div className="md:col-span-1">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Categoria Offerta</label>
                                    <div className="flex flex-col gap-2">
                                        <button onClick={() => setNewQuo({...newQuo, category: 'FORNITURA'})} className={`flex items-center p-3 border-2 rounded-2xl text-xs font-bold transition-all ${newQuo.category === 'FORNITURA' ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md' : 'bg-gray-50 border-gray-100 dark:bg-slate-900 dark:border-slate-700'}`}><Box size={16} className="mr-2"/> Fornitura</button>
                                        <button onClick={() => setNewQuo({...newQuo, category: 'MANUTENZIONE_ORDINARIA'})} className={`flex items-center p-3 border-2 rounded-2xl text-xs font-bold transition-all ${newQuo.category === 'MANUTENZIONE_ORDINARIA' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md' : 'bg-gray-50 border-gray-100 dark:bg-slate-900 dark:border-slate-700'}`}><Settings size={16} className="mr-2"/> Ordinaria</button>
                                        <button onClick={() => setNewQuo({...newQuo, category: 'MANUTENZIONE_STRAORDINARIA'})} className={`flex items-center p-3 border-2 rounded-2xl text-xs font-bold transition-all ${newQuo.category === 'MANUTENZIONE_STRAORDINARIA' ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-md' : 'bg-gray-50 border-gray-100 dark:bg-slate-900 dark:border-slate-700'}`}><HardHat size={16} className="mr-2"/> Straordinaria</button>
                                    </div>
                                </div>

                                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="relative" ref={clientSearchRef}>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Cliente Intestatario</label>
                                        <div className="relative group">
                                            <Search className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={18}/>
                                            <input 
                                                type="text" 
                                                className={`w-full p-3.5 pl-11 pr-10 border-2 rounded-2xl bg-gray-50 dark:bg-slate-900 dark:border-slate-700 font-bold outline-none transition-all ${newQuo.clientId ? 'border-emerald-500 bg-emerald-50/30' : 'focus:border-primary-500'}`}
                                                placeholder="Cerca cliente..." 
                                                value={clientSearchInput} 
                                                onChange={e => { setClientSearchInput(e.target.value); setIsClientDropdownOpen(true); if(newQuo.clientId) setNewQuo(prev => ({...prev, clientId: 0})); }}
                                                onFocus={() => setIsClientDropdownOpen(true)}
                                            />
                                            {newQuo.clientId ? (
                                                <button onClick={resetClientSelection} className="absolute right-3 top-3.5 text-emerald-600 hover:text-red-500 transition-colors"><CheckCircle2 size={20}/></button>
                                            ) : (
                                                <ChevronDown size={16} className="absolute right-3.5 top-4 text-gray-400"/>
                                            )}
                                        </div>
                                        {isClientDropdownOpen && filteredClientsAutocomplete.length > 0 && (
                                            <div className="absolute z-[120] w-full mt-2 bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
                                                {filteredClientsAutocomplete.map(c => (
                                                    <button key={c.id} onClick={() => handleSelectClient(c)} className="w-full text-left p-4 border-b last:border-0 hover:bg-primary-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3">
                                                        <div className="bg-primary-100 text-primary-600 p-2 rounded-lg"><User size={16}/></div>
                                                        <div><div className="font-bold text-sm text-gray-900 dark:text-white">{c.nome}</div><div className="text-[10px] text-gray-500 font-medium">{c.indirizzo}</div></div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Oggetto Documento</label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-3.5 top-3.5 text-gray-400" size={18}/>
                                            <input className="w-full p-3.5 pl-11 border-2 rounded-2xl bg-gray-50 dark:bg-slate-900 dark:border-slate-700 font-bold focus:border-primary-500 outline-none transition-all" placeholder="es. Ripristino efficienza estintori..." value={newQuo.title} onChange={e => setNewQuo({...newQuo, title: e.target.value})} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border-2 border-gray-100 dark:border-slate-700 relative shadow-inner">
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center"><ListPlus size={14} className="mr-2"/> Corpo del Preventivo</h4>
                                    <button onClick={addManualRow} className="flex items-center text-primary-600 text-[10px] font-black hover:bg-primary-50 px-4 py-2 rounded-xl border-2 border-primary-100 transition-all shadow-sm">
                                        <Plus size={14} className="mr-1.5"/> AGGIUNGI RIGA MANUALE
                                    </button>
                                </div>
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] font-black text-gray-400 uppercase border-b-2 border-gray-100 dark:border-slate-700 pb-3">
                                            <th className="pb-3 px-2">Descrizione Prestazione / Materiale</th>
                                            <th className="pb-3 text-center" style={{ width: '100px' }}>Quantità</th>
                                            <th className="pb-3 text-right" style={{ width: '130px' }}>Prezzo Un.</th>
                                            <th className="pb-3 text-right" style={{ width: '140px' }}>Totale</th>
                                            <th className="pb-3 text-right" style={{ width: '50px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                        {newQuo.items?.map((item, idx) => (
                                            <tr key={item.id} className="group relative">
                                                <td className="py-4 px-2 relative">
                                                    <input 
                                                        className="w-full bg-transparent font-bold text-sm text-gray-800 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 rounded-lg px-2 py-1 transition-all border border-transparent focus:border-primary-200" 
                                                        value={item.description} 
                                                        placeholder="Scrivi o cerca..."
                                                        onChange={e => handleDescriptionChange(idx, e.target.value)}
                                                    />
                                                    {activeSuggestionRow === idx && filteredSuggestions.length > 0 && (
                                                        <div className="absolute z-[130] left-0 top-full mt-1 w-full bg-white dark:bg-slate-800 shadow-2xl rounded-2xl border-2 border-gray-50 dark:border-slate-700 overflow-hidden max-h-48 overflow-y-auto">
                                                            {filteredSuggestions.map((s, si) => (
                                                                <button key={si} onClick={() => { updateItem(idx, { description: s }); setActiveSuggestionRow(null); }} className="w-full text-left px-4 py-3 text-xs hover:bg-primary-50 dark:hover:bg-slate-700 border-b border-gray-50 last:border-0 font-bold text-gray-700 dark:text-gray-300">
                                                                    {s}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-4 text-center">
                                                    <input type="number" className="w-full bg-transparent text-center font-bold text-sm outline-none border-b-2 border-transparent focus:border-primary-500 py-1" value={item.quantity} onChange={e => updateItem(idx, { quantity: e.target.value as any })} />
                                                </td>
                                                <td className="py-4 text-right">
                                                    <div className="flex items-center justify-end"><span className="text-xs mr-1 text-gray-400 font-bold">€</span><input type="number" step="0.01" className="w-24 bg-transparent text-right font-black text-sm outline-none border-b-2 border-transparent focus:border-primary-500 py-1" value={item.unitPrice} onChange={e => updateItem(idx, { unitPrice: e.target.value as any })} /></div>
                                                </td>
                                                <td className="py-4 text-right font-black text-sm text-primary-600 dark:text-blue-400 pr-2">€ {(item.total || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
                                                <td className="py-4 text-right"><button onClick={() => removeItem(idx)} className="text-gray-300 hover:text-red-500 transition-colors p-1 group-hover:opacity-100 opacity-0"><Trash2 size={16}/></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {(!newQuo.items || newQuo.items.length === 0) && (
                                    <div className="py-16 text-center text-gray-400 bg-white/40 dark:bg-slate-900/40 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-800">
                                        <Box size={48} className="mx-auto mb-4 opacity-20"/><p className="font-bold text-sm italic">Nessun elemento. Aggiungi una riga per iniziare.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 flex justify-between items-center border-t-2 pt-6 dark:border-slate-700">
                            <div className="flex items-center gap-10">
                                <div><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Totale Imponibile Offerta</span><div className="text-5xl font-black text-primary-700 dark:text-blue-400 drop-shadow-sm">€ {currentTotal.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</div></div>
                                <div className="border-l-2 border-gray-100 dark:border-slate-700 pl-10 hidden md:block"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Righe Totali</span><div className="text-xl font-bold text-gray-600 dark:text-gray-400">{(newQuo.items || []).length} voci</div></div>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setIsModalOpen(false)} className="px-10 py-4 border-2 border-gray-100 dark:border-slate-700 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all">Annulla</button>
                                <button onClick={handleSaveDocument} className="px-12 py-4 bg-primary-600 text-white rounded-2xl font-black shadow-2xl shadow-primary-600/30 hover:bg-primary-700 transition-all flex items-center transform active:scale-95 border-b-4 border-primary-800">
                                    <FileDigit size={24} className="mr-3"/> SALVA E GENERA NUMERO
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODALE CATALOGO */}
            {isCatalogOpen && (
                <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-2xl p-8 flex flex-col max-h-[85vh] border-2 border-blue-500/10">
                        <div className="flex justify-between items-center mb-6 border-b-2 pb-4 dark:border-slate-700"><h3 className="font-black text-gray-900 dark:text-white uppercase flex items-center text-lg"><PackageSearch size={24} className="mr-3 text-blue-500"/> Selezione dal Listino</h3><button onClick={() => setIsCatalogOpen(false)} className="text-gray-400 hover:text-red-500 bg-gray-100 p-1 rounded-full"><X size={24}/></button></div>
                        <div className="overflow-y-auto custom-scrollbar flex-1 pr-2">
                            <div className="grid grid-cols-1 gap-3">
                                {articles.map(art => (
                                    <button key={art.id} onClick={() => addFromCatalog(art)} className="flex justify-between items-center p-5 rounded-2xl border-2 border-gray-50 dark:border-slate-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-slate-700 text-left group transition-all shadow-sm">
                                        <div className="flex-1"><div className="font-bold text-gray-800 dark:text-white group-hover:text-primary-700 text-base leading-tight">{art.descrizione}</div><div className="text-[10px] text-gray-400 font-black mt-1 uppercase flex items-center"><span className="bg-gray-100 dark:bg-slate-900 px-2 py-0.5 rounded-lg mr-2">ID: {art.id}</span><span className="text-primary-400">{art.categoria}</span></div></div>
                                        <div className="bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-gray-100 group-hover:scale-110 transition-transform"><Plus size={20} className="text-primary-600"/></div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Quotations;
