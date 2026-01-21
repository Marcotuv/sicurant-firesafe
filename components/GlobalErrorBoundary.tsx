
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { clear } from 'idb-keyval';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    private handleReset = async () => {
        try {
            if (confirm("Attenzione: Questa operazione cancellerà la cache locale e ricaricherà l'applicazione. I dati non sincronizzati potrebbero andare persi. Continuare?")) {
                console.log("Clearing IDB and LocalStorage...");
                await clear(); // Clear IndexedDB
                localStorage.clear(); // Clear LocalStorage
                window.location.reload();
            }
        } catch (e) {
            alert("Errore durante il ripristino: " + e);
            window.location.reload();
        }
    };

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900 px-4 text-center">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-2xl max-w-lg w-full border border-gray-100 dark:border-slate-700">
                        <div className="mx-auto bg-red-100 dark:bg-red-900/30 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-6">
                            <AlertTriangle className="text-red-600 dark:text-red-400 w-10 h-10" />
                        </div>

                        <h1 className="text-2xl font-black text-gray-800 dark:text-gray-100 mb-2">
                            Qualcosa è andato storto
                        </h1>

                        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                            L'applicazione ha riscontrato un errore imprevisto. Potrebbe essere dovuto a dati locali corrotti o obsoleti.
                        </p>

                        <div className="bg-gray-100 dark:bg-slate-900 p-3 rounded text-left text-xs font-mono text-red-500 mb-6 overflow-auto max-h-32 border border-gray-200 dark:border-slate-700">
                            {this.state.error?.message || "Errore sconosciuto"}
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={this.handleReload}
                                className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold flex items-center justify-center transition-transform active:scale-95 shadow-lg"
                            >
                                <RefreshCw className="w-5 h-5 mr-2" /> Riprova a ricaricare
                            </button>

                            <button
                                onClick={this.handleReset}
                                className="w-full py-3 px-4 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg font-medium flex items-center justify-center transition-colors"
                                title="Cancella tutti i dati locali e riparti da zero"
                            >
                                <Trash2 className="w-4 h-4 mr-2" /> Reset Completo App
                            </button>
                        </div>
                    </div>
                    <div className="mt-8 text-xs text-gray-400">
                        SafetyNet Intranet - Error Boundary v1.0
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
