-- 설문 메뉴 전 사용자 접근, 본인 답변만 조회, SUPER/TBM 관리자는 전체 조회
drop policy if exists posts_read on public.posts;
create policy posts_read on public.posts for select to authenticated
using(deleted_at is null and public.has_role(array[
  'SUPER_ADMIN','AUDIT_ADMIN','APPR_ADMIN','TBM_ADMIN','VIEWER','VISITER'
]));

drop policy if exists surveys_read on public.surveys;
drop policy if exists survey_questions_read on public.survey_questions;
drop policy if exists survey_options_read on public.survey_options;
create policy surveys_read on public.surveys for select to authenticated
using(public.has_role(array[
  'SUPER_ADMIN','AUDIT_ADMIN','APPR_ADMIN','TBM_ADMIN','VIEWER','VISITER'
]));
create policy survey_questions_read on public.survey_questions for select to authenticated
using(public.has_role(array[
  'SUPER_ADMIN','AUDIT_ADMIN','APPR_ADMIN','TBM_ADMIN','VIEWER','VISITER'
]));
create policy survey_options_read on public.survey_options for select to authenticated
using(public.has_role(array[
  'SUPER_ADMIN','AUDIT_ADMIN','APPR_ADMIN','TBM_ADMIN','VIEWER','VISITER'
]));

drop policy if exists responses_period_read on public.survey_responses;
create policy responses_private_read on public.survey_responses for select to authenticated
using(user_id=auth.uid() or public.has_role(array['SUPER_ADMIN','TBM_ADMIN']));

drop policy if exists answers_period_read on public.survey_answers;
create policy answers_private_read on public.survey_answers for select to authenticated
using(exists(
  select 1 from public.survey_responses r
  where r.id=response_id
    and (r.user_id=auth.uid() or public.has_role(array['SUPER_ADMIN','TBM_ADMIN']))
));

drop policy if exists responses_period_insert on public.survey_responses;
create policy responses_period_insert on public.survey_responses for insert to authenticated
with check(
  user_id=auth.uid()
  and public.has_role(array[
    'SUPER_ADMIN','AUDIT_ADMIN','APPR_ADMIN','TBM_ADMIN','VIEWER','VISITER'
  ])
  and exists(
    select 1 from public.surveys s
    where s.id=survey_id
      and (s.starts_at is null or now() >= s.starts_at)
      and (s.ends_at is null or now() < s.ends_at)
  )
);
