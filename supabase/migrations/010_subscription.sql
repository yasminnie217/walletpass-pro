-- Abonnement / paywall
alter table clients add column if not exists plan text not null default 'free';
alter table clients add column if not exists trial_ends_at timestamptz default (now() + interval '14 days');

-- Les commerçants déjà présents sont passés en Pro (grandfather) pour ne pas
-- les limiter rétroactivement.
update clients set plan = 'pro' where created_at < now();
