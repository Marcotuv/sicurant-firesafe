-- GESTIONE CODICI PROGRESSIVI INTERVENTI (es. 2025/0001)

-- 1. Aggiungi colonna progressivo alla tabella interventions
alter table public.interventions 
add column if not exists progressive_number integer,
add column if not exists year integer,
add column if not exists progressive_code text; 
-- progressive_code sarà la stringa formattata "2025/0001"

-- 2. Tabella contatori per gestire la numerazione annuale
create table if not exists public.intervention_counters (
    year integer primary key,
    last_val integer default 0
);

-- 3. Policy per i contatori (Admin/Office full, Tecnici lettura agg)
alter table public.intervention_counters enable row level security;

create policy "All users read counters" on public.intervention_counters 
  for select using (auth.role() = 'authenticated');
  
-- Tecnici non devono scrivere qui direttamente, lo fa il trigger (Security Definer)

-- 4. Funzione Trigger per assegnare il numero
create or replace function public.assign_intervention_progressive()
returns trigger as $$
declare
    current_year integer;
    next_val integer;
begin
    -- Se il numero è già settato (es. migrazione o forzatura), non fare nulla
    if new.progressive_number is not null then
        return new;
    end if;

    current_year := date_part('year', coalesce(new.timestamp, now()));
    
    -- Inserisci l'anno se non esiste (con lock per concorrenza)
    insert into public.intervention_counters (year, last_val)
    values (current_year, 0)
    on conflict (year) do nothing;
    
    -- Incrementa atomico e ritorna valore
    update public.intervention_counters
    set last_val = last_val + 1
    where year = current_year
    returning last_val into next_val;
    
    -- Assegna i valori al record
    new.progressive_number := next_val;
    new.year := current_year;
    new.progressive_code := current_year || '/' || lpad(next_val::text, 4, '0');
    
    return new;
end;
$$ language plpgsql security definer;

-- 5. Collega il Trigger
drop trigger if exists trg_assign_intervention_progressive on public.interventions;

create trigger trg_assign_intervention_progressive
before insert on public.interventions
for each row
execute procedure public.assign_intervention_progressive();
