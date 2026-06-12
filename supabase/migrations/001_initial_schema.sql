-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Clients table (business owners)
create table clients (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  business_name text not null default 'Mon Commerce',
  logo_url text,
  primary_color text default '#00704A',
  pass2u_model_id text default 'hZUz2ppkhbhp',
  card_name text default 'Carte Fidélité',
  organization_name text,
  total_stamps int default 5,
  reward_description text default 'Récompense gratuite',
  created_at timestamptz default now()
);

-- Members table (loyalty card holders)
create table members (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  pass_id text,
  punches int default 0,
  reward_available boolean default false,
  status text default 'active',
  joined_at timestamptz default now()
);

-- Punches table (punch history)
create table punches (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid references members(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  synced_with_pass2u boolean default false,
  created_at timestamptz default now()
);

-- Notifications table
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade,
  title text,
  message text not null,
  recipients_count int default 0,
  pass2u_response text,
  sent_at timestamptz default now()
);

-- Row Level Security
alter table clients enable row level security;
alter table members enable row level security;
alter table punches enable row level security;
alter table notifications enable row level security;

-- RLS Policies
create policy "clients_own_data" on clients
  for all using (auth.uid() = id);

create policy "members_own_data" on members
  for all using (
    client_id = auth.uid()
  );

create policy "punches_own_data" on punches
  for all using (
    client_id = auth.uid()
  );

create policy "notifications_own_data" on notifications
  for all using (
    client_id = auth.uid()
  );

-- Public read for join page
create policy "members_public_insert" on members
  for insert with check (true);
