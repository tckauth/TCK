drop policy if exists responses_own_read on public.survey_responses;
drop policy if exists responses_own_insert on public.survey_responses;
drop policy if exists answers_read on public.survey_answers;
drop policy if exists answers_own_insert on public.survey_answers;

create policy responses_authorized_read on public.survey_responses for select to authenticated
using(public.has_role(array['SUPER_ADMIN','VIEWER']));
create policy responses_super_insert on public.survey_responses for insert to authenticated
with check(user_id=auth.uid() and public.has_role(array['SUPER_ADMIN']));
create policy answers_authorized_read on public.survey_answers for select to authenticated
using(public.has_role(array['SUPER_ADMIN','VIEWER']));
create policy answers_super_insert on public.survey_answers for insert to authenticated
with check(public.has_role(array['SUPER_ADMIN']) and exists(
  select 1 from public.survey_responses r
  where r.id=response_id and r.user_id=auth.uid()
));
