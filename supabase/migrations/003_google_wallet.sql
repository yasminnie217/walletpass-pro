-- Phase 3 : Google Wallet — migration schéma

-- 1. Renomme pass2u_model_id → google_wallet_class_id sur la table clients
ALTER TABLE clients
  RENAME COLUMN pass2u_model_id TO google_wallet_class_id;

-- 2. Ajoute google_wallet_object_id sur members (stocke l'ID de l'objet GW)
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS google_wallet_object_id text;

-- 3. Ajoute les colonnes de consentement courriel (LCAP/CASL)
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS email_consent boolean DEFAULT false;

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS email_consent_at timestamptz;
