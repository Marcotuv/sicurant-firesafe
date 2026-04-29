import type { Cliente, ClienteConStato, StatoSemaforo } from '../types';

// Mappa delle scadenze semestrali
// Le chiavi sono l'abbinamento (tutto lowercase, senza spazi)
export const semestriMap: Record<string, [number, number]> = {
  'gennaio-luglio': [0, 6],   // Gennaio (0) - Luglio (6)
  'febbraio-agosto': [1, 7],  // Febbraio (1) - Agosto (7)
  'marzo-settembre': [2, 8],  // Marzo (2) - Settembre (8)
  'aprile-ottobre': [3, 9],   // Aprile (3) - Ottobre (9)
  'maggio-novembre': [4, 10], // Maggio (4) - Novembre (10)
  'giugno-dicembre': [5, 11]  // Giugno (5) - Dicembre (11)
};

/**
 * Calcola lo stato del semaforo per un cliente in base ai mesi assegnati
 * e alle date degli interventi effettuati.
 */
export const calcolaStatoSemaforo = (cliente: Cliente, dataCorrente = new Date()): StatoSemaforo => {
  const currentMonth = dataCorrente.getMonth(); // 0-11
  const currentYear = dataCorrente.getFullYear();
  
  const periodo = cliente.semestre1_mesi?.toLowerCase().trim();
  const mesiScadenza = semestriMap[periodo];

  if (!mesiScadenza) return 'grigio'; // Nessun periodo assegnato o formato errato
  
  const [mese1, mese2] = mesiScadenza;
  
  // Raccogliamo le date degli interventi svolti (se presenti)
  const dateInterventi = [
    cliente.semestre1_data ? new Date(cliente.semestre1_data) : null,
    cliente.semestre2_data ? new Date(cliente.semestre2_data) : null
  ].filter(d => d !== null) as Date[];
  
  // Ordiniamo le date in modo da avere l'ultimo intervento per primo
  dateInterventi.sort((a, b) => b.getTime() - a.getTime());
  const ultimoIntervento = dateInterventi.length > 0 ? dateInterventi[0] : null;

  // Se non c'è mai stato un intervento
  if (!ultimoIntervento) {
    // Se siamo in uno dei mesi di scadenza, è GIALLO. Se lo abbiamo superato da tempo, è ROSSO.
    // Esempio: scadenza [0, 6]. Se siamo a 0 (Gennaio) o 11 (Dic, un mese prima) -> Giallo
    // Ma semplifichiamo: se non c'è l'intervento dell'anno solare, diventiamo rossi o gialli in prossimità del mese.
    const isMeseScadenza = currentMonth === mese1 || currentMonth === mese2;
    const isMesePrecedente = currentMonth === ((mese1 - 1 + 12) % 12) || currentMonth === ((mese2 - 1 + 12) % 12);
    
    if (isMeseScadenza || isMesePrecedente) return 'giallo';
    
    // Controlliamo se siamo in ritardo: 
    // Se il mese corrente è successivo a mese1 ma non siamo ancora in zona mese2
    if ((currentMonth > mese1 && currentMonth < mese2 - 1) || 
        (currentMonth > mese2 && currentMonth !== ((mese1 - 1 + 12) % 12))) {
      return 'rosso';
    }

    return 'verde'; // Caso limite, es. appena inserito a Marzo con scadenza Giugno-Dic
  }

  // C'è almeno un intervento. Analizziamo quanto tempo è passato.
  const mesiPassati = (currentYear - ultimoIntervento.getFullYear()) * 12 + (currentMonth - ultimoIntervento.getMonth());
  
  if (mesiPassati >= 6) {
    return 'rosso'; // Sono passati 6 o più mesi dall'ultimo controllo, senza dubbio rosso.
  }
  
  if (mesiPassati === 5) {
    return 'giallo'; // Siamo a 5 mesi dall'ultimo controllo, è il "mese precedente" la scadenza
  }
  
  if (mesiPassati === 4) {
      // Potrebbe essere in scadenza a fine mese prossimo? 
      // Se il prossimo mese è il mese di scadenza "preciso", lo diamo Verde per ora. 
      // Il giallo si accende a -1 mese.
  }

  return 'verde';
};

export const arricchisciClientiConStato = (clienti: Cliente[], dataCorrente = new Date()): ClienteConStato[] => {
  return clienti.map(c => ({
    ...c,
    statoSemaforo: calcolaStatoSemaforo(c, dataCorrente)
  }));
};
