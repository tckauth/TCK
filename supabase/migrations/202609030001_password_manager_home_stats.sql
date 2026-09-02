-- 담당자 목록은 활성 TBM_ADMIN만 노출하며 SUPER_ADMIN은 제외한다.
create or replace function public.list_tck_managers()
returns table(id uuid, full_name text, email text)
language sql
stable
security definer
set search_path = ''
as $$
  select distinct p.id, p.full_name, p.email
  from public.profiles p
  join public.user_roles ur on ur.user_id=p.id
  join public.roles r on r.id=ur.role_id
  where p.status='ACTIVE' and r.name='TBM_ADMIN'
  order by p.full_name nulls last, p.email;
$$;
revoke all on function public.list_tck_managers() from public;
grant execute on function public.list_tck_managers() to authenticated;

-- 로그인 전 메인 화면에는 개인 정보 없이 집계값만 제공한다.
create or replace function public.public_home_stats()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'active_users', (select count(*) from public.profiles where status='ACTIVE'),
    'admin_actions_today', (
      select count(*) from public.audit_logs
      where created_at >= date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul'
        and action in ('APPROVE_USER','SET_USER_ROLE','SET_USER_STATUS','DELETE_USER','CHANGE_TBM','CREATE_POST','UPDATE_POST','DELETE_POST')
    ),
    'service_status', '정상'
  );
$$;
revoke all on function public.public_home_stats() from public;
grant execute on function public.public_home_stats() to anon, authenticated;
