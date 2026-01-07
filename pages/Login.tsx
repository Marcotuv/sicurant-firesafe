
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, AlertCircle, Info, ChevronDown } from 'lucide-react';
import { useData } from '../context/DataContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, getMockUsers } = useAuth();
  const { syncData, remoteUrl, supabaseConfig } = useData();
  const navigate = useNavigate();

  const mockUsers = getMockUsers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);
    
    if (error) {
      setError(error.message || 'Credenziali non valide');
      setLoading(false);
    } else {
      if (remoteUrl || (supabaseConfig.url && supabaseConfig.key)) {
          syncData().catch(console.error);
      }
      navigate('/');
    }
  };

  const handleQuickLogin = (userEmail: string) => {
      setEmail(userEmail);
      // In un'app reale non si farebbe auto-submit, ma qui è per demo
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900 p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-8 border border-gray-200 dark:border-slate-700">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mb-4 ring-4 ring-red-50 dark:ring-red-900/10">
            <svg className="w-8 h-8 text-red-600 dark:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l3-3m0 0v6m0-6h-6M9 18h6m-3-3v6m0-6a6 6 0 100-12 6 6 0 000 12z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sicur.Ant</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Intranet Gestione Antincendio</p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-6 flex items-start">
            <Info className="text-blue-500 mr-2 flex-shrink-0 mt-0.5" size={18} />
            <div className="text-xs text-blue-800 dark:text-blue-200">
                <strong>Simulazione Ruoli Attiva</strong><br/>
                Scegli un utente dalla lista sottostante per testare i diversi permessi.
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start animate-fade-in">
              <AlertCircle className="text-red-500 mr-3 flex-shrink-0 mt-0.5" size={20} />
              <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
            </div>
          )}

          {/* Quick Login Selector */}
          <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Accesso Rapido (Demo)
              </label>
              <div className="relative">
                  <select 
                    onChange={(e) => handleQuickLogin(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors appearance-none cursor-pointer"
                    value={email}
                  >
                      <option value="">-- Seleziona Utente --</option>
                      <optgroup label="Super Admin">
                          {mockUsers.filter(u => u.role === 'admin').map(u => (
                              <option key={u.email} value={u.email}>{u.name} (Admin)</option>
                          ))}
                      </optgroup>
                      <optgroup label="Ufficio / Amministrazione">
                          {mockUsers.filter(u => u.role === 'office').map(u => (
                              <option key={u.email} value={u.email}>{u.name}</option>
                          ))}
                      </optgroup>
                      <optgroup label="Tecnici">
                          {mockUsers.filter(u => u.role === 'technician').map(u => (
                              <option key={u.email} value={u.email}>{u.name}</option>
                          ))}
                      </optgroup>
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={16}/>
              </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email (Manuale)
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
              placeholder="nome.cognome@sicurant.it"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <LogIn size={20} className="mr-2" />
                Accedi
              </>
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
                &copy; 2025 Sicur.Ant - Accesso Riservato Personale Autorizzato
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
