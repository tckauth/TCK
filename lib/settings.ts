import { publicEnv } from '@/lib/env';

type RuntimeSettings = {
  siteTitle: string;
  sessionTimeoutMinutes: number;
  maintenanceMode: boolean;
};

let cached: { expiresAt: number; value: RuntimeSettings } | undefined;

export function invalidateRuntimeSettings() {
  cached = undefined;
}

export async function getRuntimeSettings(): Promise<RuntimeSettings> {
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const env = publicEnv();
  const response = await fetch(
    `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/system_settings?select=key,value&key=in.(site_title,session_timeout_minutes,maintenance_mode)`,
    {
      headers: {
        apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
    },
  );
  const rows = response.ok
    ? ((await response.json()) as Array<{ key: string; value: unknown }>)
    : [];
  const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  const value = {
    siteTitle:
      typeof values.site_title === 'string' && values.site_title.trim()
        ? values.site_title
        : 'TCK Safety Hub',
    sessionTimeoutMinutes: Number(values.session_timeout_minutes) || 10,
    maintenanceMode: values.maintenance_mode === true,
  };
  cached = { expiresAt: Date.now() + 60_000, value };
  return value;
}

export async function getPublicSiteTitle() {
  return (await getRuntimeSettings()).siteTitle;
}
