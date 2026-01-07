
import React, { useState } from 'react';
import { FileText, Download, Search, Shield, Users, BookOpen, AlertCircle, HardHat, Truck, Send, X, CheckCircle, ExternalLink, Bookmark } from 'lucide-react';
import { useData } from '../context/DataContext';

const Documents: React.FC = () => {
  const { addNotification } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeModal, setActiveModal] = useState<'none' | 'dpi' | 'vehicle'>('none');

  // Form States - DPI
  const [dpiAction, setDpiAction] = useState('richiesta'); // richiesta | consegna
  const [dpiItem, setDpiItem] = useState('');
  const [dpiSize, setDpiSize] = useState('');
  const [dpiNotes, setDpiNotes] = useState('');

  // Form States - Vehicle
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleKm, setVehicleKm] = useState('');
  const [vehicleIssue, setVehicleIssue] = useState('');

  const docs = [
    { id: 1, title: "Linee guida aziendali Sicurant", category: "HR", type: "PDF", size: "2.4 MB", date: "10/01/2025", icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { id: 2, title: "Procedura Sicurezza Cantieri (POS)", category: "Sicurezza", type: "PDF", size: "5.1 MB", date: "15/02/2025", icon: Shield, color: "text-red-600", bg: "bg-red-100" },
    { id: 3, title: "Guida DPI III Categoria", category: "Sicurezza", type: "PDF", size: "1.8 MB", date: "02/01/2025", icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-100" },
    { id: 4, title: "Modulo Rimborso Spese", category: "Amministrazione", type: "XLSX", size: "450 KB", date: "01/01/2025", icon: FileText, color: "text-green-600", bg: "bg-green-100" },
    { id: 5, title: "Manuale Tecnico Estintori UNI 9994", category: "Tecnico", type: "PDF", size: "12 MB", date: "20/11/2024", icon: BookOpen, color: "text-purple-600", bg: "bg-purple-100" },
  ];

  // NORMATIVE DATA (Aggiornato)
  const regulations = [
      {
          category: "Generale",
          title: "D.M. 1 Settembre 2021 (Decreto Controlli)",
          desc: "Criteri generali per il controllo e la manutenzione degli impianti, attrezzature ed altri sistemi di sicurezza antincendio.",
          url: "https://www.gazzettaufficiale.it/eli/id/2021/09/25/21A05589/sg",
          color: "border-l-indigo-500"
      },
      {
          category: "Generale",
          title: "D.M. 3 Agosto 2015 (Codice Prevenzione Incendi)",
          desc: "Approvazione norme tecniche di prevenzione incendi.",
          url: "https://www.gazzettaufficiale.it/eli/id/2015/08/20/15A06189/sg",
          color: "border-l-indigo-500"
      },
      {
          category: "Generale",
          title: "D.Lgs 81/08 (Testo Unico Sicurezza)",
          desc: "Testo unico sulla salute e sicurezza nei luoghi di lavoro.",
          url: "https://www.gazzettaufficiale.it/eli/id/2008/04/30/008G0104/sg",
          color: "border-l-indigo-500"
      },
      {
          category: "Estintori",
          title: "D.M. 7 Gennaio 2005",
          desc: "Norme tecniche e procedurali per la classificazione ed omologazione di estintori portatili di incendio.",
          url: "https://www.gazzettaufficiale.it/eli/id/2005/02/04/05A00631/sg",
          color: "border-l-red-500"
      },
      {
          category: "Estintori",
          title: "UNI 9994-1:2024",
          desc: "Estintori: controllo iniziale e manutenzione (aggiornamento 2024).",
          url: "https://www.emme-italia.com/it/normative/norma-uni-9994-1-2024",
          color: "border-l-red-500"
      },
      {
          category: "Rivelazione Fumi",
          title: "UNI 9795 / UNI 11224",
          desc: "Progettazione, installazione e manutenzione dei sistemi di rivelazione e segnalazione d'incendio.",
          url: "https://www.ordineingegnerinapoli.com/wp-content/uploads/2022/11/9795-dicembre-2021-Nuova-Arial-senza-logo-Napoli-Megawatt.pdf",
          color: "border-l-yellow-500"
      },
       {
          category: "Pompaggio",
          title: "UNI 11292 (Locali Pompe)",
          desc: "Locali pompe antincendio - requisiti di progetto, ubicazione, ventilazione.",
          url: "https://www.puntosicuro.it/prevenzione-incendi-C-85/nuova-uni-11292-pressurizzazione-reti-idriche-AR-19021/",
          color: "border-l-blue-500"
      },
      {
          category: "Porte Tagliafuoco",
          title: "Omologazione Porte REI",
          desc: "Prescrizioni su caratteristiche REI e omologazione (Gazzetta Ufficiale).",
          url: "https://www.gazzettaufficiale.it/atto/serie_generale/caricaArticolo?art.codiceRedazionale=094A3301&art.dataPubblicazioneGazzetta=1994-05-20&art.flagTipoArticolo=1&art.idArticolo=1&art.idGruppo=0&art.idSottoArticolo=1&art.idSottoArticolo1=10&art.progressivo=0&art.versione=1",
          color: "border-l-orange-500"
      }
  ];

  const filteredDocs = docs.filter(d => 
    d.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDpiSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const actionText = dpiAction === 'richiesta' ? 'Richiesta inviata' : 'Consegna registrata';
      addNotification({
          title: `Gestione DPI: ${dpiItem}`,
          message: `${actionText}. Ufficio acquisti notificato.`,
          type: 'success'
      });
      setActiveModal('none');
      setDpiItem('');
      setDpiSize('');
      setDpiNotes('');
  };

  const handleVehicleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      addNotification({
          title: `Segnalazione Mezzo ${vehiclePlate}`,
          message: `Segnalazione registrata. Ticket manutenzione aperto.`,
          type: 'warning'
      });
      setActiveModal('none');
      setVehiclePlate('');
      setVehicleKm('');
      setVehicleIssue('');
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-10">
      <div className="flex flex-col md:flex-row justify-between items-center border-b border-gray-200 dark:border-slate-700 pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary-700 dark:text-blue-400 flex items-center">
            <FileText className="mr-3" /> Documentazione Aziendale
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Manuali operativi, moduli e procedure di sicurezza.</p>
        </div>
        <div className="relative w-full md:w-64">
          <input 
            type="text" 
            placeholder="Cerca documento..." 
            className="pl-10 pr-4 py-2 border rounded-lg w-full bg-white dark:bg-slate-800 text-gray-900 dark:text-white border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
      </div>

      {/* SEZIONE MODULISTICA ATTIVA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* CARD DPI */}
          <div 
            onClick={() => setActiveModal('dpi')}
            className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 p-6 rounded-xl border border-orange-200 dark:border-orange-800 cursor-pointer hover:shadow-lg transition-all group"
          >
              <div className="flex items-center justify-between mb-4">
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                      <HardHat size={28} className="text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-xs font-bold text-orange-700 dark:text-orange-300 bg-orange-200 dark:bg-orange-900/40 px-2 py-1 rounded-full">Modulo Digitale</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">Consegna & Richiesta DPI</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Compila il modulo per richiedere nuovo equipaggiamento o confermare la ricezione.</p>
          </div>

          {/* CARD MEZZI */}
          <div 
            onClick={() => setActiveModal('vehicle')}
            className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 p-6 rounded-xl border border-blue-200 dark:border-blue-800 cursor-pointer hover:shadow-lg transition-all group"
          >
              <div className="flex items-center justify-between mb-4">
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                      <Truck size={28} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-200 dark:bg-blue-900/40 px-2 py-1 rounded-full">Segnalazione Guasti</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">Manutenzione Mezzi</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Segnala guasti, richiedi manutenzione ordinaria o comunica il chilometraggio.</p>
          </div>
      </div>

      {/* SEZIONE NORMATIVE */}
      <div className="mb-8">
          <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-slate-700 pb-2 mb-4 flex items-center">
              <Bookmark className="mr-2 text-primary-600" size={20}/> Normative Vigenti & Riferimenti di Legge
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {regulations.map((reg, idx) => (
                  <a 
                    key={idx} 
                    href={reg.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={`block p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all border-l-4 ${reg.color}`}
                  >
                      <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded">{reg.category}</span>
                          <ExternalLink size={14} className="text-gray-400" />
                      </div>
                      <h4 className="font-bold text-sm text-gray-800 dark:text-gray-100 mb-1 leading-snug">{reg.title}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{reg.desc}</p>
                  </a>
              ))}
          </div>
      </div>

      <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-slate-700 pb-2 mb-4">Archivio Documentale</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocs.map(doc => (
          <div key={doc.id} className="bg-white dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-slate-700 p-5 hover:shadow-md transition-all flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-lg ${doc.bg} ${doc.color} dark:bg-opacity-20`}>
                <doc.icon size={24} />
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                {doc.type}
              </span>
            </div>
            
            <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1">{doc.title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{doc.category} • Aggiornato il {doc.date}</p>
            
            <div className="mt-auto pt-4 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center">
              <span className="text-xs text-gray-400">{doc.size}</span>
              <button className="text-primary-600 dark:text-blue-400 hover:underline text-sm font-bold flex items-center">
                <Download size={16} className="mr-1" /> Scarica
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODALE DPI */}
      {activeModal === 'dpi' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6">
                  <div className="flex justify-between items-center mb-6 border-b pb-2">
                      <h3 className="text-xl font-bold flex items-center text-gray-900 dark:text-white"><HardHat className="mr-2 text-orange-500"/> Gestione DPI</h3>
                      <button onClick={() => setActiveModal('none')} className="text-gray-400 hover:text-red-500"><X size={24}/></button>
                  </div>
                  <form onSubmit={handleDpiSubmit} className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">Tipo Operazione</label>
                          <div className="flex gap-2">
                              <button type="button" onClick={() => setDpiAction('richiesta')} className={`flex-1 py-2 rounded text-sm font-bold border ${dpiAction === 'richiesta' ? 'bg-orange-100 border-orange-500 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' : 'border-gray-300 dark:border-slate-600 text-gray-500'}`}>Richiesta</button>
                              <button type="button" onClick={() => setDpiAction('consegna')} className={`flex-1 py-2 rounded text-sm font-bold border ${dpiAction === 'consegna' ? 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'border-gray-300 dark:border-slate-600 text-gray-500'}`}>Conferma Consegna</button>
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">Dispositivo (DPI)</label>
                          <select className="w-full p-2 border rounded bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white" required value={dpiItem} onChange={e => setDpiItem(e.target.value)}>
                              <option value="">Seleziona...</option>
                              <option value="Scarpe Antinfortunistiche">Scarpe Antinfortunistiche</option>
                              <option value="Guanti da Lavoro">Guanti da Lavoro</option>
                              <option value="Elmetto di Protezione">Elmetto di Protezione</option>
                              <option value="Occhiali Protettivi">Occhiali Protettivi</option>
                              <option value="Divisa Aziendale Estiva">Divisa Aziendale Estiva</option>
                              <option value="Divisa Aziendale Invernale">Divisa Aziendale Invernale</option>
                              <option value="Otoprotettori">Otoprotettori</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">Taglia / Misura</label>
                          <input type="text" className="w-full p-2 border rounded bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white" placeholder="Es. 42, L, XL..." value={dpiSize} onChange={e => setDpiSize(e.target.value)} required />
                      </div>
                      <div>
                          <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">Note Aggiuntive</label>
                          <textarea className="w-full p-2 border rounded bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white" rows={3} placeholder="Motivo della richiesta..." value={dpiNotes} onChange={e => setDpiNotes(e.target.value)}></textarea>
                      </div>
                      <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded flex items-center justify-center">
                          <Send size={18} className="mr-2"/> Invia {dpiAction === 'richiesta' ? 'Richiesta' : 'Conferma'}
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* MODALE MEZZI */}
      {activeModal === 'vehicle' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6">
                  <div className="flex justify-between items-center mb-6 border-b pb-2">
                      <h3 className="text-xl font-bold flex items-center text-gray-900 dark:text-white"><Truck className="mr-2 text-blue-500"/> Segnalazione Mezzi</h3>
                      <button onClick={() => setActiveModal('none')} className="text-gray-400 hover:text-red-500"><X size={24}/></button>
                  </div>
                  <form onSubmit={handleVehicleSubmit} className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">Targa Mezzo</label>
                          <input type="text" className="w-full p-2 border rounded bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white uppercase" placeholder="Es. AB123CD" value={vehiclePlate} onChange={e => setVehiclePlate(e.target.value)} required />
                      </div>
                      <div>
                          <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">Chilometri Attuali</label>
                          <input type="number" className="w-full p-2 border rounded bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white" placeholder="Es. 125000" value={vehicleKm} onChange={e => setVehicleKm(e.target.value)} required />
                      </div>
                      <div>
                          <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">Descrizione Problema / Richiesta</label>
                          <textarea className="w-full p-2 border rounded bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white" rows={3} placeholder="Es. Spia motore accesa, Richiesta Tagliando, Cambio Gomme..." value={vehicleIssue} onChange={e => setVehicleIssue(e.target.value)} required></textarea>
                      </div>
                      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded flex items-center justify-center">
                          <CheckCircle size={18} className="mr-2"/> Registra Segnalazione
                      </button>
                  </form>
              </div>
          </div>
      )}

    </div>
  );
};

export default Documents;
