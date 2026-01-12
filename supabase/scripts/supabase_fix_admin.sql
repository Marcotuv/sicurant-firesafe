-- 1. Cerca l'utente nella tabella di sistema (auth.users)
-- 2. Inserisce o Aggiorna la riga nella tabella pubblica (public.profiles)
-- 3. Imposta forzatamente il ruolo a 'admin'

INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', email), -- Usa email come nome se manca il full_name
  'admin'
FROM auth.users
WHERE email = 'marco.tuveri@sicurant.it' -- L'indirizzo corretto
ON CONFLICT (id) DO UPDATE
SET role = 'admin';

-- CONFERMA: Mostra il risultato
SELECT * FROM public.profiles WHERE email = 'marco.tuveri@sicurant.it';
