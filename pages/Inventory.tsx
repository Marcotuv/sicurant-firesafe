import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';
import { useData } from '../context/DataContext';
import { Package, Plus, Search, ArrowUpCircle, ArrowDownCircle, AlertTriangle, CheckCircle2, Loader2, Info } from 'lucide-react';

const Inventory: React.FC = () => {
    const { profile } = useAuth();
    const { articles } = useData();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newItem, setNewItem] = useState({ sku: '', name: '', quantity: 0, min_quantity: 5, article_id: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const filteredArticles = articles.filter(a =>
        a.descrizione.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.id.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10);

    const fetchInventory = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('inventory_items').select('*').order('name');
            if (!error && data) setItems(data);
            else if (error) console.error("Error fetching inventory:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const handleAddItem = async () => {
        if (!newItem.sku || !newItem.name) return;
        const { error } = await supabase.from('inventory_items').insert(newItem);
        if (!error) {
            setNewItem({ sku: '', name: '', quantity: 0, min_quantity: 5, article_id: '' });
            setSearchTerm('');
            fetchInventory();
        } else {
            console.error(error);
            alert("Errore inserimento: " + error.message);
        }
    };

    const handleMovement = async (itemId: string, type: 'IN' | 'OUT', qty: number) => {
        if (qty <= 0 || isNaN(qty)) return;
        const { error } = await supabase.from('inventory_movements').insert({
            item_id: itemId,
            type,
            quantity: qty,
            user_id: profile?.id,
            reason: type === 'IN' ? 'Carico Manuale' : 'Scarico Manuale'
        });

        if (!error) {
            fetchInventory();
        } else {
            console.error(error);
            alert("Errore movimento: " + error.message);
        }
    };

    const isAdmin = profile?.role === 'admin' || profile?.role === 'office';

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex justify-between items-end border-b border-gray-200 dark:border-slate-700 pb-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-primary-700 dark:text-blue-400 flex items-center">
                        <Package className="mr-3" size={32} /> Magazzino Ricambi
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestione giacenze e movimenti di magazzino</p>
                </div>
            </div>

            {/* Nuovo Articolo Section */}
            {isAdmin && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 overflow-visible">
                    <div className="flex items-center gap-2 mb-4 text-gray-800 dark:text-gray-200 font-bold">
                        <Plus size={20} className="text-emerald-500" />
                        <h3>Registra Nuovo Articolo in Magazzino</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-5 relative">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Cerca in Anagrafica Articoli</label>
                            <div className="relative">
                                <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                                <input
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-gray-900 dark:text-white"
                                    placeholder="Es: Rilevatore fumo, Batteria..."
                                    value={searchTerm}
                                    onChange={e => {
                                        setSearchTerm(e.target.value);
                                        setIsDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsDropdownOpen(true)}
                                />
                            </div>

                            {isDropdownOpen && searchTerm && (
                                <div className="absolute z-50 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl mt-2 max-h-64 overflow-y-auto overflow-x-hidden backdrop-blur-md">
                                    {filteredArticles.map(a => (
                                        <div
                                            key={a.id}
                                            className="p-3 hover:bg-primary-50 dark:hover:bg-slate-700 cursor-pointer transition-colors border-b border-gray-50 dark:border-slate-700 last:border-0"
                                            onClick={() => {
                                                setNewItem({ ...newItem, name: a.descrizione, sku: a.id, article_id: a.id });
                                                setSearchTerm(a.descrizione);
                                                setIsDropdownOpen(false);
                                            }}
                                        >
                                            <div className="font-bold text-gray-900 dark:text-white text-sm">{a.descrizione}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex justify-between">
                                                <span>ID: {a.id}</span>
                                                <span className="bg-gray-100 dark:bg-slate-900 px-1.5 py-0.5 rounded uppercase">{a.categoria}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredArticles.length === 0 && (
                                        <div className="p-4 text-gray-500 text-sm italic flex items-center justify-center">
                                            <Info size={16} className="mr-2" /> Nessun articolo trovato in anagrafica
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">SKU / Codice</label>
                            <input
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white outline-none"
                                placeholder="Auto"
                                value={newItem.sku}
                                onChange={e => setNewItem({ ...newItem, sku: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-3">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Nome Visualizzato</label>
                            <input
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white outline-none"
                                placeholder="Nome articolo"
                                value={newItem.name}
                                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <button
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 transform active:scale-95"
                                onClick={handleAddItem}
                            >
                                <Plus size={18} /> Aggiungi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Inventory Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center text-gray-500">
                        <Loader2 className="animate-spin mb-4 text-primary-500" size={40} />
                        <p>Caricamento inventario in corso...</p>
                    </div>
                ) : items.length === 0 ? (
                    <div className="p-20 text-center flex flex-col items-center justify-center text-gray-400">
                        <Package size={64} className="mb-4 opacity-20" />
                        <h3 className="text-xl font-bold">Magazzino Vuoto</h3>
                        <p className="mt-2 max-w-xs mx-auto">Non ci sono ancora articoli registrati nel magazzino. Usa il modulo sopra per iniziare.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">SKU / Codice</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Articolo</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center">Giacenza</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center">Stato</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-right">Azioni Rapide</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                {items.map(item => {
                                    const isLow = item.quantity < (item.min_quantity || 5);
                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors group">
                                            <td className="px-6 py-4 font-mono text-sm text-blue-600 dark:text-blue-400">{item.sku}</td>
                                            <td className="px-6 py-4 font-bold text-gray-900 dark:text-gray-100">{item.name}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`text-xl font-black ${isLow ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>
                                                    {item.quantity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {isLow ? (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                                                        <AlertTriangle size={12} className="mr-1" /> Sottoscorta
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                                        <CheckCircle2 size={12} className="mr-1" /> Disponibile
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        title="Scarica qty"
                                                        className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                                        onClick={() => {
                                                            const qty = prompt(`Scarico per ${item.name}. Quantità:`);
                                                            if (qty) handleMovement(item.id, 'OUT', parseInt(qty));
                                                        }}
                                                    >
                                                        <ArrowDownCircle size={20} />
                                                    </button>

                                                    {isAdmin && (
                                                        <button
                                                            title="Carica qty"
                                                            className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                                                            onClick={() => {
                                                                const qty = prompt(`Carico per ${item.name}. Quantità:`);
                                                                if (qty) handleMovement(item.id, 'IN', parseInt(qty));
                                                            }}
                                                        >
                                                            <ArrowUpCircle size={20} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Inventory;
