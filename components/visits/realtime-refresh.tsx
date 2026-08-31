'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
export function RealtimeRefresh() {
  const router = useRouter();
  useEffect(() => {
    const client = createClient();
    const channel = client
      .channel('visits-board')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visits' },
        () => router.refresh(),
      )
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [router]);
  return (
    <span className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
      실시간 연결
    </span>
  );
}
