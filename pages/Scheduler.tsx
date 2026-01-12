import React, { useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { it } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const locales = {
    'it': it,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const Scheduler: React.FC = () => {
    const { sessions, technicians, clients } = useData();
    const { profile } = useAuth();
    const navigate = useNavigate();

    // Permissions check
    if (profile?.role === 'technician') {
        return <div className="p-4 text-center">Area riservata all'Ufficio</div>;
    }

    const events = useMemo(() => {
        return sessions
            .filter(s => s.status === 'PLANNED' && s.scheduledDate)
            .map(s => {
                const clientName = clients.find(c => c.id === s.clientId)?.nome || 'Cliente Sconosciuto';
                const date = new Date(s.scheduledDate!);
                return {
                    id: s.id,
                    title: `${clientName} (${s.assignedTechName || 'Non assegnato'})`,
                    start: date,
                    end: new Date(date.getTime() + (2 * 60 * 60 * 1000)), // Default 2h duration visuale
                    resource: s
                };
            });

    }, [sessions, clients]);

    const handleSelectEvent = (event: any) => {
        // Navigate to planning view where sessions are managed
        navigate(`/planning`);
    };

    return (
        <div className="h-screen flex flex-col p-4 bg-white">
            <h1 className="text-2xl font-bold mb-4">Pianificazione Interventi</h1>
            <div className="flex-1">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    culture="it"
                    onSelectEvent={handleSelectEvent}
                    messages={{
                        next: "Succ",
                        previous: "Prec",
                        today: "Oggi",
                        month: "Mese",
                        week: "Settimana",
                        day: "Giorno"
                    }}
                />
            </div>
        </div>
    );
};

export default Scheduler;
