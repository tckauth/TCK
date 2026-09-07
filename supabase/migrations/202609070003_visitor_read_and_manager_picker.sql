-- VISITOR/VISITER 사용자는 게시판과 설문을 읽을 수 있지만 작성/수정할 수 없습니다.
-- 구버전 VISITOR 역할명이 남아 있어도 조회가 가능하도록 호환성을 유지합니다.
drop policy if exists posts_read on public.posts;
create policy posts_read on public.posts for select to authenticated
using(
  deleted_at is null
  and public.has_role(array[
    'SUPER_ADMIN','AUDIT_ADMIN','APPR_ADMIN','TBM_ADMIN','VIEWER','VISITER','VISITOR'
  ])
);

drop policy if exists surveys_read on public.surveys;
create policy surveys_read on public.surveys for select to authenticated
using(public.has_role(array[
  'SUPER_ADMIN','AUDIT_ADMIN','APPR_ADMIN','TBM_ADMIN','VIEWER','VISITER','VISITOR'
]));

drop policy if exists survey_questions_read on public.survey_questions;
create policy survey_questions_read on public.survey_questions for select to authenticated
using(public.has_role(array[
  'SUPER_ADMIN','AUDIT_ADMIN','APPR_ADMIN','TBM_ADMIN','VIEWER','VISITER','VISITOR'
]));

drop policy if exists survey_options_read on public.survey_options;
create policy survey_options_read on public.survey_options for select to authenticated
using(public.has_role(array[
  'SUPER_ADMIN','AUDIT_ADMIN','APPR_ADMIN','TBM_ADMIN','VIEWER','VISITER','VISITOR'
]));

-- 담당자는 활성 상태의 내부 사용자만 노출합니다.
-- 기존 요구사항에 따라 SUPER_ADMIN과 외부 방문 계정은 제외합니다.
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
  where p.status='ACTIVE'
    and r.name in ('TBM_ADMIN','VIEWER','APPR_ADMIN','AUDIT_ADMIN')
  order by p.full_name nulls last, p.email;
$$;
revoke all on function public.list_tck_managers() from public;
grant execute on function public.list_tck_managers() to authenticated;
