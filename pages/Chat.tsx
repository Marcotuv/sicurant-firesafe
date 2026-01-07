
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Send, MoreVertical, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Chat: React.FC = () => {
  const { getMockUsers, profile } = useAuth();
  const [selectedChat, setSelectedChat] = useState(0);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Genera lista contatti reali filtrando l'utente corrente
  const contacts = useMemo(() => {
      const allUsers = getMockUsers();
      // Filtra l'utente loggato
      const otherUsers = allUsers.filter(u => u.email !== profile?.email);
      
      // Mappa nel formato richiesto dalla UI
      return otherUsers.map((u, index) => {
          // Genera dati dummy per la demo
          const isOffice = u.role === 'office' || u.role === 'admin';
          return {
              id: index,
              name: u.name,
              role: u.role,
              lastMsg: isOffice ? "Ricordati di caricare i rapportini." : "Intervento concluso.",
              time: "09:00",
              unread: index === 0 ? 1 : 0, // Solo il primo ha messaggi non letti per demo
              avatar: u.name.charAt(0).toUpperCase()
          };
      });
  }, [getMockUsers, profile]);

  // Convertito in State per gestire nuovi messaggi
  const [messages, setMessages] = useState([
    { id: 1, sender: 'them', text: 'Ciao, hai completato il giro all\'Hotel Bellavista?', time: '10:15' },
    { id: 2, sender: 'me', text: 'Sì, sto caricando i dati ora. C\'era un estintore con accesso ostruito.', time: '10:20' },
    { id: 3, sender: 'them', text: 'Perfetto, segnalalo nelle note. Hai inviato il report?', time: '10:30' },
    { id: 4, sender: 'me', text: 'Certamente. Allego anche la foto nel report tecnico.', time: '10:32' },
    { id: 5, sender: 'them', text: 'Ottimo lavoro. A dopo.', time: '10:35' },
  ]);

  // Auto-scroll all'ultimo messaggio
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
      if (!inputText.trim()) return;

      const now = new Date();
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const newMessage = {
          id: Date.now(),
          sender: 'me',
          text: inputText,
          time: timeString
      };

      setMessages(prev => [...prev, newMessage]);
      setInputText("");

      // Simulazione risposta automatica (Demo)
      setTimeout(() => {
          const reply = {
              id: Date.now() + 1,
              sender: 'them',
              text: 'Messaggio ricevuto. Grazie dell\'aggiornamento.',
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, reply]);
      }, 1000);
  };

  const currentContact = contacts[selectedChat];

  return (
    // Adjusted height to better fit mobile viewports without scrolling the main body
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden flex border border-gray-200 dark:border-slate-700 relative h-[calc(100vh-6rem)] md:h-[calc(100vh-8.5rem)]">
      
      {/* Sidebar List */}
      <div className={`w-full md:w-80 border-r border-gray-200 dark:border-slate-700 flex-col bg-white dark:bg-slate-800 z-10 ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
             <div className="relative">
                <input 
                    type="text" 
                    placeholder="Cerca collega..." 
                    className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-slate-900 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none text-gray-800 dark:text-gray-200 transition-colors"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
             </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {contacts.map(contact => (
                <div 
                    key={contact.id}
                    onClick={() => {
                        setSelectedChat(contact.id);
                        setShowMobileChat(true);
                    }}
                    className={`flex items-center p-4 cursor-pointer border-b border-gray-50 dark:border-slate-700/50 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors ${
                        selectedChat === contact.id ? 'bg-blue-50 dark:bg-slate-700' : ''
                    }`}
                >
                    <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-slate-600 flex items-center justify-center text-primary-700 dark:text-blue-300 font-bold mr-3 flex-shrink-0 text-lg relative">
                        {contact.avatar}
                        {/* Status Indicator based on role */}
                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${contact.role === 'admin' || contact.role === 'office' ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                            <h4 className="font-bold text-gray-900 dark:text-gray-100 truncate text-sm">{contact.name}</h4>
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">{contact.time}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className={`text-xs truncate pr-2 ${contact.unread > 0 ? 'font-bold text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
                                {contact.lastMsg}
                            </p>
                            {contact.unread > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[1.25rem] text-center">
                                    {contact.unread}
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">{contact.role}</span>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex-col bg-gray-50 dark:bg-slate-900/50 w-full ${showMobileChat ? 'flex fixed inset-0 top-16 bottom-0 z-20 md:static md:inset-auto' : 'hidden md:flex'}`}>
         {/* Chat Header */}
         {currentContact && (
             <div className="p-3 md:p-4 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0 shadow-sm">
                <div className="flex items-center">
                    <button 
                        onClick={() => setShowMobileChat(false)}
                        className="md:hidden mr-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 transition-colors"
                    >
                        <ArrowLeft size={22}/>
                    </button>

                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-slate-600 flex items-center justify-center text-primary-700 dark:text-blue-300 font-bold mr-3">
                        {currentContact.avatar}
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm md:text-base">{currentContact.name}</h4>
                        <span className="text-xs text-green-600 dark:text-green-400 flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span> Online</span>
                    </div>
                </div>
                <div className="flex space-x-1 md:space-x-2 text-gray-500 dark:text-gray-400">
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"><MoreVertical size={20}/></button>
                </div>
             </div>
         )}

         {/* Messages */}
         <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#e5ddd5] dark:bg-slate-900/80" style={{backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundBlendMode: "overlay"}}>
            {messages.map(msg => (
                <div key={msg.id} className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${msg.sender === 'me' ? 'self-end items-end' : 'self-start items-start'}`}>
                    <div className={`px-4 py-2 rounded-xl text-sm shadow-md relative ${
                        msg.sender === 'me' 
                        ? 'bg-[#dcf8c6] dark:bg-primary-900 text-gray-800 dark:text-gray-100 rounded-tr-none' 
                        : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 rounded-tl-none'
                    }`}>
                        {msg.text}
                        <div className={`text-[10px] text-right mt-1 ${msg.sender === 'me' ? 'text-green-800 dark:text-green-200' : 'text-gray-400'}`}>
                            {msg.time}
                        </div>
                    </div>
                </div>
            ))}
            <div ref={messagesEndRef} />
         </div>

         {/* Input Area */}
         <div className="p-3 md:p-4 bg-gray-100 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 flex-shrink-0">
            <div className="flex items-center space-x-2">
                <input 
                    type="text" 
                    placeholder="Scrivi un messaggio..." 
                    className="flex-1 p-3 bg-white dark:bg-slate-700 rounded-full border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none text-gray-800 dark:text-gray-100 transition-colors shadow-sm"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button 
                    onClick={handleSendMessage}
                    className="p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-full transition-colors shadow-lg flex-shrink-0"
                >
                    <Send size={20} className="ml-0.5" />
                </button>
            </div>
         </div>
      </div>

    </div>
  );
};

export default Chat;
