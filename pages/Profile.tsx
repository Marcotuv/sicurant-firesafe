
import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { User, Mail, Shield, PenTool, Save, Clock, Calendar, HeartPulse, StickyNote, CheckCircle, Plus, Trash2, Palette } from 'lucide-react';
import { SignaturePad } from '../components/SignaturePad';
import { MOCK_USER } from '../lib/constants';
import { Note } from '../types';

const Profile: React.FC = () => {
    const { profile } = useAuth();
    const {
        userNotes, updateUserNotes,
        userSignature, saveUserSignature,
        addNotification, attendanceHistory
    } = useData();

    // Local state for editing notes before saving to context/DB
    const [localNotes, setLocalNotes] = useState<Note[]>([]);
    const [isNotesSaved, setIsNotesSaved] = useState(false);

    // Sync from context only on mount or when context updates (e.g. after sync)
    useEffect(() => {
        setLocalNotes(userNotes);
    }, [userNotes]);

    // Dati utente (fallback su mock se necessario)
    const userData = {
        name: profile?.full_name || MOCK_USER.name,
        email: profile?.email || 'tecnico@sicurant.it',
        role: profile?.role || 'Technician',
        avatar: profile?.avatar_url || MOCK_USER.avatarUrl
    };

    // --- CALCOLO STATISTICHE MESE CORRENTE ---
    const stats = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Filtra record mese corrente
        const monthlyRecords = attendanceHistory.filter(r => {
            const d = new Date(r.timestamp);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        // Calcolo Ore Lavorate
        let totalMs = 0;
        let lastEntry: Date | null = null;

        monthlyRecords.forEach(r => {
            const time = new Date(r.timestamp);
            if (r.type === 'ENTRATA') {
                lastEntry = time;
            } else if (r.type === 'USCITA' && lastEntry) {
                totalMs += (time.getTime() - lastEntry.getTime());
                lastEntry = null;
            }
        });

        const workedHours = (totalMs / (1000 * 60 * 60)).toFixed(1);

        // Conteggi Eventi
        const leaveCount = monthlyRecords.filter(r => r.type === 'FERIE').length;
        const rolCount = monthlyRecords.filter(r => r.type === 'ROL').length;
        const sickCount = monthlyRecords.filter(r => r.type === 'MALATTIA').length;
        const permitCount = monthlyRecords.filter(r => r.type === 'PERMESSO').length;

        return { workedHours, leaveCount, rolCount, sickCount, permitCount };

    }, [attendanceHistory]);

    // --- NOTES MANAGEMENT ---
    const handleSaveNotes = () => {
        updateUserNotes(localNotes);
        setIsNotesSaved(true);
        addNotification({ title: 'Post-it Salvati', message: 'Tutte le note sono state aggiornate.', type: 'success' });
        setTimeout(() => setIsNotesSaved(false), 2000);
    };

    const addNote = () => {
        const newNote: Note = {
            id: Date.now().toString(),
            text: '',
            color: 'yellow',
            date: new Date().toISOString()
        };
        setLocalNotes([newNote, ...localNotes]);
    };

    const deleteNote = (id: string) => {
        setLocalNotes(prev => prev.filter(n => n.id !== id));
    };

    const updateNoteText = (id: string, text: string) => {
        setLocalNotes(prev => prev.map(n => n.id === id ? { ...n, text } : n));
    };

    const updateNoteColor = (id: string, color: Note['color']) => {
        setLocalNotes(prev => prev.map(n => n.id === id ? { ...n, color } : n));
    };

    const handleSaveSignature = (sig: string) => {
        saveUserSignature(sig);
        addNotification({ title: 'Firma Aggiornata', message: 'Nuova firma digitale salvata.', type: 'success' });
    };

    const getColorClasses = (color: Note['color']) => {
        switch (color) {
            case 'yellow': return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 focus-within:ring-yellow-400';
            case 'blue': return 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 focus-within:ring-blue-400';
            case 'green': return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 focus-within:ring-green-400';
            case 'pink': return 'bg-pink-100 dark:bg-pink-900/30 border-pink-300 dark:border-pink-700 focus-within:ring-pink-400';
            case 'purple': return 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 focus-within:ring-purple-400';
            default: return 'bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600';
        }
    };

    return (
        <div className="space-y-6 pb-10 animate-fade-in">
            <div className="border-b border-gray-200 dark:border-slate-700 pb-4">
                <h2 className="text-2xl font-bold text-primary-700 dark:text-blue-400 flex items-center">
                    <User className="mr-3" /> Profilo Personale
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Gestisci i tuoi dati, configura la firma e controlla le tue prestazioni.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* COLONNA SINISTRA: INFO + STATS */}
                <div className="space-y-6 lg:col-span-1">

                    {/* CARD UTENTE */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 text-center">
                        <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-slate-700 mx-auto mb-4 overflow-hidden border-4 border-primary-100 dark:border-slate-600">
                            {/* Placeholder avatar */}
                            <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-500">
                                {userData.name.charAt(0)}
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{userData.name}</h3>
                        <span className="inline-block bg-primary-100 dark:bg-blue-900/30 text-primary-700 dark:text-blue-300 text-xs px-2 py-1 rounded-full uppercase tracking-wider font-bold mt-2">
                            {userData.role}
                        </span>

                        <div className="mt-6 text-left space-y-3">
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <Mail size={16} className="mr-3 text-gray-400" /> {userData.email}
                            </div>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <Shield size={16} className="mr-3 text-gray-400" /> ID: {profile?.id.substring(0, 8) || 'N/A'}
                            </div>
                        </div>
                    </div>

                    {/* CARD STATISTICHE */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                        <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                            <Clock size={18} className="mr-2 text-primary-600" /> Riepilogo Mese
                        </h4>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                                <span className="text-xs text-blue-600 dark:text-blue-300 font-bold uppercase">Ore Lavorate</span>
                                <div className="text-2xl font-bold text-blue-800 dark:text-blue-100 mt-1">{stats.workedHours}</div>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-100 dark:border-purple-800">
                                <span className="text-xs text-purple-600 dark:text-purple-300 font-bold uppercase">Permessi (h)</span>
                                <div className="text-2xl font-bold text-purple-800 dark:text-purple-100 mt-1">{stats.permitCount}</div>
                            </div>
                            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-100 dark:border-orange-800">
                                <span className="text-xs text-orange-600 dark:text-orange-300 font-bold uppercase">Ferie (gg)</span>
                                <div className="text-2xl font-bold text-orange-800 dark:text-orange-100 mt-1">{stats.leaveCount}</div>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800">
                                <span className="text-xs text-red-600 dark:text-red-300 font-bold uppercase">Malattia (gg)</span>
                                <div className="text-2xl font-bold text-red-800 dark:text-red-100 mt-1">{stats.sickCount}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLONNA DESTRA: STRUMENTI */}
                <div className="space-y-6 lg:col-span-2">

                    {/* CONFIGURAZIONE FIRMA */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center text-lg">
                                    <PenTool size={20} className="mr-2 text-emerald-600" /> Firma Digitale
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Salva la tua firma per pre-compilarla automaticamente nei rapporti di intervento.
                                </p>
                            </div>
                            {userSignature && <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-bold flex items-center"><CheckCircle size={12} className="mr-1" /> Configurato</span>}
                        </div>

                        <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                            <SignaturePad
                                label="La tua Firma"
                                value={userSignature}
                                onChange={handleSaveSignature}
                            />
                        </div>
                    </div>

                    {/* POST-IT BOARD */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 flex flex-col min-h-[500px]">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center text-lg">
                                <StickyNote size={20} className="mr-2 text-yellow-500" /> I tuoi Post-it
                            </h4>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={addNote}
                                    className="text-sm px-4 py-2 rounded-lg font-bold flex items-center transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600"
                                >
                                    <Plus size={16} className="mr-1" /> Nuovo Post-it
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveNotes}
                                    className={`text-sm px-4 py-2 rounded-lg font-bold flex items-center transition-colors shadow-sm ${isNotesSaved
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                            : 'bg-primary-600 text-white hover:bg-primary-700'
                                        }`}
                                >
                                    {isNotesSaved ? <CheckCircle size={16} className="mr-1" /> : <Save size={16} className="mr-1" />}
                                    {isNotesSaved ? 'Salvati!' : 'Salva Post-it'}
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4 border border-dashed border-gray-300 dark:border-slate-700 overflow-y-auto custom-scrollbar relative">
                            {localNotes.length === 0 ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 opacity-50">
                                    <StickyNote size={64} className="mb-4 stroke-1" />
                                    <p>Aggiungi un nuovo post-it per iniziare</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
                                    {localNotes.map(note => (
                                        <div
                                            key={note.id}
                                            className={`relative p-4 rounded-md shadow-md border transition-all hover:shadow-lg hover:-translate-y-1 flex flex-col h-64 ${getColorClasses(note.color)}`}
                                        >
                                            <div className="flex justify-between items-center mb-2 pb-2 border-b border-black/5 dark:border-white/10">
                                                <span className="text-[10px] font-bold opacity-60 uppercase">{new Date(note.date).toLocaleDateString()}</span>
                                                <div className="flex items-center gap-1">
                                                    <div className="flex gap-1 mr-2 bg-white/50 dark:bg-black/20 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:opacity-100">
                                                        {['yellow', 'blue', 'green', 'pink', 'purple'].map((c) => (
                                                            <button
                                                                key={c}
                                                                onClick={() => updateNoteColor(note.id, c as Note['color'])}
                                                                className={`w-3 h-3 rounded-full border border-black/10 ${c === 'yellow' ? 'bg-yellow-300' :
                                                                        c === 'blue' ? 'bg-blue-300' :
                                                                            c === 'green' ? 'bg-green-300' :
                                                                                c === 'pink' ? 'bg-pink-300' : 'bg-purple-300'
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <button onClick={() => deleteNote(note.id)} className="text-red-500/60 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-500/10">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            <textarea
                                                className="flex-1 w-full bg-transparent border-none resize-none focus:ring-0 outline-none text-sm text-gray-800 dark:text-gray-100 leading-relaxed font-medium placeholder-black/20 dark:placeholder-white/20"
                                                placeholder="Scrivi qui..."
                                                value={note.text}
                                                onChange={(e) => updateNoteText(note.id, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Profile;
