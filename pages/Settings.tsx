
import React, { useState, useRef, useEffect } from 'react';
import { Save, Database, Download, Upload, Server, Globe, Check, Cloud, AlertTriangle, CheckCircle, Lock } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { envConfig } from '../config/supabase';

const Settings: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
      if (!isAdmin) {
          const t = setTimeout(() => navigate('/'), 3000);
          return () => clearTimeout(t);
      }
  }, [isAdmin, navigate]);

  const { exportData, importData, remoteUrl, setRemoteUrl, supabaseConfig, setSupabaseConfig, syncData } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Supabase State initialization
  const [sbUrl, setSbUrl] = useState(supabaseConfig?.url || '');
  const [sbKey, setSbKey] = useState(supabaseConfig?.key || '');
  const [urlInput, setUrlInput] = useState(remoteUrl || '');

  const [isSaved, setIsSaved] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{success: boolean; message: string} | null>(null);

  // Determina se stiamo usando le variabili d'ambiente
  const isEnvManaged = !!envConfig.url;

  useEffect(() => {
    if (supabaseConfig?.url) setSbUrl(supabaseConfig.url);
    if (supabaseConfig?.key) setSbKey(supabaseConfig.key);
    if (remoteUrl) setUrlInput(remoteUrl);
  }, [supabaseConfig, remoteUrl]);

  if (!isAdmin) {
      return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="bg-red-100 p-4 rounded-full mb-4">
                  <Lock size={48} className="text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Area Riservata</h2>
              <p className="text-gray-500 mt-2">Solo gli amministratori possono modificare le impostazioni di sistema.</p>
              <p className="text-sm text-gray-400 mt-4">Verrai reindirizzato alla Dashboard...</p>
          </div>
      );
  }

  const handleSaveConfig = () => {
      setRemoteUrl(urlInput);
      // Se gestito da ENV, non salviamo url/key nel local storage per evitare ridondanza/conflitti,
      // ma se l'utente vuole fare override manuale (solo se non gestito da env) lo permettiamo.
      if (!isEnvManaged) {
        setSupabaseConfig({ url: sbUrl, key: sbKey });
      }
      
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          const text = event.target?.result as string;
          if (!text) return;
          const success = importData(text);
          if (success) {
            setSyncResult({ success: true, message: "Importazione completata." });
            setTimeout(() => setSyncResult(null), 3000);
          }
          if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsText(file);
  };

  const handleManualSync = async () => {
      setIsSyncing(true);
      setSyncResult(null);
      
      const result = await syncData();
      
      setSyncResult(result);
      setIsSyncing(false);

      setTimeout(() => setSyncResult(null), 5000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-10">
       <div className="border-b border-gray-200 dark:border-slate-700 pb-4">
        <h2 className="text-2xl font-bold text-primary-700 dark:text-blue-400 flex items-center">
            <Database className="mr-3" /> Gestione Dati & Sincronizzazione
        </h2>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-slate-700">
          
          {/* SUPABASE CONFIG SECTION */}
          <div className="flex items-center mb-6 border-b border-gray-100 dark:border-slate-700 pb-4">
              <div className="p-3 rounded-full mr-4 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300">
                  <Cloud size={24} />
              </div>
              <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Configurazione Cloud (Consigliato)</h3>
                  <p className="text-sm text-gray-500">Connetti un database Supabase per la sincronizzazione bidirezionale tra tecnici.</p>
              </div>
          </div>
        
          {isEnvManaged && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded flex items-center">
                <Lock className="text-blue-500 mr-3" size={20} />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Gestito da Variabili d'Ambiente</strong>
                    <p>La configurazione è sicura e gestita dal file .env.local o dal server di deploy.</p>
                </div>
            </div>
          )}

          <div className={`grid grid-cols-1 gap-4 mb-8 ${isEnvManaged ? 'opacity-60 grayscale pointer-events-none' : ''}`}>
              <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Supabase Project URL</label>
                  <input 
                    type="text" 
                    className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="https://xyz.supabase.co"
                    value={sbUrl}
                    onChange={(e) => setSbUrl(e.target.value)}
                    disabled={isEnvManaged}
                  />
              </div>
              <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Supabase Anon Key</label>
                  <input 
                    type="password" 
                    className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={sbKey}
                    onChange={(e) => setSbKey(e.target.value)}
                    disabled={isEnvManaged}
                  />
              </div>
          </div>

          {/* LEGACY WEBHOOK SECTION */}
          <div className="flex items-center mb-6 border-b border-gray-100 dark:border-slate-700 pb-4 pt-4">
              <div className="p-3 rounded-full mr-4 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                  <Globe size={24} />
              </div>
              <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Backup HTTP (Legacy)</h3>
                  <p className="text-sm text-gray-500">Metodo alternativo: invio semplice a server (solo upload).</p>
              </div>
          </div>
          
          <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">URL Endpoint di Backup</label>
              <input 
                type="text" 
                className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="Es. https://webhook.site/..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
              />
          </div>

          <div className="text-right mb-8">
               <button 
                    onClick={handleSaveConfig}
                    className={`px-8 py-3 rounded-lg font-bold text-white transition-all inline-flex items-center shadow-md ${isSaved ? 'bg-green-500' : 'bg-primary-600 hover:bg-primary-700'}`}
                  >
                    {isSaved ? <><Check size={20} className="mr-2"/> Salvato</> : <><Save size={20} className="mr-2"/> Salva Configurazione</>}
               </button>
          </div>

          {/* MANUAL FILE SECTION */}
          <div className="flex items-center mb-6 border-t border-gray-200 dark:border-slate-700 pt-6">
              <div className="p-3 rounded-full mr-4 bg-gray-100 text-gray-500">
                  <Server size={24} />
              </div>
              <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Gestione Manuale (File)</h3>
                  <p className="text-sm text-gray-500">Esporta o importa manualmente i dati se offline.</p>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-900">
                  <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center"><Download size={20} className="mr-2 text-blue-500"/> Esporta File Locale</h4>
                  <button onClick={exportData} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-colors flex justify-center items-center mt-4">
                      <Download size={18} className="mr-2"/> Scarica Dati
                  </button>
              </div>

              <div className="p-5 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-900">
                  <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center"><Upload size={20} className="mr-2 text-emerald-500"/> Importa Backup</h4>
                  <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                  <button onClick={handleImportClick} className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold transition-colors flex justify-center items-center mt-4">
                      <Upload size={18} className="mr-2"/> Carica Dati
                  </button>
              </div>
          </div>
          
          {(sbUrl || urlInput) && (
             <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700 text-center">
                 <button 
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-8 py-4 rounded-xl font-bold shadow-xl flex items-center justify-center mx-auto text-lg transform hover:scale-105 transition-transform"
                 >
                     {isSyncing ? (
                         <>
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                            Sincronizzazione Cloud...
                         </>
                     ) : (
                         <>
                            <Cloud size={24} className="mr-2" /> Sincronizza Ora
                         </>
                     )}
                 </button>
                 
                 {/* FEEDBACK VISIVO DEL RISULTATO */}
                 {syncResult && (
                     <div className={`mt-4 p-4 rounded-lg flex items-center justify-center max-w-md mx-auto animate-fade-in ${syncResult.success ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                         {syncResult.success ? (
                             <CheckCircle size={20} className="mr-2 flex-shrink-0" />
                         ) : (
                             <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
                         )}
                         <span className="font-medium">{syncResult.message}</span>
                     </div>
                 )}

                 <p className="text-xs text-gray-400 mt-2">
                     {sbUrl ? "Usa Cloud DB (Supabase)" : "Usa Webhook HTTP"}
                 </p>
             </div>
          )}
      </div>
    </div>
  );
};

export default Settings;
