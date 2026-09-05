-- 사용자/게시물 감사 상세화 및 SUPER_ADMIN 설문 관리 허용
create or replace function public.manage_user(
  target_user uuid,
  operation text,
  requested_value text default null
) returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor uuid := auth.uid();
  actor_super boolean := public.has_role(array['SUPER_ADMIN']);
  actor_approver boolean := public.has_role(array['APPR_ADMIN']);
  target_role text;
  target_status text;
  target_name text;
  target_email text;
  new_role_id uuid;
  detail text;
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;

  select p.status::text, p.full_name, p.email
    into target_status, target_name, target_email
  from public.profiles p where p.id=target_user;
  select r.name into target_role
  from public.user_roles ur join public.roles r on r.id=ur.role_id
  where ur.user_id=target_user order by r.level desc limit 1;
  detail := coalesce(nullif(target_name,''), '이름 없음') || ' (' || coalesce(target_email,'이메일 없음') || ')';

  if operation='APPROVE' then
    if not (actor_super or actor_approver) then raise exception 'Not allowed' using errcode='42501'; end if;
    if not actor_super and target_role <> 'VISITER' then raise exception 'Not allowed' using errcode='42501'; end if;
    update public.profiles set status='ACTIVE',approved_at=now(),approved_by=actor
    where id=target_user and status='PENDING';
    detail := detail || ': 상태 ' || coalesce(target_status,'PENDING') || ' → ACTIVE (가입 승인)';
  elsif operation='ROLE' then
    if not (actor_super or actor_approver) then raise exception 'Not allowed' using errcode='42501'; end if;
    if requested_value not in ('VISITER','VIEWER','TBM_ADMIN','APPR_ADMIN','AUDIT_ADMIN','SUPER_ADMIN') then raise exception 'Invalid role'; end if;
    if not actor_super and (target_role not in ('VISITER','VIEWER') or requested_value not in ('VISITER','VIEWER')) then raise exception 'Not allowed' using errcode='42501'; end if;
    select id into new_role_id from public.roles where name=requested_value;
    delete from public.user_roles where user_id=target_user;
    insert into public.user_roles(user_id,role_id) values(target_user,new_role_id);
    detail := detail || ': 역할 ' || coalesce(target_role,'없음') || ' → ' || requested_value;
  elsif operation='STATUS' then
    if not actor_super then raise exception 'Not allowed' using errcode='42501'; end if;
    if target_user=actor and requested_value='INACTIVE' then raise exception 'Cannot disable yourself'; end if;
    if requested_value not in ('ACTIVE','INACTIVE') then raise exception 'Invalid status'; end if;
    update public.profiles set status=requested_value::public.user_status
    where id=target_user and status<>'PENDING';
    detail := detail || ': 상태 ' || coalesce(target_status,'없음') || ' → ' || requested_value;
  elsif operation='DELETE' then
    if not actor_super or target_user=actor then raise exception 'Not allowed' using errcode='42501'; end if;
    detail := detail || ': 계정 삭제';
    delete from auth.users where id=target_user;
  else
    raise exception 'Invalid operation';
  end if;

  insert into public.audit_logs(user_id,action,target_type,target_id,description)
  values(actor,'USER_'||operation,'USER',target_user,detail);
end;
$function$;
revoke all on function public.manage_user(uuid,text,text) from public;
grant execute on function public.manage_user(uuid,text,text) to authenticated;

drop policy if exists posts_author_update on public.posts;
create policy posts_author_update on public.posts for update to authenticated
using(
  public.has_role(array['SUPER_ADMIN'])
  or (post_type <> 'SURVEY' and author_id=auth.uid())
)
with check(
  public.has_role(array['SUPER_ADMIN'])
  or (post_type <> 'SURVEY' and author_id=auth.uid())
);

create or replace function public.protect_survey_post_content()
returns trigger
security definer
set search_path = ''
as $function$
begin
  if old.post_type='SURVEY'
     and not public.has_role(array['SUPER_ADMIN'])
     and (
       new.title is distinct from old.title
       or new.content is distinct from old.content
       or new.post_type is distinct from old.post_type
       or new.author_id is distinct from old.author_id
       or new.external_video_url is distinct from old.external_video_url
       or new.is_pinned is distinct from old.is_pinned
       or new.download_allowed is distinct from old.download_allowed
       or new.deleted_at is distinct from old.deleted_at
     ) then
    raise exception '등록된 설문은 SUPER_ADMIN만 수정하거나 삭제할 수 있습니다.' using errcode='42501';
  end if;
  return new;
end;
$function$ language plpgsql;

create or replace function public.audit_post_change()
returns trigger
security definer
set search_path = ''
as $function$
declare
  kind text := case when coalesce(new.post_type,old.post_type)='SURVEY' then 'SURVEY' else 'POST' end;
  event_action text;
  event_title text := coalesce(new.title,old.title);
begin
  if tg_op='INSERT' then
    event_action := 'CREATE_' || kind;
  elsif new.view_count is distinct from old.view_count
     and new.title is not distinct from old.title
     and new.content is not distinct from old.content
     and new.is_pinned is not distinct from old.is_pinned
     and new.external_video_url is not distinct from old.external_video_url
     and new.download_allowed is not distinct from old.download_allowed
     and new.deleted_at is not distinct from old.deleted_at then
    return new;
  elsif old.deleted_at is null and new.deleted_at is not null then
    event_action := 'DELETE_' || kind;
  else
    event_action := 'UPDATE_' || kind;
  end if;
  insert into public.audit_logs(user_id,action,target_type,target_id,description)
  values(auth.uid(),event_action,kind,new.id,event_title || ' ' ||
    case when event_action like 'CREATE_%' then '작성'
         when event_action like 'DELETE_%' then '삭제'
         else '수정' end || ' 처리했습니다.');
  return new;
end;
$function$ language plpgsql;
drop trigger if exists posts_change_audit on public.posts;
create trigger posts_change_audit after insert or update on public.posts
for each row execute function public.audit_post_change();
