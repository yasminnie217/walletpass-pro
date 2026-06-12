-- Add explicit INSERT policy for clients table
-- (FOR ALL USING does not reliably cover INSERT in all Supabase versions)
create policy "clients_insert_own" on clients
  for insert with check (auth.uid() = id);

-- Allow clients to read their own public profile for join page
create policy "clients_public_read" on clients
  for select using (true);
