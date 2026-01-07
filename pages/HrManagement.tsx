
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Users, Check, X, Download, Search, Filter, Calendar, MapPin, AlertCircle, FileSpreadsheet, RotateCcw } from 'lucide-react';
import { ApprovalStatus } from '../types';

const HrManagement: React.FC = () => {
    const { attendanceHistory, updateAttendanceStatus, technicians, addNotification } = useData();
    const { profile, user } = useAuth();
    
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'ALL'>('ALL'); // Cambiato default a ALL

    const filteredRecords = useMemo(() => {
        return attendanceHistory
            .filter(r => r.type !== 'ENTRATA' && r.type !== 'USCITA') // Solo richieste HR
            .filter(r => {
                const matchesSearch = r.userName.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => {
                // Priorità assoluta ai PENDING
                if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
                if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
                // Poi ordine cronologico decrescente
                return b.timestamp.localeCompare(a.timestamp);
            });
    }, [attendanceHistory, searchTerm, statusFilter]);

    const handleAction = (recordId: string, status: ApprovalStatus, techName: string, type: string) => {
        if (!user?.id) return;
        updateAttendanceStatus(recordId, status, user.full_name || user.id);
        
        const msg = status === 'APPROVED' ? 'approvata' : 'respinta';
        addNotification({
            title: `Richiesta HR ${msg}`,
            message: `La richiesta di ${type} di ${techName} è stata ${msg}.`,
            type: status === 'APPROVED' ? 'success' : 'alert'
        });
    };

    const exportToExcel = () => {
        const headers = ["Tecnico", "Tipo", "Data Richiesta", "Note", "Stato", "Gestito Da"];
        const rows = filteredRecords.map(r => [
            r.userName,
            r.type,
            new Date(r.timestamp).toLocaleDateString(),
            r.notes || "",
            r.status,
            r.approvedBy || ""
        ].join(";"));
        
        const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Export_HR_${new Date().toLocaleDateString()}.csv`);
        link.click();
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 dark:border-slate-700 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-primary-700 dark:text-blue-400 flex items-center">
                        <Users className="mr-3" /> Gestione Richieste HR
                    </h2>
                    <p className="text-sm text-gray-500 font-medium">Autorizza ferie, permessi e tieni traccia dello storico.</p>
                </div>
                <button 
                    onClick={exportToExcel}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl flex items-center font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                >
                    <Download size={18} className="mr-2"/> Esporta Excel
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative col-span-1 md:col-span-2">
                    <Search className="absolute left-3.5 top-3.5 text-gray-400" size={18}/>
                    <input 
                        type="text" 
                        placeholder="Cerca per nome tecnico..." 
                        className="w-full pl-11 pr-4 py-3 border rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white border-gray-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary-500 shadow-sm transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative col-span-1 md:col-span-2">
                    <Filter className="absolute left-3.5 top-3.5 text-gray-400" size={18}/>
                    <select 
                        className="w-full pl-11 pr-10 py-3 border rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white border-gray-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary-500 appearance-none shadow-sm font-semibold cursor-pointer"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                        <option value="ALL">Mostra Tutte (Storico)</option>
                        <option value="PENDING">Da approvare</option>
                        <option value="APPROVED">Approvate</option>
                        <option value="REJECTED">Respinte</option>
                    </select>
                    <div className="absolute right-3.5 top-3.5 pointer-events-none text-gray-400">
                        <RotateCcw size={18} onClick={() => setStatusFilter('ALL')} className="cursor-pointer pointer-events-auto hover:text-primary-500"/>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-slate-900/50 text-gray-500 dark:text-gray-400 text-[10px] uppercase font-bold tracking-widest border-b dark:border-slate-700">
                                <th className="p-5">Tecnico</th>
                                <th className="p-5">Tipo</th>
                                <th className="p-5">Data Richiesta</th>
                                <th className="p-5">Note</th>
                                <th className="p-5">Stato</th>
                                <th className="p-5 text-right">Gestione</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {filteredRecords.length > 0 ? (
                                filteredRecords.map(record => (
                                    <tr key={record.id} className={`transition-colors duration-200 ${record.status === 'PENDING' ? 'bg-orange-50/20 dark:bg-orange-900/5 hover:bg-orange-50/40' : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'}`}>
                                        <td className="p-5">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 flex items-center justify-center font-bold text-xs mr-3">
                                                    {record.userName.charAt(0)}
                                                </div>
                                                <span className="font-bold text-gray-900 dark:text-white">{record.userName}</span>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase border ${
                                                record.type === 'MALATTIA' ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300' :
                                                record.type === 'FERIE' ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300' :
                                                'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300'
                                            }`}>
                                                {record.type}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300">
                                                <Calendar size={14} className="mr-2 text-gray-400"/> {new Date(record.timestamp).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <p className="text-xs italic text-gray-500 dark:text-gray-400 max-w-[200px] truncate" title={record.notes}>
                                                {record.notes || "-"}
                                            </p>
                                        </td>
                                        <td className="p-5">
                                            {record.status === 'PENDING' && (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 text-xs font-bold ring-1 ring-orange-200 dark:ring-orange-800">
                                                    <AlertCircle size={12} className="mr-1.5"/> In attesa
                                                </span>
                                            )}
                                            {record.status === 'APPROVED' && (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs font-bold ring-1 ring-emerald-200 dark:ring-emerald-800">
                                                    <Check size={12} className="mr-1.5"/> Autorizzato
                                                </span>
                                            )}
                                            {record.status === 'REJECTED' && (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs font-bold ring-1 ring-red-200 dark:ring-red-800">
                                                    <X size={12} className="mr-1.5"/> Respinto
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-5 text-right">
                                            {record.status === 'PENDING' ? (
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleAction(record.id, 'APPROVED', record.userName, record.type)}
                                                        className="p-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95"
                                                        title="Approva Richiesta"
                                                    >
                                                        <Check size={18}/>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleAction(record.id, 'REJECTED', record.userName, record.type)}
                                                        className="p-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all hover:shadow-lg hover:shadow-red-500/20 active:scale-95"
                                                        title="Respingi Richiesta"
                                                    >
                                                        <X size={18}/>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Gestito da:</span>
                                                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 truncate max-w-[120px]">{record.approvedBy?.split(' ')[0] || 'Admin'}</span>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-20 text-center">
                                        <div className="flex flex-col items-center opacity-30">
                                            <FileSpreadsheet size={48} className="mb-3"/>
                                            <p className="text-sm font-bold italic uppercase tracking-widest">Nessuna richiesta trovata</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default HrManagement;
