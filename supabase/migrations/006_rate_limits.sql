-- Table de rate limiting pour les tentatives d'authentification
create table if not exists rate_limits (
  key text primary key,
  count integer not null default 0,
  expires_at timestamptz not null
);

-- RLS activé sans policy : seul le service_role (qui bypass RLS) peut y accéder.
-- Aucune requête publique/anon ne peut lire ou écrire cette table.
alter table rate_limits enable row level security;
