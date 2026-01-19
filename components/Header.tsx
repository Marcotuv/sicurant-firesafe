
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, LogOut, Bell, Trash2, Info, AlertTriangle, CheckCircle, XCircle, Menu, X, LayoutDashboard, Wrench, ClipboardList, Database, Settings, Cloud, CloudOff, FileText, User, CalendarRange } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useClients } from '../context/ClientsContext';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ darkMode, toggleDarkMode }) => {
  const { notifications, markNotificationAsRead, clearAllNotifications, supabaseConfig, syncStatus, lastSyncTime, syncData, clearAllDataLocal } = useData();
  const { clearClientsData } = useClients();
  const { user, profile, signOut } = useAuth();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // FIX: Unread count based on readBy array
  const currentUserId = user?.id || '';
  const unreadCount = notifications.filter(n => !n.readBy.includes(currentUserId)).length;

  const isCloudConfigured = !!(supabaseConfig?.url && supabaseConfig?.key);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMobileNav = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    // Forzare sync prima del logout
    await signOut(async () => {
      console.log("[Header] Starting pre-logout sync...");
      await syncData().catch(e => console.warn("Logout sync failed", e));
      await clearAllDataLocal();
      await clearClientsData();
    });
    navigate('/login');
  };

  const handleMarkAsRead = (id: string) => {
    if (currentUserId) {
      markNotificationAsRead(id, currentUserId);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle size={18} className="text-yellow-500" />;
      case 'alert': return <XCircle size={18} className="text-red-500" />;
      case 'success': return <CheckCircle size={18} className="text-emerald-500" />;
      default: return <Info size={18} className="text-blue-500" />;
    }
  };

  const getBgColor = (type: string, read: boolean) => {
    if (read) return 'bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700';
    switch (type) {
      case 'warning': return 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400';
      case 'alert': return 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500';
      case 'success': return 'bg-green-50 dark:bg-green-900/20 border-l-4 border-emerald-500';
      default: return 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400';
    }
  };

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/planning", icon: CalendarRange, label: "Pianificazione" },
    { to: "/technician", icon: Wrench, label: "Interventi Assegnati" },
    { to: "/interventions", icon: ClipboardList, label: "Registro Interventi" },
    { to: "/anagraphics", icon: Database, label: "Anagrafiche (Admin)" },
  ];

  // Helper per le iniziali
  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <header className="bg-primary-700 dark:bg-slate-900 text-white shadow-md h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-50 transition-colors duration-300">
      <div className="flex items-center space-x-3">
        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-1 hover:bg-white/10 rounded focus:outline-none transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Logo Sicur. Ant (SVG Inline) */}
        <div className="bg-white p-0.5 rounded-full h-11 w-11 flex items-center justify-center overflow-hidden shrink-0 shadow-sm ring-2 ring-white/20">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-xl font-bold tracking-tight hidden sm:block">Sicur.Ant <span className="font-normal opacity-80 text-sm">Intranet</span></h1>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">

        {/* Cloud Status Indicator */}
        <div className="hidden sm:flex items-center" title={
          syncStatus === 'offline' ? "Modalità Offline" :
            syncStatus === 'syncing' ? "Sincronizzazione in corso..." :
              syncStatus === 'error' ? "Errore di sincronizzazione" :
                `Sincronizzato alle ${lastSyncTime || '---'}`
        }>
          {!isCloudConfigured ? (
            <div className="bg-gray-100 dark:bg-slate-800 text-gray-400 p-2 rounded-full transition-colors cursor-not-allowed">
              <CloudOff size={20} />
            </div>
          ) : (
            <button
              onClick={() => syncData()}
              disabled={syncStatus === 'syncing'}
              className={`p-2 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center outline-none focus:ring-2 focus:ring-white/20 ${syncStatus === 'syncing'
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 animate-pulse"
                  : syncStatus === 'error'
                    ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200"
                    : syncStatus === 'offline'
                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200"
                      : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200"
                }`}
            >
              <Cloud
                size={20}
                className={syncStatus === 'syncing' ? "animate-spin-slow" : ""}
              />
            </button>
          )}
        </div>

        {/* Notification Area */}
        <div className="relative" ref={notificationRef}>
          <button
            className="p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none relative group"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            title="Notifiche"
          >
            <Bell size={20} className={`transition-transform duration-300 ${isNotificationsOpen ? 'rotate-12' : 'group-hover:rotate-12'}`} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold animate-pulse ring-2 ring-primary-700 dark:ring-slate-900">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 overflow-hidden origin-top-right transform transition-all z-50">
              <div className="p-3 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">Notifiche ({unreadCount})</h3>
                {notifications.length > 0 && (
                  <button
                    onClick={() => clearAllNotifications(currentUserId)}
                    className="text-xs text-gray-500 hover:text-red-500 flex items-center transition-colors px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-slate-700"
                  >
                    <Trash2 size={12} className="mr-1" /> Cancella tutto
                  </button>
                )}
              </div>

              <div className="max-h-[24rem] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center flex flex-col items-center text-gray-400 dark:text-gray-500">
                    <Bell size={32} className="mb-2 opacity-20" />
                    <span className="text-sm">Nessuna nuova notifica</span>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-slate-700">
                    {notifications.filter(n => !n.clearedBy?.includes(currentUserId)).map((notification) => {
                      const isRead = notification.readBy.includes(currentUserId);
                      return (
                        <li
                          key={notification.id}
                          className={`p-4 cursor-pointer transition-colors ${getBgColor(notification.type, isRead)}`}
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="mt-0.5 flex-shrink-0">
                              {getIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <p className={`text-sm font-medium truncate pr-2 ${isRead ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                  {notification.title}
                                </p>
                                {!isRead && (
                                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-2 text-right">
                                {new Date(notification.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none"
          title={darkMode ? "Modalità Chiara" : "Modalità Scura"}
        >
          {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
        </button>

        {/* User Profile */}
        <div className="flex items-center space-x-3 pl-2 border-l border-white/20">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-medium opacity-90 truncate max-w-[150px]">
              {profile?.full_name || user?.email || 'Tecnico'}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-70 bg-black/20 px-1.5 py-0.5 rounded">
              {profile?.role || 'Utente'}
            </span>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white rounded-full flex items-center justify-center text-primary-700 border-2 border-white/20 overflow-hidden shadow-sm">
            <span className="font-bold text-lg">{getInitials()}</span>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center ml-2 shadow-sm hidden sm:flex"
            title="Esci"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="absolute top-16 left-0 w-full bg-white dark:bg-slate-900 shadow-xl border-b border-gray-200 dark:border-slate-700 md:hidden animate-fade-in z-40 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="flex flex-col p-4 space-y-2">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex justify-between items-center">
              <span>Menu Navigazione</span>
              {isCloudConfigured && (
                <button
                  onClick={() => { syncData(); setIsMobileMenuOpen(false); }}
                  className={`flex items-center space-x-1 text-[10px] px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors ${syncStatus === 'syncing' ? 'animate-pulse' : ''}`}
                >
                  <Cloud size={12} className={syncStatus === 'syncing' ? 'animate-spin-slow' : ''} />
                  <span>{syncStatus === 'syncing' ? 'Sincronizzazione...' : 'Sync Ora'}</span>
                </button>
              )}
            </div>
            {navItems.map((item) => (
              <button
                key={item.to}
                onClick={() => handleMobileNav(item.to)}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors w-full text-left"
              >
                <item.icon size={20} className="text-primary-600 dark:text-blue-400" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
            <hr className="my-2 border-gray-100 dark:border-slate-700" />
            <button
              onClick={() => handleMobileNav('/profile')}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors w-full text-left"
            >
              <User size={20} className="text-primary-600 dark:text-blue-400" />
              <span className="font-medium">Profilo Personale</span>
            </button>
            <button
              onClick={() => handleMobileNav('/docs')}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors w-full text-left"
            >
              <FileText size={20} className="text-primary-600 dark:text-blue-400" />
              <span className="font-medium">Documenti</span>
            </button>
            <button
              onClick={() => handleMobileNav('/settings')}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors w-full text-left"
            >
              <Settings size={20} className="text-primary-600 dark:text-blue-400" />
              <span className="font-medium">Impostazioni</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 w-full text-left transition-colors"
            >
              <LogOut size={20} /> <span className="font-medium">Esci</span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
