export interface Client {
  id: string;
  email: string;
  business_name: string;
  logo_url: string | null;
  primary_color: string;
  google_wallet_class_id: string | null;
  card_name: string;
  organization_name: string | null;
  total_stamps: number;
  reward_description: string;
  created_at: string;
}

export interface Member {
  id: string;
  client_id: string;
  first_name: string;
  last_name: string;
  email: string;
  pass_id: string | null;
  google_wallet_object_id: string | null;
  punches: number;
  reward_available: boolean;
  status: string;
  joined_at: string;
  email_consent: boolean;
  email_consent_at: string | null;
}

export interface Punch {
  id: string;
  member_id: string;
  client_id: string;
  synced_with_pass2u: boolean;
  created_at: string;
  members?: { first_name: string; last_name: string };
}

export interface Notification {
  id: string;
  client_id: string;
  title: string | null;
  message: string;
  recipients_count: number;
  pass2u_response: string | null;
  sent_at: string;
}
