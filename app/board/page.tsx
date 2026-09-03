import { Users, HardHat, ClipboardCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { requireUser } from '@/lib/auth/authorization';
import { RealtimeRefresh } from '@/components/visits/realtime-refresh';
import { getSeoulDate } from '@/lib/date-time';
type Manager = { id: string; full_name: string | null; email: string };
export default async function BoardPage() {
  const { supabase } = await requireUser();
  const today = getSeoulDate();
  const { data, error } = await supabase
    .from('visits')
    .select(
      'id,visit_date,visit_end_date,company_name,visitor_count,construction_location,construction_yn,tbm_yn,tck_manager_id',
    )
    .lte('visit_date', today)
    .gte('visit_end_date', today)
    .is('deleted_at', null)
    .order('created_at');
  const managerIds = [...new Set((data ?? []).map((visit) => visit.tck_manager_id))];
  const { data: allManagers } = await supabase.rpc('list_tck_managers');
  const managers = ((allManagers ?? []) as Manager[]).filter((manager) => managerIds.includes(manager.id));
  const managerById = new Map((managers ?? []).map((manager) => [manager.id, manager]));
  const total = (data ?? []).reduce((sum, v) => sum + v.visitor_count, 0);
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-sm font-medium text-primary">LIVE BOARD</p>
          <h1 className="text-3xl font-bold tracking-tight">오늘 방문 예정</h1>
          <p className="mt-2 text-muted-foreground">
            {today} 사업장 방문 및 TBM 현황
          </p>
        </div>
        <RealtimeRefresh />
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="shadow-none">
          <CardContent className="flex items-center gap-4 p-5">
            <Users className="text-primary" />
            <div>
              <p className="text-2xl font-bold">{data?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">방문 업체</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent className="flex items-center gap-4 p-5">
            <HardHat className="text-primary" />
            <div>
              <p className="text-2xl font-bold">
                {data?.filter((v) => v.construction_yn).length ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">공사 건</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent className="flex items-center gap-4 p-5">
            <ClipboardCheck className="text-primary" />
            <div>
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-xs text-muted-foreground">총 방문인원</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-3">
        {error && (
          <Card className="border-red-200 bg-red-50 shadow-none">
            <CardContent className="py-8 text-center text-sm text-red-700">
              현황 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
            </CardContent>
          </Card>
        )}
        {data?.map((v) => {
          const manager = managerById.get(v.tck_manager_id);
          return (
            <Card
              key={v.id}
              className={
                !v.construction_yn
                  ? 'border-red-200 bg-red-50'
                  : v.tbm_yn === 'X'
                    ? 'border-red-500 bg-red-200'
                    : ''
              }
            >
              <CardContent className="grid items-center gap-3 p-5 sm:grid-cols-[1fr_1fr_auto_auto]">
                <div>
                  <p className="text-lg font-semibold">{v.company_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {v.construction_location}
                  </p>
                </div>
                <div>
                  <p className="text-sm">
                    담당자 {manager?.full_name ?? manager?.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {v.visitor_count}명 · 공사 {v.construction_yn ? 'O' : 'X'}
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
                  className="px-3 py-1"
                >
                  TBM {v.tbm_yn ?? '미입력'}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
        {!data?.length && (
          <Card className="shadow-none">
            <CardContent className="py-20 text-center text-muted-foreground">
              오늘 예정된 방문이 없습니다.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
