-- 1) Pulizia iniziale: Cancella le tabelle se esistono per ripartire da zero
-- ATTENZIONE: Questo cancella i dati esistenti nel DB cloud.
DROP TABLE IF EXISTS public.work_sessions;
DROP TABLE IF EXISTS public.interventions;
DROP TABLE IF EXISTS public.assets;
DROP TABLE IF EXISTS public.clients;

-- 2) Creazione tabella CLIENTS
-- L'ID qui è un numero (bigint) perché nel tuo codice usi numeri (es. 1, 2, 99)
CREATE TABLE public.clients (
    id bigint PRIMARY KEY, 
    json_content jsonb NOT NULL,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3) Creazione tabella ASSETS
-- L'ID è TEXT perché usi codici alfanumerici (es. "A01", "H-1000")
CREATE TABLE public.assets (
    id text PRIMARY KEY,
    json_content jsonb NOT NULL,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4) Creazione tabella INTERVENTIONS
-- L'ID è TEXT (es. "INT-001")
CREATE TABLE public.interventions (
    id text PRIMARY KEY,
    json_content jsonb NOT NULL,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5) Creazione tabella WORK_SESSIONS (Il fix principale)
-- L'ID deve essere TEXT per supportare il formato "SESS-..." generato dall'app
CREATE TABLE public.work_sessions (
    id text PRIMARY KEY,
    json_content jsonb NOT NULL,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6) Abilitazione Row Level Security (RLS)
-- Supabase richiede che RLS sia attivo per servire i dati via API
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_sessions ENABLE ROW LEVEL SECURITY;

-- 7) Creazione Policy di Accesso Totale
-- Queste policy permettono all'applicazione di leggere e scrivere senza login utente complesso
-- (Simula una intranet aperta dove chi ha la chiave API può operare)
CREATE POLICY "Enable all access for clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for assets" ON public.assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for interventions" ON public.interventions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for sessions" ON public.work_sessions FOR ALL USING (true) WITH CHECK (true);
