alter table public.roles drop constraint if exists roles_name_check;

update public.roles
set name = 'APPR_ADMIN', description = '가입 승인 및 VIEWER/VISITER 역할 관리', level = 80
where name = 'ADMIN';
update public.roles
set name = 'TBM_ADMIN', description = '방문/공사 및 TBM 여부 관리', level = 50
where name = 'TBM_MANAGER';
update public.roles
set name = 'VISITER', description = '외부업체 방문/공사 등록', level = 5
where name = 'EXTERNAL';
update public.roles set description = '모든 기능과 권한 관리' where name = 'SUPER_ADMIN';
update public.roles set description = '등록된 데이터 조회 전용' where name = 'VIEWER';

insert into public.roles(name, description, level)
values ('AUDIT_ADMIN', '감사 대응용 로그 조회', 70)
on conflict(name) do update set description = excluded.description, level = excluded.level;

alter table public.roles add constraint roles_name_check check(name in (
  'SUPER_ADMIN','AUDIT_ADMIN','APPR_ADMIN','TBM_ADMIN','VIEWER','VISITER'
));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare default_role uuid;
begin
  insert into public.profiles(id, full_name, email, status)
  values(new.id, nullif(new.raw_user_meta_data->>'full_name', ''), new.email, 'PENDING');
  select id into default_role from public.roles where name = 'VISITER';
  if default_role is not null then
    insert into public.user_roles(user_id, role_id) values(new.id, default_role);
  end if;
  return new;
end;
$$;

create or replace function public.protect_visit_tbm()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.tbm_yn is distinct from old.tbm_yn
     and not public.has_role(array['SUPER_ADMIN','TBM_ADMIN']) then
    raise exception 'TBM status can only be changed by SUPER_ADMIN or TBM_ADMIN'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create or replace function public.protect_profile_approval()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.status is distinct from old.status
      or new.approved_at is distinct from old.approved_at
      or new.approved_by is distinct from old.approved_by)
     and coalesce(auth.jwt()->>'role', '') <> 'service_role'
     and not public.has_role(array['SUPER_ADMIN','APPR_ADMIN']) then
    raise exception 'Only SUPER_ADMIN or APPR_ADMIN can approve a signup'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop policy if exists profiles_staff_select on public.profiles;
drop policy if exists profiles_active_directory on public.profiles;
drop policy if exists profiles_admin_update on public.profiles;
drop policy if exists profiles_super_update on public.profiles;
create policy profiles_staff_select on public.profiles for select to authenticated
using(public.has_role(array['SUPER_ADMIN','APPR_ADMIN','AUDIT_ADMIN','TBM_ADMIN','VIEWER']));
create policy profiles_active_directory on public.profiles for select to authenticated
using(status='ACTIVE' and public.has_role(array['SUPER_ADMIN','TBM_ADMIN','VIEWER','VISITER']));
create policy profiles_super_update on public.profiles for update to authenticated
using(public.has_role(array['SUPER_ADMIN'])) with check(public.has_role(array['SUPER_ADMIN']));

drop policy if exists user_roles_staff_select on public.user_roles;
create policy user_roles_staff_select on public.user_roles for select to authenticated
using(public.has_role(array['SUPER_ADMIN','APPR_ADMIN']));

drop policy if exists audit_admin_select on public.audit_logs;
create policy audit_admin_select on public.audit_logs for select to authenticated
using(public.has_role(array['SUPER_ADMIN','AUDIT_ADMIN']));

drop policy if exists settings_public_select on public.system_settings;
drop policy if exists settings_admin_manage on public.system_settings;
create policy settings_public_select on public.system_settings for select
using(is_public or public.has_role(array['SUPER_ADMIN']));
create policy settings_admin_manage on public.system_settings for all to authenticated
using(public.has_role(array['SUPER_ADMIN'])) with check(public.has_role(array['SUPER_ADMIN']));

drop policy if exists companies_staff_read on public.companies;
create policy companies_staff_read on public.companies for select to authenticated
using(public.has_role(array['SUPER_ADMIN','TBM_ADMIN','VIEWER']));

drop policy if exists visits_read on public.visits;
drop policy if exists visits_external_insert on public.visits;
drop policy if exists visits_external_update on public.visits;
drop policy if exists visits_staff_update on public.visits;
create policy visits_read on public.visits for select to authenticated
using(deleted_at is null and (
  public.has_role(array['SUPER_ADMIN','TBM_ADMIN','VIEWER'])
  or (created_by=auth.uid() and public.has_role(array['VISITER']))
));
create policy visits_visiter_insert on public.visits for insert to authenticated
with check(created_by=auth.uid() and tbm_yn is null and deleted_at is null
  and public.has_role(array['SUPER_ADMIN','TBM_ADMIN','VISITER']));
create policy visits_visiter_update on public.visits for update to authenticated
using(created_by=auth.uid() and deleted_at is null and public.has_role(array['VISITER']))
with check(created_by=auth.uid() and deleted_at is null and public.has_role(array['VISITER']));
create policy visits_tbm_update on public.visits for update to authenticated
using(public.has_role(array['SUPER_ADMIN','TBM_ADMIN']))
with check(public.has_role(array['SUPER_ADMIN','TBM_ADMIN']));

drop policy if exists posts_read on public.posts;
drop policy if exists posts_author_insert on public.posts;
drop policy if exists posts_author_update on public.posts;
create policy posts_read on public.posts for select to authenticated
using(deleted_at is null and public.has_role(array['SUPER_ADMIN','VIEWER']));
create policy posts_super_insert on public.posts for insert to authenticated
with check(author_id=auth.uid() and public.has_role(array['SUPER_ADMIN']));
create policy posts_super_update on public.posts for update to authenticated
using(public.has_role(array['SUPER_ADMIN'])) with check(public.has_role(array['SUPER_ADMIN']));

drop policy if exists attachments_read on public.post_attachments;
drop policy if exists attachments_author_manage on public.post_attachments;
create policy attachments_read on public.post_attachments for select to authenticated
using(public.has_role(array['SUPER_ADMIN','VIEWER']));
create policy attachments_super_manage on public.post_attachments for all to authenticated
using(public.has_role(array['SUPER_ADMIN'])) with check(public.has_role(array['SUPER_ADMIN']));

drop policy if exists surveys_read on public.surveys;
drop policy if exists survey_questions_read on public.survey_questions;
drop policy if exists survey_options_read on public.survey_options;
drop policy if exists survey_manage on public.surveys;
drop policy if exists survey_questions_manage on public.survey_questions;
drop policy if exists survey_options_manage on public.survey_options;
create policy surveys_read on public.surveys for select to authenticated
using(public.has_role(array['SUPER_ADMIN','VIEWER']));
create policy survey_questions_read on public.survey_questions for select to authenticated
using(public.has_role(array['SUPER_ADMIN','VIEWER']));
create policy survey_options_read on public.survey_options for select to authenticated
using(public.has_role(array['SUPER_ADMIN','VIEWER']));
create policy survey_manage on public.surveys for all to authenticated
using(public.has_role(array['SUPER_ADMIN'])) with check(public.has_role(array['SUPER_ADMIN']));
create policy survey_questions_manage on public.survey_questions for all to authenticated
using(public.has_role(array['SUPER_ADMIN'])) with check(public.has_role(array['SUPER_ADMIN']));
create policy survey_options_manage on public.survey_options for all to authenticated
using(public.has_role(array['SUPER_ADMIN'])) with check(public.has_role(array['SUPER_ADMIN']));

drop policy if exists attachment_objects_read on storage.objects;
drop policy if exists attachment_objects_insert on storage.objects;
drop policy if exists attachment_objects_delete on storage.objects;
create policy attachment_objects_read on storage.objects for select to authenticated
using(bucket_id='post-attachments' and public.has_role(array['SUPER_ADMIN','VIEWER']));
create policy attachment_objects_insert on storage.objects for insert to authenticated
with check(bucket_id='post-attachments' and (storage.foldername(name))[1]=auth.uid()::text
  and public.has_role(array['SUPER_ADMIN']));
create policy attachment_objects_delete on storage.objects for delete to authenticated
using(bucket_id='post-attachments' and public.has_role(array['SUPER_ADMIN']));

insert into public.permissions(name, description) values
('signup.approve','가입 승인'),
('visits.manage','방문/공사 및 TBM 관리')
on conflict(name) do update set description=excluded.description;

delete from public.role_permissions
where role_id in (select id from public.roles where name <> 'SUPER_ADMIN');
insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r join public.permissions p on p.name='audit.read'
where r.name='AUDIT_ADMIN' on conflict do nothing;
insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r join public.permissions p on p.name in ('users.read','signup.approve')
where r.name='APPR_ADMIN' on conflict do nothing;
insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r join public.permissions p on p.name='visits.manage'
where r.name='TBM_ADMIN' on conflict do nothing;
insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p
where r.name='SUPER_ADMIN' on conflict do nothing;
