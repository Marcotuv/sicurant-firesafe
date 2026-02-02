
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity, Book, Bell, Plus, Sun, Sunrise, Moon
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { NotificationAttachment, Notification } from '../types'; const Dashboard: React.FC = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const { addNotification, notifications, markNotificationAsRead } = useData();
    const { user, profile } = useAuth();
    const navigate = useNavigate();

    const canCreateNotice = profile?.role === 'admin' || profile?.role === 'office';
    const isOffice = profile?.role === 'admin' || profile?.role === 'office';



    const [readingNotification, setReadingNotification] = useState<Notification | null>(null);





    const urgentEvents = useMemo(() => {
        return notifications
            .filter(n => {
                const isTargetMatch = !n.targetUserId || n.targetUserId === 'ALL' || (user && n.targetUserId === user.id);
                return isTargetMatch;
            })
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 10);
    }, [notifications, user]);



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







    const handleOpenNotification = (note: Notification) => {
        setReadingNotification(note);
        if (user?.id) markNotificationAsRead(note.id, user.id);
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

                        <li><button onClick={() => navigate('/docs')} className="w-full flex items-center p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 transition-all text-left group border border-gray-200 dark:border-slate-600"><div className="bg-gray-500 text-white p-2 rounded-lg mr-3 shadow-sm group-hover:scale-110 transition-transform"><Book size={20} /></div><div><span className="block font-bold text-gray-800 dark:text-gray-100">Documenti</span><span className="text-xs text-gray-500 dark:text-gray-400">Manuali e Procedure</span></div></button></li>
                    </ul>
                </section>

                <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 col-span-1 lg:col-span-2 h-fit">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center"><Bell className="mr-2 text-yellow-500" size={20} /> Bacheca Avvisi</h3>

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


        </div>
    );
};

export default Dashboard;
