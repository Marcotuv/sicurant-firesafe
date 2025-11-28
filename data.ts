
import { Client, Asset, Article, Intervention, Notification } from './types';

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
    note: "ATTENZIONE: Accesso reparti sterili solo con autorizzazione. Contattare caposala per chiavi locali tecnici."
  }
];

// Catalogo Articoli (Nuovo)
export const INITIAL_ARTICLES: Article[] = [
  { id: 'EST-001', categoria: 'Estintori', descrizione: 'Estintore Polvere 6kg', note: 'Standard per uffici' },
  { id: 'EST-002', categoria: 'Estintori', descrizione: 'Estintore Co2 5kg', note: 'Per quadri elettrici' },
  { id: 'IDR-001', categoria: 'Idranti', descrizione: 'Idrante UNI 45', note: 'Manichetta 20m' },
  { id: 'POR-120', categoria: 'Porte REI', descrizione: 'Porta Tagliafuoco REI 120', note: 'Maniglione antipanico' },
  { id: 'RIL-001', categoria: 'Rilevazione', descrizione: 'Rilevatore Ottico Fumi', note: 'Sensore puntiforme' }
];

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
     assets.push({ id: `H-${idCounter++}`, clientId: 99, tipo: "Centrale Rilevazione Fumi", matricola: `CRF-${idx+1}`, ubicazione: `Piano Terra - Reception ${pad}`, scadenza: "2024-11-30", categoria: "Rilevazione", note: "Testare batterie tampone" });
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
             scadenza: "2024-10-10", categoria: "Porte REI", note: "Ingrassare cerniere"
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
  
  // Asset associati alla Scuola Rodari (ID 3)
  { 
    id: 'A04', clientId: 3, tipo: "Porta Tagliafuoco REI 120", matricola: "PRT-001", 
    ubicazione: "Piano Terra - Palestra", scadenza: "2024-10-30", categoria: "Porte REI", note: "Chiudiporta difettoso" 
  },
  { 
    id: 'A05', clientId: 3, tipo: "Rilevatore Ottico Fumi", matricola: "SENS-992", 
    ubicazione: "Corridoio Aule 1° Piano", scadenza: "2024-12-20", categoria: "Rilevazione", note: "Testare centrale" 
  },
  // Spread degli asset ospedalieri
  ...generateHospitalAssets()
];

export const SERVICES_LIST = [
  "Revisione Semestrale", "Ricarica Estintore", "Collaudo Idrostatico", "Sostituzione Manichetta", "Prova di tenuta"
];

export const ANOMALIES_LIST = [
  "Pressione insufficiente", "Cartellino mancante", "Accesso ostruito", "Coppiglia di sicurezza rotta", "Manichetta screpolata", "Segnaletica assente"
];

export const INITIAL_INTERVENTIONS: Intervention[] = [
  { 
      id: 'INT-001', 
      timestamp: "2024-11-18T10:30:00Z", 
      clientId: 1, 
      clientName: "Hotel Bellavista SPA", 
      assetId: "A01", 
      assetName: "Estintore Polvere 6kg",
      services: ["Revisione Semestrale", "Prova di tenuta"], 
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
    type: 'info',
    timestamp: "2024-11-20T09:00:00Z",
    read: false
  },
  {
    id: 'NOT-002',
    title: 'Scadenza Imminente',
    message: 'Asset A04 (Porta REI) in scadenza tra 5 giorni presso Scuola Rodari.',
    type: 'warning',
    timestamp: "2024-11-19T14:30:00Z",
    read: true
  }
];

export const MOCK_USER = {
  name: "Mario Tecnico",
  role: 'admin' as const,
  avatarUrl: "https://picsum.photos/200"
};
