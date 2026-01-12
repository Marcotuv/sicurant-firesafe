-- ABILITA ESTENSIONI
create extension if not exists "uuid-ossp";

-- 1. TABELLA CLIENTI (Clients)
-- Sostituisce la gestione basata solo su JSON.
-- L'ID è numerico per compatibilità con il codice esistente (types.ts: Client.id is number)
create table if not exists public.clients (
    id bigint primary key, -- Non 'serial' perché potremmo volerlo controllare da FE o mantenere ID esistenti
    nome text not null,
    indirizzo text,
    piva text,
    codice_univoco text,
    pec text,
    referente text,
    telefono text,
    email text,
    commessa text,
    id_commessa text,
    struttura text,
    indirizzo_struttura text,
    id_struttura text,
    referente_commessa text,
    recapito_commessa text,
    pagamento text,
    note text,
    updated_at timestamptz default now(),
    json_content jsonb -- Manteniamo per retrocompatibilità o campi extra non mappati
);

-- 2. TABELLA TECNICI (Technicians)
-- Gestione anagrafica tecnici su DB invece che file flat
create table if not exists public.technicians (
    id text primary key, -- Es. 'T-ROSSI' o UUID
    name text not null,
    email text not null,
    color text,
    created_at timestamptz default now()
);

-- 3. TABELLA ASSET / PRESIDI
create table if not exists public.assets (
    id text primary key,
    client_id bigint not null references public.clients(id) on delete cascade,
    tipo text not null,
    matricola text,
    ubicazione text,
    scadenza timestamptz,
    data_ultima_revisione timestamptz,
    categoria text,
    note text,
    specific_data jsonb, -- Per campi variabili extra
    updated_at timestamptz default now(),
    json_content jsonb
);

-- 4. TABELLA ARTICOLI (Articles)
create table if not exists public.articles (
    id text primary key,
    categoria text,
    descrizione text,
    note text,
    updated_at timestamptz default now()
);

-- 5. TABELLA SESSIONI DI LAVORO (WorkSessions)
create table if not exists public.work_sessions (
    id text primary key,
    client_id bigint not null references public.clients(id) on delete cascade,
    statustext text check (statustext in ('PLANNED', 'OPEN', 'CLOSED')), -- 'status' è parola riservata a volte, meglio evitare o quotare
    start_timestamp timestamptz,
    scheduled_date timestamptz,
    assigned_tech_ids jsonb, -- Array di ID tecnici
    assigned_tech_name text,
    general_notes text,
    tech_signature text,     -- Nome testuale firma
    tech_signature_img text, -- Base64 o URL
    client_signature text,
    client_signature_img text,
    intervention_ids jsonb, -- Array ID interventi collegati
    updated_at timestamptz default now(),
    json_content jsonb
);

-- 6. TABELLA INTERVENTI (Interventions)
create table if not exists public.interventions (
    id text primary key,
    client_id bigint not null references public.clients(id) on delete cascade,
    asset_id text references public.assets(id) on delete set null,
    timestamp timestamptz,
    services jsonb,   -- Array di stringhe
    anomalies jsonb,  -- Array di stringhe
    notes text,
    photos jsonb,     -- Array URL/Base64
    internal_comments jsonb,
    technician_signature text,
    technician_signature_img text,
    client_signature text,
    client_signature_img text,
    updated_at timestamptz default now(),
    json_content jsonb
);

-- 7. TABELLA PREVENTIVI (Quotations)
create table if not exists public.quotations (
    id text primary key,
    number text,
    type text,
    category text,
    client_id bigint not null references public.clients(id) on delete cascade,
    status text,
    amount numeric,
    date timestamptz,
    expiry_date timestamptz,
    items jsonb, -- Dettaglio righe preventivo
    notes text,
    updated_at timestamptz default now(),
    json_content jsonb
);

-- 8. TABELLA PRESENZE (Attendance)
create table if not exists public.attendance_history (
    id text primary key,
    user_id text not null, -- ID auth supabase
    user_name text,
    type text not null, -- ENTRATA, USCITA, ecc.
    status text, -- APPROVED, PENDING...
    timestamp timestamptz not null,
    latitude numeric,
    longitude numeric,
    notes text,
    approved_by text,
    approval_timestamp timestamptz,
    synced boolean default true,
    created_at timestamptz default now()
);

-- ABILITAZIONE RLS (Opzionale ma consigliata, Policy 'Open' per ora per compatibilità demo)
alter table public.clients enable row level security;
alter table public.assets enable row level security;
alter table public.interventions enable row level security;
alter table public.work_sessions enable row level security;
alter table public.attendance_history enable row level security;

-- POLICY "PERMISSIVE" PER INIZIARE (Tutti gli autenticati possono fare tutto)
-- In produzione andrebbero ristrette (es. tecnici vedono tutto, clienti solo le loro cose)
create policy "Enable all for authenticated users on clients" on public.clients for all using (auth.role() = 'authenticated');
create policy "Enable all for authenticated users on assets" on public.assets for all using (auth.role() = 'authenticated');
create policy "Enable all for authenticated users on interventions" on public.interventions for all using (auth.role() = 'authenticated');
create policy "Enable all for authenticated users on work_sessions" on public.work_sessions for all using (auth.role() = 'authenticated');
create policy "Enable all for authenticated users on attendance" on public.attendance_history for all using (auth.role() = 'authenticated');
create policy "Enable all for authenticated users on technicians" on public.technicians for all using (auth.role() = 'authenticated');
create policy "Enable all for authenticated users on articles" on public.articles for all using (auth.role() = 'authenticated');
create policy "Enable all for authenticated users on quotations" on public.quotations for all using (auth.role() = 'authenticated');
