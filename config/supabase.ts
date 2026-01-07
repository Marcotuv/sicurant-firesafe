import { createClient } from '@supabase/supabase-js';

// Safe access to environment variables
const getEnv = () => {
  try {
    // @ts-ignore
    return import.meta.env || {};
  } catch (e) {
    return {};
  }
};

const env = getEnv();
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || '';

let supabaseInstance = null;

// Validazione: se mancano, l'app non parte (o gestisce l'errore)
if (supabaseUrl && supabaseKey) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.warn("Error initializing Supabase client:", error);
  }
} else {
  // Non lanciamo errore qui per permettere il fallback manuale nelle impostazioni
  console.warn("Supabase Env Vars mancanti. L'app userà la modalità offline o configurazione manuale.");
}

// Esporta client configurato (o null)
export const supabase = supabaseInstance;

// Esporta le credenziali (solo per inizializzare lo stato, non per usarle direttamente)
export const envConfig = {
  url: supabaseUrl || '',
  key: supabaseKey || ''
};