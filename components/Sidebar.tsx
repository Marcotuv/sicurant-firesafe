import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Wrench, ClipboardList, Database, FileText, Calendar, User, Settings } from 'lucide-react';

const Sidebar: React.FC = () => {
  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/messages", icon: MessageSquare, label: "Messaggistica" },
    { to: "/technician", icon: Wrench, label: "Gestione Intervento" },
    { to: "/interventions", icon: ClipboardList, label: "Registro Interventi" },
    { to: "/anagraphics", icon: Database, label: "Anagrafiche (Admin)" },
  ];

  const secondaryItems = [
    { to: "/docs", icon: FileText, label: "Documenti" },
    { to: "/calendar", icon: Calendar, label: "Calendario" },
    { to: "/profile", icon: User, label: "Profilo" },
    { to: "/settings", icon: Settings, label: "Impostazioni" },
  ];

  const linkClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center space-x-3 px-6 py-3 transition-colors duration-200 ${
      isActive 
        ? 'bg-primary-700 text-white dark:bg-primary-900' 
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-primary-700 dark:hover:text-primary-400'
    }`;

  return (
    <aside className="w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col h-full hidden md:flex shadow-sm z-10 transition-colors duration-300">
      <div className="p-6 border-b border-gray-100 dark:border-slate-700">
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Navigazione Rapida</h4>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul>
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} className={linkClass}>
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
        <hr className="my-4 border-gray-200 dark:border-slate-700 mx-6" />
        <ul>
          {secondaryItems.map((item) => (
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
        &copy; 2025 SafetyNet Intranet
      </div>
    </aside>
  );
};

export default Sidebar;
