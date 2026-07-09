-- Position du magasin pour les notifications de proximité Google Wallet
alter table clients add column if not exists latitude double precision;
alter table clients add column if not exists longitude double precision;
alter table clients add column if not exists store_address text;
