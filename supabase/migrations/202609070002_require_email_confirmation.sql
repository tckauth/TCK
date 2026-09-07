-- 이메일 인증 전 프로필이 ACTIVE가 되는 상태 불일치를 방지합니다.
create or replace function public.require_email_confirmation_for_active()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.status='ACTIVE' and old.status is distinct from new.status
     and not exists(
       select 1 from auth.users u
       where u.id=new.id and u.email_confirmed_at is not null
     ) then
    raise exception '이메일 인증 완료 후 가입 승인할 수 있습니다.' using errcode='42501';
  end if;
  return new;
end;
$function$;

drop trigger if exists profiles_require_email_confirmation on public.profiles;
create trigger profiles_require_email_confirmation
before update of status on public.profiles
for each row execute function public.require_email_confirmation_for_active();

-- 이전 관리자 직접 생성 흐름에서 ACTIVE로 표시된 미인증 계정을 정상화합니다.
alter table public.profiles disable trigger protect_profile_approval_before_update;
update public.profiles p
set status='PENDING',approved_at=null,approved_by=null
where p.status='ACTIVE'
  and exists(
    select 1 from auth.users u
    where u.id=p.id and u.email_confirmed_at is null
  );
alter table public.profiles enable trigger protect_profile_approval_before_update;

-- 게시글/설문 작성은 SUPER_ADMIN과 TBM_ADMIN만 허용합니다.
drop policy if exists posts_author_insert on public.posts;
create policy posts_author_insert on public.posts for insert to authenticated
with check(
  author_id=auth.uid()
  and public.has_role(array['SUPER_ADMIN','TBM_ADMIN'])
);

drop policy if exists posts_author_update on public.posts;
create policy posts_author_update on public.posts for update to authenticated
using(
  public.has_role(array['SUPER_ADMIN'])
  or (
    post_type<>'SURVEY' and author_id=auth.uid()
    and public.has_role(array['TBM_ADMIN'])
  )
)
with check(
  public.has_role(array['SUPER_ADMIN'])
  or (
    post_type<>'SURVEY' and author_id=auth.uid()
    and public.has_role(array['TBM_ADMIN'])
  )
);

drop policy if exists attachment_objects_insert on storage.objects;
create policy attachment_objects_insert on storage.objects for insert to authenticated
with check(
  bucket_id='post-attachments'
  and (storage.foldername(name))[1]=auth.uid()::text
  and public.has_role(array['SUPER_ADMIN','TBM_ADMIN'])
);

-- 게시글별 사용자 조회 횟수를 누적합니다.
create table if not exists public.post_views(
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  view_count bigint not null default 1 check(view_count>0),
  first_viewed_at timestamptz not null default now(),
  last_viewed_at timestamptz not null default now(),
  primary key(post_id,user_id)
);
create index if not exists post_views_post_count_idx
  on public.post_views(post_id,view_count desc);
alter table public.post_views enable row level security;

create or replace function public.record_post_view(target_post uuid)
returns void
language plpgsql
security definer
set search_path=''
as $function$
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if not exists(select 1 from public.posts p where p.id=target_post and p.deleted_at is null) then return; end if;
  insert into public.post_views(post_id,user_id)
  values(target_post,auth.uid())
  on conflict(post_id,user_id) do update
    set view_count=public.post_views.view_count+1,last_viewed_at=now();
  update public.posts set view_count=view_count+1 where id=target_post;
end;
$function$;
revoke all on function public.record_post_view(uuid) from public;
grant execute on function public.record_post_view(uuid) to authenticated;

create or replace function public.post_view_details(target_post uuid)
returns table(user_id uuid,user_name text,email text,view_count bigint,last_viewed_at timestamptz)
language plpgsql
stable
security definer
set search_path=''
as $function$
begin
  if not public.has_role(array['SUPER_ADMIN','TBM_ADMIN']) then
    raise exception 'Not allowed' using errcode='42501';
  end if;
  return query
  select v.user_id,coalesce(nullif(p.full_name,''),p.email,'사용자명 없음'),p.email,
         v.view_count,v.last_viewed_at
  from public.post_views v join public.profiles p on p.id=v.user_id
  where v.post_id=target_post
  order by v.view_count desc,v.last_viewed_at desc;
end;
$function$;
revoke all on function public.post_view_details(uuid) from public;
grant execute on function public.post_view_details(uuid) to authenticated;
