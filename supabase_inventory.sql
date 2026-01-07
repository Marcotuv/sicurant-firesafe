-- TABELLE MAGAZZINO

-- 1. TABELLA ARTICOLI MAGAZZINO
-- Diversa dalla tabella 'articles' esistente che era solo una lista prezzi. 
-- Questa gestisce le quantità fisiche.
create table if not exists public.inventory_items (
  id uuid default uuid_generate_v4() primary key,
  sku text unique not null,
  name text not null,
  description text,
  quantity integer default 0,
  min_quantity integer default 5, -- Soglia riordino
  unit text default 'pz',
  price decimal(10,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. TABELLA MOVIMENTI
create table if not exists public.inventory_movements (
  id uuid default uuid_generate_v4() primary key,
  item_id uuid references public.inventory_items(id) on delete cascade,
  type text check (type in ('IN', 'OUT')),
  quantity integer not null,
  reason text, -- es. "Carico Fornitore", "Scarico Intervento X"
  user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

-- 3. RLS
alter table public.inventory_items enable row level security;
alter table public.inventory_movements enable row level security;

-- Admin/Ufficio: Full Access
drop policy if exists "Admin/Office full inventory" on public.inventory_items;
create policy "Admin/Office full inventory" on public.inventory_items 
  using (auth.uid() in (select id from public.profiles where role in ('admin', 'office')));

drop policy if exists "Admin/Office full movements" on public.inventory_movements;
create policy "Admin/Office full movements" on public.inventory_movements 
  using (auth.uid() in (select id from public.profiles where role in ('admin', 'office')));

-- Tecnici: Visualizza giacenze, Crea Scarichi (OUT)
drop policy if exists "Technicians view items" on public.inventory_items;
create policy "Technicians view items" on public.inventory_items for select 
   using (auth.uid() in (select id from public.profiles where role = 'technician'));
   
drop policy if exists "Technicians create movements" on public.inventory_movements;
create policy "Technicians create movements" on public.inventory_movements for insert 
   with check (auth.uid() in (select id from public.profiles where role = 'technician'));
   
-- Trigger aggiornamento giacenza
create or replace function public.update_inventory_quantity()
returns trigger as $$
begin
  if new.type = 'IN' then
    update public.inventory_items set quantity = quantity + new.quantity where id = new.item_id;
  elsif new.type = 'OUT' then
    update public.inventory_items set quantity = quantity - new.quantity where id = new.item_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_movement_created on public.inventory_movements;
create trigger on_movement_created
  after insert on public.inventory_movements
  for each row execute procedure public.update_inventory_quantity();
