
/**
 * Ottiene la data locale in formato YYYY-MM-DD
 * Usa SEMPRE questa per confronti/storage
 */
export const getLocalDate = (date: Date = new Date()): string => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().split('T')[0];
};

/**
 * Ottiene timestamp ISO corrente
 */
export const getTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Formatta data per visualizzazione italiana
 */
export const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

/**
 * Verifica se una data è scaduta
 */
export const isExpired = (expiryDateStr: string): boolean => {
  const today = getLocalDate();
  return expiryDateStr < today;
};

/**
 * Verifica se scadenza è imminente (entro X giorni)
 */
export const isExpiringSoon = (expiryDateStr: string, daysThreshold = 30): boolean => {
  const today = getLocalDate();
  const todayDate = new Date(today);
  const threshold = new Date(todayDate.getTime() + daysThreshold * 24 * 60 * 60 * 1000);
  const thresholdStr = getLocalDate(threshold);
  
  return expiryDateStr >= today && expiryDateStr <= thresholdStr;
};

// --- COMPATIBILITÀ CON IL RESTO DELL'APP ---

/**
 * Aggiunge mesi a una data e restituisce stringa locale YYYY-MM-DD
 */
export const addMonthsToDate = (date: Date, months: number): string => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return getLocalDate(d);
};

/**
 * Aggiunge giorni a una data e restituisce stringa locale YYYY-MM-DD
 */
export const addDaysToDate = (date: Date, days: number): string => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return getLocalDate(d);
};

// Alias per mantenere compatibilità con le importazioni esistenti
export const isAssetExpired = isExpired;
export const isAssetExpiringSoon = isExpiringSoon;
