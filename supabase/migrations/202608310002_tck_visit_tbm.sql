-- TCK 방문/공사, TBM, 게시판, 설문 확장
alter table public.roles drop constraint if exists roles_name_check;
update public.roles set name='TBM_MANAGER', description='방문/공사 및 TBM 관리' where name='MANAGER';
update public.roles set name='VIEWER', description='조회 전용' where name='USER';
insert into public.roles(name,description,level) values ('EXTERNAL','외부업체 방문 등록',5) on conflict(name) do nothing;
alter table public.roles add constraint roles_name_check check(name in ('SUPER_ADMIN','ADMIN','TBM_MANAGER','VIEWER','EXTERNAL'));

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
declare default_role uuid; begin
  insert into public.profiles(id,full_name,email) values(new.id,nullif(new.raw_user_meta_data->>'full_name',''),new.email);
  select id into default_role from public.roles where name='EXTERNAL';
  if default_role is not null then insert into public.user_roles(user_id,role_id) values(new.id,default_role); end if;
  return new;
end; $$;
drop policy if exists profiles_admin_select on public.profiles;
create policy profiles_staff_select on public.profiles for select to authenticated using(public.has_role(array['SUPER_ADMIN','ADMIN','TBM_MANAGER','VIEWER']));
create policy profiles_active_directory on public.profiles for select to authenticated using(status='ACTIVE');
drop policy if exists user_roles_admin_select on public.user_roles;
create policy user_roles_staff_select on public.user_roles for select to authenticated using(public.has_role(array['SUPER_ADMIN','ADMIN','TBM_MANAGER']));

create table public.companies (
  id uuid primary key default gen_random_uuid(), company_name text not null unique check(char_length(company_name) between 1 and 120),
  business_number text, contact_name text, contact_phone text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.visits (
  id uuid primary key default gen_random_uuid(), visit_date date not null, company_name text not null check(char_length(company_name) between 1 and 120),
  company_id uuid references public.companies(id) on delete set null, purpose text not null check(char_length(purpose) between 1 and 1000), visitor_count integer not null check(visitor_count between 1 and 10000),
  construction_location text not null check(char_length(construction_location) between 1 and 200), tck_manager_id uuid not null references public.profiles(id) on delete restrict,
  construction_yn boolean not null, tbm_yn char(1) check(tbm_yn is null or tbm_yn in ('O','X')), created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(), updated_by uuid references public.profiles(id) on delete set null, updated_at timestamptz not null default now(),
  deleted_at timestamptz, deleted_by uuid references public.profiles(id) on delete set null
);
create index visits_date_created_idx on public.visits(visit_date desc,created_at desc) where deleted_at is null;
create index visits_company_idx on public.visits using gin(to_tsvector('simple',company_name));
create index visits_manager_idx on public.visits(tck_manager_id) where deleted_at is null;
create index visits_tbm_idx on public.visits(tbm_yn) where deleted_at is null;
create index visits_construction_idx on public.visits(construction_yn) where deleted_at is null;
create index visits_creator_idx on public.visits(created_by) where deleted_at is null;

create type public.post_type as enum ('GENERAL','NOTICE','SURVEY','IMAGE','VIDEO');
create table public.posts (
  id uuid primary key default gen_random_uuid(), title text not null check(char_length(title) between 1 and 200), content text not null check(char_length(content)<=20000),
  post_type public.post_type not null default 'GENERAL', author_id uuid not null references public.profiles(id) on delete restrict, view_count bigint not null default 0 check(view_count>=0),
  external_video_url text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create table public.post_attachments (
  id uuid primary key default gen_random_uuid(), post_id uuid not null references public.posts(id) on delete cascade, file_name text not null, file_path text not null unique,
  file_type text not null check(file_type in ('IMAGE','VIDEO')), file_size bigint not null check(file_size between 1 and 104857600), mime_type text not null, created_at timestamptz not null default now()
);
create index posts_created_idx on public.posts(created_at desc) where deleted_at is null;
create index posts_search_idx on public.posts using gin(to_tsvector('simple',title||' '||content));
create index attachments_post_idx on public.post_attachments(post_id);

create table public.surveys (
  id uuid primary key default gen_random_uuid(), post_id uuid not null unique references public.posts(id) on delete cascade, is_results_public boolean not null default false,
  starts_at timestamptz, ends_at timestamptz, created_at timestamptz not null default now()
);
create table public.survey_questions (
  id uuid primary key default gen_random_uuid(), survey_id uuid not null references public.surveys(id) on delete cascade, question_text text not null check(char_length(question_text) between 1 and 500),
  allow_multiple boolean not null default false, sort_order integer not null default 0
);
create table public.survey_options (
  id uuid primary key default gen_random_uuid(), question_id uuid not null references public.survey_questions(id) on delete cascade, option_text text not null check(char_length(option_text) between 1 and 300), sort_order integer not null default 0
);
create table public.survey_responses (
  id uuid primary key default gen_random_uuid(), survey_id uuid not null references public.surveys(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(), unique(survey_id,user_id)
);
create table public.survey_answers (
  id uuid primary key default gen_random_uuid(), response_id uuid not null references public.survey_responses(id) on delete cascade, question_id uuid not null references public.survey_questions(id) on delete cascade,
  option_id uuid not null references public.survey_options(id) on delete cascade, unique(response_id,question_id,option_id)
);
create index survey_questions_idx on public.survey_questions(survey_id,sort_order);
create index survey_options_idx on public.survey_options(question_id,sort_order);
create index survey_responses_idx on public.survey_responses(survey_id);

create trigger companies_updated before update on public.companies for each row execute function public.set_updated_at();
create trigger visits_updated before update on public.visits for each row execute function public.set_updated_at();
create trigger posts_updated before update on public.posts for each row execute function public.set_updated_at();

alter table public.companies enable row level security; alter table public.visits enable row level security; alter table public.posts enable row level security;
alter table public.post_attachments enable row level security; alter table public.surveys enable row level security; alter table public.survey_questions enable row level security;
alter table public.survey_options enable row level security; alter table public.survey_responses enable row level security; alter table public.survey_answers enable row level security;

create policy companies_staff_read on public.companies for select to authenticated using(public.has_role(array['SUPER_ADMIN','ADMIN','TBM_MANAGER','VIEWER']));
create policy visits_read on public.visits for select to authenticated using(deleted_at is null and (created_by=auth.uid() or public.has_role(array['SUPER_ADMIN','ADMIN','TBM_MANAGER','VIEWER'])));
create policy visits_external_insert on public.visits for insert to authenticated with check(created_by=auth.uid() and tbm_yn is null and deleted_at is null);
create policy visits_external_update on public.visits for update to authenticated using(created_by=auth.uid() and deleted_at is null) with check(created_by=auth.uid() and tbm_yn is null and deleted_at is null);
create policy visits_staff_update on public.visits for update to authenticated using(public.has_role(array['SUPER_ADMIN','ADMIN','TBM_MANAGER'])) with check(public.has_role(array['SUPER_ADMIN','ADMIN','TBM_MANAGER']));
create policy posts_read on public.posts for select to authenticated using(deleted_at is null);
create policy posts_author_insert on public.posts for insert to authenticated with check(author_id=auth.uid());
create policy posts_author_update on public.posts for update to authenticated using(author_id=auth.uid() or public.has_role(array['SUPER_ADMIN','ADMIN'])) with check(author_id=auth.uid() or public.has_role(array['SUPER_ADMIN','ADMIN']));
create policy attachments_read on public.post_attachments for select to authenticated using(true);
create policy attachments_author_manage on public.post_attachments for all to authenticated using(exists(select 1 from public.posts p where p.id=post_id and (p.author_id=auth.uid() or public.has_role(array['SUPER_ADMIN','ADMIN'])))) with check(exists(select 1 from public.posts p where p.id=post_id and (p.author_id=auth.uid() or public.has_role(array['SUPER_ADMIN','ADMIN']))));
create policy surveys_read on public.surveys for select to authenticated using(true); create policy survey_questions_read on public.survey_questions for select to authenticated using(true); create policy survey_options_read on public.survey_options for select to authenticated using(true);
create policy survey_manage on public.surveys for all to authenticated using(public.has_role(array['SUPER_ADMIN','ADMIN','TBM_MANAGER'])) with check(public.has_role(array['SUPER_ADMIN','ADMIN','TBM_MANAGER']));
create policy survey_questions_manage on public.survey_questions for all to authenticated using(public.has_role(array['SUPER_ADMIN','ADMIN','TBM_MANAGER'])) with check(public.has_role(array['SUPER_ADMIN','ADMIN','TBM_MANAGER']));
create policy survey_options_manage on public.survey_options for all to authenticated using(public.has_role(array['SUPER_ADMIN','ADMIN','TBM_MANAGER'])) with check(public.has_role(array['SUPER_ADMIN','ADMIN','TBM_MANAGER']));
create policy responses_own_read on public.survey_responses for select to authenticated using(user_id=auth.uid() or public.has_role(array['SUPER_ADMIN','ADMIN','TBM_MANAGER']) or exists(select 1 from public.surveys s where s.id=survey_id and s.is_results_public));
create policy responses_own_insert on public.survey_responses for insert to authenticated with check(user_id=auth.uid());
create policy answers_read on public.survey_answers for select to authenticated using(exists(select 1 from public.survey_responses r join public.surveys s on s.id=r.survey_id where r.id=response_id and (r.user_id=auth.uid() or s.is_results_public or public.has_role(array['SUPER_ADMIN','ADMIN','TBM_MANAGER']))));
create policy answers_own_insert on public.survey_answers for insert to authenticated with check(exists(select 1 from public.survey_responses r where r.id=response_id and r.user_id=auth.uid()));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('post-attachments','post-attachments',false,104857600,array['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/webm','video/quicktime']) on conflict(id) do update set file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy attachment_objects_read on storage.objects for select to authenticated using(bucket_id='post-attachments');
create policy attachment_objects_insert on storage.objects for insert to authenticated with check(bucket_id='post-attachments' and (storage.foldername(name))[1]=auth.uid()::text);
create policy attachment_objects_delete on storage.objects for delete to authenticated using(bucket_id='post-attachments' and ((storage.foldername(name))[1]=auth.uid()::text or public.has_role(array['SUPER_ADMIN','ADMIN'])));

alter publication supabase_realtime add table public.visits;
