-- 1. TABELLA PROFILI (Identità Utente)
-- Questa tabella estende la tabella auth.users di Supabase
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  role text default 'technician' check (role in ('admin', 'office', 'technician', 'viewer')),
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. TRIGGER AUTOMATICO NUOVI UTENTI
-- Crea automaticamente un profilo quando un utente si registra su Supabase Auth
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'technician'); -- Default role
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger se esiste per evitar duplicati in caso di ri-esecuzione
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. ABILITAZIONE RLS SU TUTTE LE TABELLE
alter table public.profiles enable row level security;
-- (Le altre tabelle dovrebbero già averla abilitata dallo script v2, ma per sicurezza:)
alter table public.clients enable row level security;
alter table public.assets enable row level security;
alter table public.interventions enable row level security;
alter table public.work_sessions enable row level security;
alter table public.attendance_history enable row level security;
alter table public.quotations enable row level security;

-- FIX SCHEMA: Assicuriamoci che le colonne critiche esistano (caso di tabelle vecchie)
alter table public.work_sessions add column if not exists assigned_tech_ids jsonb;
alter table public.work_sessions add column if not exists assigned_tech_name text;
alter table public.work_sessions add column if not exists statustext text;

-- 4. POLICIES (REGOLA CHI VEDE COSA)

-- --- PROFILES ---
-- Ognuno vede il proprio profilo
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles 
  for select using (auth.uid() = id);

-- Gli admin/ufficio vedono tutti i profili
drop policy if exists "Admin/Office can view all profiles" on public.profiles;
create policy "Admin/Office can view all profiles" on public.profiles 
  for select using (
    auth.uid() in (select id from public.profiles where role in ('admin', 'office'))
  );

-- Utente può aggiornare il proprio profilo
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles 
  for update using (auth.uid() = id);

-- --- CLIENTS / ASSETS / ARTICLES (Dati Anagrafici) ---
-- Admin/Ufficio: Tutto
drop policy if exists "Admin/Office full access clients" on public.clients;
create policy "Admin/Office full access clients" on public.clients 
  using (auth.uid() in (select id from public.profiles where role in ('admin', 'office')));

drop policy if exists "Admin/Office full access assets" on public.assets;
create policy "Admin/Office full access assets" on public.assets 
  using (auth.uid() in (select id from public.profiles where role in ('admin', 'office')));

-- Tecnici: Solo lettura (per lavorare offline servono i dati)
drop policy if exists "Technicians view all clients" on public.clients;
create policy "Technicians view all clients" on public.clients 
  for select using (auth.uid() in (select id from public.profiles where role = 'technician'));

drop policy if exists "Technicians view all assets" on public.assets;
create policy "Technicians view all assets" on public.assets 
  for select using (auth.uid() in (select id from public.profiles where role = 'technician'));

-- --- INTERVENTIONS / SESSIONS (Dati Operativi) ---
-- Admin/Ufficio: Tutto
drop policy if exists "Admin/Office full access interventions" on public.interventions;
create policy "Admin/Office full access interventions" on public.interventions 
  using (auth.uid() in (select id from public.profiles where role in ('admin', 'office')));

drop policy if exists "Admin/Office full access sessions" on public.work_sessions;
create policy "Admin/Office full access sessions" on public.work_sessions 
  using (auth.uid() in (select id from public.profiles where role in ('admin', 'office')));

-- Tecnici:
-- 1. Vedono sessioni assegnate A LORO (array contains id) OPPURE create da loro
drop policy if exists "Technicians view assigned sessions" on public.work_sessions;
create policy "Technicians view assigned sessions" on public.work_sessions 
  for select using (
    auth.uid() in (select id from public.profiles where role = 'technician') and (
      json_content->>'assignedTechIds' like '%' || auth.uid()::text || '%' -- Check semplificato su stringa JSON
      or 
      id in (select id from public.work_sessions where assigned_tech_ids::text like '%' || auth.uid()::text || '%') -- Fallback cast a text se il tipo array/jsonb crea problemi
    )
  );
  
drop policy if exists "Enable all for authenticated users on interventions" on public.interventions;
drop policy if exists "Enable all for authenticated users on work_sessions" on public.work_sessions;

-- POLICY TRANSITORIA "HYBRID":
drop policy if exists "Authenticated view all operational data" on public.interventions;
create policy "Authenticated view all operational data" on public.interventions for select using (auth.role() = 'authenticated');

drop policy if exists "Authenticated view all sessions" on public.work_sessions;
create policy "Authenticated view all sessions" on public.work_sessions for select using (auth.role() = 'authenticated');

drop policy if exists "Technician modify open sessions" on public.work_sessions;
create policy "Technician modify open sessions" on public.work_sessions 
  for update using (
    auth.uid() in (select id from public.profiles where role = 'technician') 
    and statustext = 'OPEN'
  );

drop policy if exists "Technician insert interventions" on public.interventions;
create policy "Technician insert interventions" on public.interventions 
  for insert with check (auth.uid() in (select id from public.profiles where role = 'technician'));

drop policy if exists "Technician update own interventions" on public.interventions;
create policy "Technician update own interventions" on public.interventions 
  for update using (auth.uid() in (select id from public.profiles where role = 'technician'));

-- --- ATTENDANCE ---
drop policy if exists "Users manage own attendance" on public.attendance_history;
create policy "Users manage own attendance" on public.attendance_history
  using (user_id = auth.uid()::text);

drop policy if exists "Admin/Office view all attendance" on public.attendance_history;
create policy "Admin/Office view all attendance" on public.attendance_history
  for select using (auth.uid() in (select id from public.profiles where role in ('admin', 'office')));
