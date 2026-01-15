
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plane, Book, Clock, ArrowRight,
    Activity, AlertCircle, CheckCircle,
    MapPin, Navigation, X, Loader2, FileSpreadsheet,
    Download, List, LogOut, LogIn, PlusCircle, Bell,
    Plus, Paperclip, FileText, Image as ImageIcon,
    Sun, Sunrise, Sunset, Moon, XCircle, Timer
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { AttendanceType, NotificationAttachment, Notification, ApprovalStatus } from '../types';
import { getLocalDate } from '../utils/dates';

const Dashboard: React.FC = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const { addNotification, attendanceHistory, addAttendanceRecord, notifications, markNotificationAsRead, technicians } = useData();
    const { user, profile } = useAuth();
    const navigate = useNavigate();

    const canCreateNotice = profile?.role === 'admin' || profile?.role === 'office';
    const isOffice = profile?.role === 'admin' || profile?.role === 'office';

    const [isClockInModalOpen, setIsClockInModalOpen] = useState(false);
    const [modalTab, setModalTab] = useState<'clock' | 'report'>('clock');

    const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
    const [newNotifTitle, setNewNotifTitle] = useState('');
    const [newNotifMessage, setNewNotifMessage] = useState('');
    const [newNotifCategory, setNewNotifCategory] = useState<'Avviso' | 'Comunicazione' | 'Circolare'>('Comunicazione');
    const [newNotifPriority, setNewNotifPriority] = useState<'info' | 'warning' | 'alert'>('info');
    const [newNotifTarget, setNewNotifTarget] = useState<string>('ALL');
    const [newNotifFile, setNewNotifFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [readingNotification, setReadingNotification] = useState<Notification | null>(null);

    const [gpsLoading, setGpsLoading] = useState(false);
    const [gpsError, setGpsError] = useState<string | null>(null);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number, lng: number } | null>(null);

    const todaysRecords = useMemo(() => {
        const today = getLocalDate();
        return attendanceHistory
            .filter(r => r.userId === user?.id && r.timestamp.startsWith(today))
            .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    }, [attendanceHistory, user]);

    const lastRecord = todaysRecords.length > 0 ? todaysRecords[0] : null;
    const isClockedIn = lastRecord?.type === 'ENTRATA';

    const urgentEvents = useMemo(() => {
        return notifications
            .filter(n => {
                const isTargetMatch = !n.targetUserId || n.targetUserId === 'ALL' || (user && n.targetUserId === user.id);
                return isTargetMatch;
            })
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 10);
    }, [notifications, user]);

    const [leaveType, setLeaveType] = useState<AttendanceType>('FERIE');
    const [leaveNote, setLeaveNote] = useState('');
    const [leaveDate, setLeaveDate] = useState<string>(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getTimeGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return { text: "Buongiorno", icon: Sunrise };
        if (hour < 18) return { text: "Buon pomeriggio", icon: Sun };
        return { text: "Buonasera", icon: Moon };
    };

    const greeting = getTimeGreeting();
    const GreetingIcon = greeting.icon;

    const userName = useMemo(() => {
        if (!profile?.full_name) return 'Utente';
        const parts = profile.full_name.split(' ');
        return parts.length > 1 ? parts[1] : parts[0];
    }, [profile]);

    const requestLocation = () => {
        setGpsLoading(true);
        setGpsError(null);
        setCurrentLocation(null);
        if (!navigator.geolocation) {
            setGpsError("Geolocalizzazione non supportata.");
            setGpsLoading(false);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCurrentLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
                setGpsLoading(false);
            },
            (error) => {
                let msg = "Impossibile rilevare la posizione.";
                if (error.code === 1) msg = "Permesso GPS negato.";
                setGpsError(msg);
                setGpsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleOpenClockIn = () => {
        setIsClockInModalOpen(true);
        setModalTab('clock');
        requestLocation();
    };

    const handleTimbratura = () => {
        if (!currentLocation) { requestLocation(); return; }
        const type: AttendanceType = isClockedIn ? 'USCITA' : 'ENTRATA';
        const now = new Date();
        addAttendanceRecord({
            id: `ATT-${Date.now()}`,
            userId: user?.id || 'guest',
            userName: profile?.full_name || 'Tecnico',
            type: type,
            status: 'APPROVED', // Timbrature GPS auto-approvate
            timestamp: now.toISOString(),
            latitude: currentLocation.lat,
            longitude: currentLocation.lng,
            notes: ''
        });
        addNotification({ title: `Timbratura ${type} Registrata`, message: `Ore: ${now.toLocaleTimeString()}`, category: 'Avviso', type: 'success' });
        setIsClockInModalOpen(false);
    };

    const handleAddLeave = () => {
        const now = new Date();
        const timestampDate = new Date(leaveDate);
        timestampDate.setHours(now.getHours(), now.getMinutes());
        addAttendanceRecord({
            id: `REQ-${Date.now()}`,
            userId: user?.id || 'guest',
            userName: profile?.full_name || 'Tecnico',
            type: leaveType,
            status: 'PENDING', // Richieste HR partono come PENDING
            timestamp: timestampDate.toISOString(),
            notes: leaveNote
        });
        addNotification({ title: 'Richiesta Registrata', message: `${leaveType} per il ${timestampDate.toLocaleDateString()} inserita. In attesa di approvazione ufficio.`, category: 'Comunicazione', type: 'info' });
        setLeaveNote('');
    };

    const handleCreateNotification = () => {
        if (!newNotifTitle.trim() || !newNotifMessage.trim()) return;
        let attachment: NotificationAttachment | undefined = undefined;
        if (newNotifFile) {
            attachment = { name: newNotifFile.name, type: newNotifFile.type.startsWith('image/') ? 'image' : 'pdf', url: URL.createObjectURL(newNotifFile) };
        }
        addNotification({ title: newNotifTitle, message: newNotifMessage, category: newNotifCategory, type: newNotifPriority, targetUserId: newNotifTarget, attachment: attachment });
        setIsNotifModalOpen(false);
        setNewNotifTitle(''); setNewNotifMessage(''); setNewNotifFile(null);
    };

    const handleOpenNotification = (note: Notification) => {
        setReadingNotification(note);
        if (user?.id) markNotificationAsRead(note.id, user.id);
    };

    const downloadExcelReport = () => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthData = attendanceHistory.filter(r => {
            const d = new Date(r.timestamp);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
        const headers = ["Data", "Ora", "Dipendente", "Tipo Evento", "Stato", "Note"];
        const rows = monthData.map(r => [new Date(r.timestamp).toLocaleDateString(), new Date(r.timestamp).toLocaleTimeString(), r.userName, r.type, r.status, `"${r.notes || ''}"`].join(";"));
        const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Report_Presenze.csv`);
        link.click();
    };

    const getStatusIcon = (status: ApprovalStatus) => {
        switch (status) {
            case 'APPROVED': return <CheckCircle size={14} className="text-emerald-500" />;
            case 'REJECTED': return <XCircle size={14} className="text-red-500" />;
            default: return <Timer size={14} className="text-orange-500" />;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in relative max-w-6xl mx-auto">
            <section className="bg-gradient-to-r from-primary-700 to-blue-600 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-lg p-8 text-white relative overflow-hidden flex flex-col items-center justify-center">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-5"></div>
                <div className="mb-4 bg-white/10 p-2 rounded-2xl backdrop-blur-sm border border-white/20">
                    <img src="/logo.png" alt="Logo" className="h-20 w-auto brightness-110 contrast-125 shadow-2xl" />
                </div>
                <div className="relative z-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-blue-100 mb-2">
                        <GreetingIcon size={24} />
                        <span className="font-medium text-xl">{greeting.text}, {userName}</span>
                    </div>
                    <h1 className="text-6xl md:text-7xl font-bold tracking-tight font-mono">
                        {currentTime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                        <span className="text-3xl md:text-4xl opacity-60 ml-2 font-light">{currentTime.getSeconds().toString().padStart(2, '0')}</span>
                    </h1>
                    <p className="text-blue-100 mt-3 text-lg capitalize">{currentTime.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 col-span-1 h-fit">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 pb-2 border-b border-gray-100 dark:border-slate-700 flex items-center"><Activity className="mr-2 text-blue-500" size={20} /> Azioni Rapide</h3>
                    <ul className="space-y-3">
                        <li><button onClick={handleOpenClockIn} className="w-full flex items-center p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 transition-all text-left group border border-blue-100 dark:border-blue-800"><div className="bg-blue-500 text-white p-2 rounded-lg mr-3 shadow-sm group-hover:scale-110 transition-transform"><MapPin size={20} /></div><div><span className="block font-bold text-blue-900 dark:text-blue-100">Timbratura GPS</span><span className="text-xs text-blue-600 dark:text-blue-300">{isClockedIn ? "Stato: IN SERVIZIO" : "Stato: FUORI SERVIZIO"}</span></div></button></li>
                        <li><button onClick={() => { setIsClockInModalOpen(true); setModalTab('report'); }} className="w-full flex items-center p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 transition-all text-left group border border-gray-200 dark:border-slate-600"><div className="bg-gray-500 text-white p-2 rounded-lg mr-3 shadow-sm group-hover:scale-110 transition-transform"><Plane size={20} /></div><div><span className="block font-bold text-gray-800 dark:text-gray-100">Richieste HR</span><span className="text-xs text-gray-500 dark:text-gray-400">Ferie / Permessi</span></div></button></li>
                        <li><button onClick={() => navigate('/docs')} className="w-full flex items-center p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 transition-all text-left group border border-gray-200 dark:border-slate-600"><div className="bg-gray-500 text-white p-2 rounded-lg mr-3 shadow-sm group-hover:scale-110 transition-transform"><Book size={20} /></div><div><span className="block font-bold text-gray-800 dark:text-gray-100">Documenti</span><span className="text-xs text-gray-500 dark:text-gray-400">Manuali e Procedure</span></div></button></li>
                    </ul>
                </section>

                <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 col-span-1 lg:col-span-2 h-fit">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center"><Bell className="mr-2 text-yellow-500" size={20} /> Bacheca Avvisi</h3>
                        {canCreateNotice && <button onClick={() => setIsNotifModalOpen(true)} className="flex items-center text-xs bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 px-3 py-1.5 rounded-full hover:bg-yellow-100 transition-colors font-semibold"><Plus size={14} className="mr-1" /> Nuovo Avviso</button>}
                    </div>
                    <div className="space-y-3 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
                        {urgentEvents.length > 0 ? urgentEvents.map(event => {
                            const isRead = event.readBy.includes(user?.id || '');
                            return (
                                <div key={event.id} onClick={() => handleOpenNotification(event)} className={`flex items-start space-x-3 p-3 rounded-lg transition-all cursor-pointer border ${isRead ? 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800' : 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-100 shadow-sm hover:bg-yellow-100'}`}><div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${isRead ? 'bg-gray-300' : 'bg-blue-500 animate-pulse'}`}></div><div className="flex-1 min-w-0"><div className="flex justify-between items-start"><h4 className={`text-sm truncate pr-2 ${isRead ? 'font-medium text-gray-600' : 'font-bold text-gray-900 dark:text-white'}`}>{event.category && <span className="mr-1 text-[10px] uppercase font-extrabold text-primary-600 bg-primary-50 px-1 py-0.5 rounded">{event.category}</span>}{event.title}</h4><span className="text-[10px] text-gray-400 ml-2">{new Date(event.timestamp).toLocaleDateString()}</span></div><p className={`text-xs mt-1 line-clamp-1 ${isRead ? 'text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>{event.message}</p></div></div>
                            );
                        }) : <div className="flex flex-col items-center justify-center py-10 text-gray-400 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-gray-200"><Bell size={32} className="mb-2 opacity-20" /><p className="text-sm">Nessuna comunicazione recente.</p></div>}
                    </div>
                </section>
            </div>

            {isClockInModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-primary-700 p-4 text-white flex justify-between items-center shrink-0">
                            <div className="flex space-x-4">
                                <button onClick={() => { setModalTab('clock'); requestLocation(); }} className={`flex items-center font-bold px-3 py-1 rounded transition-colors ${modalTab === 'clock' ? 'bg-white/20' : 'hover:bg-white/10 opacity-70'}`}><MapPin size={18} className="mr-2" /> Timbratrice</button>
                                <button onClick={() => setModalTab('report')} className={`flex items-center font-bold px-3 py-1 rounded transition-colors ${modalTab === 'report' ? 'bg-white/20' : 'hover:bg-white/10 opacity-70'}`}><FileSpreadsheet size={18} className="mr-2" /> Report</button>
                            </div>
                            <button onClick={() => setIsClockInModalOpen(false)} className="hover:bg-white/20 p-1 rounded"><X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {modalTab === 'clock' ? (
                                <div className="p-6 text-center">
                                    <div className="mb-6"><p className="text-gray-500 text-sm uppercase tracking-wider mb-1">Orario Attuale</p><p className="text-5xl font-bold text-gray-800 dark:text-white font-mono">{currentTime.toLocaleTimeString('it-IT')}</p></div>
                                    <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-4 mb-6 min-h-[100px] flex items-center justify-center">
                                        {gpsLoading ? <div className="flex flex-col items-center py-2 text-primary-600"><Loader2 className="animate-spin mb-2" size={24} /><span className="text-sm font-semibold">Acquisizione GPS...</span></div> : gpsError ? <div className="flex flex-col items-center py-2 text-red-500"><AlertCircle className="mb-2" size={24} /><span className="text-sm font-semibold">{gpsError}</span></div> : currentLocation ? <div className="flex flex-col items-center py-2 text-green-600"><Navigation className="mb-2" size={24} /><span className="text-sm font-bold">Posizione Rilevata</span></div> : <div className="text-gray-400 text-sm">In attesa di posizione...</div>}
                                    </div>
                                    <button onClick={handleTimbratura} disabled={!currentLocation || gpsLoading} className={`w-full py-6 rounded-xl font-bold text-white text-xl shadow-lg transition-all flex items-center justify-center mb-4 ${!currentLocation ? 'bg-gray-300 cursor-not-allowed' : isClockedIn ? 'bg-red-500' : 'bg-emerald-500'}`}>{isClockedIn ? <><LogOut className="mr-3" size={28} /> TIMBRA USCITA</> : <><LogIn className="mr-3" size={28} /> TIMBRA ENTRATA</>}</button>
                                </div>
                            ) : (
                                <div className="p-6">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 mb-6">
                                        <h4 className="font-bold text-blue-700 text-sm mb-3 flex items-center"><List size={16} className="mr-2" /> Inserisci Giustificativo / Richiesta</h4>
                                        <div className="grid grid-cols-2 gap-2 mb-3">{['FERIE', 'ROL', 'MALATTIA', 'PERMESSO'].map(t => (<button key={t} onClick={() => setLeaveType(t as AttendanceType)} className={`py-2 text-xs font-bold rounded border ${leaveType === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-700 border-gray-300 text-gray-700 dark:text-gray-300'}`}>{t}</button>))}</div>
                                        <div className="mb-3"><label className="block text-xs font-bold text-gray-500 mb-1">Data Richiesta</label><input type="date" className="w-full p-2 border rounded bg-white dark:bg-slate-700 text-sm" value={leaveDate} onChange={(e) => setLeaveDate(e.target.value)} /></div>
                                        <div className="flex gap-2"><input type="text" placeholder="Note..." className="flex-1 p-2 text-sm border rounded bg-white dark:bg-slate-700" value={leaveNote} onChange={(e) => setLeaveNote(e.target.value)} /><button onClick={handleAddLeave} className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"><PlusCircle size={18} /></button></div>
                                    </div>
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-bold text-gray-800 dark:text-gray-200">Storico Recente</h4>
                                        {isOffice && (
                                            <button onClick={downloadExcelReport} className="text-xs flex items-center bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-bold"><Download size={14} className="mr-1" /> Esporta Excel</button>
                                        )}
                                    </div>
                                    <div className="border rounded-lg overflow-hidden dark:border-slate-700">
                                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-gray-100 dark:bg-slate-700 text-xs text-gray-500 uppercase sticky top-0"><tr><th className="p-2">Data/Ora</th><th className="p-2">Tipo</th><th className="p-2">Stato</th></tr></thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                                    {todaysRecords.slice(0, 30).map((record, idx) => (
                                                        <tr key={idx} className="bg-white dark:bg-slate-800">
                                                            <td className="p-2 text-xs">
                                                                <div className="font-bold">{new Date(record.timestamp).toLocaleDateString()}</div>
                                                                <div className="text-gray-400">{new Date(record.timestamp).toLocaleTimeString()}</div>
                                                            </td>
                                                            <td className="p-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${record.type === 'ENTRATA' ? 'bg-green-100 text-green-700' : record.type === 'USCITA' ? 'bg-gray-100 text-gray-700' : 'bg-orange-100 text-orange-700'}`}>{record.type}</span></td>
                                                            <td className="p-2">{getStatusIcon(record.status)}</td>
                                                        </tr>
                                                    ))}
                                                    {todaysRecords.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-gray-400 text-xs">Nessun movimento registrato oggi.</td></tr>}
                                                </tbody>
                                            </table>
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

export default Dashboard;
