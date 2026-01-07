
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import TechIntervention from './pages/TechIntervention';
import InterventionLog from './pages/InterventionLog';
import Anagraphics from './pages/Anagraphics';
import Planning from './pages/Planning';
import HrManagement from './pages/HrManagement';
import Quotations from './pages/Quotations'; // NUOVO
import Settings from './pages/Settings'; 
import Documents from './pages/Documents'; 
import Profile from './pages/Profile';
import Login from './pages/Login';

import { DataProvider } from './context/DataContext';
import { ClientsProvider } from './context/ClientsContext';
import { AuthProvider, useAuth } from './context/AuthContext';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
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

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-slate-900">
        <Loader2 className="animate-spin text-primary-600 w-12 h-12" />
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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
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
          </HashRouter>
        </DataProvider>
      </ClientsProvider>
    </AuthProvider>
  );
};

export default App;
