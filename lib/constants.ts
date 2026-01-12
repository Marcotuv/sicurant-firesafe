
import { Client, Asset, Article, Intervention, Notification, Technician } from '../types';

export const PAYMENT_METHODS = [
    "Rimessa Diretta",
    "Contanti",
    "Bonifico Bancario 30gg D.F.",
    "Bonifico Bancario 60gg D.F.",
    "Bonifico Bancario 90gg D.F.",
    "Bonifico Bancario 30gg D.F. F.M.",
    "Bonifico Bancario 60gg D.F. F.M.",
    "Bonifico Bancario 90gg D.F. F.M.",
    "Ri.Ba. 30gg D.F.",
    "Ri.Ba. 60gg D.F.",
    "Carta di Credito",
    "Altro"
];

// --- RIFERIMENTI NORMATIVI PER CATEGORIA ---
export const CATEGORY_STANDARDS: Record<string, string> = {
    "Estintori": "UNI 9994-1:2013",
    "Idranti": "UNI 10779 / UNI EN 671-3",
    "Porte REI / US": "UNI 11473-1 / UNI 1125",
    "Rivelazione": "UNI 11224:2019",
    "Pompaggio": "UNI 12845 / UNI 10779",
    "EFC": "UNI 9494-2 / UNI 9494-3",
    "Autorespiratori": "UNI EN 529:2006",
    "Pronto Soccorso": "D.M. 388/03",
    "Generico": "D.M. 1/9/2021 (Regola dell'Arte)"
};

// --- CHECKLIST OPERATIVE E LAVORAZIONI NORMATIVE ---
export const CHECKLIST_TEMPLATES: Record<string, string[]> = {
    "Estintori": [
        "Sorveglianza - Par. 4.4 UNI 9994-1",
        "Controllo Periodico - Par. 4.5 UNI 9994-1 (Verifica pressione/peso)",
        "Revisione Programmata - Par. 4.6 UNI 9994-1 (Sostituzione estinguente)",
        "Collaudo - Par. 4.7 UNI 9994-1 (Verifica stabilità serbatoio)",
        "Ricarica straordinaria-pressurizzazione - Par. 4.8 UNI 9994-1"
    ],
    "Idranti": [
        "Sorveglianza - UNI EN 671-3",
        "Controllo Periodico Semestrale - UNI EN 671-3",
        "Verifica Annuale Manichette - UNI EN 671-3 (Sottoposizione a pressione di rete)",
        "Collaudo Manichetta (Pressione max esercizio) - UNI EN 671-3"
    ],
    "Porte REI / US": [
        "Sorveglianza - UNI 11473-1",
        "Controllo Semestrale - UNI 11473-1 (Lubrificazione, integrità)",
        "Controllo Uscite Sicurezza (US) - UNI 1125 (Barre antipanico)",
        "Verifica Dinamometrica - UNI 11473-1 (Misura forza di sgancio)",
        "Sostituzione Componenti - UNI 11473-1 (Guarnizioni/Molle)"
    ],
    "Rivelazione": [
        "Controllo Impianti Rivelazione Fumi - UNI 11224 (Prova funzionale sensori)",
        "Controllo Segnalatori Ottico/Acustici - UNI 11224",
        "Prova Efficienza Alimentazione e Batterie - UNI 11224",
        "Verifica Funzionale Centrale - UNI 11224"
    ],
    "Pompaggio": [
        "Controllo Pompe Antincendio - UNI 12845 / UNI 10779",
        "Prova Avviamento Settimanale - UNI 12845",
        "Controllo Curve Prestazionali (Semestrale) - UNI 12845",
        "Manutenzione Motori Diesel (Tagliando) - UNI 12845"
    ],
    "EFC": [
        "Controllo Evacuatori Fumo Calore (EFC) - UNI 9494",
        "Prova di Apertura (Ordinaria)",
        "Sostituzione Bombolette CO2 / Fialette Termiche",
        "Verifica Integrità Cupole"
    ],
    "Autorespiratori": [
        "Controllo Bombole Autorespiratori - UNI EN 529:06",
        "Verifica Pressione Residua",
        "Sostituzione Filtri / Maschere",
        "Collaudo Bombole (Decennale)"
    ],
    "Pronto Soccorso": [
        "Controllo Cassetta Pronto Soccorso - D.M. 388/03",
        "Verifica Scadenza Prodotti",
        "Integrazione Materiale Mancante",
        "Verifica Integrità Valigetta"
    ],
    "Generico": [
        "Controllo Visivo (Regola dell'arte - D.M. 1/9/2021)",
        "Verifica Funzionale Meccanica/Elettrica",
        "Pulizia e Lubrificazione Componenti",
        "Aggiornamento Cartellino di Manutenzione"
    ]
};

// --- ANOMALIE SPECIFICHE PER CATEGORIA ---
export const CATEGORY_ANOMALIES: Record<string, string[]> = {
    "Estintori": [
        "Pressione insufficiente (Manometro rosso)",
        "Coppiglia di sicurezza mancante/rotta",
        "Tubo erogatore screpolato",
        "Serbatoio corroso/ammaccato",
        "Estinguente impaccato",
        "Etichetta identificativa illeggibile"
    ],
    "Idranti": [
        "Lastra cassetta rotta/mancante",
        "Sigillo cassetta mancante",
        "Manichetta usurata/screpolata",
        "Manichetta bucata",
        "Lancia erogatrice mancante",
        "Rubinetto bloccato/gocciolante",
        "Sella salvamanichetta assente"
    ],
    "Porte REI / US": [
        "Chiudiporta scarico (non chiude)",
        "Chiudiporta perde olio",
        "Selettore di chiusura non funzionante",
        "Maniglione antipanico duro/bloccato",
        "Guarnizioni termoespandenti danneggiate",
        "Ante con gioco eccessivo / sfregamento",
        "Magneti non trattengono"
    ],
    "Rivelazione": [
        "Sensore sporco / polvere eccessiva",
        "LED indicatore guasto",
        "Batteria tampone scarica",
        "Centrale in avaria / guasto sistema",
        "Sirena non udibile"
    ],
    "Pompaggio": [
        "Perdita gasolio/olio motore",
        "Livello vasca insufficiente",
        "Batterie avviamento scariche",
        "Quadro elettrico in allarme",
        "Pressostati starati"
    ],
    "EFC": [
        "Bomboletta CO2 scarica/mancante",
        "Fialetta termica rotta",
        "Pistone di apertura bloccato",
        "Cupola danneggiata/crepata"
    ],
    "Pronto Soccorso": [
        "Prodotti scaduti (Iodio/Soluzioni)",
        "Materiale di consumo mancante",
        "Valigetta danneggiata/non chiude"
    ],
    "Autorespiratori": [
        "Bombola scarica",
        "Maschera usurata/rigata",
        "Schienale danneggiato"
    ]
};

// LISTA GENERICA SERVIZI AGGIUNTIVI
export const SERVICES_LIST = [
    "Revisione Semestrale (UNI 9994-1)",
    "Revisione Programmata (UNI 9994-1)",
    "Collaudo (UNI 9994-1 / EN 671-3)",
    "Sostituzione Manichetta",
    "Prova di tenuta statica",
    "Ricarica Estinguente"
];

// LISTA ANOMALIE GENERICHE
export const ANOMALIES_LIST = [
    "Accesso ostruito / non visibile",
    "Cartellino manutenzione mancante",
    "Cartellino illeggibile/pieno",
    "Segnaletica assente",
    "Segnaletica errata/scaduta",
    "Ancoraggio precario / instabile",
    "Installazione non a regola d'arte",
    "Matricola illeggibile"
];

// --- DATI INIZIALI VUOTI (Sostituiti da Supabase) ---
export const INITIAL_CLIENTS: Client[] = [];
export const MOCK_TECHNICIANS: Technician[] = [];
export const INITIAL_ARTICLES: Article[] = [];
export const INITIAL_ASSETS: Asset[] = [];
export const INITIAL_INTERVENTIONS: Intervention[] = [];
export const INITIAL_NOTIFICATIONS: Notification[] = [];

export const MOCK_USER = {
    name: "Utente",
    role: 'technician' as const,
    avatarUrl: "https://picsum.photos/200"
};
