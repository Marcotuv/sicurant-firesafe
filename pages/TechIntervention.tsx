
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { CheckCircle, AlertTriangle, FileText, Wrench, Save, X, MapPin, Hash, Search, PenTool, ClipboardCheck, Eraser, FileCheck, ArrowLeft, Download, RefreshCw, Filter, Tag, Layers, Play, ChevronDown, User, UploadCloud } from 'lucide-react';
import { Asset, Intervention, Client } from '../types';

// Simple Signature Pad Component
const SignaturePad: React.FC<{
    onEnd: (dataUrl: string) => void;
    onClear: () => void;
    label: string;
}> = ({ onEnd, onClear, label }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Handle resizing - simple fix for blurriness
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
    }, []);

    const getPos = (event: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        
        let clientX, clientY;
        if ('touches' in event) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            clientX = (event as React.MouseEvent).clientX;
            clientY = (event as React.MouseEvent).clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault(); 
        setIsDrawing(true);
        const pos = getPos(e);
        const ctx = canvasRef.current?.getContext('2d');
        ctx?.beginPath();
        ctx?.moveTo(pos.x, pos.y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault(); 
        if (!isDrawing) return;
        const pos = getPos(e);
        const ctx = canvasRef.current?.getContext('2d');
        ctx?.lineTo(pos.x, pos.y);
        ctx?.stroke();
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            if (canvasRef.current) {
                onEnd(canvasRef.current.toDataURL());
            }
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            onClear();
        }
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase block">{label}</span>
                <button onClick={clearCanvas} className="text-xs text-red-500 flex items-center hover:underline">
                    <Eraser size={12} className="mr-1"/> Cancella
                </button>
            </div>
            <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded bg-white touch-none">
                <canvas 
                    ref={canvasRef}
                    className="w-full h-32 block"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
            </div>
        </div>
    );
};

const TechIntervention: React.FC = () => {
  const { 
      clients, assets, services, anomalies, 
      createSession, getOpenSession, updateSession, saveInterventionToSession, closeSession, sessions,
      interventions, addNotification, exportData, syncData, downloadCloudData, remoteUrl
  } = useData();
  const navigate = useNavigate();
  
  const [selectedClientId, setSelectedClientId] = useState<number | string>("");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Client Search State (Autocomplete)
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  
  // Data from Active Session
  const [sessionInterventionIds, setSessionInterventionIds] = useState<string[]>([]);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterLocation, setFilterLocation] = useState<string>("All");

  // Global Session State (Step 3) - Local State sync with Context
  const [generalNotes, setGeneralNotes] = useState("");
  const [technicianSignature, setTechnicianSignature] = useState("");
  const [clientSignature, setClientSignature] = useState("");
  
  const [techSigImage, setTechSigImage] = useState<string>("");
  const [clientSigImage, setClientSigImage] = useState<string>("");

  // Single Intervention Form State
  const [checkedServices, setCheckedServices] = useState<string[]>([]);
  const [checkedAnomalies, setCheckedAnomalies] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  // Load Session Data when Client Changes
  const handleSelectClient = (client: Client) => {
    const cid = client.id;
    setSelectedClientId(cid);
    setClientSearchTerm(client.nome); // Set input to selected name
    setIsClientDropdownOpen(false); // Close dropdown

    // Reset View State
    setSelectedAsset(null);
    setIsSessionComplete(false);
    setIsDraftSaved(false);
    
    // Reset Filters
    setSearchTerm("");
    setFilterCategory("All");
    setFilterLocation("All");

    if (cid) {
        // Init or Load Session
        const session = createSession(cid); // Will return existing if open
        setGeneralNotes(session.generalNotes || "");
        setTechnicianSignature(session.technicianSignature || "");
        setClientSignature(session.clientSignature || "");
        setTechSigImage(session.technicianSignatureImage || "");
        setClientSigImage(session.clientSignatureImage || "");
        setSessionInterventionIds(session.interventionIds || []);
    }
  };

  const openInterventionModal = (asset: Asset) => {
    setSelectedAsset(asset);
    
    // Check if we already have a draft for this asset in the session
    const session = getOpenSession(Number(selectedClientId));
    const existing = session?.draftInterventions.find(i => i.assetId === asset.id);

    if (existing) {
        setCheckedServices(existing.services);
        setCheckedAnomalies(existing.anomalies);
        setNotes(existing.notes);
    } else {
        setCheckedServices([]);
        setCheckedAnomalies([]);
        setNotes("");
    }
    
    setIsModalOpen(true);
  };

  const toggleService = (service: string) => {
    setCheckedServices(prev => 
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
  };

  const toggleAnomaly = (anomaly: string) => {
    setCheckedAnomalies(prev => 
      prev.includes(anomaly) ? prev.filter(a => a !== anomaly) : [...prev, anomaly]
    );
  };

  const handleSaveAssetIntervention = () => {
    if (!selectedAsset) return;

    const client = clients.find(c => c.id === Number(selectedClientId));
    
    // Generate ID or keep existing if editing? For now create new/overwrite
    // We should try to keep consistent ID if editing in same session
    const session = getOpenSession(Number(selectedClientId));
    const existing = session?.draftInterventions.find(i => i.assetId === selectedAsset.id);
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
      // Metadata (notes/signatures) are applied at COMMIT time
    };

    saveInterventionToSession(Number(selectedClientId), newIntervention);
    
    // Update local list tracking
    if (!sessionInterventionIds.includes(id)) {
        setSessionInterventionIds(prev => [...prev, id]);
    }

    setIsModalOpen(false);
  };
  
  const handlePartialSave = async () => {
      if (!selectedClientId) return;

      // Sync local metadata to session
      updateSession(Number(selectedClientId), {
          generalNotes,
          technicianSignature,
          clientSignature,
          technicianSignatureImage: techSigImage,
          clientSignatureImage: clientSigImage
      });

      if (remoteUrl) {
          setIsSyncing(true);
          await syncData();
          setIsSyncing(false);
      } else {
          // Fallback manual download
          setTimeout(() => {
            exportData();
          }, 500);
      }

      addNotification({
          title: "Sessione Salvata",
          message: remoteUrl ? "Backup sincronizzato con il server." : "Il file di backup è stato scaricato.",
          type: "success"
      });
      
      setIsDraftSaved(true);
      window.scrollTo(0, 0);
  };

  const handleGlobalSave = async () => {
      if (sessionInterventionIds.length === 0) {
          alert("Nessun presidio lavorato. Esegui almeno un intervento prima di concludere.");
          return;
      }
      
      setIsSyncing(true);

      // Update metadata one last time
      updateSession(Number(selectedClientId), {
          generalNotes,
          technicianSignature,
          clientSignature,
          technicianSignatureImage: techSigImage,
          clientSignatureImage: clientSigImage
      });
      
      // Commit logic
      closeSession(Number(selectedClientId));

      // Attempt Remote Sync if URL is present
      let syncResult = { success: false };
      if (remoteUrl) {
          syncResult = await syncData();
      }

      // If sync failed or no URL, download file
      if (!remoteUrl || !syncResult.success) {
          setTimeout(() => {
             exportData();
          }, 500);
      }
      
      setIsSyncing(false);
      setIsSessionComplete(true);
      window.scrollTo(0, 0);
  };
  
  const handleRefreshCloud = async () => {
      setIsDownloading(true);
      await downloadCloudData();
      setIsDownloading(false);
      addNotification({ title: "Dati Aggiornati", message: "Ultime modifiche scaricate dal cloud.", type: "success" });
  }

  const generatePDFReport = () => {
      const element = document.getElementById('session-report-container');
      const client = clients.find(c => c.id === Number(selectedClientId));
      
      if (!element || !client) return;

      const opt = {
        margin: 10,
        filename: `Rapporto_Intervento_${client.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // @ts-ignore
      if (window.html2pdf) {
          // @ts-ignore
          window.html2pdf().set(opt).from(element).save();
      } else {
          alert("Errore: Libreria PDF non caricata.");
      }
  };

  const handleReset = () => {
      setSelectedClientId("");
      setClientSearchTerm("");
      setIsSessionComplete(false);
      setIsDraftSaved(false);
      setSessionInterventionIds([]);
  };

  // --- DATA COMPUTATION FOR FILTERS ---
  const allClientAssets = selectedClientId 
    ? assets.filter(a => a.clientId === Number(selectedClientId))
    : [];
  
  const categories = useMemo(() => Array.from(new Set(allClientAssets.map(a => a.categoria || 'Altro'))).sort(), [allClientAssets]);
  const locations = useMemo(() => Array.from(new Set(allClientAssets.map(a => a.ubicazione ? a.ubicazione.split('-')[0].trim() : 'Generico'))).sort(), [allClientAssets]);

  const filteredAssets = allClientAssets.filter(asset => {
      const matchesSearch = searchTerm === "" || 
          asset.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          asset.matricola?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          asset.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === "All" || asset.categoria === filterCategory;
      const matchesLocation = filterLocation === "All" || (asset.ubicazione && asset.ubicazione.startsWith(filterLocation));

      return matchesSearch && matchesCategory && matchesLocation;
  });

  // Calculate Progress
  const session = selectedClientId ? getOpenSession(Number(selectedClientId)) : undefined;
  
  // Logic Fix: Consider done if in current local session OR in global interventions list for this client
  const draftAssetIds = session ? session.draftInterventions.map(i => i.assetId) : [];
  
  // Get globally completed interventions (e.g. from other devices)
  const globalCompletedAssetIds = selectedClientId 
    ? interventions.filter(i => i.clientId === Number(selectedClientId)).map(i => i.assetId)
    : [];

  const allCompletedIds = [...new Set([...draftAssetIds, ...globalCompletedAssetIds])];

  const completedInView = filteredAssets.filter(a => allCompletedIds.includes(a.id)).length;
  const progressPercentage = filteredAssets.length > 0 ? Math.round((completedInView / filteredAssets.length) * 100) : 0;

  // For Report
  const sessionInterventions = session ? session.draftInterventions : [];

  // Helper for Dropdown Options
  const isCompletedToday = (cid: number) => {
      const today = new Date().toDateString();
      return sessions.some(s => s.clientId === cid && s.status === 'CLOSED' && new Date(s.startTimestamp).toDateString() === today);
  };
  
  const isInProgress = (cid: number) => {
      return sessions.some(s => s.clientId === cid && s.status === 'OPEN');
  };

  // Filter Clients for Autocomplete
  const filteredClients = useMemo(() => {
      if (!clientSearchTerm && !isClientDropdownOpen) return [];
      return clients.filter(c => 
          c.nome.toLowerCase().includes(clientSearchTerm.toLowerCase()) || 
          c.indirizzo.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
          c.commessa?.toLowerCase().includes(clientSearchTerm.toLowerCase())
      ).slice(0, 50); // Limit results for performance
  }, [clientSearchTerm, clients, isClientDropdownOpen]);

  // --- DRAFT SAVED VIEW ---
  if (isDraftSaved) {
    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in py-10">
            <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 p-8 rounded-lg shadow-sm text-center">
                <div className="mx-auto bg-orange-100 dark:bg-orange-800 w-20 h-20 rounded-full flex items-center justify-center mb-4">
                    <Save className="text-orange-600 dark:text-orange-200" size={40} />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Salvataggio Effettuato</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-lg mx-auto">
                    La sessione è stata salvata.
                    {remoteUrl 
                        ? " Il backup è stato inviato al server centrale con successo."
                        : " Il file di backup è stato scaricato sul dispositivo per l'invio manuale."
                    }
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button onClick={() => navigate('/')} className="bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 px-6 py-3 rounded-lg font-medium flex items-center justify-center transition-colors">
                        <ArrowLeft size={20} className="mr-2" /> Torna alla Dashboard
                    </button>
                    <button onClick={() => setIsDraftSaved(false)} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center">
                        <Play size={20} className="mr-2" /> Continua a Lavorare
                    </button>
                </div>
            </div>
        </div>
    );
  }

  // --- COMPLETED SESSION VIEW ---
  if (isSessionComplete) {
      const client = clients.find(c => c.id === Number(selectedClientId));
      return (
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
              <div className="bg-emerald-5 dark:bg-emerald-900/20 border-l-4 border-emerald-500 p-6 rounded-lg shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center">
                      <FileCheck className="text-emerald-500 mr-4" size={48} />
                      <div>
                          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Intervento Completato!</h2>
                          <p className="text-gray-600 dark:text-gray-300">
                             {remoteUrl 
                                ? "I dati sono stati inviati al server aziendale." 
                                : "Il file di Backup è stato scaricato."}
                          </p>
                      </div>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={() => navigate('/')} className="bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg font-medium flex items-center transition-colors">
                          <ArrowLeft size={18} className="mr-2" /> Torna alla Dashboard
                      </button>
                      <button onClick={handleReset} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors">
                          <RefreshCw size={18} className="mr-2" /> Nuovo Intervento
                      </button>
                  </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                  <div className="p-4 bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                      <h3 className="font-bold text-gray-700 dark:text-gray-200">Anteprima Rapporto</h3>
                      <button onClick={generatePDFReport} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-bold shadow-md hover:shadow-lg transition-all flex items-center">
                          <Download size={20} className="mr-2" /> SCARICA PDF
                      </button>
                  </div>
                  <div id="session-report-container" className="p-8 bg-white text-gray-900">
                      <div className="flex justify-between items-start border-b-2 border-red-600 pb-4 mb-6">
                          <div><h1 className="text-2xl font-bold text-gray-900">RAPPORTO INTERVENTO</h1><p className="text-sm text-gray-500">Sicur. Ant Antincendio</p></div>
                          <div className="text-right"><p className="font-bold">{client?.nome}</p><p className="text-sm">{client?.indirizzo}</p><p className="text-sm mt-2">Data: {new Date().toLocaleDateString()}</p></div>
                      </div>
                      <div className="mb-6">
                          <h4 className="font-bold border-b border-gray-300 mb-2 pb-1 text-sm uppercase">Riepilogo Attività</h4>
                          <table className="w-full text-sm text-left">
                              <thead><tr className="bg-gray-100"><th className="p-2">Asset / Matricola</th><th className="p-2">Lavorazioni</th><th className="p-2">Anomalie</th></tr></thead>
                              <tbody>
                                  {sessionInterventions.map((int, idx) => (
                                      <tr key={idx} className="border-b border-gray-200">
                                          <td className="p-2 align-top"><div className="font-bold">{int.assetName}</div><div className="text-xs text-gray-500">{int.assetId}</div></td>
                                          <td className="p-2 align-top text-xs text-gray-600">{int.services.join(', ')}</td>
                                          <td className="p-2 align-top text-xs text-red-600 font-semibold">{int.anomalies.join(', ')}</td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                      <div className="mb-6">
                          <h4 className="font-bold border-b border-gray-300 mb-2 pb-1 text-sm uppercase">Note Generali</h4>
                          <p className="text-sm bg-gray-50 p-3 rounded border border-gray-200 italic">{generalNotes || "Nessuna nota generale."}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-8 mt-12">
                          <div className="text-center"><p className="text-xs font-bold uppercase mb-2">Firma Tecnico</p>{techSigImage ? <img src={techSigImage} className="h-16 mx-auto object-contain" /> : <div className="h-16 flex items-end justify-center pb-2 border-b border-gray-300 italic">{technicianSignature}</div>}</div>
                          <div className="text-center"><p className="text-xs font-bold uppercase mb-2">Firma Cliente</p>{clientSigImage ? <img src={clientSigImage} className="h-16 mx-auto object-contain" /> : <div className="h-16 flex items-end justify-center pb-2 border-b border-gray-300 italic">{clientSignature}</div>}</div>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // --- WORK IN PROGRESS VIEW ---
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-slate-700 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 flex items-center"><Wrench className="mr-3" /> Gestione Intervento sul Campo</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Compila le firme, esegui i lavori e salva il report completo.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleRefreshCloud} 
                disabled={isDownloading}
                className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded flex items-center transition-colors disabled:opacity-50"
            >
                <RefreshCw size={16} className={`mr-1 ${isDownloading ? 'animate-spin' : ''}`}/> {isDownloading ? 'Aggiornamento...' : 'Aggiorna Dati'}
            </button>
            {selectedClientId && (
                <button onClick={handleReset} className="text-sm text-gray-500 hover:text-red-500 flex items-center px-2">
                    <X size={16} className="mr-1"/> Annulla
                </button>
            )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border-l-4 border-primary-700 dark:border-blue-500 relative z-20">
            <h3 className="text-lg font-bold text-primary-700 dark:text-blue-400 mb-4">1. Seleziona Cliente/Impianto</h3>
            
            {/* Custom Autocomplete Search */}
            <div className="relative">
                <div className="relative">
                     <Search className="absolute left-4 top-4 text-gray-400" size={20}/>
                     <input 
                        type="text"
                        className="w-full p-4 pl-12 pr-10 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none text-lg shadow-sm"
                        placeholder="Cerca cliente, indirizzo o commessa..."
                        value={clientSearchTerm}
                        onChange={(e) => {
                            setClientSearchTerm(e.target.value);
                            setIsClientDropdownOpen(true);
                            if(e.target.value === "") {
                                setSelectedClientId("");
                            }
                        }}
                        onFocus={() => setIsClientDropdownOpen(true)}
                     />
                     {clientSearchTerm && (
                        <button 
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                            onClick={() => {
                                setClientSearchTerm("");
                                setSelectedClientId("");
                                setIsClientDropdownOpen(true);
                            }}
                        >
                            <X size={20} />
                        </button>
                     )}
                </div>

                {/* Dropdown Results */}
                {isClientDropdownOpen && (
                    <ul className="absolute z-50 w-full bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md shadow-xl mt-1 max-h-80 overflow-y-auto">
                        {filteredClients.length > 0 ? (
                            filteredClients.map(c => {
                                const done = isCompletedToday(c.id);
                                const wip = isInProgress(c.id);
                                return (
                                    <li 
                                        key={c.id}
                                        onClick={() => {
                                            if (!done) handleSelectClient(c);
                                        }}
                                        className={`p-4 border-b border-gray-100 dark:border-slate-600 last:border-0 cursor-pointer flex justify-between items-center transition-colors ${
                                            done ? 'bg-green-50 dark:bg-green-900/10 cursor-not-allowed opacity-70' : 
                                            wip ? 'bg-orange-50 dark:bg-orange-900/10 hover:bg-orange-100 dark:hover:bg-orange-900/20' : 
                                            'hover:bg-gray-50 dark:hover:bg-slate-600'
                                        }`}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                                {c.nome}
                                                {wip && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full flex items-center"><Play size={10} className="mr-1"/> In Corso</span>}
                                                {done && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center"><CheckCircle size={10} className="mr-1"/> Completato</span>}
                                            </span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                                                <MapPin size={12} className="mr-1"/> {c.indirizzo}
                                            </span>
                                            {c.commessa && <span className="text-xs text-gray-400 mt-0.5">Comm: {c.commessa}</span>}
                                        </div>
                                        {done ? (
                                             <span className="text-green-600"><CheckCircle size={20} /></span>
                                        ) : (
                                            <span className="text-gray-300"><ChevronDown size={20} className="-rotate-90"/></span>
                                        )}
                                    </li>
                                );
                            })
                        ) : (
                            <li className="p-6 text-center text-gray-500 dark:text-gray-400 italic">
                                {clientSearchTerm ? "Nessun cliente trovato." : "Inizia a digitare per cercare..."}
                            </li>
                        )}
                    </ul>
                )}
            </div>

            {selectedClientId && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-md flex items-start">
                    <User size={18} className="text-blue-500 mt-0.5 mr-2" />
                    <div>
                        <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">Note Cliente:</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{clients.find(c => c.id === Number(selectedClientId))?.note || "Nessuna nota specifica."}</p>
                    </div>
                </div>
            )}
        </div>

        {selectedClientId && (
            <>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border-l-4 border-primary-700 dark:border-blue-500 animate-fade-in-up relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-primary-700 dark:text-blue-400">2. Presidi Installati</h3>
                        <p className="text-sm text-gray-500">Totale: {allClientAssets.length} | Filtrati: {filteredAssets.length}</p>
                    </div>
                    <div className="w-full md:w-1/3">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="font-semibold text-gray-600 dark:text-gray-300">Avanzamento (Vista Corrente)</span>
                            <span className="font-bold text-primary-600">{progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5">
                            <div className="bg-primary-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-700 mb-6 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <input type="text" placeholder="Cerca matricola o tipo..." className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-sm outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                    </div>
                    <div className="w-full md:w-1/4 relative">
                        <select className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-sm outline-none appearance-none" value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)}>
                            <option value="All">Tutte le Zone</option>
                            {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                        </select>
                        <MapPin className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                    </div>
                    <div className="w-full md:w-1/4 relative">
                        <select className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-sm outline-none appearance-none" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                            <option value="All">Tutte le Categorie</option>
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        <Tag className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                    </div>
                </div>
                
                {filteredAssets.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-lg">
                        <p className="text-lg font-medium">Nessun presidio trovato.</p>
                        <button onClick={() => {setSearchTerm(""); setFilterCategory("All"); setFilterLocation("All")}} className="mt-2 text-primary-600 hover:underline">Resetta Filtri</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                        {filteredAssets.map(asset => {
                            const isDone = allCompletedIds.includes(asset.id);
                            return (
                                <div key={asset.id} className={`flex flex-col md:flex-row justify-between items-center p-3 border rounded-lg shadow-sm transition-all ${isDone ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-l-green-500 border-y-green-200 border-r-green-200 dark:border-green-800' : 'bg-white dark:bg-slate-900 border-l-4 border-l-gray-300 border-y-gray-200 border-r-gray-200 dark:border-slate-700 hover:border-l-primary-500'}`}>
                                    <div className="flex-1 w-full md:w-auto mb-2 md:mb-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="font-bold text-gray-800 dark:text-gray-100">{asset.tipo}</div>
                                            {isDone && <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded flex items-center"><CheckCircle size={12} className="mr-1"/> COMPLETATO</span>}
                                            <span className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-500 px-2 py-0.5 rounded border border-gray-200 dark:border-slate-700">{asset.categoria}</span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:gap-6 text-sm text-gray-600 dark:text-gray-400">
                                            <span className="flex items-center"><Hash size={12} className="mr-1 text-primary-500"/> Matr: {asset.matricola || 'N/D'}</span>
                                            <span className="flex items-center"><MapPin size={12} className="mr-1 text-primary-500"/> <strong>{asset.ubicazione || 'Non specificata'}</strong></span>
                                        </div>
                                    </div>
                                    <button onClick={() => openInterventionModal(asset)} className={`w-full md:w-auto px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center justify-center shadow ${isDone ? 'bg-white border border-green-500 text-green-700 hover:bg-green-50' : 'bg-primary-600 hover:bg-primary-700 text-white'}`}>
                                        <Wrench size={16} className="mr-2"/> {isDone ? 'Modifica / Rivedi' : 'Esegui'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border-l-4 border-green-500 animate-fade-in-up">
                 <h3 className="text-lg font-bold text-primary-700 dark:text-blue-400 mb-4 flex items-center">3. Conclusione Intervento (Dati Comuni)</h3>
                 <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Note Generali</label>
                        <textarea key={selectedClientId} className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-900 text-sm outline-none" rows={3} placeholder="Es. Accesso effettuato con portiere..." value={generalNotes} onChange={(e) => setGeneralNotes(e.target.value)}></textarea>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div key={`tech-${selectedClientId}`} className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-900">
                             <div className="flex items-center mb-4 text-primary-600 dark:text-blue-400 font-semibold border-b pb-2"><PenTool size={18} className="mr-2" /> Firma Tecnico</div>
                             <input type="text" placeholder="Nome Leggibile" className="w-full p-2 border rounded bg-white dark:bg-slate-800 text-sm mb-4" value={technicianSignature} onChange={(e) => setTechnicianSignature(e.target.value)} />
                             {techSigImage ? (
                                <div className="relative border-2 border-green-500 bg-white rounded p-2">
                                    <img src={techSigImage} className="h-24 mx-auto" alt="Firma salvata"/>
                                    <button onClick={() => setTechSigImage("")} className="absolute top-2 right-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200">Modifica</button>
                                    <div className="text-center text-xs text-green-600 font-bold mt-1">Firma Salvata</div>
                                </div>
                             ) : (
                                <SignaturePad label="Firma" onEnd={setTechSigImage} onClear={() => setTechSigImage("")} />
                             )}
                        </div>
                        <div key={`client-${selectedClientId}`} className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-900">
                             <div className="flex items-center mb-4 text-primary-600 dark:text-blue-400 font-semibold border-b pb-2"><ClipboardCheck size={18} className="mr-2" /> Firma Cliente</div>
                             <input type="text" placeholder="Nome Leggibile" className="w-full p-2 border rounded bg-white dark:bg-slate-800 text-sm mb-4" value={clientSignature} onChange={(e) => setClientSignature(e.target.value)} />
                             {clientSigImage ? (
                                <div className="relative border-2 border-green-500 bg-white rounded p-2">
                                    <img src={clientSigImage} className="h-24 mx-auto" alt="Firma salvata"/>
                                    <button onClick={() => setClientSigImage("")} className="absolute top-2 right-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200">Modifica</button>
                                    <div className="text-center text-xs text-green-600 font-bold mt-1">Firma Salvata</div>
                                </div>
                             ) : (
                                <SignaturePad label="Firma" onEnd={setClientSigImage} onClear={() => setClientSigImage("")} />
                             )}
                        </div>
                     </div>
                 </div>
             </div>
        
             <div className="flex flex-col md:flex-row justify-end gap-4 pt-4 pb-12">
                 <button onClick={handlePartialSave} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg flex items-center justify-center text-lg">
                    <Save size={24} className="mr-2" /> SALVA PARZIALMENTE
                 </button>
                 <button 
                    onClick={handleGlobalSave} 
                    disabled={isSyncing}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg flex items-center justify-center text-lg disabled:opacity-70 disabled:cursor-not-allowed"
                 >
                    {isSyncing ? (
                         <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                            SINCRONIZZAZIONE...
                         </>
                    ) : (
                         <>
                            {remoteUrl ? <UploadCloud size={24} className="mr-2"/> : <CheckCircle size={24} className="mr-2" />}
                            {remoteUrl ? "CHIUDI E SINCRONIZZA" : "CHIUDI INTERVENTO"}
                         </>
                    )}
                 </button>
             </div>
             </>
        )}
      </div>

      {isModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col">
                <div className="flex justify-between items-center p-5 border-b bg-gray-50 dark:bg-slate-900">
                    <div><h3 className="text-xl font-bold">{selectedAsset.tipo}</h3><p className="text-sm text-gray-500">{selectedAsset.matricola}</p></div>
                    <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-gray-400"/></button>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <h4 className="text-blue-600 font-semibold mb-3 flex items-center"><CheckCircle size={18} className="mr-2" /> Lavorazioni</h4>
                        <div className="space-y-2">{services.map((svc, idx) => (
                            <label key={idx} className="flex items-center p-3 bg-blue-50 border border-blue-100 rounded-lg cursor-pointer"><input type="checkbox" className="w-5 h-5 text-blue-600" checked={checkedServices.includes(svc)} onChange={() => toggleService(svc)}/><span className="ml-3 text-sm">{svc}</span></label>
                        ))}</div>
                    </div>
                    <div>
                        <h4 className="text-red-600 font-semibold mb-3 flex items-center"><AlertTriangle size={18} className="mr-2" /> Anomalie</h4>
                        <div className="space-y-2">{anomalies.map((anom, idx) => (
                            <label key={idx} className="flex items-center p-3 bg-red-50 border border-red-100 rounded-lg cursor-pointer"><input type="checkbox" className="w-5 h-5 text-red-600" checked={checkedAnomalies.includes(anom)} onChange={() => toggleAnomaly(anom)}/><span className="ml-3 text-sm">{anom}</span></label>
                        ))}</div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-3 flex items-center"><FileText size={18} className="mr-2" /> Note Presidio</h4>
                        <textarea className="w-full p-3 border rounded-md text-sm outline-none" rows={3} placeholder="Note..." value={notes} onChange={(e) => setNotes(e.target.value)}></textarea>
                    </div>
                </div>
                <div className="p-5 border-t bg-gray-50"><button onClick={handleSaveAssetIntervention} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-lg flex justify-center items-center"><Save className="mr-2" /> CONFERMA PRESIDIO</button></div>
            </div>
        </div>
      )}
    </div>
  );
};

export default TechIntervention;
