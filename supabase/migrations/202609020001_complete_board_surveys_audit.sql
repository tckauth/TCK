-- 게시물 고정, 기간형 설문, 종료 후 결과 보호 및 역할별 게시판 접근
alter table public.posts
  add column if not exists is_pinned boolean not null default false;

create index if not exists posts_pinned_created_idx
  on public.posts(is_pinned desc, created_at desc)
  where deleted_at is null;

alter table public.surveys
  drop constraint if exists surveys_valid_period;
alter table public.surveys
  add constraint surveys_valid_period
  check(starts_at is null or ends_at is null or starts_at < ends_at);

drop policy if exists posts_read on public.posts;
create policy posts_read on public.posts for select to authenticated
using(deleted_at is null and public.has_role(array['SUPER_ADMIN','TBM_ADMIN','VIEWER','VISITER']));

drop policy if exists attachments_read on public.post_attachments;
create policy attachments_read on public.post_attachments for select to authenticated
using(public.has_role(array['SUPER_ADMIN','TBM_ADMIN','VIEWER','VISITER']));

drop policy if exists surveys_read on public.surveys;
drop policy if exists survey_questions_read on public.survey_questions;
drop policy if exists survey_options_read on public.survey_options;
create policy surveys_read on public.surveys for select to authenticated
using(public.has_role(array['SUPER_ADMIN','TBM_ADMIN','VIEWER','VISITER']));
create policy survey_questions_read on public.survey_questions for select to authenticated
using(public.has_role(array['SUPER_ADMIN','TBM_ADMIN','VIEWER','VISITER']));
create policy survey_options_read on public.survey_options for select to authenticated
using(public.has_role(array['SUPER_ADMIN','TBM_ADMIN','VIEWER','VISITER']));

drop policy if exists responses_authorized_read on public.survey_responses;
drop policy if exists responses_super_insert on public.survey_responses;
drop policy if exists answers_authorized_read on public.survey_answers;
drop policy if exists answers_super_insert on public.survey_answers;

create policy responses_period_read on public.survey_responses for select to authenticated
using(
  user_id=auth.uid()
  or public.has_role(array['SUPER_ADMIN','TBM_ADMIN'])
  or exists(
    select 1 from public.surveys s
    where s.id=survey_id
      and s.is_results_public
      and (s.ends_at is null or now() < s.ends_at)
  )
);

create policy responses_period_insert on public.survey_responses for insert to authenticated
with check(
  user_id=auth.uid()
  and public.has_role(array['SUPER_ADMIN','TBM_ADMIN','VIEWER','VISITER'])
  and exists(
    select 1 from public.surveys s
    where s.id=survey_id
      and (s.starts_at is null or now() >= s.starts_at)
      and (s.ends_at is null or now() < s.ends_at)
  )
);

create policy answers_period_read on public.survey_answers for select to authenticated
using(exists(
  select 1
  from public.survey_responses r
  join public.surveys s on s.id=r.survey_id
  where r.id=response_id and (
    r.user_id=auth.uid()
    or public.has_role(array['SUPER_ADMIN','TBM_ADMIN'])
    or (s.is_results_public and (s.ends_at is null or now() < s.ends_at))
  )
));

create policy answers_period_insert on public.survey_answers for insert to authenticated
with check(exists(
  select 1
  from public.survey_responses r
  join public.surveys s on s.id=r.survey_id
  where r.id=response_id
    and r.user_id=auth.uid()
    and (s.starts_at is null or now() >= s.starts_at)
    and (s.ends_at is null or now() < s.ends_at)
));

drop policy if exists attachment_objects_read on storage.objects;
create policy attachment_objects_read on storage.objects for select to authenticated
using(bucket_id='post-attachments' and public.has_role(array['SUPER_ADMIN','TBM_ADMIN','VIEWER','VISITER']));
