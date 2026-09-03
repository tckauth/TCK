'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function PublicSiteTitle() {
  const [title, setTitle] = useState('TCK Safety Hub');
  useEffect(() => {
    void createClient()
      .from('system_settings')
      .select('value')
      .eq('key', 'site_title')
      .maybeSingle()
      .then(({ data }) => {
        if (typeof data?.value === 'string' && data.value.trim()) setTitle(data.value);
      });
  }, []);
  return <>{title}</>;
}
