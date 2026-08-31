import { requireRole } from '@/lib/auth/authorization';
const csv = (value: string | number | boolean | null | undefined) =>
  `"${(value == null ? '' : `${value}`).replaceAll('"', '""')}"`;
export async function GET(request: Request) {
  const { supabase } = await requireRole([
    'SUPER_ADMIN',
    'ADMIN',
    'TBM_MANAGER',
  ]);
  const url = new URL(request.url);
  let query = supabase
    .from('visits')
    .select(
      'visit_date,company_name,purpose,visitor_count,construction_location,construction_yn,tbm_yn,profiles!visits_tck_manager_id_fkey(full_name,email)',
    )
    .is('deleted_at', null)
    .order('visit_date', { ascending: false })
    .limit(10000);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const q = url.searchParams.get('q');
  if (from) query = query.gte('visit_date', from);
  if (to) query = query.lte('visit_date', to);
  if (q)
    query = query.ilike('company_name', `%${q.replaceAll(/[%,()]/g, '')}%`);
  const { data, error } = await query;
  if (error) return new Response('내보내기에 실패했습니다.', { status: 500 });
  const header = [
    '날짜',
    '업체명',
    '목적',
    '방문인원',
    '장소',
    'TCK 담당자',
    '공사유무',
    'TBM',
  ];
  const rows = (data ?? []).map((v) => {
    const m = v.profiles as unknown as {
      full_name: string | null;
      email: string;
    } | null;
    return [
      v.visit_date,
      v.company_name,
      v.purpose,
      v.visitor_count,
      v.construction_location,
      m?.full_name ?? m?.email,
      v.construction_yn ? 'O' : 'X',
      v.tbm_yn ?? '미입력',
    ]
      .map(csv)
      .join(',');
  });
  return new Response(
    '\uFEFF' + [header.map(csv).join(','), ...rows].join('\r\n'),
    {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="tck-visits.csv"',
      },
    },
  );
}
