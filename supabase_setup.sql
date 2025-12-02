-- Tabella per i Clienti
create table clients (
  id bigint primary key,
  json_content jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Tabella per gli Asset/Presidi
create table assets (
  id text primary key,
  json_content jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Tabella per gli Interventi (Registro)
create table interventions (
  id text primary key,
  json_content jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);
