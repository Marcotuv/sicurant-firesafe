
import { Client, Asset, Article, Intervention, Notification, Technician } from './types';

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

export const INITIAL_CLIENTS: Client[] = [
  { 
    id: 1, 
    nome: "Hotel Bellavista SPA", 
    indirizzo: "Via Roma 10, Milano", 
    referente: "Mario Rossi", 
    telefono: "02 12345678", 
    email: "info@hotelbella.it", 
    commessa: "MAN-2024-001", 
    idCommessa: "CNT-8821",
    struttura: "Edificio Principale",
    idStruttura: "ED-01",
    pagamento: "Bonifico Bancario 30gg D.F.",
    note: "Accesso carraio dal retro"
  },
  { 
    id: 2, 
    nome: "Industria Meccanica SRL", 
    indirizzo: "Zona Ind.le Sud, Torino", 
    referente: "Ing. Bianchi", 
    telefono: "011 98765432", 
    email: "safety@indmecc.com", 
    commessa: "MAN-2024-045", 
    idCommessa: "CNT-9901",
    struttura: "Capannone B",
    idStruttura: "CP-B",
    pagamento: "Ri.Ba. 60gg D.F.",
    note: "Richiesto DPI udito per accesso reparti"
  },
  { 
    id: 3, 
    nome: "Scuola Elementare Rodari", 
    indirizzo: "Piazza Garibaldi, Roma", 
    referente: "Dirigente Verdi", 
    telefono: "06 55554444", 
    email: "segreteria@scuola.it", 
    commessa: "PUB-2023-112", 
    idCommessa: "CNT-7743",
    struttura: "Plesso Scolastico",
    idStruttura: "SC-01",
    pagamento: "Bonifico Bancario 60gg D.F.",
    note: "Orari accesso: 14:00 - 18:00"
  },
  {
    id: 99,
    nome: "Ospedale San Raffaele",
    indirizzo: "Via Olgettina 60, Milano",
    referente: "Ing. Neri (Dir. Tecnica)",
    telefono: "02 26430000",
    email: "tecnico@hsr.it", 
    commessa: "OSP-2024-MAXI",
    idCommessa: "CNT-HSR-01",
    struttura: "Padiglione A, B, C",
    idStruttura: "CMP-HSR",
    pagamento: "Bonifico Bancario 90gg D.F.",
    note: "ATTENZIONE: Accesso reparti sterili solo con autorizzazione. Contattare caposala per chiavi locali tecnici."
  }
];

export const MOCK_TECHNICIANS: Technician[] = [
    { id: 'T-FENU', name: 'Fenu Nicola', email: 'nicola.fenu@sicurant.it', color: '#2563eb' }, // Blue
    { id: 'T-CIRRONIS', name: 'Cirronis Matteo', email: 'matteo.cirronis@sicurant.it', color: '#16a34a' }, // Green
    { id: 'T-USAI', name: 'Usai Mario', email: 'mario.usai@sicurant.it', color: '#dc2626' }, // Red
    { id: 'T-LAMPIS', name: 'Lampis Andrea', email: 'andrea.lampis@sicurant.it', color: '#9333ea' }, // Purple
    { id: 'T-ATZENI', name: 'Atzeni Federico', email: 'federico.atzeni@sicurant.it', color: '#ea580c' }, // Orange
    { id: 'T-CASULA', name: 'Casula Federico', email: 'federico.casula@sicurant.it', color: '#0d9488' }, // Teal
    { id: 'T-ZACCHEDDU', name: 'Zaccheddu Alessandro', email: 'alessandro.zaccheddu@sicurant.it', color: '#0891b2' }, // Cyan
    { id: 'T-VACCA', name: 'Vacca Piero', email: 'piero.vacca@sicurant.it', color: '#db2777' }, // Pink
    { id: 'T-TRUDU', name: 'Trudu Michele', email: 'michele.trudu@sicurant.it', color: '#4f46e5' }, // Indigo
    { id: 'T-CASTI-S', name: 'Casti Samuele', email: 'samuele.casti@sicurant.it', color: '#65a30d' }, // Lime
    { id: 'T-CASTI-L', name: 'Casti Lorenzo', email: 'lorenzo.casti@sicurant.it', color: '#d97706' }, // Amber
    { id: 'T-MELIS', name: 'Melis Gianluca', email: 'gianluca.melis@sicurant.it', color: '#059669' }, // Emerald
    { id: 'T-PAUSICH', name: 'Pausich Cristiano', email: 'cristiano.pausich@sicurant.it', color: '#c026d3' }, // Fuchsia
];

// Catalogo Articoli (Nuovo)
export const INITIAL_ARTICLES: Article[] = [
  { id: 'EST-001', categoria: 'Estintori', descrizione: 'Estintore Polvere 6kg', note: 'Standard per uffici' },
  { id: 'EST-002', categoria: 'Estintori', descrizione: 'Estintore Co2 5kg', note: 'Per quadri elettrici' },
  { id: 'IDR-001', categoria: 'Idranti', descrizione: 'Idrante UNI 45', note: 'Manichetta 20m' },
  { id: 'POR-120', categoria: 'Porte REI / US', descrizione: 'Porta Tagliafuoco REI 120', note: 'Maniglione antipanico' },
  { id: 'RIL-001', categoria: 'Rivelazione', descrizione: 'Rilevatore Ottico Fumi', note: 'Sensore puntiforme' },
  { id: 'MED-001', categoria: 'Pronto Soccorso', descrizione: 'Cassetta PS All.1', note: 'Aziende Gruppo A' },
  { id: 'EFC-001', categoria: 'EFC', descrizione: 'Evacuatore Fumo', note: 'Apertura pneumatica' }
];

// --- RIFERIMENTI NORMATIVI PER CATEGORIA (AGGIORNATI) ---
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

// Funzione Helper per generare asset ospedalieri
const generateHospitalAssets = (): Asset[] => {
  const assets: Asset[] = [];
  const floors = ['Piano -2 (Locali Tecnici)', 'Piano -1 (Servizi)', 'Piano Terra', 'Piano 1 (Degenza)', 'Piano 2 (Degenza)', 'Piano 3 (Sale Operatorie)', 'Piano 4 (Uffici)', 'Piano 5 (Terrazza)'];
  let idCounter = 1000;

  // Stazioni di Pompaggio (2 unità)
  assets.push(
    { id: `H-${idCounter++}`, clientId: 99, tipo: "Stazione Pompaggio Principale", matricola: "PUMP-MAIN-01", ubicazione: "Piano -2 (Locali Tecnici)", scadenza: "2024-12-31", categoria: "Pompaggio", note: "Verificare pressione mandata" },
    { id: `H-${idCounter++}`, clientId: 99, tipo: "Stazione Pompaggio Riserva", matricola: "PUMP-RES-02", ubicazione: "Piano -2 (Locali Tecnici)", scadenza: "2024-12-31", categoria: "Pompaggio", note: "Prova avviamento diesel" }
  );

  // Centrali Fumi (3 unità)
  ['Padiglione A', 'Padiglione B', 'Padiglione C'].forEach((pad, idx) => {
     assets.push({ id: `H-${idCounter++}`, clientId: 99, tipo: "Centrale Rilevazione Fumi", matricola: `CRF-${idx+1}`, ubicazione: `Piano Terra - Reception ${pad}`, scadenza: "2024-11-30", categoria: "Rivelazione", note: "Testare batterie tampone" });
  });

  // Generazione massiva per piano
  floors.forEach((floor, floorIdx) => {
      // Estintori (circa 50 per piano)
      for(let i=0; i<50; i++) {
         const type = i % 3 === 0 ? "Estintore Co2 5kg" : "Estintore Polvere 6kg";
         assets.push({
             id: `H-${idCounter++}`, clientId: 99, tipo: type, matricola: `EXT-${floorIdx}-${i}`,
             ubicazione: `${floor} - Corridoio ${String.fromCharCode(65 + (i%4))}`,
             scadenza: "2025-01-15", categoria: "Estintori", note: ""
         });
      }
      // Idranti (circa 40 per piano)
      for(let i=0; i<40; i++) {
         assets.push({
             id: `H-${idCounter++}`, clientId: 99, tipo: "Idrante UNI 45", matricola: `HYD-${floorIdx}-${i}`,
             ubicazione: `${floor} - Nicchia ${i+1}`,
             scadenza: "2025-02-20", categoria: "Idranti", note: "Srotolare manichetta completa"
         });
      }
      // Porte (circa 50 per piano)
      for(let i=0; i<50; i++) {
         assets.push({
             id: `H-${idCounter++}`, clientId: 99, tipo: "Porta Tagliafuoco REI 120", matricola: `REI-${floorIdx}-${i}`,
             ubicazione: `${floor} - Scala Antincendio ${String.fromCharCode(65 + (i%3))}`,
             scadenza: "2024-10-10", categoria: "Porte REI / US", note: "Ingrassare cerniere"
         });
      }
  });

  return assets;
};

// Inventario Installato (Esistente + Ospedale)
export const INITIAL_ASSETS: Asset[] = [
  // Asset associati all'Hotel Bellavista (ID 1)
  { 
    id: 'A01', clientId: 1, tipo: "Estintore Polvere 6kg", matricola: "MAT-2021-001", 
    ubicazione: "Hall Ingresso", scadenza: "2024-12-01", categoria: "Estintori", note: "Verificare sigillo" 
  },
  { 
    id: 'A02', clientId: 1, tipo: "Estintore Co2 5kg", matricola: "MAT-2021-002", 
    ubicazione: "Sala Server Piano -1", scadenza: "2024-11-15", categoria: "Estintori", note: "Attenzione accesso limitato" 
  },
  
  // Asset associati all'Industria Meccanica (ID 2)
  { 
    id: 'A03', clientId: 2, tipo: "Idrante UNI 45", matricola: "IDR-2019-55", 
    ubicazione: "Esterno Piazzale Nord", scadenza: "2025-01-10", categoria: "Idranti", note: "Cassetta da sostituire" 
  },
  {
    id: 'A03-B', clientId: 2, tipo: "Cassetta Primo Soccorso", matricola: "MED-001",
    ubicazione: "Infermeria", scadenza: "2025-03-01", categoria: "Pronto Soccorso", note: "Controllare scadenza iodio"
  },
  
  // Asset associati alla Scuola Rodari (ID 3)
  { 
    id: 'A04', clientId: 3, tipo: "Porta Tagliafuoco REI 120", matricola: "PRT-001", 
    ubicazione: "Piano Terra - Palestra", scadenza: "2024-10-30", categoria: "Porte REI / US", note: "Chiudiporta difettoso" 
  },
  { 
    id: 'A05', clientId: 3, tipo: "Rilevatore Ottico Fumi", matricola: "SENS-992", 
    ubicazione: "Corridoio Aule 1° Piano", scadenza: "2024-12-20", categoria: "Rivelazione", note: "Testare centrale" 
  },
  // Spread degli asset ospedalieri
  ...generateHospitalAssets()
];

// LISTA GENERICA SERVIZI AGGIUNTIVI (Fallback)
export const SERVICES_LIST = [
  "Revisione Semestrale (UNI 9994-1)", 
  "Revisione Programmata (UNI 9994-1)",
  "Collaudo (UNI 9994-1 / EN 671-3)", 
  "Sostituzione Manichetta", 
  "Prova di tenuta statica",
  "Ricarica Estinguente"
];

// LISTA ANOMALIE GENERICHE (Trasversali)
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

export const INITIAL_INTERVENTIONS: Intervention[] = [
  { 
      id: 'INT-001', 
      timestamp: "2024-11-18T10:30:00Z", 
      clientId: 1, 
      clientName: "Hotel Bellavista SPA", 
      assetId: "A01", 
      assetName: "Estintore Polvere 6kg",
      services: ["Controllo Periodico - Par. 4.5 UNI 9994-1"], 
      anomalies: ["Accesso ostruito"], 
      notes: "Intervento regolare. Segnalato accesso ostruito da scatole.",
      generalNotes: "Accesso regolare.",
      technicianSignature: "Mario Tecnico",
      clientSignature: "Resp. Hotel"
  }
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'NOT-001',
    title: 'Aggiornamento Procedura',
    message: 'Nuove linee guida per la manutenzione idranti disponibili nella sezione Documenti.',
    category: 'Comunicazione',
    type: 'info',
    timestamp: "2024-11-20T09:00:00Z",
    readBy: []
  },
  {
    id: 'NOT-002',
    title: 'Scadenza Imminente',
    message: 'Asset A04 (Porta REI) in scadenza tra 5 giorni presso Scuola Rodari.',
    category: 'Avviso',
    type: 'warning',
    timestamp: "2024-11-19T14:30:00Z",
    readBy: []
  }
];

export const MOCK_USER = {
  name: "Mario Tecnico",
  role: 'admin' as const,
  avatarUrl: "https://picsum.photos/200"
};
