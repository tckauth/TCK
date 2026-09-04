import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://wwcqupwfulykvxgvdimr.supabase.co',
  'sb_publishable_OM1CLbPYf1wxADAwMSiQcQ_yP1Q9iDn',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
);
