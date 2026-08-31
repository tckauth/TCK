import Link from 'next/link';
import { Download, Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { requireUser, getRoles } from '@/lib/auth/authorization';
import { TbmControl } from '@/components/visits/tbm-control';
type Params = {
  q?: string;
  from?: string;
  to?: string;
  manager?: string;
  construction?: string;
  tbm?: string;
  page?: string;
};
export default async function VisitsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const { supabase, user } = await requireUser();
  const roles = await getRoles(user.id);
  const staff = roles.some((r) =>
    ['SUPER_ADMIN', 'ADMIN', 'TBM_MANAGER'].includes(r),
  );
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const size = 20;
  let query = supabase
    .from('visits')
    .select(
      'id,visit_date,company_name,purpose,visitor_count,construction_location,tck_manager_id,construction_yn,tbm_yn,created_by,created_at,profiles!visits_tck_manager_id_fkey(full_name,email)',
      { count: 'exact' },
    )
    .is('deleted_at', null)
    .order('visit_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range((page - 1) * size, page * size - 1);
  if (params.q)
    query = query.ilike(
      'company_name',
      `%${params.q.replaceAll(/[%,()]/g, '')}%`,
    );
  if (params.from) query = query.gte('visit_date', params.from);
  if (params.to) query = query.lte('visit_date', params.to);
  if (params.manager) query = query.eq('tck_manager_id', params.manager);
  if (params.construction === 'O' || params.construction === 'X')
    query = query.eq('construction_yn', params.construction === 'O');
  if (params.tbm === 'O' || params.tbm === 'X')
    query = query.eq('tbm_yn', params.tbm);
  if (params.tbm === 'NULL') query = query.is('tbm_yn', null);
  const [{ data, count }, { data: managers }] = await Promise.all([
    query,
    supabase
      .from('profiles')
      .select('id,full_name,email')
      .eq('status', 'ACTIVE')
      .order('full_name')
      .limit(200),
  ]);
  const pages = Math.max(1, Math.ceil((count ?? 0) / size));
  const qs = (p: number) =>
    new URLSearchParams({ ...params, page: String(p) }).toString();
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">TCK SAFETY</p>
          <h1 className="text-3xl font-bold tracking-tight">방문/공사 현황</h1>
          <p className="mt-2 text-muted-foreground">
            TBM 상태와 방문 일정을 한눈에 확인하세요.
          </p>
        </div>
        <div className="flex gap-2">
          {staff && (
            <a
              className={buttonVariants({ variant: 'outline' })}
              href={`/visits/export?${new URLSearchParams(params).toString()}`}
            >
              <Download />
              CSV
            </a>
          )}
          <Button nativeButton={false} render={<Link href="/visits/new" />}>
            <Plus />
            방문 등록
          </Button>
        </div>
      </div>
      <Card className="mb-4 shadow-none">
        <CardContent className="p-4">
          <form className="grid gap-3 md:grid-cols-6">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                placeholder="업체명 검색"
                defaultValue={params.q}
                className="pl-9"
              />
            </div>
            <Input
              type="date"
              name="from"
              aria-label="시작일"
              defaultValue={params.from}
            />
            <Input
              type="date"
              name="to"
              aria-label="종료일"
              defaultValue={params.to}
            />
            <NativeSelect
              name="manager"
              defaultValue={params.manager ?? ''}
              className="w-full"
            >
              <NativeSelectOption value="">담당자 전체</NativeSelectOption>
              {managers?.map((m) => (
                <NativeSelectOption key={m.id} value={m.id}>
                  {m.full_name ?? m.email}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <Button>검색</Button>
            <NativeSelect
              name="construction"
              defaultValue={params.construction ?? ''}
              className="w-full"
            >
              <NativeSelectOption value="">공사 전체</NativeSelectOption>
              <NativeSelectOption value="O">공사 O</NativeSelectOption>
              <NativeSelectOption value="X">공사 X</NativeSelectOption>
            </NativeSelect>
            <NativeSelect
              name="tbm"
              defaultValue={params.tbm ?? ''}
              className="w-full"
            >
              <NativeSelectOption value="">TBM 전체</NativeSelectOption>
              <NativeSelectOption value="O">TBM O</NativeSelectOption>
              <NativeSelectOption value="X">TBM X</NativeSelectOption>
              <NativeSelectOption value="NULL">미입력</NativeSelectOption>
            </NativeSelect>
          </form>
        </CardContent>
      </Card>
      <div className="grid gap-3 md:hidden">
        {data?.map((v) => {
          const manager = v.profiles as unknown as {
            full_name: string | null;
            email: string;
          } | null;
          return (
            <Card
              key={v.id}
              className={
                v.tbm_yn === 'O'
                  ? 'border-emerald-200 bg-emerald-50/70'
                  : v.tbm_yn === 'X'
                    ? 'border-red-200 bg-red-50/70'
                    : ''
              }
            >
              <CardContent className="p-4">
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold">{v.company_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.visit_date} · {v.visitor_count}명
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
                    {v.tbm_yn ?? '미입력'}
                  </Badge>
                </div>
                <p className="mt-3 text-sm">{v.purpose}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {v.construction_location} ·{' '}
                  {manager?.full_name ?? manager?.email}
                </p>
                {staff && (
                  <div className="mt-4">
                    <TbmControl
                      id={v.id}
                      value={v.tbm_yn as 'O' | 'X' | null}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Card className="hidden shadow-none md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>날짜</TableHead>
                  <TableHead>업체명/목적</TableHead>
                  <TableHead>인원</TableHead>
                  <TableHead>장소</TableHead>
                  <TableHead>담당자</TableHead>
                  <TableHead>공사</TableHead>
                  <TableHead>TBM</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.map((v) => {
                  const manager = v.profiles as unknown as {
                    full_name: string | null;
                    email: string;
                  } | null;
                  return (
                    <TableRow
                      key={v.id}
                      className={
                        v.tbm_yn === 'O'
                          ? 'bg-emerald-50/70 hover:bg-emerald-100/60'
                          : v.tbm_yn === 'X'
                            ? 'bg-red-50/70 hover:bg-red-100/60'
                            : ''
                      }
                    >
                      <TableCell>{v.visit_date}</TableCell>
                      <TableCell>
                        <Link
                          href={`/visits/${v.id}`}
                          className="font-medium hover:underline"
                        >
                          {v.company_name}
                        </Link>
                        <p className="max-w-64 truncate text-xs text-muted-foreground">
                          {v.purpose}
                        </p>
                      </TableCell>
                      <TableCell>{v.visitor_count}명</TableCell>
                      <TableCell>{v.construction_location}</TableCell>
                      <TableCell>
                        {manager?.full_name ?? manager?.email}
                      </TableCell>
                      <TableCell>{v.construction_yn ? 'O' : 'X'}</TableCell>
                      <TableCell>
                        {staff ? (
                          <TbmControl
                            id={v.id}
                            value={v.tbm_yn as 'O' | 'X' | null}
                          />
                        ) : (
                          <Badge
                            variant={
                              v.tbm_yn === 'O'
                                ? 'default'
                                : v.tbm_yn === 'X'
                                  ? 'destructive'
                                  : 'outline'
                            }
                          >
                            {v.tbm_yn ?? '미입력'}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {!data?.length && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              조건에 맞는 방문 정보가 없습니다.
            </div>
          )}
          <div className="flex items-center justify-between border-t p-4 text-sm">
            <span>
              총 {count ?? 0}건 · {page}/{pages} 페이지
            </span>
            <div className="flex gap-2">
              <a
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
                href={`?${qs(Math.max(1, page - 1))}`}
              >
                이전
              </a>
              <a
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
                href={`?${qs(Math.min(pages, page + 1))}`}
              >
                다음
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
