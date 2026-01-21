
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { SpeedInsights } from '@vercel/speed-insights/react';

import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Lazy loading components
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const TechIntervention = React.lazy(() => import('./pages/TechIntervention'));
const InterventionLog = React.lazy(() => import('./pages/InterventionLog'));
const Anagraphics = React.lazy(() => import('./pages/Anagraphics'));
const Planning = React.lazy(() => import('./pages/Planning'));
const HrManagement = React.lazy(() => import('./pages/HrManagement'));
const Quotations = React.lazy(() => import('./pages/Quotations'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Documents = React.lazy(() => import('./pages/Documents'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Login = React.lazy(() => import('./pages/Login'));
const Inventory = React.lazy(() => import('./pages/Inventory'));
const Scheduler = React.lazy(() => import('./pages/Scheduler'));

import { DataProvider } from './context/DataContext';
import { ClientsProvider } from './context/ClientsContext';
import { AuthProvider, useAuth } from './context/AuthContext';

import { useAutoSync } from './hooks/useAutoSync';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  useAutoSync(); // Activate background sync
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const newVal = !prev;
      if (newVal) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return newVal;
    });
  };

  // Se stiamo caricando l'auth iniziale, mostra il loader a tutto schermo
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-slate-900">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin text-primary-600 w-12 h-12 mb-4" />
          <p className="text-gray-500 animate-pulse text-sm">Caricamento sessione...</p>
        </div>
      </div>
    );
  }

  // Se l'utente è loggato ma il profilo non è ancora arrivato (es. dopo il timeout di sicurezza)
  // mostriamo comunque un loader invece di far entrare l'utente con "permessi limitati"
  const { profile } = useAuth();
  if (user && !profile) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-slate-900">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin text-primary-600 w-12 h-12 mb-4" />
          <p className="text-gray-500 text-sm">Recupero profilo utente...</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 text-xs text-primary-600 hover:underline"
          >
            Riprova ricaricando la pagina
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-slate-900 transition-colors duration-300 font-sans print:block print:h-auto print:bg-white print:overflow-visible">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden print:overflow-visible print:h-auto print:block">
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

        <main className="flex-1 overflow-x-hidden overflow-y-auto sm:p-6 p-4 scroll-smooth print:overflow-visible print:h-auto print:p-0 print:m-0 print:block">
          <div className="container mx-auto max-w-7xl pb-10 print:max-w-none print:pb-0 print:w-full">
            <React.Suspense fallback={
              <div className="flex items-center justify-center p-12">
                <Loader2 className="animate-spin text-primary-600 w-8 h-8" />
              </div>
            }>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/planning" element={<Planning />} />
                <Route path="/hr-management" element={<HrManagement />} />
                <Route path="/quotations" element={<Quotations />} />
                <Route path="/technician" element={<TechIntervention />} />
                <Route path="/interventions" element={<InterventionLog />} />
                <Route path="/anagraphics" element={<Anagraphics />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/docs" element={<Documents />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/scheduler" element={<Scheduler />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </React.Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ClientsProvider>
        <DataProvider>
          <HashRouter>
            <AppContent />
            <SpeedInsights />
          </HashRouter>
        </DataProvider>
      </ClientsProvider>
    </AuthProvider>
  );
};

export default App;
