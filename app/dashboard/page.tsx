import Link from 'next/link';
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  HardHat,
  XCircle,
} from 'lucide-react';
import { MetricCard } from '@/components/dashboard/metric-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { requireUser } from '@/lib/auth/authorization';
import { getSeoulDate } from '@/lib/date-time';
export default async function DashboardPage() {
  const { supabase } = await requireUser();
  const today = getSeoulDate();
  const { data } = await supabase
    .from('visits')
    .select(
      'id,company_name,visitor_count,construction_yn,tbm_yn,construction_location',
    )
    .lte('visit_date', today)
    .gte('visit_end_date', today)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  const visits = data ?? [];
  const construction = visits.filter((v) => v.construction_yn);
  const complete = visits.filter((v) => v.tbm_yn === 'O');
  const failed = visits.filter((v) => v.tbm_yn === 'X');
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <p className="text-sm font-medium text-primary">TCK SAFETY OVERVIEW</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          방문·공사 대시보드
        </h1>
        <p className="mt-2 text-muted-foreground">
          오늘의 방문 일정과 TBM 확인 상태입니다.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Link href="/visits">
          <MetricCard
            label="오늘 방문 예정"
            value={`${visits.length}건`}
            detail="전체 방문"
            icon={CalendarDays}
          />
        </Link>
        <Link href="/visits?construction=O">
          <MetricCard
            label="오늘 공사"
            value={`${construction.length}건`}
            detail="공사 진행"
            icon={HardHat}
          />
        </Link>
        <Link href="/visits?tbm=O">
          <MetricCard
            label="TBM 완료"
            value={`${complete.length}건`}
            detail="안전 확인 O"
            icon={CheckCircle2}
          />
        </Link>
        <Link href="/visits?construction=X">
          <MetricCard label="비공사 방문" value={`${visits.length - construction.length}건`} detail="공사 여부 X" icon={ClipboardList} />
        </Link>
        <Link href="/visits?tbm=X">
          <MetricCard
            label="TBM X"
            value={`${failed.length}건`}
            detail="즉시 확인"
            icon={XCircle}
          />
        </Link>
      </div>
      <Card className="mt-6 shadow-none">
        <CardHeader>
          <CardTitle>오늘 방문 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {visits.map((v) => (
              <Link
                href={`/visits/${v.id}`}
                key={v.id}
                className={`flex items-center gap-4 py-4 ${v.tbm_yn === 'O' ? 'bg-emerald-50/50' : v.tbm_yn === 'X' ? 'bg-red-50/50' : ''}`}
              >
                <div className="flex-1 px-2">
                  <p className="font-medium">{v.company_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {v.construction_location} · {v.visitor_count}명
                  </p>
                </div>
                <Badge
                  variant={
                    v.tbm_yn === 'O'
                      ? 'default'
                      : v.tbm_yn === 'X'
                        ? 'destructive'
                        : 'outline'
                  }
                >
                  TBM {v.tbm_yn ?? '미입력'}
                </Badge>
              </Link>
            ))}
            {!visits.length && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                오늘 예정된 방문이 없습니다.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
