import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Newspaper, Plane, Receipt, Book, Clock, MessageCircle, ArrowRight,
  TrendingUp, Activity
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useData } from '../context/DataContext';

const Dashboard: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { interventions } = useData();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate simple stats for the chart
  const regularCount = interventions.filter(i => i.anomalies.length === 0).length;
  const issueCount = interventions.filter(i => i.anomalies.length > 0).length;

  const data = [
    { name: 'Regolari', value: regularCount },
    { name: 'Con Anomalie', value: issueCount },
  ];
  const COLORS = ['#10b981', '#ef4444'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center border-b border-gray-200 dark:border-slate-700 pb-4">
        <div>
           <h2 className="text-2xl font-bold text-primary-700 dark:text-blue-400">Panoramica Aziendale</h2>
           <p className="text-gray-500 dark:text-gray-400">Bentornato sulla tua dashboard operativa.</p>
        </div>
        <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {currentTime.toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-xl font-bold text-primary-700 dark:text-blue-400">
                {currentTime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* News Widget */}
        <section className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border-l-4 border-red-500 p-5 col-span-1 lg:col-span-2 transition-transform hover:-translate-y-1 duration-300">
          <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-slate-700 pb-2">
            <h3 className="text-lg font-bold text-primary-700 dark:text-blue-400 flex items-center">
              <Newspaper className="mr-2" size={20} /> Notizie e Annunci
            </h3>
          </div>
          <div className="space-y-3">
             <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-100 dark:border-red-900/50">
                <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase">Importante</span>
                <p className="text-sm mt-1">Nuova procedura di sicurezza per la revisione degli estintori a CO2 in vigore dal 1° Dicembre.</p>
             </div>
             <div className="p-2">
                <p className="text-sm text-gray-600 dark:text-gray-300">🎉 La cena aziendale di Natale si terrà il 20 Dicembre. Confermare presenza in segreteria.</p>
             </div>
          </div>
        </section>

        {/* Stats Widget */}
         <section className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border-l-4 border-emerald-500 p-5">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-slate-700 pb-2">
                <h3 className="text-lg font-bold text-primary-700 dark:text-blue-400 flex items-center">
                <TrendingUp className="mr-2" size={20} /> Stato Interventi
                </h3>
            </div>
            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={40}
                            outerRadius={60}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </section>

        {/* Quick Actions */}
        <section className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border-l-4 border-blue-500 p-5">
          <h3 className="text-lg font-bold text-primary-700 dark:text-blue-400 mb-4 pb-2 border-b border-gray-100 dark:border-slate-700 flex items-center">
             <Activity className="mr-2" size={20} /> Azioni Rapide
          </h3>
          <ul className="space-y-2">
            <li>
                <button className="w-full flex items-center p-3 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left text-gray-700 dark:text-gray-300">
                    <Plane className="mr-3 text-blue-500" size={18} /> Richiedi Ferie
                </button>
            </li>
            <li>
                <button className="w-full flex items-center p-3 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left text-gray-700 dark:text-gray-300">
                    <Receipt className="mr-3 text-blue-500" size={18} /> Report Spese
                </button>
            </li>
            <li>
                <button className="w-full flex items-center p-3 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left text-gray-700 dark:text-gray-300">
                    <Book className="mr-3 text-blue-500" size={18} /> Manuale HR
                </button>
            </li>
          </ul>
        </section>

        {/* Events */}
        <section className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border-l-4 border-yellow-500 p-5">
          <h3 className="text-lg font-bold text-primary-700 dark:text-blue-400 mb-4 pb-2 border-b border-gray-100 dark:border-slate-700 flex items-center">
             <Clock className="mr-2" size={20} /> Prossimi Eventi
          </h3>
          <div className="space-y-4">
             <div className="flex items-start space-x-3">
                <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-500 font-bold p-2 rounded text-center min-w-[3.5rem]">
                    <span className="block text-xs uppercase">Nov</span>
                    <span className="block text-xl">22</span>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">Riunione Tecnica</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Ore 14:00 - Sala Meeting A</p>
                </div>
             </div>
          </div>
        </section>

        {/* Chat Teaser */}
        <section className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border-l-4 border-green-500 p-5 col-span-1 md:col-span-2 lg:col-span-1">
          <h3 className="text-lg font-bold text-primary-700 dark:text-blue-400 mb-4 pb-2 border-b border-gray-100 dark:border-slate-700 flex items-center">
             <MessageCircle className="mr-2" size={20} /> Chat Colleghi
          </h3>
          <div className="text-center py-6">
             <p className="text-gray-500 dark:text-gray-400 mb-6 italic">Hai 3 messaggi non letti.</p>
             <Link to="/messages" className="inline-flex items-center justify-center w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md font-semibold transition-colors">
                Apri Chat Completa <ArrowRight className="ml-2" size={18} />
             </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
