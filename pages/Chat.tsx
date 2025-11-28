import React, { useState } from 'react';
import { Search, Send, MoreVertical, Phone, Video } from 'lucide-react';

const Chat: React.FC = () => {
  const [selectedChat, setSelectedChat] = useState(0);
  const [inputText, setInputText] = useState("");

  const contacts = [
    { id: 0, name: "Ufficio Tecnico", lastMsg: "Hai inviato il report?", time: "10:30", unread: 2, avatar: "T" },
    { id: 1, name: "Segreteria", lastMsg: "Confermata cena di Natale", time: "Ieri", unread: 0, avatar: "S" },
    { id: 2, name: "Mario Rossi", lastMsg: "Ok, procedo con la revisione.", time: "Lun", unread: 0, avatar: "M" },
  ];

  const messages = [
    { id: 1, sender: 'them', text: 'Ciao, hai completato il giro all\'Hotel Bellavista?', time: '10:15' },
    { id: 2, sender: 'me', text: 'Sì, sto caricando i dati ora. C\'era un estintore con accesso ostruito.', time: '10:20' },
    { id: 3, sender: 'them', text: 'Perfetto, segnalalo nelle note. Hai inviato il report?', time: '10:30' },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden h-[calc(100vh-140px)] flex border border-gray-200 dark:border-slate-700">
      
      {/* Sidebar List */}
      <div className="w-80 border-r border-gray-200 dark:border-slate-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
             <div className="relative">
                <input 
                    type="text" 
                    placeholder="Cerca conversazione..." 
                    className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-slate-900 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none text-gray-800 dark:text-gray-200"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
             </div>
        </div>
        <div className="flex-1 overflow-y-auto">
            {contacts.map(contact => (
                <div 
                    key={contact.id}
                    onClick={() => setSelectedChat(contact.id)}
                    className={`flex items-center p-4 cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors ${
                        selectedChat === contact.id ? 'bg-blue-50 dark:bg-slate-700' : ''
                    }`}
                >
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-slate-600 flex items-center justify-center text-primary-700 dark:text-blue-300 font-bold mr-3">
                        {contact.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{contact.name}</h4>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{contact.time}</span>
                        </div>
                        <p className={`text-sm truncate ${contact.unread > 0 ? 'font-bold text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
                            {contact.lastMsg}
                        </p>
                    </div>
                    {contact.unread > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{contact.unread}</span>
                    )}
                </div>
            ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-slate-900/50">
         {/* Chat Header */}
         <div className="p-4 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
            <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-slate-600 flex items-center justify-center text-primary-700 dark:text-blue-300 font-bold mr-3">
                    {contacts[selectedChat].avatar}
                </div>
                <div>
                    <h4 className="font-bold text-gray-800 dark:text-gray-100">{contacts[selectedChat].name}</h4>
                    <span className="text-xs text-green-500 flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span> Online</span>
                </div>
            </div>
            <div className="flex space-x-3 text-gray-500 dark:text-gray-400">
                <button className="hover:text-primary-600 dark:hover:text-blue-400"><Phone size={20}/></button>
                <button className="hover:text-primary-600 dark:hover:text-blue-400"><Video size={20}/></button>
                <button className="hover:text-primary-600 dark:hover:text-blue-400"><MoreVertical size={20}/></button>
            </div>
         </div>

         {/* Messages */}
         <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map(msg => (
                <div key={msg.id} className={`flex flex-col max-w-[70%] ${msg.sender === 'me' ? 'self-end items-end' : 'self-start items-start'}`}>
                    <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${
                        msg.sender === 'me' 
                        ? 'bg-primary-600 text-white rounded-br-none' 
                        : 'bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
                    }`}>
                        {msg.text}
                    </div>
                    <span className="text-xs text-gray-400 mt-1">{msg.time}</span>
                </div>
            ))}
         </div>

         {/* Input Area */}
         <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
            <div className="flex items-center space-x-3">
                <input 
                    type="text" 
                    placeholder="Scrivi un messaggio..." 
                    className="flex-1 p-3 bg-gray-100 dark:bg-slate-900 rounded-lg border-none focus:ring-2 focus:ring-primary-500 outline-none text-gray-800 dark:text-gray-200"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                />
                <button className="p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
                    <Send size={20} />
                </button>
            </div>
         </div>
      </div>

    </div>
  );
};

export default Chat;
