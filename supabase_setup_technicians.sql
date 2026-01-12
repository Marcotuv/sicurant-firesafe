-- SCRIPT PER L'INSERIMENTO DEI TECNICI REALI NELLA TABELLA PROFILES
-- Nota: I tecnici devono prima essere creati nella sezione "Authentication" di Supabase 
-- per ottenere i loro ID (UUID) reali.

-- Questo script serve come template. Sostituisci 'METTI-UUID-QUI' con gli ID reali 
-- recuperati dalla scheda Authentication -> Users.

INSERT INTO public.profiles (id, email, full_name, role)
VALUES 
  ('METTI-UUID-QUI', 'federico.casula@sicurant.it', 'Casula Federico', 'technician'),
  ('METTI-UUID-QUI', 'federico.atzeni@sicurant.it', 'Atzeni Federico', 'technician'),
  ('METTI-UUID-QUI', 'matteo.cirronis@sicurant.it', 'Cirronis Matteo', 'technician'),
  ('METTI-UUID-QUI', 'cristiano.pausich@sicurant.it', 'Pausich Cristiano', 'technician'),
  ('METTI-UUID-QUI', 'alessandro.zaccheddu@sicurant.it', 'Zaccheddu Alessandro', 'technician'),
  ('METTI-UUID-QUI', 'mario.usai@sicurant.it', 'Usai Mario', 'technician'),
  ('METTI-UUID-QUI', 'alessandro.erbi@sicurant.it', 'Erbì Alessandro', 'technician'),
  ('METTI-UUID-QUI', 'marco.cabriolu@sicurant.it', 'Cabriolu Marco', 'technician'),
  ('METTI-UUID-QUI', 'gianpiero.vacca@sicurant.it', 'Vacca Gianpiero', 'technician'),
  ('METTI-UUID-QUI', 'gianluca.melis@sicurant.it', 'Melis Gianluca', 'technician'),
  ('METTI-UUID-QUI', 'michele.trudu@sicurant.it', 'Trudu Michele', 'technician'),
  ('METTI-UUID-QUI', 'samuele.casti@sicurant.it', 'Casti Samuele', 'technician'),
  ('METTI-UUID-QUI', 'lorenzo.casti@sicurant.it', 'Casti Lorenzo', 'technician')
ON CONFLICT (id) DO UPDATE 
SET 
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  email = EXCLUDED.email;
