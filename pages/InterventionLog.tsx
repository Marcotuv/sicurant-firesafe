import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Eye, Search, X, Printer, Coins, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { Intervention, QuotationItem } from '../types';

interface GroupedSession {
    id: string; // Combinazione clientId-date
    clientId: number;
    clientName: string;
    date: string;
    technicianName: string;
    assetsChecked: number;
    totalAnomalies: number;
    interventions: Intervention[];
    progressiveCode?: string; // Usiamo il codice del primo intervento come riferimento
}

const InterventionLog: React.FC = () => {
    const { interventions } = useData();
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSession, setSelectedSession] = useState<GroupedSession | null>(null);

    const isOffice = profile?.role === 'admin' || profile?.role === 'office';

    const groupedSessions = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        const groups: Record<string, GroupedSession> = {};

        interventions.forEach(int => {
            // Gestione robusta della data per il raggruppamento
            let datePart = 'Unknown';
            try {
                if (int.timestamp.includes('T')) {
                    datePart = int.timestamp.split('T')[0];
                } else {
                    // Fallback se timestamp non è ISO (es. dd/mm/yyyy)
                    datePart = int.timestamp;
                }
            } catch (e) { datePart = 'Invalid-Date'; }

            const key = `${int.clientId}-${datePart}`;

            const matchesSearch = !term ||
                int.clientName.toLowerCase().includes(term) ||
                (int.technicianSignature && int.technicianSignature.toLowerCase().includes(term));

            if (!matchesSearch) return;

            if (!groups[key]) {
                groups[key] = {
                    id: key,
                    clientId: int.clientId,
                    clientName: int.clientName,
                    date: datePart,
                    technicianName: int.technicianSignature || 'N.D.',
                    assetsChecked: 0,
                    totalAnomalies: 0,
                    interventions: [],
                    progressiveCode: int.progressive_code
                };
            }

            groups[key].assetsChecked += 1;
            groups[key].totalAnomalies += int.anomalies.length;
            groups[key].interventions.push(int);
            // Se troviamo un progressive code e non l'abbiamo ancora settato, prendiamolo
            if (!groups[key].progressiveCode && int.progressive_code) {
                groups[key].progressiveCode = int.progressive_code;
            }
        });

        return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
    }, [interventions, searchTerm]);

    const handlePrint = () => {
        window.print();
    };

    const handleTransformToQuotation = (session: GroupedSession) => {
        const itemsMap = new Map<string, { count: number, type: 'SERVICE' | 'ARTICLE' }>();

        session.interventions.forEach(int => {
            int.anomalies.forEach(a => {
                const key = `[RIPRISTINO] ${a} su ${int.assetName} (Mat. ${int.asset_id || int.assetId || 'N.D.'})`;
                const existing = itemsMap.get(key);
                itemsMap.set(key, { count: (existing?.count || 0) + 1, type: 'ARTICLE' });
            });

            if (int.anomalies.length === 0) {
                int.services.forEach(s => {
                    const key = `[LAVORAZIONE] ${s} su ${int.assetName}`;
                    const existing = itemsMap.get(key);
                    itemsMap.set(key, { count: (existing?.count || 0) + 1, type: 'SERVICE' });
                });
            }
        });

        const items: QuotationItem[] = Array.from(itemsMap.entries()).map(([desc, data], idx) => ({
            id: `GRP-${idx}-${Date.now()}`,
            type: data.type,
            description: desc,
            quantity: data.count,
            unitPrice: 0,
            total: 0
        }));

        navigate('/quotations', {
            state: {
                prefill: {
                    clientId: session.clientId,
                    clientName: session.clientName,
                    title: `Preventivo per Ripristino Anomalie del ${session.date !== 'Unknown' ? new Date(session.date).toLocaleDateString() : session.date
                        }`,
                    items: items,
                    type: 'PREVENTIVO',
                    interventionRefId: session.id
                }
            }
        });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="no-print flex flex-col md:flex-row justify-between md:items-center border-b border-gray-200 dark:border-slate-700 pb-4 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-primary-700 dark:text-blue-400 flex items-center">
                        <ClipboardList className="mr-3" /> Registro Rapportini
                    </h2>
                    <p className="text-sm text-gray-500 font-medium">Archivio raggruppato per cliente e sessioni di lavoro.</p>
                </div>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Cerca cliente o tecnico..."
                        className="pl-10 pr-4 py-2.5 border rounded-xl w-full md:w-80 bg-white dark:bg-slate-800 text-gray-900 dark:text-white border-gray-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
                </div>
            </div>

            <div className="no-print bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-slate-900/50 text-gray-500 dark:text-gray-400 text-[10px] uppercase font-bold tracking-widest border-b dark:border-slate-700">
                                <th className="p-5">Data Visita</th>
                                <th className="p-5">Rapporto N.</th> {/* Nuova colonna */}
                                <th className="p-5">Cliente</th>
                                <th className="p-5 text-center">Volume Asset</th>
                                <th className="p-5">Esito Globale</th>
                                <th className="p-5 text-right">Azioni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {groupedSessions.length > 0 ? (
                                groupedSessions.map(session => (
                                    <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group">
                                        <td className="p-5">
                                            <div className="font-bold text-gray-900 dark:text-white">
                                                {session.date !== 'Unknown' ? new Date(session.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }) : session.date}
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            {session.progressiveCode ? (
                                                <span className="font-mono text-xs font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded">{session.progressiveCode}</span>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">In attesa...</span>
                                            )}
                                        </td>
                                        <td className="p-5">
                                            <div className="font-bold text-primary-700 dark:text-blue-300">{session.clientName}</div>
                                            <div className="text-[10px] text-gray-400 uppercase tracking-tight">Tecnico: {session.technicianName}</div>
                                        </td>
                                        <td className="p-5 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="font-black text-lg text-gray-800 dark:text-white">{session.assetsChecked}</span>
                                                <span className="text-[9px] uppercase font-bold opacity-50">Presidi</span>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            {session.totalAnomalies > 0 ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-100 text-[10px] font-bold dark:bg-red-900/20 dark:text-red-300 dark:border-red-800">
                                                    <AlertCircle size={12} className="mr-1.5" /> {session.totalAnomalies} ANOMALIE
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800">
                                                    <CheckCircle2 size={12} className="mr-1.5" /> REGOLARE
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                {isOffice && session.totalAnomalies > 0 && (
                                                    <button
                                                        onClick={() => handleTransformToQuotation(session)}
                                                        className="p-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 shadow-md transition-all active:scale-95 flex items-center group/btn"
                                                        title="Crea Offerta Straordinaria"
                                                    >
                                                        <Coins size={18} className="md:mr-1.5" />
                                                        <span className="hidden md:inline text-xs font-black uppercase">Quota</span>
                                                    </button>
                                                )}
                                                <button onClick={() => setSelectedSession(session)} className="p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 shadow-md transition-all active:scale-95 flex items-center">
                                                    <Eye size={18} className="md:mr-1.5" />
                                                    <span className="hidden md:inline text-xs font-black uppercase">Dettaglio</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={6} className="p-20 text-center text-gray-400 font-bold italic uppercase tracking-widest opacity-30">Nessuna sessione trovata</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:fixed print:inset-0 print:bg-white print:p-0 print:z-[100]">
                    <div id="report" className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto text-gray-900 dark:text-gray-100 print:shadow-none print:max-w-none print:max-h-none print:overflow-visible print:w-full print:h-auto print:absolute print:top-0 print:left-0 animate-fade-in">
                        <div className="no-print flex justify-between items-center p-5 border-b bg-gray-50 dark:bg-slate-800 dark:border-slate-700 sticky top-0 z-10">
                            <h3 className="font-bold text-gray-800 dark:text-white">Rapporto Intervento Completo</h3>
                            <div className="flex gap-2">
                                {isOffice && (
                                    <button
                                        onClick={() => handleTransformToQuotation(selectedSession)}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg flex items-center shadow-md font-bold text-xs transition-all active:scale-95"
                                    >
                                        <ShieldCheck size={16} className="mr-1.5" /> Crea Preventivo
                                    </button>
                                )}
                                <button onClick={handlePrint} className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded flex items-center font-bold text-xs"><Printer size={18} className="mr-1" /> Stampa PDF</button>
                                <button onClick={() => setSelectedSession(null)} className="text-gray-400 hover:text-red-500 p-2"><X size={24} /></button>
                            </div>
                        </div>

                        <div className="p-8 space-y-6 print:p-12">
                            <div className="flex justify-between items-start border-b-2 border-red-600 pb-4 mb-6">
                                <div>
                                    <h1 className="text-2xl font-black text-gray-900 uppercase">Rapporto di Manutenzione</h1>
                                    <p className="text-sm font-bold text-gray-500">Sicur. Ant Antincendio - Intranet Certificata</p>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-xl">{selectedSession.clientName}</div>
                                    <div className="text-sm text-gray-600 uppercase tracking-tighter">
                                        Data: {selectedSession.date !== 'Unknown' ? new Date(selectedSession.date).toLocaleDateString('it-IT') : selectedSession.date}
                                    </div>
                                    {selectedSession.progressiveCode && (
                                        <div className="text-sm font-mono font-bold bg-yellow-100 inline-block px-2 rounded mt-1">
                                            Rif: {selectedSession.progressiveCode}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-6 text-xs bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl print:bg-white print:border print:p-4">
                                <div><span className="block text-gray-400 dark:text-gray-500 uppercase font-bold mb-0.5">Asset Controllati</span><span className="font-bold text-lg text-gray-800 dark:text-gray-200">{selectedSession.assetsChecked}</span></div>
                                <div><span className="block text-gray-400 dark:text-gray-500 uppercase font-bold mb-0.5">Totale Anomalie</span><span className={`font-bold text-lg ${selectedSession.totalAnomalies > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{selectedSession.totalAnomalies}</span></div>
                                <div><span className="block text-gray-400 dark:text-gray-500 uppercase font-bold mb-0.5">Manutentore</span><span className="font-bold text-lg text-gray-800 dark:text-gray-200">{selectedSession.technicianName}</span></div>
                            </div>

                            <div>
                                <h4 className="font-black text-[10px] text-primary-700 uppercase tracking-widest border-b pb-1 mb-4">Dettaglio Presidi Verificati</h4>
                                <div className="space-y-4">
                                    {selectedSession.interventions.map((int, i) => (
                                        <div key={int.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/30 break-inside-avoid">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="font-bold text-gray-900 dark:text-gray-100">{int.assetName}</div>
                                                    <div className="text-[10px] text-gray-500 dark:text-gray-400 font-mono uppercase">MAT: {int.assetId}</div>
                                                </div>
                                                {int.anomalies.length > 0 ? <AlertCircle className="text-red-500" size={18} /> : <CheckCircle2 className="text-emerald-500" size={18} />}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase">Lavorazioni:</span>
                                                    <ul className="text-xs text-gray-700 dark:text-gray-300 list-disc pl-4 mt-1">
                                                        {int.services.map((s, idx) => <li key={idx}>{s}</li>)}
                                                    </ul>
                                                </div>
                                                {int.anomalies.length > 0 && (
                                                    <div>
                                                        <span className="text-[9px] font-bold text-red-500 uppercase">Anomalie Riscontrate:</span>
                                                        <ul className="text-xs text-red-700 dark:text-red-400 list-disc pl-4 mt-1">
                                                            {int.anomalies.map((a, idx) => <li key={idx}>{a}</li>)}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                            {int.notes && (
                                                <div className="mt-3 pt-2 border-t border-gray-100 text-xs italic text-gray-500">
                                                    Note: {int.notes}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 pt-6 border-t mt-10">
                                <div className="text-center">
                                    <p className="text-[10px] font-black uppercase text-gray-400 mb-6 tracking-widest">Firma Manutentore</p>
                                    {selectedSession.interventions[0]?.technicianSignatureImage ? (
                                        <img src={selectedSession.interventions[0].technicianSignatureImage} className="h-20 mx-auto object-contain grayscale" />
                                    ) : (
                                        <div className="h-20 border-b-2 border-dashed border-gray-100 flex items-center justify-center text-gray-300 italic text-xs">Firma Digitale</div>
                                    )}
                                    <p className="mt-3 text-xs font-bold text-gray-800">{selectedSession.technicianName}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-black uppercase text-gray-400 mb-6 tracking-widest">Firma Cliente per Ricevuta</p>
                                    {selectedSession.interventions[0]?.clientSignatureImage ? (
                                        <img src={selectedSession.interventions[0].clientSignatureImage} className="h-20 mx-auto object-contain grayscale" />
                                    ) : (
                                        <div className="h-20 border-b-2 border-dashed border-gray-100 flex items-center justify-center text-gray-300 italic text-xs">Firma per Presa Visione</div>
                                    )}
                                    <p className="mt-3 text-xs font-bold text-gray-800">{selectedSession.interventions[0]?.clientSignature || "N.D."}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InterventionLog;
