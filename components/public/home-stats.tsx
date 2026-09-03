'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, ShieldCheck, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

type Stats = {
  active_users?: number;
  admin_actions_today?: number;
  service_status?: string;
};

export function PublicHomeStats() {
  const [stats, setStats] = useState<Stats>();
  useEffect(() => {
    void createClient().rpc('public_home_stats').then(({ data }) => {
      if (data) setStats(data as Stats);
    });
  }, []);
  const items = [
    { label: '활성 사용자', value: stats ? String(stats.active_users ?? 0) : '—', note: '현재', icon: Users },
    { label: '관리 작업', value: stats ? String(stats.admin_actions_today ?? 0) : '—', note: '오늘', icon: ShieldCheck },
    { label: '서비스 상태', value: stats?.service_status ?? (stats ? '정상' : '확인 중'), note: '실시간', icon: CheckCircle2 },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map(({ label, value, note, icon: Icon }) => (
        <Card key={label} className="shadow-none">
          <CardContent className="p-4">
            <Icon className="mb-5 size-5 text-primary" />
            <p className="text-xs text-muted-foreground">{label}</p>
            <div className="mt-1 flex items-end justify-between">
              <strong className="text-xl">{value}</strong>
              <span className="text-xs text-emerald-600">{note}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
