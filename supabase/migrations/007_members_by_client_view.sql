-- Vue de lecture : membres regroupés par commerce (client), pour une consultation
-- claire dans Supabase. NE change PAS la structure : les membres sont déjà séparés
-- par client_id dans la table `members` (clé étrangère + RLS members_own_data).
-- Cette vue joint simplement le nom du commerce pour l'affichage.
--
-- security_invoker = respecte les politiques RLS de l'utilisateur qui interroge.

create or replace view members_by_client
with (security_invoker = on) as
select
  c.business_name        as commerce,
  c.id                   as client_id,
  m.first_name           as prenom,
  m.last_name            as nom,
  m.email                as courriel,
  m.punches              as tampons,
  m.status               as statut,
  m.reward_available     as recompense_prete,
  m.joined_at            as inscription
from members m
join clients c on c.id = m.client_id
order by c.business_name, m.joined_at;
