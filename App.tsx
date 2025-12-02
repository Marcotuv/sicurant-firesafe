import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import TechIntervention from './pages/TechIntervention';
import InterventionLog from './pages/InterventionLog';
import Anagraphics from './pages/Anagraphics';
import Chat from './pages/Chat';
import Settings from './pages/Settings'; 
import { DataProvider } from './context/DataContext';

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check local storage or preference
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

  return (
    <DataProvider>
      <HashRouter>
        <div className="flex h-screen bg-gray-100 dark:bg-slate-900 transition-colors duration-300 font-sans">
          <Sidebar />
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            
            <main className="flex-1 overflow-x-hidden overflow-y-auto sm:p-6 p-4 scroll-smooth">
              <div className="container mx-auto max-w-7xl pb-10">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/technician" element={<TechIntervention />} />
                  <Route path="/interventions" element={<InterventionLog />} />
                  <Route path="/anagraphics" element={<Anagraphics />} />
                  <Route path="/messages" element={<Chat />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </main>
          </div>
        </div>
      </HashRouter>
    </DataProvider>
  );
};

export default App;