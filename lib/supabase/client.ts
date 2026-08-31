'use client';
import { createBrowserClient } from '@supabase/ssr';
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key)
    throw new Error('Supabase 연결 정보가 설정되지 않았습니다.');
  return createBrowserClient(url, key);
}
