export interface Cliente {
  id?: number;
  cliente: string;
  commessa: string;
  struttura: string;
  idCommessa: string;
  citta: string;
  provincia: string;
  indirizzo: string;
  
  // Dati I Semestre
  semestre1_mesi: string; // es: "gennaio-luglio"
  semestre1_data: string; // formato YYYY-MM-DD
  semestre1_numeroSac: string;
  semestre1_tecnico: string;

  // Dati II Semestre
  semestre2_mesi: string; // es: "luglio-gennaio" - dipendente dal primo
  semestre2_data: string;
  semestre2_numeroSac: string;
  semestre2_tecnico: string;
  
  pagamento: string;
  note: string;
  
  // Consistenze
  estintori: number;
  porteUS: number; // PORTE + US
  idranti: number;
  attaccoVVF: number;
  efc: number;
  impiantoSprinkler: number;
  stazionePompaggio: number;
  impiantoRilevazioneFumi: number;
  dataFumi: string; // YYYY-MM-DD
  sorveglianza: string;
  dataSorveglianza: string; // YYYY-MM-DD
  totalePezzi: number;

  createdAt?: string;
  updatedAt?: string;
}

export type StatoSemaforo = 'rosso' | 'giallo' | 'verde' | 'grigio';

export interface ClienteConStato extends Cliente {
  statoSemaforo: StatoSemaforo;
}
