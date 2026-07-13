-- Historique des récompenses utilisées
create table if not exists redemptions (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid references members(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  reward_description text,
  created_at timestamptz default now()
);

alter table redemptions enable row level security;

create policy "redemptions_own_data" on redemptions
  for all using (client_id = auth.uid());
