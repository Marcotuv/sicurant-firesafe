import React from 'react';
import { ShieldAlert, Users, LayoutDashboard, Download, Upload } from 'lucide-react';
import { clearDatabase, getAllClienti, importData } from '../db';
import type { Cliente } from '../types';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {

  const handleExport = async () => {
    try {
      const clienti = await getAllClienti();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(clienti, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `sicurant_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (e) {
      alert("Errore durante l'esportazione");
    }
  };

  const handleImport = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const data: Cliente[] = JSON.parse(content);
          if (Array.isArray(data)) {
            // Rimuoviamo l'ID per forzare l'assegnazione automatica (evita collisioni se importiamo su un db vuoto)
            const cleanData = data.map(d => {
              const { id, ...rest } = d;
              return rest as Cliente;
            });
            await clearDatabase(); // Opzionale: puliamo prima di importare? o facciamo merge? Per semplicità: sostituiamo.
            await importData(cleanData);
            alert("Dati importati con successo! Ricarica la pagina.");
            window.location.reload();
          } else {
            alert("Formato file non valido.");
          }
        } catch (err) {
          alert("Errore nella lettura del file.");
          console.error(err);
        }
      };
      reader.readAsText(file);
    };
    fileInput.click();
  }

  return (
    <header className="glass-panel mb-4 p-4 flex justify-between items-center sticky top-4 z-50">
      <div className="flex items-center gap-2 text-status-red" style={{ cursor: 'pointer' }} onClick={() => onNavigate('dashboard')}>
        <ShieldAlert size={28} />
        <h1 className="text-xl font-bold text-text-primary hidden sm:block">SICURANT FireSafe <span className="text-text-secondary font-medium text-sm">Local</span></h1>
      </div>
      
      <nav className="flex gap-4">
        <button 
          onClick={() => onNavigate('dashboard')}
          className={`flex items-center gap-2 p-2 rounded-md transition-colors ${currentView === 'dashboard' ? 'bg-bg-secondary text-accent-blue' : 'text-text-secondary hover:text-text-primary'}`}
        >
          <LayoutDashboard size={20} />
          <span className="hidden sm:block font-medium">Dashboard</span>
        </button>
        
        <button 
          onClick={() => onNavigate('clienti')}
          className={`flex items-center gap-2 p-2 rounded-md transition-colors ${currentView === 'clienti' ? 'bg-bg-secondary text-accent-blue' : 'text-text-secondary hover:text-text-primary'}`}
        >
          <Users size={20} />
          <span className="hidden sm:block font-medium">Archivio Clienti</span>
        </button>

        <div className="h-8 w-px bg-border-subtle mx-2 self-center"></div>

        <button 
          onClick={handleExport}
          title="Esporta Backup Dati"
          className="flex items-center gap-2 p-2 rounded-md transition-colors text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
        >
          <Download size={20} />
        </button>
        
        <button 
          onClick={handleImport}
          title="Importa Dati / Ripristina Backup"
          className="flex items-center gap-2 p-2 rounded-md transition-colors text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
        >
          <Upload size={20} />
        </button>
      </nav>
    </header>
  );
};
