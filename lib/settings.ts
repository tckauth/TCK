import { createClient } from '@/lib/supabase/server';

export async function getPublicSiteTitle() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'site_title')
    .maybeSingle();
  return typeof data?.value === 'string' && data.value.trim()
    ? data.value
    : 'TCK Safety Hub';
}
