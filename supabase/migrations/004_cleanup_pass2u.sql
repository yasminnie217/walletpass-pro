-- Phase 4 : suppression Pass2U — nettoyage schéma

-- Renomme punches.synced_with_pass2u → synced_with_google_wallet
ALTER TABLE punches
  RENAME COLUMN synced_with_pass2u TO synced_with_google_wallet;

-- Renomme notifications.pass2u_response → wallet_response
ALTER TABLE notifications
  RENAME COLUMN pass2u_response TO wallet_response;
