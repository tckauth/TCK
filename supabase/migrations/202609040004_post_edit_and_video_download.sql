-- 게시물 작성자 수정, 설문 불변성, 영상 다운로드 표시 설정
alter table public.posts
  add column if not exists download_allowed boolean not null default true;

drop policy if exists posts_super_insert on public.posts;
drop policy if exists posts_super_update on public.posts;
drop policy if exists posts_author_insert on public.posts;
drop policy if exists posts_author_update on public.posts;
create policy posts_author_insert on public.posts for insert to authenticated
with check(
  author_id=auth.uid()
  and public.has_role(array['SUPER_ADMIN','TBM_ADMIN','VIEWER','VISITER'])
);
create policy posts_author_update on public.posts for update to authenticated
using(
  post_type <> 'SURVEY'
  and (author_id=auth.uid() or public.has_role(array['SUPER_ADMIN']))
)
with check(
  post_type <> 'SURVEY'
  and (author_id=auth.uid() or public.has_role(array['SUPER_ADMIN']))
);

drop policy if exists attachments_super_manage on public.post_attachments;
drop policy if exists attachments_author_manage on public.post_attachments;
create policy attachments_author_manage on public.post_attachments for all to authenticated
using(exists(
  select 1 from public.posts p where p.id=post_id
    and p.post_type <> 'SURVEY'
    and (p.author_id=auth.uid() or public.has_role(array['SUPER_ADMIN']))
))
with check(exists(
  select 1 from public.posts p where p.id=post_id
    and p.post_type <> 'SURVEY'
    and (p.author_id=auth.uid() or public.has_role(array['SUPER_ADMIN']))
));

drop policy if exists attachment_objects_insert on storage.objects;
drop policy if exists attachment_objects_delete on storage.objects;
create policy attachment_objects_insert on storage.objects for insert to authenticated
with check(
  bucket_id='post-attachments'
  and (storage.foldername(name))[1]=auth.uid()::text
  and public.has_role(array['SUPER_ADMIN','TBM_ADMIN','VIEWER','VISITER'])
);
create policy attachment_objects_delete on storage.objects for delete to authenticated
using(
  bucket_id='post-attachments'
  and ((storage.foldername(name))[1]=auth.uid()::text or public.has_role(array['SUPER_ADMIN']))
);

drop policy if exists survey_manage on public.surveys;
drop policy if exists survey_questions_manage on public.survey_questions;
drop policy if exists survey_options_manage on public.survey_options;
drop policy if exists survey_author_insert on public.surveys;
drop policy if exists survey_questions_author_insert on public.survey_questions;
drop policy if exists survey_options_author_insert on public.survey_options;
create policy survey_author_insert on public.surveys for insert to authenticated
with check(exists(
  select 1 from public.posts p where p.id=post_id
    and p.author_id=auth.uid() and p.post_type='SURVEY'
));
create policy survey_questions_author_insert on public.survey_questions for insert to authenticated
with check(exists(
  select 1 from public.surveys s join public.posts p on p.id=s.post_id
  where s.id=survey_id and p.author_id=auth.uid()
));
create policy survey_options_author_insert on public.survey_options for insert to authenticated
with check(exists(
  select 1 from public.survey_questions q
  join public.surveys s on s.id=q.survey_id
  join public.posts p on p.id=s.post_id
  where q.id=question_id and p.author_id=auth.uid()
));

create or replace function public.protect_survey_post_content()
returns trigger
security definer
set search_path = ''
as $function$
begin
  if old.post_type='SURVEY' and (
    new.title is distinct from old.title
    or new.content is distinct from old.content
    or new.post_type is distinct from old.post_type
    or new.author_id is distinct from old.author_id
    or new.external_video_url is distinct from old.external_video_url
    or new.is_pinned is distinct from old.is_pinned
    or new.download_allowed is distinct from old.download_allowed
    or new.deleted_at is distinct from old.deleted_at
  ) then
    raise exception '등록된 설문은 수정하거나 삭제할 수 없습니다.' using errcode='42501';
  end if;
  return new;
end;
$function$ language plpgsql;
drop trigger if exists protect_survey_post_content on public.posts;
create trigger protect_survey_post_content before update on public.posts
for each row execute function public.protect_survey_post_content();

create or replace function public.audit_post_change()
returns trigger
security definer
set search_path = ''
as $function$
begin
  if new.view_count is distinct from old.view_count
     and new.title is not distinct from old.title
     and new.content is not distinct from old.content
     and new.is_pinned is not distinct from old.is_pinned
     and new.external_video_url is not distinct from old.external_video_url
     and new.download_allowed is not distinct from old.download_allowed
     and new.deleted_at is not distinct from old.deleted_at then
    return new;
  end if;
  insert into public.audit_logs(user_id,action,target_type,target_id,description)
  values(auth.uid(),'UPDATE_POST','POST',new.id,new.title || ' 게시물을 수정했습니다.');
  return new;
end;
$function$ language plpgsql;
drop trigger if exists posts_change_audit on public.posts;
create trigger posts_change_audit after update on public.posts
for each row execute function public.audit_post_change();
