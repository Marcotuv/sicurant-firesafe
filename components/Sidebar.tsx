
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wrench, ClipboardList, Database, FileText, User, Settings, CalendarRange, Users, ReceiptEuro, Package, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar: React.FC = () => {
  const { profile } = useAuth();

  const isAdmin = profile?.role === 'admin';
  const isOffice = profile?.role === 'office';
  const canManageData = isAdmin || isOffice;

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard", visible: true, end: true },
    { to: "/scheduler", icon: Calendar, label: "Calendario", visible: canManageData }, // NUOVO
    { to: "/planning", icon: CalendarRange, label: "Pianificazione", visible: true },
    { to: "/inventory", icon: Package, label: "Magazzino", visible: true }, // NUOVO

    { to: "/quotations", icon: ReceiptEuro, label: "Preventivi", visible: canManageData },
    { to: "/technician", icon: Wrench, label: "Interventi Assegnati", visible: true },
    { to: "/interventions", icon: ClipboardList, label: "Registro Interventi", visible: true },
    { to: "/anagraphics", icon: Database, label: "Anagrafiche", visible: canManageData },
  ];

  const secondaryItems = [
    { to: "/docs", icon: FileText, label: "Documenti", visible: true },
    { to: "/profile", icon: User, label: "Profilo", visible: true },
    { to: "/settings", icon: Settings, label: "Impostazioni", visible: isAdmin },
  ];

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-3 px-6 py-3 transition-colors duration-200 ${isActive
      ? 'bg-primary-700 text-white dark:bg-primary-900'
      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-primary-700 dark:hover:text-primary-400'
    }`;

  return (
    <aside className="w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col h-full hidden md:flex shadow-sm z-10 transition-colors duration-300">
      <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex flex-col items-center">
        <img src="/logo.png" alt="Sicur.Ant Logo" className="w-24 h-24 object-contain mb-4" />
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Navigazione Rapida</h4>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul>
          {navItems.filter(item => item.visible).map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.end} className={linkClass}>
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
        <hr className="my-4 border-gray-200 dark:border-slate-700 mx-6" />
        <ul>
          {secondaryItems.filter(item => item.visible).map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} className={linkClass}>
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 text-center text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-slate-700">
        &copy; 2025 SafetyNet Intranet v2.9.4
      </div>
    </aside>
  );
};

export default Sidebar;
