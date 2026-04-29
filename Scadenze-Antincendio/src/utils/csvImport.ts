import type { Cliente } from '../types';

/**
 * Mappa flessibile: header CSV (lowercase, senza spazi) → campo Cliente
 * Permette di leggere file Excel esportati come CSV con intestazioni varianti.
 */
const CSV_COLUMN_MAP: Record<string, keyof Cliente> = {
  // Anagrafica
  'cliente': 'cliente',
  'ragionesociale': 'cliente',
  'ragione sociale': 'cliente',
  'nome cliente': 'cliente',
  'nomecliente': 'cliente',

  'commessa': 'commessa',
  'n. commessa': 'commessa',
  'n commessa': 'commessa',
  'numero commessa': 'commessa',
  'numerocommessa': 'commessa',

  'idcommessa': 'idCommessa',
  'id commessa': 'idCommessa',
  'id': 'idCommessa',

  'struttura': 'struttura',
  'sede': 'struttura',
  'descrizione': 'struttura',

  'indirizzo': 'indirizzo',
  'via': 'indirizzo',

  'citta': 'citta',
  'città': 'citta',
  'comune': 'citta',

  'provincia': 'provincia',
  'prov': 'provincia',
  'prov.': 'provincia',

  // Semestre 1
  'semestre1': 'semestre1_mesi',
  'semestre 1': 'semestre1_mesi',
  'i semestre': 'semestre1_mesi',
  'isemestre': 'semestre1_mesi',
  'mesi1': 'semestre1_mesi',
  'mesi semestre 1': 'semestre1_mesi',
  'periodo': 'semestre1_mesi',

  'data1': 'semestre1_data',
  'data semestre 1': 'semestre1_data',
  'data i semestre': 'semestre1_data',
  'datasemestre1': 'semestre1_data',
  'data intervento 1': 'semestre1_data',

  'sac1': 'semestre1_numeroSac',
  'n. sac 1': 'semestre1_numeroSac',
  'nsac1': 'semestre1_numeroSac',
  'numero sac 1': 'semestre1_numeroSac',

  'tecnico1': 'semestre1_tecnico',
  'tecnico semestre 1': 'semestre1_tecnico',
  'tecnico 1': 'semestre1_tecnico',

  // Semestre 2
  'semestre2': 'semestre2_mesi',
  'semestre 2': 'semestre2_mesi',
  'ii semestre': 'semestre2_mesi',
  'iisemestre': 'semestre2_mesi',
  'mesi2': 'semestre2_mesi',
  'mesi semestre 2': 'semestre2_mesi',

  'data2': 'semestre2_data',
  'data semestre 2': 'semestre2_data',
  'data ii semestre': 'semestre2_data',
  'datasemestre2': 'semestre2_data',
  'data intervento 2': 'semestre2_data',

  'sac2': 'semestre2_numeroSac',
  'n. sac 2': 'semestre2_numeroSac',
  'nsac2': 'semestre2_numeroSac',
  'numero sac 2': 'semestre2_numeroSac',

  'tecnico2': 'semestre2_tecnico',
  'tecnico semestre 2': 'semestre2_tecnico',
  'tecnico 2': 'semestre2_tecnico',

  // Consistenze
  'estintori': 'estintori',
  'porteus': 'porteUS',
  'porte us': 'porteUS',
  'porte+us': 'porteUS',
  'porte': 'porteUS',

  'idranti': 'idranti',
  'attaccovvf': 'attaccoVVF',
  'attacco vvf': 'attaccoVVF',
  'attacco': 'attaccoVVF',

  'efc': 'efc',
  'impiantosprinkler': 'impiantoSprinkler',
  'impianto sprinkler': 'impiantoSprinkler',
  'sprinkler': 'impiantoSprinkler',

  'stazionepompaggio': 'stazionePompaggio',
  'stazione pompaggio': 'stazionePompaggio',
  'pompaggio': 'stazionePompaggio',

  'impiantorilevazionefumi': 'impiantoRilevazioneFumi',
  'impianto rilevazione fumi': 'impiantoRilevazioneFumi',
  'rilevazionefumi': 'impiantoRilevazioneFumi',
  'rilevazione fumi': 'impiantoRilevazioneFumi',
  'centralefumi': 'impiantoRilevazioneFumi',

  'datafumi': 'dataFumi',
  'data fumi': 'dataFumi',

  'sorveglianza': 'sorveglianza',
  'datasoveglianza': 'dataSorveglianza',
  'data sorveglianza': 'dataSorveglianza',
  'dataSoveglianza': 'dataSorveglianza',

  'totalepezzi': 'totalePezzi',
  'totale pezzi': 'totalePezzi',
  'totale': 'totalePezzi',

  'pagamento': 'pagamento',
  'note': 'note',
  'notes': 'note',
};

const NUMBER_FIELDS: Array<keyof Cliente> = [
  'estintori', 'porteUS', 'idranti', 'attaccoVVF', 'efc',
  'impiantoSprinkler', 'stazionePompaggio', 'impiantoRilevazioneFumi', 'totalePezzi',
];

/**
 * Parsa una riga CSV rispettando le virgolette.
 */
const parseCsvRow = (line: string, separator: string): string[] => {
  const result: string[] = [];
  let inQuotes = false;
  let current = '';
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === separator && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
};

/**
 * Detect separator: comma o punto e virgola.
 */
const detectSeparator = (firstLine: string): string =>
  (firstLine.split(';').length > firstLine.split(',').length) ? ';' : ',';

/**
 * Normalizza un header di colonna per il lookup nella mappa.
 */
const normHeader = (h: string) => h.toLowerCase().replace(/\s+/g, ' ').trim();

export interface CsvImportResult {
  imported: Omit<Cliente, 'id'>[];
  skipped: number;
  errors: string[];
}

/**
 * Parsa il testo di un file CSV e lo converte in un array di oggetti Cliente.
 */
export const parseClienteCSV = (text: string): CsvImportResult => {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < 2) return { imported: [], skipped: 0, errors: ['File CSV vuoto o senza righe dati.'] };

  const sep = detectSeparator(lines[0]);
  const headers = parseCsvRow(lines[0], sep);

  // Map header index → Cliente field
  const fieldMap: (keyof Cliente | null)[] = headers.map(h => CSV_COLUMN_MAP[normHeader(h)] ?? null);

  const imported: Omit<Cliente, 'id'>[] = [];
  const errors: string[] = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvRow(lines[i], sep);
    const record: Partial<Omit<Cliente, 'id'>> = {};

    fieldMap.forEach((field, idx) => {
      if (!field || field === 'id') return;
      const raw = cells[idx] ?? '';
      if (NUMBER_FIELDS.includes(field as keyof Cliente)) {
        (record as Record<string, unknown>)[field] = parseInt(raw, 10) || 0;
      } else {
        (record as Record<string, unknown>)[field] = raw;
      }
    });

    // Calcola totale pezzi se non presente
    if (!record.totalePezzi) {
      record.totalePezzi =
        (Number(record.estintori) || 0) +
        (Number(record.porteUS) || 0) +
        (Number(record.idranti) || 0) +
        (Number(record.attaccoVVF) || 0) +
        (Number(record.efc) || 0) +
        (Number(record.impiantoSprinkler) || 0) +
        (Number(record.stazionePompaggio) || 0) +
        (Number(record.impiantoRilevazioneFumi) || 0);
    }

    if (!record.cliente?.trim()) {
      skipped++;
      errors.push(`Riga ${i + 1}: campo "Cliente" mancante — riga saltata.`);
      continue;
    }

    imported.push({
      cliente: record.cliente ?? '',
      commessa: record.commessa ?? '',
      struttura: record.struttura ?? '',
      idCommessa: record.idCommessa ?? '',
      citta: record.citta ?? '',
      provincia: record.provincia ?? '',
      indirizzo: record.indirizzo ?? '',
      semestre1_mesi: record.semestre1_mesi ?? '',
      semestre1_data: record.semestre1_data ?? '',
      semestre1_numeroSac: record.semestre1_numeroSac ?? '',
      semestre1_tecnico: record.semestre1_tecnico ?? '',
      semestre2_mesi: record.semestre2_mesi ?? '',
      semestre2_data: record.semestre2_data ?? '',
      semestre2_numeroSac: record.semestre2_numeroSac ?? '',
      semestre2_tecnico: record.semestre2_tecnico ?? '',
      pagamento: record.pagamento ?? '',
      note: record.note ?? '',
      estintori: record.estintori ?? 0,
      porteUS: record.porteUS ?? 0,
      idranti: record.idranti ?? 0,
      attaccoVVF: record.attaccoVVF ?? 0,
      efc: record.efc ?? 0,
      impiantoSprinkler: record.impiantoSprinkler ?? 0,
      stazionePompaggio: record.stazionePompaggio ?? 0,
      impiantoRilevazioneFumi: record.impiantoRilevazioneFumi ?? 0,
      dataFumi: record.dataFumi ?? '',
      sorveglianza: record.sorveglianza ?? '',
      dataSorveglianza: record.dataSorveglianza ?? '',
      totalePezzi: record.totalePezzi ?? 0,
    });
  }

  return { imported, skipped, errors };
};
