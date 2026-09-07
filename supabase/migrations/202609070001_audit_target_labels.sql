-- Audit 화면에서 내부 UUID 대신 사람이 알아볼 수 있는 대상명을 제공합니다.
create or replace function public.audit_target_labels(target_ids uuid[])
returns table(target_type text, target_id text, target_label text)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if not public.has_role(array['SUPER_ADMIN','AUDIT_ADMIN']) then
    raise exception 'Not allowed' using errcode='42501';
  end if;

  return query
  select 'USER'::text, p.id::text,
         coalesce(nullif(p.full_name,''),p.email,'사용자명 없음')
  from public.profiles p where p.id=any(target_ids)
  union all
  select 'AUTH'::text, p.id::text,
         coalesce(nullif(p.full_name,''),p.email,'사용자명 없음')
  from public.profiles p where p.id=any(target_ids)
  union all
  select case when p.post_type='SURVEY' then 'SURVEY' else 'POST' end,
         p.id::text,p.title
  from public.posts p where p.id=any(target_ids)
  union all
  select 'VISIT'::text,v.id::text,
         v.company_name || ' (' || v.visit_date::text ||
           case when v.visit_end_date<>v.visit_date then ' ~ ' || v.visit_end_date::text else '' end || ')'
  from public.visits v where v.id=any(target_ids);
end;
$function$;

revoke all on function public.audit_target_labels(uuid[]) from public;
grant execute on function public.audit_target_labels(uuid[]) to authenticated;

-- 사용자 정보 변경, 자기 자신의 SUPER_ADMIN 역할 보호, 삭제 대상명 보존.
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
  actor_name text;
  actor_email text;
  target_role text;
  target_status text;
  target_name text;
  target_email text;
  new_role_id uuid;
  requested jsonb;
  new_name text;
  new_email text;
  detail text;
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;

  select p.full_name,p.email into actor_name,actor_email
  from public.profiles p where p.id=actor;
  select p.status::text,p.full_name,p.email
    into target_status,target_name,target_email
  from public.profiles p where p.id=target_user;
  if not found then raise exception 'User not found'; end if;
  select r.name into target_role
  from public.user_roles ur join public.roles r on r.id=ur.role_id
  where ur.user_id=target_user order by r.level desc limit 1;
  detail := coalesce(nullif(target_name,''),'이름 없음') || ' (' || coalesce(target_email,'이메일 없음') || ')';

  if operation='APPROVE' then
    if not (actor_super or actor_approver) then raise exception 'Not allowed' using errcode='42501'; end if;
    if not actor_super and target_role <> 'VISITER' then raise exception 'Not allowed' using errcode='42501'; end if;
    update public.profiles set status='ACTIVE',approved_at=now(),approved_by=actor
    where id=target_user and status='PENDING';
    detail := detail || ': 상태 ' || coalesce(target_status,'PENDING') || ' → ACTIVE (가입 승인)';
  elsif operation='ROLE' then
    if not (actor_super or actor_approver) then raise exception 'Not allowed' using errcode='42501'; end if;
    if target_user=actor and target_role='SUPER_ADMIN' then
      raise exception '자기 자신의 SUPER_ADMIN 권한은 변경할 수 없습니다.' using errcode='42501';
    end if;
    if requested_value not in ('VISITER','VIEWER','TBM_ADMIN','APPR_ADMIN','AUDIT_ADMIN','SUPER_ADMIN') then raise exception 'Invalid role'; end if;
    if not actor_super and (target_role not in ('VISITER','VIEWER') or requested_value not in ('VISITER','VIEWER')) then raise exception 'Not allowed' using errcode='42501'; end if;
    select id into new_role_id from public.roles where name=requested_value;
    delete from public.user_roles where user_id=target_user;
    insert into public.user_roles(user_id,role_id) values(target_user,new_role_id);
    detail := detail || ': 역할 ' || coalesce(target_role,'없음') || ' → ' || requested_value;
  elsif operation='PROFILE' then
    if not actor_super then raise exception 'Not allowed' using errcode='42501'; end if;
    requested := requested_value::jsonb;
    new_name := trim(requested->>'full_name');
    new_email := lower(trim(requested->>'email'));
    if new_name is null or char_length(new_name) not between 1 and 100 then raise exception '사용자명을 확인하세요.'; end if;
    if new_email is null or new_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then raise exception '이메일 주소를 확인하세요.'; end if;
    update auth.users
    set email=new_email,
        raw_user_meta_data=coalesce(raw_user_meta_data,'{}'::jsonb) || jsonb_build_object('full_name',new_name),
        updated_at=now()
    where id=target_user;
    update public.profiles set full_name=new_name,email=new_email where id=target_user;
    detail := '사용자 정보 변경: ' || coalesce(target_name,'이름 없음') || ' (' || coalesce(target_email,'이메일 없음') || ') → ' || new_name || ' (' || new_email || ')';
  elsif operation='STATUS' then
    if not actor_super then raise exception 'Not allowed' using errcode='42501'; end if;
    if target_user=actor and requested_value='INACTIVE' then raise exception 'Cannot disable yourself'; end if;
    if requested_value not in ('ACTIVE','INACTIVE') then raise exception 'Invalid status'; end if;
    update public.profiles set status=requested_value::public.user_status
    where id=target_user and status<>'PENDING';
    detail := detail || ': 상태 ' || coalesce(target_status,'없음') || ' → ' || requested_value;
  elsif operation='DELETE' then
    if not actor_super or target_user=actor then raise exception 'Not allowed' using errcode='42501'; end if;
    detail := '삭제 수행자: ' || coalesce(actor_name,'이름 없음') || ' (' || coalesce(actor_email,'이메일 없음') || ') / 삭제 사용자: ' || detail;
    delete from auth.users where id=target_user;
  else
    raise exception 'Invalid operation';
  end if;

  insert into public.audit_logs(user_id,action,target_type,target_id,description)
  values(actor,'USER_'||operation,'USER',
    case when operation='DELETE' then coalesce(nullif(target_name,''),target_email,'삭제된 사용자') else target_user::text end,
    detail);
end;
$function$;
revoke all on function public.manage_user(uuid,text,text) from public;
grant execute on function public.manage_user(uuid,text,text) to authenticated;
