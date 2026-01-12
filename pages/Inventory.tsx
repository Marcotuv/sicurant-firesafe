import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';
import { useData } from '../context/DataContext';

const Inventory: React.FC = () => {
    const { profile } = useAuth();
    const { articles } = useData();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [newItem, setNewItem] = useState({ sku: '', name: '', quantity: 0, min_quantity: 5, article_id: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const filteredArticles = articles.filter(a =>
        a.descrizione.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.id.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10);

    const fetchInventory = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('inventory_items').select('*').order('name');
        if (!error && data) setItems(data);
        setLoading(false);
    };

    const handleAddItem = async () => {
        if (!newItem.sku || !newItem.name) return;
        const { error } = await supabase.from('inventory_items').insert(newItem);
        if (!error) {
            setNewItem({ sku: '', name: '', quantity: 0, min_quantity: 5, article_id: '' });
            setSearchTerm('');
            fetchInventory();
        } else {
            console.error(error);
            alert("Errore inserimento");
        }
    };

    const handleMovement = async (itemId: string, type: 'IN' | 'OUT', qty: number) => {
        if (qty <= 0) return;
        const { error } = await supabase.from('inventory_movements').insert({
            item_id: itemId,
            type,
            quantity: qty,
            user_id: profile?.id, // Assumes profile has ID
            reason: type === 'IN' ? 'Carico Manuale' : 'Scarico Manuale'
        });

        if (!error) {
            fetchInventory(); // Reload to see new quantity updated by trigger
        } else {
            console.error(error);
            alert("Errore movimento");
        }
    };

    const isAdmin = profile?.role === 'admin' || profile?.role === 'office';

    return (
        <div className="p-4 bg-white min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Magazzino</h1>

            {isAdmin && (
                <div className="mb-8 p-4 bg-gray-50 rounded border">
                    <h3 className="font-bold mb-2">Nuovo Articolo</h3>
                    <div className="flex gap-2 flex-wrap items-start">
                        <div className="relative flex-1 min-w-[200px]">
                            <input
                                className="border p-2 rounded w-full"
                                placeholder="Cerca in Anagrafica..."
                                value={searchTerm}
                                onChange={e => {
                                    setSearchTerm(e.target.value);
                                    setIsDropdownOpen(true);
                                }}
                                onFocus={() => setIsDropdownOpen(true)}
                            />
                            {isDropdownOpen && searchTerm && (
                                <div className="absolute z-10 w-full bg-white border rounded shadow-lg mt-1 max-h-60 overflow-y-auto">
                                    {filteredArticles.map(a => (
                                        <div
                                            key={a.id}
                                            className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                                            onClick={() => {
                                                setNewItem({ ...newItem, name: a.descrizione, sku: a.id, article_id: a.id });
                                                setSearchTerm(a.descrizione);
                                                setIsDropdownOpen(false);
                                            }}
                                        >
                                            <div className="font-bold">{a.descrizione}</div>
                                            <div className="text-xs text-gray-500">{a.id} - {a.categoria}</div>
                                        </div>
                                    ))}
                                    {filteredArticles.length === 0 && (
                                        <div className="p-2 text-gray-500 text-sm italic">Nessun risultato</div>
                                    )}
                                </div>
                            )}
                        </div>
                        <input className="border p-2 rounded" placeholder="SKU" value={newItem.sku} onChange={e => setNewItem({ ...newItem, sku: e.target.value })} />
                        <input className="border p-2 rounded" placeholder="Nome" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
                        <input className="border p-2 rounded w-24" type="number" placeholder="Qty" value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })} />
                        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleAddItem}>Aggiungi</button>
                    </div>
                </div>
            )}

            {loading ? <p>Caricamento...</p> : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-2 border">SKU</th>
                                <th className="p-2 border">Nome</th>
                                <th className="p-2 border">Giacenza</th>
                                <th className="p-2 border">Stato</th>
                                <th className="p-2 border">Azioni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => (
                                <tr key={item.id} className="text-center">
                                    <td className="p-2 border">{item.sku}</td>
                                    <td className="p-2 border">{item.name}</td>
                                    <td className="p-2 border font-bold">{item.quantity}</td>
                                    <td className="p-2 border">
                                        {item.quantity < item.min_quantity ?
                                            <span className="text-red-500 font-bold">Sottoscorta</span> :
                                            <span className="text-green-500">OK</span>}
                                    </td>
                                    <td className="p-2 border flex justify-center gap-2">
                                        <button className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm" onClick={() => {
                                            const qty = prompt("Quantità da scaricare:");
                                            if (qty) handleMovement(item.id, 'OUT', parseInt(qty));
                                        }}>Scarica (-)</button>

                                        {isAdmin && (
                                            <button className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm" onClick={() => {
                                                const qty = prompt("Quantità da caricare:");
                                                if (qty) handleMovement(item.id, 'IN', parseInt(qty));
                                            }}>Carica (+)</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Inventory;
