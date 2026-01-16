
import React from 'react';
import { AlertTriangle, RefreshCw, Save, XCircle } from 'lucide-react';

interface ConflictWarningProps {
    isOpen: boolean;
    onClose: () => void;
    onOverwrite: () => void;
    onReload: () => void;
    itemName?: string;
}

const ConflictWarning: React.FC<ConflictWarningProps> = ({
    isOpen,
    onClose,
    onOverwrite,
    onReload,
    itemName = 'questo record'
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-amber-200 dark:border-amber-900/50 animate-in zoom-in-95 duration-200">
                <div className="bg-amber-50 dark:bg-amber-900/20 p-6 flex items-start gap-4">
                    <div className="bg-amber-100 dark:bg-amber-900/40 p-3 rounded-full">
                        <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Conflitto di Modifica</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                            Attenzione! Sembra che <strong>{itemName}</strong> sia stato modificato da un altro utente mentre lo stavi modificando tu.
                        </p>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Cosa vuoi fare?</p>

                    <button
                        onClick={onReload}
                        className="w-full flex items-center gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 transition-colors border border-blue-100 dark:border-blue-900/30 text-left"
                    >
                        <RefreshCw className="w-5 h-5 flex-shrink-0" />
                        <div>
                            <div className="font-bold">Scarica versione cloud</div>
                            <div className="text-xs opacity-80">Perderai le tue modifiche locali e vedrai i dati aggiornati.</div>
                        </div>
                    </button>

                    <button
                        onClick={onOverwrite}
                        className="w-full flex items-center gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400 transition-colors border border-amber-100 dark:border-amber-900/30 text-left"
                    >
                        <Save className="w-5 h-5 flex-shrink-0" />
                        <div>
                            <div className="font-bold">Sovrascrivi comunque</div>
                            <div className="text-xs opacity-80">Forzerai le tue modifiche al server, cancellando quelle altrui.</div>
                        </div>
                    </button>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-slate-900/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        Annulla e chiudi
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConflictWarning;
