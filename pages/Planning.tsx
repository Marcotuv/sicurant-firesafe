
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { CalendarRange, ChevronLeft, ChevronRight, User, Plus, Trash2, Calendar, MapPin, CalendarCheck, Clock, AlertTriangle, Users, Edit2, CheckCircle, Search, PlayCircle, CalendarX, CalendarClock, ChevronDown, ChevronUp } from 'lucide-react';
import { Client, WorkSession } from '../types';
import { getLocalDate, addDaysToDate, isAssetExpired } from '../utils/dates';

const Planning: React.FC = () => {
    const { clients, assets, technicians, sessions, scheduleSession, deleteSession, updatePlannedSession } = useData();
    const { profile } = useAuth();
    const [viewDate, setViewDate] = useState(new Date());

    // Permission Logic
    const canPlan = profile?.role === 'admin' || profile?.role === 'office';

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedClientIdStr, setSelectedClientIdStr] = useState<string>("");

    // Search State (Modal)
    const [clientSearchTerm, setClientSearchTerm] = useState("");
    const [showClientSuggestions, setShowClientSuggestions] = useState(false);

    // Search State (Main View)
    const [planningSearchTerm, setPlanningSearchTerm] = useState("");

    // Modal Form State
    const [selectedDate, setSelectedDate] = useState<string>(getLocalDate());
    const [selectedTechIds, setSelectedTechIds] = useState<string[]>([]);

    // Editing State
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

    // Accordion State for Backlog
    const [expandedSections, setExpandedSections] = useState({
        expired: false,
        current: false,
        next: false
    });

    // Helper per calcolare etichetta Semestre
    const getSemesterLabel = (dateStr: string) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        const month = date.getMonth();
        const pairs = ["GEN-LUG", "FEB-AGO", "MAR-SET", "APR-OTT", "MAG-NOV", "GIU-DIC"];
        return pairs[month % 6];
    };

    // --- LOGIC: BACKLOG GROUPING ---
    const groupedBacklog = useMemo(() => {
        const nextMonthLimitStr = addDaysToDate(new Date(), 60);
        const today = new Date();
        const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

        const strStartCurr = getLocalDate(startOfCurrentMonth);
        const strStartNext = getLocalDate(startOfNextMonth);

        const relevantAssets = assets.filter(asset => {
            if (!asset.scadenza) return false;
            return isAssetExpired(asset.scadenza) || asset.scadenza <= nextMonthLimitStr;
        });

        const clientEarliestExpiry: Record<number, string> = {};
        relevantAssets.forEach(asset => {
            if (!clientEarliestExpiry[asset.clientId] || asset.scadenza < clientEarliestExpiry[asset.clientId]) {
                clientEarliestExpiry[asset.clientId] = asset.scadenza;
            }
        });

        let clientsToPlan = clients.filter(c => {
            if (!clientEarliestExpiry[c.id]) return false;
            const hasExistingSession = sessions.some(s =>
                s.clientId === c.id && (s.status === 'OPEN' || s.status === 'PLANNED')
            );
            return !hasExistingSession;
        });

        if (planningSearchTerm.trim()) {
            const term = planningSearchTerm.toLowerCase();
            clientsToPlan = clientsToPlan.filter(c =>
                c.nome.toLowerCase().includes(term) || c.indirizzo.toLowerCase().includes(term)
            );
        }

        const groups = {
            expired: [] as { client: Client, date: string }[],
            current: [] as { client: Client, date: string }[],
            next: [] as { client: Client, date: string }[]
        };

        clientsToPlan.forEach(client => {
            const date = clientEarliestExpiry[client.id];
            const item = { client, date };
            if (date < strStartCurr) groups.expired.push(item);
            else if (date >= strStartCurr && date < strStartNext) groups.current.push(item);
            else groups.next.push(item);
        });

        groups.expired.sort((a, b) => a.date.localeCompare(b.date));
        groups.current.sort((a, b) => a.date.localeCompare(b.date));
        groups.next.sort((a, b) => a.date.localeCompare(b.date));

        return groups;
    }, [assets, clients, sessions, planningSearchTerm]);

    const totalBacklogCount = groupedBacklog.expired.length + groupedBacklog.current.length + groupedBacklog.next.length;

    const plannedSessions = useMemo(() => {
        const term = planningSearchTerm.toLowerCase().trim();
        return sessions
            .filter(s => s.status === 'PLANNED' && s.scheduledDate)
            .filter(s => {
                if (!term) return true;
                const client = clients.find(c => c.id === s.clientId);
                return client && (client.nome.toLowerCase().includes(term) || client.indirizzo.toLowerCase().includes(term));
            })
            .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime());
    }, [sessions, clients, planningSearchTerm]);

    const filteredClientsModal = useMemo(() => {
        if (!clientSearchTerm.trim()) return [];
        const term = clientSearchTerm.toLowerCase();
        return clients.filter(c => c.nome.toLowerCase().includes(term) || c.indirizzo.toLowerCase().includes(term)).slice(0, 20);
    }, [clients, clientSearchTerm]);

    const getClientStatus = (clientId: number) => {
        const today = getLocalDate();
        const openSession = sessions.find(s => s.clientId === clientId && s.status === 'OPEN');
        if (openSession) return { label: 'IN LAVORAZIONE', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertTriangle };
        const plannedSession = sessions.find(s => s.clientId === clientId && s.status === 'PLANNED' && s.scheduledDate && s.scheduledDate >= today);
        if (plannedSession) return { label: 'PIANIFICATO', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Calendar };
        return null;
    };

    const handleClientSelect = (client: Client) => {
        setSelectedClientIdStr(client.id.toString());
        setClientSearchTerm(client.nome);
        setShowClientSuggestions(false);
    };

    const handlePrevMonth = () => {
        const d = new Date(viewDate);
        d.setMonth(d.getMonth() - 1);
        setViewDate(d);
    };

    const handleNextMonth = () => {
        const d = new Date(viewDate);
        d.setMonth(d.getMonth() + 1);
        setViewDate(d);
    };

    const getCalendarDays = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        let startDay = firstDay.getDay() - 1;
        if (startDay === -1) startDay = 6;
        const days = [];
        for (let i = 0; i < startDay; i++) days.push(null);
        for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
        return days;
    };

    const days = getCalendarDays();
    const weekDays = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];

    const getSessionsForDate = (date: Date) => {
        const dateStr = getLocalDate(date);
        return sessions.filter(s => s.scheduledDate === dateStr || (s.status === 'OPEN' && s.startTimestamp?.startsWith(dateStr)));
    };

    const getTechsForSession = (session: WorkSession) => {
        const ids = (session.assignedTechIds && session.assignedTechIds.length > 0) ? session.assignedTechIds : (session.assignedTechId ? [session.assignedTechId] : []);
        return technicians.filter(t => ids.includes(t.id));
    };

    const openPlanModal = (client: Client) => {
        if (!canPlan) return;
        setSelectedClient(client);
        setSelectedClientIdStr(client.id.toString());
        setEditingSessionId(null);
        setSelectedDate(getLocalDate());
        setSelectedTechIds(technicians.length > 0 ? [technicians[0].id] : []);
        setIsModalOpen(true);
    };

    const openManualPlanModal = () => {
        if (!canPlan) return;
        setSelectedClient(null);
        setSelectedClientIdStr("");
        setClientSearchTerm("");
        setEditingSessionId(null);
        setSelectedDate(getLocalDate());
        setSelectedTechIds(technicians.length > 0 ? [technicians[0].id] : []);
        setIsModalOpen(true);
    };

    const openEditModal = (session: WorkSession) => {
        if (!canPlan) return;
        const client = clients.find(c => c.id === session.clientId);
        if (!client) return;
        setSelectedClient(client);
        setSelectedClientIdStr(client.id.toString());
        setEditingSessionId(session.id);
        setSelectedDate(session.scheduledDate || getLocalDate());
        const currentTechs = getTechsForSession(session).map(t => t.id);
        setSelectedTechIds(currentTechs.length > 0 ? currentTechs : (technicians.length > 0 ? [technicians[0].id] : []));
        setIsModalOpen(true);
    };

    const toggleTechSelection = (techId: string) => {
        setSelectedTechIds(prev => prev.includes(techId) ? prev.filter(id => id !== techId) : [...prev, techId]);
    };

    const handleSavePlan = () => {
        const finalClientId = selectedClient ? selectedClient.id : Number(selectedClientIdStr);
        if (!finalClientId || !selectedDate || selectedTechIds.length === 0) {
            alert("Seleziona un cliente, una data e almeno un tecnico.");
            return;
        }
        if (editingSessionId) updatePlannedSession(editingSessionId, selectedDate, selectedTechIds);
        else scheduleSession(finalClientId, selectedDate, selectedTechIds);
        setIsModalOpen(false);
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'OPEN': return { bg: 'bg-orange-500 border-orange-600', icon: PlayCircle };
            case 'CLOSED': return { bg: 'bg-emerald-500 border-emerald-600', icon: CheckCircle };
            default: return { bg: 'bg-blue-500 border-blue-600', icon: Calendar };
        }
    };

    const renderBacklogGroup = (title: string, list: { client: Client, date: string }[], type: 'expired' | 'current' | 'next') => {
        const isOpen = expandedSections[type];
        let headerColorClass = type === 'expired' ? "text-purple-800 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/30" : type === 'current' ? "text-indigo-800 bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-900/30" : "text-cyan-800 bg-cyan-100 dark:text-cyan-300 dark:bg-cyan-900/30";
        return (
            <div className="mb-2 last:mb-0 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <button onClick={() => setExpandedSections(prev => ({ ...prev, [type]: !prev[type] }))} className={`w-full flex justify-between items-center p-3 text-sm font-bold border-b ${headerColorClass}`}>
                    <div className="flex items-center">{title} ({list.length})</div>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {isOpen && (
                    <div className="bg-gray-50 dark:bg-slate-900/50 p-2 space-y-2 max-h-60 overflow-y-auto">
                        {list.length === 0 ? <p className="text-xs text-gray-400 text-center italic py-2">Nessun cliente in questa lista.</p> : list.map(({ client, date }) => (
                            <div key={client.id} className="p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 flex justify-between items-center">
                                <div className="min-w-0 pr-2">
                                    <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm truncate">{client.nome}</h4>
                                    <p className="text-[10px] text-gray-500 truncate">{client.indirizzo}</p>
                                    <span className="text-[9px] font-bold text-red-600 uppercase mt-1 block">SEM: {getSemesterLabel(date)}</span>
                                </div>
                                {canPlan && <button onClick={() => openPlanModal(client)} className="bg-blue-50 text-blue-600 p-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"><Plus size={16} /></button>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6 md:h-[calc(100vh-140px)] flex flex-col animate-fade-in">
            {/* HEADER SEZIONE */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-primary-700 dark:text-blue-400 flex items-center">
                        <CalendarRange className="mr-3" /> Pianificazione Turni
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Gestisci scadenze e assegna interventi.</p>
                </div>
                {canPlan && (
                    <button onClick={openManualPlanModal} className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg shadow-md flex items-center justify-center font-bold transition-all transform active:scale-95">
                        <Plus size={20} className="mr-2" /> Pianifica Nuovo Turno
                    </button>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-6 md:h-full md:overflow-hidden">

                {/* --- LEFT COLUMN: SEARCH & LISTS --- */}
                <div className="w-full lg:w-1/3 flex flex-col gap-4 md:h-full">

                    {/* BARRA DI RICERCA SEMPRE VISIBILE */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Cerca cliente o indirizzo..."
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 transition-all"
                            value={planningSearchTerm}
                            onChange={(e) => setPlanningSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-3.5 top-3.5 text-gray-400" size={20} />
                    </div>

                    {/* BACKLOG & SCHEDULED WRAPPER */}
                    <div className="flex flex-col gap-4 md:flex-1 md:overflow-hidden">
                        {canPlan && (
                            <div className="flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 md:h-1/2 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 flex items-center justify-between">
                                    <h3 className="font-bold text-gray-700 dark:text-gray-300 flex items-center text-sm">
                                        <Calendar size={18} className="mr-2 text-purple-500" /> Scadenze da Pianificare ({totalBacklogCount})
                                    </h3>
                                </div>
                                <div className="overflow-y-auto p-2 custom-scrollbar">
                                    {renderBacklogGroup("Arretrati", groupedBacklog.expired, 'expired')}
                                    {renderBacklogGroup("Mese Corrente", groupedBacklog.current, 'current')}
                                    {renderBacklogGroup("Mese Prossimo", groupedBacklog.next, 'next')}
                                    {totalBacklogCount === 0 && <p className="p-6 text-center text-gray-400 text-xs italic">Nessuna scadenza critica.</p>}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 md:h-1/2 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/10">
                                <h3 className="font-bold text-blue-700 dark:text-blue-400 flex items-center text-sm">
                                    <CalendarCheck size={18} className="mr-2" /> In Programma ({plannedSessions.length})
                                </h3>
                            </div>
                            <div className="overflow-y-auto p-2 space-y-2 custom-scrollbar">
                                {plannedSessions.length === 0 ? (
                                    <p className="p-6 text-center text-gray-400 text-xs italic">Nessun intervento pianificato.</p>
                                ) : (
                                    plannedSessions.map(session => {
                                        const client = clients.find(c => c.id === session.clientId);
                                        const assignedTechs = getTechsForSession(session);
                                        const isOverdue = session.scheduledDate && session.scheduledDate < getLocalDate();
                                        return (
                                            <div key={session.id} className={`p-3 border-l-4 rounded-lg bg-white dark:bg-slate-900 border ${isOverdue ? 'border-red-200 border-l-red-500' : 'border-gray-100 border-l-primary-500 shadow-sm'}`}>
                                                <div className="flex justify-between items-start">
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="font-bold text-gray-800 dark:text-gray-100 text-xs truncate uppercase tracking-tight">{client?.nome}</h4>
                                                        <p className="text-[10px] text-gray-500 font-medium mt-0.5 flex items-center">
                                                            <Calendar size={10} className="mr-1" /> {new Date(session.scheduledDate!).toLocaleDateString()}
                                                            {isOverdue && <span className="ml-2 text-red-600 font-bold">SCADUTO</span>}
                                                        </p>
                                                        <div className="mt-1 flex flex-wrap gap-1">
                                                            {assignedTechs.map(t => <span key={t.id} className="text-[9px] bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-400">{t.name.split(' ')[0]}</span>)}
                                                        </div>
                                                    </div>
                                                    {canPlan && (
                                                        <div className="flex gap-1">
                                                            <button onClick={() => openEditModal(session)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={14} /></button>
                                                            <button onClick={() => deleteSession(session.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN: CALENDAR --- */}
                <div className="w-full lg:w-2/3 flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 md:h-full">
                    <div className="p-4 flex flex-col sm:flex-row justify-between items-center border-b border-gray-100 dark:border-slate-700 gap-4">
                        <div className="flex items-center space-x-4">
                            <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"><ChevronLeft size={20} /></button>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 capitalize min-w-[140px] text-center">
                                {viewDate.toLocaleString('it-IT', { month: 'long', year: 'numeric' })}
                            </h3>
                            <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"><ChevronRight size={20} /></button>
                        </div>
                        <div className="flex items-center space-x-3 text-[10px] font-bold uppercase tracking-tighter sm:tracking-normal">
                            <div className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span> Pianificato</div>
                            <div className="flex items-center"><span className="w-2 h-2 bg-orange-500 rounded-full mr-1"></span> In Corso</div>
                            <div className="flex items-center"><span className="w-2 h-2 bg-emerald-500 rounded-full mr-1"></span> Chiuso</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-center font-bold text-[10px] text-gray-500">
                        {weekDays.map(d => <div key={d} className="py-2">{d}</div>)}
                    </div>

                    <div className="grid grid-cols-7 auto-rows-fr md:overflow-y-auto custom-scrollbar flex-1">
                        {days.map((date, idx) => {
                            if (!date) return <div key={idx} className="bg-gray-50/50 dark:bg-slate-900/50 border-b border-r border-gray-100 dark:border-slate-700 min-h-[80px] md:min-h-[120px]"></div>;
                            const sessionsOnDay = getSessionsForDate(date);
                            const isToday = new Date().toDateString() === date.toDateString();
                            return (
                                <div key={idx} className={`min-h-[80px] md:min-h-[120px] border-b border-r border-gray-100 dark:border-slate-700 p-1.5 relative hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors ${isToday ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                                    <span className={`text-[11px] md:text-sm font-bold ${isToday ? 'text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full' : 'text-gray-500'}`}>{date.getDate()}</span>
                                    <div className="mt-1 flex flex-col gap-1">
                                        {sessionsOnDay.map(s => {
                                            const statusStyle = getStatusStyle(s.status);
                                            const StatusIcon = statusStyle.icon;
                                            return (
                                                <div key={s.id} onClick={() => openEditModal(s)} className={`text-[8px] md:text-[10px] p-1 rounded leading-tight text-white cursor-pointer shadow-sm border truncate ${statusStyle.bg}`}>
                                                    <div className="flex items-center gap-1">
                                                        <StatusIcon size={8} className="shrink-0" />
                                                        <span className="font-bold truncate">{clients.find(c => c.id === s.clientId)?.nome || 'N.A.'}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* PLAN MODAL (STESSA LOGICA) */}
            {isModalOpen && canPlan && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-slate-700">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                                {editingSessionId ? <Edit2 className="mr-2 text-blue-500" size={20} /> : <Plus className="mr-2 text-emerald-500" size={20} />}
                                {editingSessionId ? 'Modifica Turno' : 'Nuova Pianificazione'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors"><ChevronUp size={24} /></button>
                        </div>

                        <div className="space-y-5 overflow-y-auto pr-1 custom-scrollbar">
                            {!selectedClient && (
                                <div className="relative">
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Cerca Cliente</label>
                                    <div className="relative">
                                        <input type="text" className="w-full p-3 pl-10 border rounded-xl bg-gray-50 dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Nome o indirizzo..." value={clientSearchTerm} onChange={(e) => { setClientSearchTerm(e.target.value); setShowClientSuggestions(true); }} onFocus={() => setShowClientSuggestions(true)} />
                                        <Search className="absolute left-3 top-3.5 text-gray-400" size={16} />
                                        {showClientSuggestions && clientSearchTerm && (
                                            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                                                {filteredClientsModal.map(c => (
                                                    <div key={c.id} onClick={() => handleClientSelect(c)} className="p-3 border-b dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer flex justify-between items-center whitespace-normal">
                                                        <div className="min-w-0 pr-2 flex-1">
                                                            <div className="font-bold text-sm text-gray-800 dark:text-gray-100">{c.nome}</div>
                                                            <div className="text-[10px] text-gray-500">{c.indirizzo}</div>
                                                            {(c.commessa || c.idCommessa || c.struttura) && (
                                                                <div className="mt-1 flex flex-wrap gap-1 text-[9px]">
                                                                    {c.commessa && <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded border border-blue-200">{c.commessa}</span>}
                                                                    {c.struttura && <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded border border-purple-200 font-bold">{c.struttura}</span>}
                                                                    {c.indirizzoStruttura && <span className="text-gray-400 italic">{c.indirizzoStruttura}</span>}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {getClientStatus(c.id) && <span className={`shrink-0 ml-2 text-[8px] font-extrabold px-1.5 py-0.5 rounded border whitespace-nowrap ${getClientStatus(c.id)!.color}`}>{getClientStatus(c.id)!.label}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Data Intervento</label>
                                <input type="date" className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-primary-500" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Tecnici Incaricati</label>
                                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {technicians.length === 0 ? (
                                        <div className="p-4 text-center border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800/50">
                                            <AlertTriangle className="mx-auto text-orange-400 mb-2" size={20} />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Nessun tecnico disponibile.</p>
                                            <p className="text-[10px] text-gray-400 mt-1">Esegui "Download Dati Cloud" dalle impostazioni per aggiornare la lista.</p>
                                        </div>
                                    ) : (
                                        technicians.map(t => {
                                            const isSelected = selectedTechIds.includes(t.id);
                                            return (
                                                <div key={t.id} onClick={() => toggleTechSelection(t.id)} className={`flex items-center p-2.5 border rounded-xl cursor-pointer transition-all ${isSelected ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-sm' : 'border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs mr-3 shrink-0 shadow-sm" style={{ backgroundColor: t.color }}>{t.name.charAt(0)}</div>
                                                    <span className="text-sm font-semibold flex-1 text-gray-700 dark:text-gray-200">{t.name}</span>
                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'bg-primary-600 border-primary-600 scale-110' : 'border-gray-300 dark:border-slate-500'}`}>{isSelected && <CheckCircle size={12} className="text-white" />}</div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3 pt-4 border-t dark:border-slate-700">
                            <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-gray-600 dark:text-gray-300">Annulla</button>
                            <button onClick={handleSavePlan} className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg shadow-primary-500/20 transition-all">{editingSessionId ? 'Salva' : 'Conferma'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Planning;
