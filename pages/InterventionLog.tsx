
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { ClipboardList, Eye, Search, X, Calendar, User, Box, FileText, Download } from 'lucide-react';
import { Intervention } from '../types';

const InterventionLog: React.FC = () => {
  const { interventions } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);

  const filtered = interventions
    .filter(i => 
      i.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      i.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleExportPDF = () => {
      const element = document.getElementById('intervention-report-container');
      if (!element || !selectedIntervention) return;

      const opt = {
        margin: 10,
        filename: `Report_Intervento_${selectedIntervention.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // @ts-ignore
      if (window.html2pdf) {
          // @ts-ignore
          window.html2pdf().set(opt).from(element).save();
      } else {
          alert("Libreria PDF non caricata correttamente.");
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center border-b border-gray-200 dark:border-slate-700 pb-4 gap-4">
        <div>
            <h2 className="text-2xl font-bold text-primary-700 dark:text-blue-400 flex items-center">
                <ClipboardList className="mr-3" /> Registro Interventi
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Storico completo delle attività di manutenzione.</p>
        </div>
        <div className="relative">
            <input 
                type="text" 
                placeholder="Cerca cliente, asset o ID..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg w-full md:w-64 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-primary-700 dark:bg-slate-900 text-white text-sm uppercase tracking-wider">
                        <th className="p-4 font-semibold">Data</th>
                        <th className="p-4 font-semibold">Cliente</th>
                        <th className="p-4 font-semibold">Asset</th>
                        <th className="p-4 font-semibold">Stato</th>
                        <th className="p-4 font-semibold">Azioni</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                    {filtered.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="p-8 text-center text-gray-500">Nessun intervento trovato.</td>
                        </tr>
                    ) : (
                        filtered.map(int => {
                            const hasIssues = int.anomalies.length > 0;
                            return (
                                <tr key={int.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors text-sm text-gray-700 dark:text-gray-300">
                                    <td className="p-4 whitespace-nowrap">
                                        {new Date(int.timestamp).toLocaleString('it-IT', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'})}
                                    </td>
                                    <td className="p-4 font-medium">{int.clientName}</td>
                                    <td className="p-4">
                                        <span className="block font-medium">{int.assetName}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-500">{int.assetId}</span>
                                    </td>
                                    <td className="p-4">
                                        {hasIssues ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                                Anomalia
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                Completato
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <button 
                                            onClick={() => setSelectedIntervention(int)}
                                            className="p-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors"
                                            title="Vedi Dettagli"
                                        >
                                            <Eye size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
         </div>
      </div>

      {/* Detail Modal */}
      {selectedIntervention && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div id="intervention-report-container" className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in-up">
                <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Dettagli Intervento {selectedIntervention.id}</h3>
                    <div className="flex gap-2" data-html2canvas-ignore="true">
                        <button 
                            onClick={handleExportPDF} 
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded transition-colors flex items-center"
                            title="Esporta PDF"
                        >
                            <Download size={20} className="mr-1" /> <span className="text-sm font-semibold hidden sm:inline">PDF</span>
                        </button>
                        <button onClick={() => setSelectedIntervention(null)} className="text-gray-400 hover:text-red-500 p-2">
                            <X size={24} />
                        </button>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 gap-4 text-sm">
                        <div className="flex items-center">
                            <User className="text-primary-500 mr-2" size={18} />
                            <span className="font-bold w-24">Cliente:</span>
                            <span className="text-gray-600 dark:text-gray-300">{selectedIntervention.clientName}</span>
                        </div>
                        <div className="flex items-center">
                            <Box className="text-primary-500 mr-2" size={18} />
                            <span className="font-bold w-24">Asset:</span>
                            <span className="text-gray-600 dark:text-gray-300">{selectedIntervention.assetName} ({selectedIntervention.assetId})</span>
                        </div>
                        <div className="flex items-center">
                            <Calendar className="text-primary-500 mr-2" size={18} />
                            <span className="font-bold w-24">Data:</span>
                            <span className="text-gray-600 dark:text-gray-300">
                                {new Date(selectedIntervention.timestamp).toLocaleString('it-IT')}
                            </span>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-dashed border-gray-200 dark:border-slate-700">
                        <h4 className="text-blue-600 dark:text-blue-400 font-bold mb-2 text-sm uppercase">Lavorazioni</h4>
                        <div className="flex flex-wrap gap-2">
                            {selectedIntervention.services.length > 0 ? selectedIntervention.services.map((s, i) => (
                                <span key={i} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 text-xs rounded border border-blue-100 dark:border-blue-800">
                                    {s}
                                </span>
                            )) : <span className="text-gray-400 text-sm italic">Nessuna lavorazione</span>}
                        </div>
                    </div>

                    <div className="pt-2">
                        <h4 className="text-red-600 dark:text-red-400 font-bold mb-2 text-sm uppercase">Anomalie</h4>
                        <div className="flex flex-wrap gap-2">
                            {selectedIntervention.anomalies.length > 0 ? selectedIntervention.anomalies.map((a, i) => (
                                <span key={i} className="px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 text-xs rounded border border-red-100 dark:border-red-800">
                                    {a}
                                </span>
                            )) : <span className="text-gray-400 text-sm italic">Nessuna anomalia</span>}
                        </div>
                    </div>

                    <div className="pt-2">
                        <h4 className="text-gray-600 dark:text-gray-400 font-bold mb-2 text-sm uppercase">Note Presidio</h4>
                        <div className="bg-gray-50 dark:bg-slate-900 p-3 rounded text-sm text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-slate-700">
                            {selectedIntervention.notes || "Nessuna nota presente."}
                        </div>
                    </div>

                     {/* General Notes & Signatures */}
                    {(selectedIntervention.generalNotes || selectedIntervention.technicianSignature || selectedIntervention.clientSignature || selectedIntervention.technicianSignatureImage || selectedIntervention.clientSignatureImage) && (
                        <div className="pt-4 border-t border-gray-200 dark:border-slate-700 mt-2">
                             <h4 className="text-gray-800 dark:text-gray-100 font-bold mb-3 text-sm uppercase flex items-center">
                                <FileText size={14} className="mr-2"/> Dati Comuni Intervento
                             </h4>
                             
                             {selectedIntervention.generalNotes && (
                                <div className="mb-3">
                                    <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">Note Generali</span>
                                    <div className="bg-yellow-50 dark:bg-yellow-900/10 p-2 rounded text-sm border border-yellow-100 dark:border-yellow-900/30 text-gray-700 dark:text-gray-300">
                                        {selectedIntervention.generalNotes}
                                    </div>
                                </div>
                             )}

                             <div className="grid grid-cols-2 gap-4 mt-4">
                                 <div>
                                     <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">Firma Tecnico</span>
                                     <div className="border-b-2 border-gray-300 dark:border-slate-600 py-1 font-signature text-lg text-gray-800 dark:text-gray-200 italic mb-1">
                                         {selectedIntervention.technicianSignature || "Non specificato"}
                                     </div>
                                     {selectedIntervention.technicianSignatureImage && (
                                         <div className="border border-gray-200 dark:border-slate-700 p-1 rounded bg-white">
                                            <img src={selectedIntervention.technicianSignatureImage} alt="Firma Tecnico" className="w-full h-16 object-contain" />
                                         </div>
                                     )}
                                 </div>
                                 <div>
                                     <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">Firma Cliente</span>
                                     <div className="border-b-2 border-gray-300 dark:border-slate-600 py-1 font-signature text-lg text-gray-800 dark:text-gray-200 italic mb-1">
                                         {selectedIntervention.clientSignature || "Non specificato"}
                                     </div>
                                     {selectedIntervention.clientSignatureImage && (
                                         <div className="border border-gray-200 dark:border-slate-700 p-1 rounded bg-white">
                                            <img src={selectedIntervention.clientSignatureImage} alt="Firma Cliente" className="w-full h-16 object-contain" />
                                         </div>
                                     )}
                                 </div>
                             </div>
                        </div>
                    )}
                </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default InterventionLog;
