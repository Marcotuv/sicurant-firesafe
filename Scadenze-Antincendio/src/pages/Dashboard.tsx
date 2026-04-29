import React, { useEffect, useState } from 'react';
import { Users, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { getAllClienti } from '../db';
import type { Cliente } from '../types';
import { isBefore, addDays, parseISO } from 'date-fns';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const [clienti, setClienti] = useState<Cliente[]>([]);

  useEffect(() => {
    const fetchClienti = async () => {
      const data = await getAllClienti();
      setClienti(data);
    };
    fetchClienti();
  }, []);

  const totalClienti = clienti.length;

  const upcomingDeadlines = clienti.filter(c => {
    if (!c.semestre1_data) return false;
    try {
      const date = parseISO(c.semestre1_data);
      return isBefore(date, addDays(new Date(), 30));
    } catch {
      return false;
    }
  }).length;

  return (
    <div className="animate-fade-in">
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Dashboard Overview</h2>
      
      <div className="dashboard-grid">
        <StatCard 
          title="Totale Clienti" 
          value={totalClienti.toString()} 
          icon={<Users size={24} style={{ color: 'var(--accent-blue)' }} />} 
        />
        <StatCard 
          title="Scadenze in 30gg" 
          value={upcomingDeadlines.toString()} 
          icon={<AlertTriangle size={24} style={{ color: 'var(--status-yellow)' }} />} 
        />
        <StatCard 
          title="Manutenzioni Completate" 
          value="0" 
          icon={<CheckCircle size={24} style={{ color: 'var(--status-green)' }} />} 
        />
        <StatCard 
          title="Interventi in Ritardo" 
          value="0" 
          icon={<Clock size={24} style={{ color: 'var(--status-red)' }} />} 
        />
      </div>
      
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 className="section-title">Prossime Scadenze</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Nessuna scadenza a breve termine rilevata.</p>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) => (
  <div className="glass-panel stat-card">
    <div className="stat-icon-wrapper">
      {icon}
    </div>
    <div>
      <h4 className="stat-title">{title}</h4>
      <p className="stat-value">{value}</p>
    </div>
  </div>
);
