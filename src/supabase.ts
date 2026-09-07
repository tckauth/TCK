import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wwcqupwfulykvxgvdimr.supabase.co';
const supabaseKey = 'sb_publishable_OM1CLbPYf1wxADAwMSiQcQ_yP1Q9iDn';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const createAdminAccount = (
  email: string,
  password: string,
  fullName: string,
) =>
  createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }).auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
