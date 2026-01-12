-- SCRIPT DI RIPARAZIONE PROFILI
-- Questo script risolve il problema delle righe inserite a mano con ID sbagliati.

-- 1. Cancella i profili "orfani" (quelli inseriti a mano che non corrispondono al vero utente Auth)
DELETE FROM public.profiles
WHERE id NOT IN (SELECT id FROM auth.users);

-- 2. Inserisce (o aggiorna) il profilo corretto per entrambi gli indirizzi email (per sicurezza)
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', email), 
  'admin' -- Imposta Admin
FROM auth.users
WHERE email IN ('marco.tuveri@sicurant.it', 'marco.tuveri@sicurantincendi.it')
ON CONFLICT (id) DO UPDATE
SET role = 'admin', email = EXCLUDED.email;

-- 3. Verifica finale: Mostra i profili corretti
SELECT * FROM public.profiles WHERE role = 'admin';
