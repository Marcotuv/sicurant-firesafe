
import React, { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import { Database, Plus, Trash2, Edit, X, Save, Upload, Package, MapPin, Hash } from 'lucide-react';
import { Client, Asset, Article } from '../types';

type Tab = 'clients' | 'articles' | 'services' | 'anomalies';

const Anagraphics: React.FC = () => {
  const { 
    clients, articles, assets, services, anomalies, 
    deleteClient, deleteArticle, deleteAsset, deleteService, deleteAnomaly,
    addClient, updateClient, addClientsBulk, 
    addArticle, addArticlesBulk,
    addAsset, addAssetsBulk, 
    addService, addAnomaly 
  } = useData();
  
  const [activeTab, setActiveTab] = useState<Tab>('clients');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inventoryFileInputRef = useRef<HTMLInputElement>(null);

  // --- Modal States ---
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false); 
  const [isSimpleModalOpen, setIsSimpleModalOpen] = useState(false); // For Services/Anomalies
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false); // New Inventory Modal
  
  const [simpleModalType, setSimpleModalType] = useState<'service' | 'anomaly' | null>(null);

  // --- Form States ---
  const [newClient, setNewClient] = useState<Partial<Client>>({ 
    nome: '', indirizzo: '', referente: '', telefono: '', email: '', 
    commessa: '', idCommessa: '', struttura: '', idStruttura: '', note: '' 
  });
  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  
  // State for Catalog Article (Nuovo Articolo)
  const [newArticle, setNewArticle] = useState<Partial<Article>>({
    id: '', categoria: '', descrizione: '', note: ''
  });

  // State for Inventory Management
  const [selectedClientForInventory, setSelectedClientForInventory] = useState<Client | null>(null);
  const [newInventoryAsset, setNewInventoryAsset] = useState<Partial<Asset>>({
    id: '', tipo: '', matricola: '', ubicazione: '', scadenza: '', categoria: '', note: ''
  });

  const [newItemName, setNewItemName] = useState('');

  const tabs = [
    { id: 'clients', label: 'Clienti' },
    { id: 'articles', label: 'Articoli (Catalogo)' },
    { id: 'services', label: 'Servizi' },
    { id: 'anomalies', label: 'Anomalie' },
  ];

  // --- Handlers ---

  const handleOpenClientModal = (client?: Client) => {
    if (client) {
        // BUGFIX: Assicuriamoci che i campi opzionali non siano mai undefined per evitare errori di "Uncontrolled Input"
        setNewClient({
            nome: client.nome || '',
            indirizzo: client.indirizzo || '',
            referente: client.referente || '',
            telefono: client.telefono || '',
            email: client.email || '',
            commessa: client.commessa || '',
            idCommessa: client.idCommessa || '',
            struttura: client.struttura || '',
            idStruttura: client.idStruttura || '',
            note: client.note || ''
        });
        setEditingClientId(client.id);
    } else {
        setNewClient({ 
          nome: '', indirizzo: '', referente: '', telefono: '', email: '', 
          commessa: '', idCommessa: '', struttura: '', idStruttura: '', note: '' 
        });
        setEditingClientId(null);
    }
    setIsClientModalOpen(true);
  };

  const handleOpenArticleModal = () => {
    setNewArticle({ id: '', categoria: '', descrizione: '', note: '' });
    setIsArticleModalOpen(true);
  };

  const handleOpenInventoryModal = (client: Client) => {
      setSelectedClientForInventory(client);
      setNewInventoryAsset({ id: '', tipo: '', matricola: '', ubicazione: '', scadenza: '', categoria: '', note: '' });
      setIsInventoryModalOpen(true);
  };

  const handleSaveClient = () => {
    if (!newClient.nome) {
      alert("La Ragione Sociale è obbligatoria");
      return;
    }

    const clientData: Client = {
        id: editingClientId || 0, // Placeholder
        nome: newClient.nome || '',
        indirizzo: newClient.indirizzo || '',
        referente: newClient.referente || '',
        telefono: newClient.telefono || '',
        email: newClient.email || '',
        commessa: newClient.commessa || '',
        idCommessa: newClient.idCommessa || '',
        struttura: newClient.struttura || '',
        idStruttura: newClient.idStruttura || '',
        note: newClient.note || ''
    };

    if (editingClientId !== null) {
        updateClient(clientData);
    } else {
        const maxId = clients.reduce((max, c) => (c.id > max ? c.id : max), 0);
        addClient({ ...clientData, id: maxId + 1 });
    }
    setIsClientModalOpen(false);
  };

  const handleSaveArticle = () => {
      if (!newArticle.descrizione) {
          alert("La descrizione è obbligatoria");
          return;
      }
      addArticle({
          id: newArticle.id || `ART-${Date.now()}`,
          categoria: newArticle.categoria || 'Generico',
          descrizione: newArticle.descrizione || '',
          note: newArticle.note || ''
      } as Article);
      setIsArticleModalOpen(false);
  };

  const handleSaveInventoryAsset = () => {
      if (!selectedClientForInventory) return;
      if (!newInventoryAsset.tipo) {
          alert("La descrizione/tipo è obbligatoria");
          return;
      }

      // Generate ID if missing (simple random for demo)
      const assetId = newInventoryAsset.id || `A-${Math.floor(Math.random() * 10000)}`;

      const assetToAdd: Asset = {
          id: assetId,
          clientId: selectedClientForInventory.id,
          tipo: newInventoryAsset.tipo || '',
          matricola: newInventoryAsset.matricola || '',
          ubicazione: newInventoryAsset.ubicazione || '',
          scadenza: newInventoryAsset.scadenza || new Date().toISOString().split('T')[0],
          categoria: newInventoryAsset.categoria || 'Generico',
          note: newInventoryAsset.note || ''
      };

      addAsset(assetToAdd);
      setNewInventoryAsset({ id: '', tipo: '', matricola: '', ubicazione: '', scadenza: '', categoria: '', note: '' });
      // Keep modal open to add more
  };

  const openSimpleModal = (type: 'service' | 'anomaly') => {
    setSimpleModalType(type);
    setNewItemName('');
    setIsSimpleModalOpen(true);
  };

  const handleSaveSimpleItem = () => {
    if (!newItemName.trim()) return;
    if (simpleModalType === 'service') {
      addService(newItemName);
    } else {
      addAnomaly(newItemName);
    }
    setIsSimpleModalOpen(false);
  };

  // --- CSV Import Logic ---
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleInventoryImportClick = () => {
      inventoryFileInputRef.current?.click();
  };

  const parseCSVPositional = (content: string) => {
    const text = content.replace(/^\uFEFF/, '').trim();
    const lines = text.replace(/\r/g, '').split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return [];
    
    // Rimuovi header se presente (euristica semplice)
    const firstLineLower = lines[0].toLowerCase();
    const hasHeader = firstLineLower.includes('nome') || firstLineLower.includes('ragione') || firstLineLower.includes('id') || firstLineLower.includes('codice') || firstLineLower.includes('tipologia');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    return dataLines.map(line => {
        // Prova punto e virgola, se fallisce prova virgola
        let values = line.split(';');
        if (values.length <= 1) { values = line.split(','); }
        return values.map(v => v.trim().replace(/^"|"$/g, ''));
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const text = event.target?.result as string;
        if (!text) return;
        try {
            const rows = parseCSVPositional(text);
            if (activeTab === 'clients') {
                const clientsToAdd = rows.map(cols => ({
                    nome: cols[0] || '', 
                    commessa: cols[1] || '', 
                    idCommessa: cols[2] || '', 
                    referente: cols[3] || '',
                    struttura: cols[4] || '', 
                    idStruttura: cols[5] || '', 
                    indirizzo: cols[6] || '', 
                    telefono: cols[7] || '',
                    email: cols[8] || '', 
                    note: cols[9] || ''
                })).filter(c => c.nome.length > 1);
                if (clientsToAdd.length > 0) addClientsBulk(clientsToAdd);
            } else if (activeTab === 'articles') {
                // Importazione Articoli (Catalogo)
                // A(0): Codice, B(1): Categoria, C(2): Descrizione, D(3): Note
                const articlesToAdd = rows.map(cols => ({
                    id: cols[0] || `IMP-${Math.floor(Math.random()*1000)}`,
                    categoria: cols[1] || 'Generico',
                    descrizione: cols[2] || 'Articolo Importato',
                    note: cols[3] || ''
                } as Article));
                if (articlesToAdd.length > 0) addArticlesBulk(articlesToAdd);
            }
        } catch (error) { console.error(error); alert("Errore durante l'importazione del CSV"); }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // Specific handler for Inventory CSV
  const handleInventoryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !selectedClientForInventory) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
          const text = event.target?.result as string;
          if (!text) return;
          try {
              const rows = parseCSVPositional(text);
              
              // Get current client assets to check for duplicates
              const currentClientAssets = assets.filter(a => a.clientId === selectedClientForInventory.id);
              const existingSerials = new Set(currentClientAssets.map(a => a.matricola.toLowerCase().trim()));

              // Schema Inventario:
              // A: Tipologia, B: Matricola, C: Ubicazione, D: Scadenza, E: Categoria, F: ID
              const assetsToAdd: Asset[] = [];
              let duplicatesCount = 0;

              rows.forEach(cols => {
                  const type = cols[0]?.trim();
                  const serial = cols[1]?.trim() || '';
                  
                  // Skip empty rows
                  if (!type || type.length < 2) return;

                  // Skip if matricola exists for this client (and is not empty)
                  if (serial && existingSerials.has(serial.toLowerCase())) {
                      duplicatesCount++;
                      return;
                  }

                  assetsToAdd.push({
                      clientId: selectedClientForInventory.id,
                      tipo: type,
                      matricola: serial,
                      ubicazione: cols[2]?.trim() || '',
                      scadenza: cols[3]?.trim() || new Date().toISOString().split('T')[0],
                      categoria: cols[4]?.trim() || 'Generico',
                      id: cols[5]?.trim() || `IMP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                      note: ''
                  });
              });

              if (assetsToAdd.length > 0) {
                  addAssetsBulk(assetsToAdd);
                  alert(`${assetsToAdd.length} presidi importati correttamente.\n${duplicatesCount > 0 ? `(Ignorati ${duplicatesCount} duplicati)` : ''}`);
              } else if (duplicatesCount > 0) {
                  alert(`Tutti i ${duplicatesCount} presidi trovati erano già presenti (duplicati di matricola).`);
              } else {
                  alert("Nessun dato valido trovato nel CSV.");
              }

          } catch (error) {
              console.error(error);
              alert("Errore durante l'importazione dell'inventario.");
          }
          if (inventoryFileInputRef.current) inventoryFileInputRef.current.value = '';
      };
      reader.readAsText(file);
  };

  const inputClass = "w-full p-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none";

  return (
    <div className="space-y-6">
       <div className="border-b border-gray-200 dark:border-slate-700 pb-4">
        <h2 className="text-2xl font-bold text-primary-700 dark:text-blue-400 flex items-center">
            <Database className="mr-3" /> Gestione Anagrafiche
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Configurazione Clienti, Articoli e Inventario.</p>
      </div>

      <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

      <div className="flex space-x-2 border-b border-gray-200 dark:border-slate-700 overflow-x-auto">
        {tabs.map((tab) => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
                    activeTab === tab.id 
                    ? 'border-primary-700 text-primary-700 dark:border-blue-400 dark:text-blue-400' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
                {tab.label}
            </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow min-h-[400px] p-6">
        
        {/* Clients Tab */}
        {activeTab === 'clients' && (
            <div className="space-y-4 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Elenco Clienti</h3>
                    <div className="flex gap-2">
                        <button onClick={handleImportClick} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium flex items-center transition-colors">
                            <Upload size={16} className="mr-2" /> Importa CSV
                        </button>
                        <button onClick={() => handleOpenClientModal()} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded text-sm font-medium flex items-center transition-colors">
                            <Plus size={16} className="mr-2" /> Nuovo Cliente
                        </button>
                    </div>
                </div>
                <div className="grid gap-4">
                  {clients.map(client => (
                      <div key={client.id} className="flex flex-col md:flex-row justify-between items-start p-4 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-900">
                          <div className="mb-4 md:mb-0 w-full md:w-2/3">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="font-bold text-primary-700 dark:text-blue-400 text-lg">{client.nome}</p>
                                <span className="bg-gray-200 dark:bg-slate-700 text-xs px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">ID: {client.id}</span>
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1 gap-x-4">
                                    <span className="col-span-2">📍 {client.indirizzo}</span>
                                    <span>👤 {client.referente}</span>
                                    <span>📞 {client.telefono}</span>
                                    {client.commessa && <span>📄 Comm: {client.commessa}</span>}
                                    {client.struttura && <span>🏢 Struttura: {client.struttura}</span>}
                                </div>
                                {client.note && <div className="mt-2 text-xs text-gray-500 italic border-t border-gray-200 dark:border-slate-700 pt-1">Note: {client.note}</div>}
                              </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto mt-2 md:mt-0">
                                <button 
                                    onClick={() => handleOpenInventoryModal(client)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center shadow-sm"
                                    title="Gestisci Inventario Presidi"
                                >
                                    <Package size={16} className="mr-2"/> Gestisci Presidi
                                </button>
                                <div className="flex gap-2">
                                    <button onClick={() => handleOpenClientModal(client)} className="p-2 border border-gray-300 dark:border-slate-600 text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 rounded bg-white dark:bg-slate-800" title="Modifica">
                                        <Edit size={18}/>
                                    </button>
                                    <button onClick={() => deleteClient(client.id)} className="p-2 border border-gray-300 dark:border-slate-600 text-red-500 hover:bg-red-50 dark:hover:bg-slate-800 rounded bg-white dark:bg-slate-800" title="Elimina">
                                        <Trash2 size={18}/>
                                    </button>
                                </div>
                          </div>
                      </div>
                  ))}
                </div>
            </div>
        )}

        {/* Articles Tab (Catalog) */}
        {activeTab === 'articles' && (
             <div className="space-y-4 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Catalogo Articoli</h3>
                    <div className="flex gap-2">
                        <button onClick={handleImportClick} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium flex items-center transition-colors">
                            <Upload size={16} className="mr-2" /> Importa CSV
                        </button>
                        <button onClick={handleOpenArticleModal} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded text-sm font-medium flex items-center transition-colors">
                            <Plus size={16} className="mr-2" /> Nuovo Articolo
                        </button>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
                     <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 text-sm">
                                <th className="p-3 border-b border-gray-200 dark:border-slate-600">Codice Articolo</th>
                                <th className="p-3 border-b border-gray-200 dark:border-slate-600">Categoria</th>
                                <th className="p-3 border-b border-gray-200 dark:border-slate-600">Descrizione</th>
                                <th className="p-3 border-b border-gray-200 dark:border-slate-600">Note</th>
                                <th className="p-3 border-b border-gray-200 dark:border-slate-600">Azioni</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {articles.map(art => (
                                <tr key={art.id} className="hover:bg-gray-50 dark:hover:bg-slate-900 border-b border-gray-100 dark:border-slate-700 last:border-0">
                                    <td className="p-3 font-mono text-blue-600 dark:text-blue-400">{art.id}</td>
                                    <td className="p-3">{art.categoria}</td>
                                    <td className="p-3 font-medium">{art.descrizione}</td>
                                    <td className="p-3 text-gray-500 dark:text-gray-400">{art.note || '-'}</td>
                                    <td className="p-3">
                                        <button onClick={() => deleteArticle(art.id)} className="text-red-500 hover:text-red-700" title="Elimina"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                            {articles.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-6 text-center text-gray-400 italic">Nessun articolo nel catalogo.</td>
                                </tr>
                            )}
                        </tbody>
                     </table>
                </div>
            </div>
        )}
        
        {/* Services & Anomalies Tabs */}
        {(activeTab === 'services' || activeTab === 'anomalies') && (
            <div className="space-y-4 animate-fade-in">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">{activeTab === 'services' ? 'Servizi' : 'Anomalie'}</h3>
                    <button onClick={() => openSimpleModal(activeTab === 'services' ? 'service' : 'anomaly')} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded text-sm font-medium flex items-center">
                        <Plus size={16} className="mr-2" /> Aggiungi
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(activeTab === 'services' ? services : anomalies).map((item, i) => (
                         <div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded">
                            <span className="text-gray-700 dark:text-gray-200">{item}</span>
                             <button onClick={() => activeTab === 'services' ? deleteService(item) : deleteAnomaly(item)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                         </div>
                    ))}
                </div>
            </div>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* Client Modal */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{editingClientId !== null ? 'Modifica Cliente' : 'Nuovo Cliente'}</h3>
                    <button onClick={() => setIsClientModalOpen(false)}><X size={20} className="text-gray-400"/></button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Ragione Sociale / Nome</label>
                        <input className={inputClass} value={newClient.nome || ''} onChange={(e) => setNewClient({...newClient, nome: e.target.value})} placeholder="Es. Azienda Rossi SRL" />
                    </div>
                    <div>
                         <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Commessa</label>
                         <input className={inputClass} value={newClient.commessa || ''} onChange={(e) => setNewClient({...newClient, commessa: e.target.value})} placeholder="Es. MAN-2024-001" />
                    </div>
                    <div>
                         <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Id Commessa / N. Contratto</label>
                         <input className={inputClass} value={newClient.idCommessa || ''} onChange={(e) => setNewClient({...newClient, idCommessa: e.target.value})} placeholder="Es. CNT-8821" />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                         <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Referente</label>
                         <input className={inputClass} value={newClient.referente || ''} onChange={(e) => setNewClient({...newClient, referente: e.target.value})} placeholder="Es. Mario Rossi" />
                    </div>
                    <div>
                         <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Struttura / Edificio</label>
                         <input className={inputClass} value={newClient.struttura || ''} onChange={(e) => setNewClient({...newClient, struttura: e.target.value})} placeholder="Es. Edificio Principale" />
                    </div>
                    <div>
                         <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Id Struttura</label>
                         <input className={inputClass} value={newClient.idStruttura || ''} onChange={(e) => setNewClient({...newClient, idStruttura: e.target.value})} placeholder="Es. ED-01" />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                         <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Indirizzo Completo</label>
                         <input className={inputClass} value={newClient.indirizzo || ''} onChange={(e) => setNewClient({...newClient, indirizzo: e.target.value})} placeholder="Es. Via Roma 10, Milano" />
                    </div>
                    <div>
                         <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Recapito Telefonico</label>
                         <input className={inputClass} value={newClient.telefono || ''} onChange={(e) => setNewClient({...newClient, telefono: e.target.value})} placeholder="Es. 02 12345678" />
                    </div>
                    <div>
                         <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Email</label>
                         <input className={inputClass} value={newClient.email || ''} onChange={(e) => setNewClient({...newClient, email: e.target.value})} placeholder="Es. info@azienda.it" />
                    </div>
                     <div className="col-span-1 md:col-span-2">
                         <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Note</label>
                         <textarea className={inputClass} rows={3} value={newClient.note || ''} onChange={(e) => setNewClient({...newClient, note: e.target.value})} placeholder="Note aggiuntive..." />
                    </div>
                </div>
                <button onClick={handleSaveClient} className="w-full mt-6 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg font-bold shadow-md transition-all">Salva Cliente</button>
            </div>
        </div>
      )}

      {/* Article Modal (NEW) */}
      {isArticleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Nuovo Articolo (Catalogo)</h3>
                    <button onClick={() => setIsArticleModalOpen(false)}><X size={20} className="text-gray-400"/></button>
                </div>
                <div className="space-y-4">
                     <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Codice Articolo (ID)</label>
                        <input className={inputClass} value={newArticle.id || ''} onChange={(e) => setNewArticle({...newArticle, id: e.target.value})} placeholder="Es. EST-006" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Categoria</label>
                        <input className={inputClass} value={newArticle.categoria || ''} onChange={(e) => setNewArticle({...newArticle, categoria: e.target.value})} placeholder="Es. Estintori" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Descrizione Articolo</label>
                        <input className={inputClass} value={newArticle.descrizione || ''} onChange={(e) => setNewArticle({...newArticle, descrizione: e.target.value})} placeholder="Es. Estintore Polvere 6kg" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Note</label>
                        <textarea className={inputClass} rows={2} value={newArticle.note || ''} onChange={(e) => setNewArticle({...newArticle, note: e.target.value})} placeholder="Note..." />
                    </div>
                    <button onClick={handleSaveArticle} className="w-full mt-2 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg font-bold shadow-md transition-all">Salva Articolo</button>
                </div>
            </div>
          </div>
      )}

      {/* Inventory Management Modal */}
      {isInventoryModalOpen && selectedClientForInventory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Gestione Inventario</h3>
                        <p className="text-sm text-primary-600 dark:text-blue-400 font-medium">
                            {selectedClientForInventory.nome} 
                            <span className="text-gray-500 dark:text-gray-400 font-normal ml-2">
                                - {selectedClientForInventory.indirizzo}
                            </span>
                        </p>
                    </div>
                    <div className="flex gap-2 items-center">
                        <input type="file" accept=".csv" ref={inventoryFileInputRef} onChange={handleInventoryFileChange} className="hidden" />
                        <button onClick={handleInventoryImportClick} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium flex items-center transition-colors">
                            <Upload size={14} className="mr-2" /> Importa CSV
                        </button>
                        <button onClick={() => setIsInventoryModalOpen(false)} className="text-gray-400 hover:text-red-500 ml-2"><X size={24}/></button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Add New Asset Form */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 mb-6">
                        <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-3 flex items-center"><Plus size={16} className="mr-2"/> Aggiungi Nuovo Presidio</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input 
                                className="p-2 border rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm" 
                                placeholder="Tipologia (es. Estintore 6kg)" 
                                value={newInventoryAsset.tipo || ''}
                                onChange={(e) => setNewInventoryAsset({...newInventoryAsset, tipo: e.target.value})}
                            />
                            <input 
                                className="p-2 border rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm" 
                                placeholder="Matricola / Seriale" 
                                value={newInventoryAsset.matricola || ''}
                                onChange={(e) => setNewInventoryAsset({...newInventoryAsset, matricola: e.target.value})}
                            />
                            <input 
                                className="p-2 border rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm" 
                                placeholder="Ubicazione (es. Piano Terra)" 
                                value={newInventoryAsset.ubicazione || ''}
                                onChange={(e) => setNewInventoryAsset({...newInventoryAsset, ubicazione: e.target.value})}
                            />
                            <input 
                                className="p-2 border rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm" 
                                placeholder="Codice ID Interno (Opz.)" 
                                value={newInventoryAsset.id || ''}
                                onChange={(e) => setNewInventoryAsset({...newInventoryAsset, id: e.target.value})}
                            />
                            <input 
                                type="date"
                                className={`p-2 border rounded bg-white dark:bg-slate-700 text-sm ${!newInventoryAsset.scadenza ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}
                                value={newInventoryAsset.scadenza || ''}
                                onChange={(e) => setNewInventoryAsset({...newInventoryAsset, scadenza: e.target.value})}
                            />
                             <button 
                                onClick={handleSaveInventoryAsset}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded font-bold text-sm flex items-center justify-center"
                            >
                                <Save size={16} className="mr-1"/> Aggiungi
                            </button>
                        </div>
                    </div>

                    {/* Inventory List */}
                    <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-3">Presidi Installati</h4>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-xs uppercase">
                                <th className="p-3 border-b dark:border-slate-600">ID / Matricola</th>
                                <th className="p-3 border-b dark:border-slate-600">Descrizione</th>
                                <th className="p-3 border-b dark:border-slate-600">Ubicazione</th>
                                <th className="p-3 border-b dark:border-slate-600">Scadenza</th>
                                <th className="p-3 border-b dark:border-slate-600">Azioni</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {assets.filter(a => a.clientId === selectedClientForInventory.id).map(asset => (
                                <tr key={asset.id} className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800">
                                    <td className="p-3">
                                        <div className="font-bold text-gray-700 dark:text-gray-200">{asset.id}</div>
                                        <div className="text-xs text-gray-500 font-mono">{asset.matricola}</div>
                                    </td>
                                    <td className="p-3">{asset.tipo}</td>
                                    <td className="p-3 flex items-center text-gray-600 dark:text-gray-400">
                                        <MapPin size={12} className="mr-1"/> {asset.ubicazione || '-'}
                                    </td>
                                    <td className="p-3">{new Date(asset.scadenza).toLocaleDateString()}</td>
                                    <td className="p-3">
                                        <button onClick={() => deleteAsset(asset.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                            {assets.filter(a => a.clientId === selectedClientForInventory.id).length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-6 text-center text-gray-400 italic">Nessun presidio registrato per questo cliente.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
      )}

      {/* Simple Modal (Service/Anomaly) */}
      {isSimpleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{simpleModalType === 'service' ? 'Nuovo Servizio' : 'Nuova Anomalia'}</h3>
                    <button onClick={() => setIsSimpleModalOpen(false)}><X size={20} className="text-gray-400"/></button>
                </div>
                <div className="space-y-3">
                    <input className="input-field w-full p-2 border rounded bg-white dark:bg-slate-700" placeholder="Descrizione" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} />
                    <button onClick={handleSaveSimpleItem} className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded font-bold">Aggiungi</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default Anagraphics;
