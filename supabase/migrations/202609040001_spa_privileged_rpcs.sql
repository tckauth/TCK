-- 정적 SPA에서 service_role 키 없이 승인/역할/상태 관리를 수행하는 보안 함수.
create or replace function public.manage_user(
  target_user uuid,
  operation text,
  requested_value text default null
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  actor_super boolean := public.has_role(array['SUPER_ADMIN']);
  actor_approver boolean := public.has_role(array['APPR_ADMIN']);
  target_role text;
  new_role_id uuid;
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select r.name into target_role from public.user_roles ur join public.roles r on r.id=ur.role_id
    where ur.user_id=target_user order by r.level desc limit 1;

  if operation='APPROVE' then
    if not (actor_super or actor_approver) then raise exception 'Not allowed' using errcode='42501'; end if;
    if not actor_super and target_role <> 'VISITER' then raise exception 'Not allowed' using errcode='42501'; end if;
    update public.profiles set status='ACTIVE',approved_at=now(),approved_by=actor where id=target_user and status='PENDING';
  elsif operation='ROLE' then
    if not (actor_super or actor_approver) then raise exception 'Not allowed' using errcode='42501'; end if;
    if requested_value not in ('VISITER','VIEWER','TBM_ADMIN','APPR_ADMIN','AUDIT_ADMIN','SUPER_ADMIN') then raise exception 'Invalid role'; end if;
    if not actor_super and (target_role not in ('VISITER','VIEWER') or requested_value not in ('VISITER','VIEWER')) then raise exception 'Not allowed' using errcode='42501'; end if;
    select id into new_role_id from public.roles where name=requested_value;
    delete from public.user_roles where user_id=target_user;
    insert into public.user_roles(user_id,role_id) values(target_user,new_role_id);
  elsif operation='STATUS' then
    if not actor_super then raise exception 'Not allowed' using errcode='42501'; end if;
    if target_user=actor and requested_value='INACTIVE' then raise exception 'Cannot disable yourself'; end if;
    if requested_value not in ('ACTIVE','INACTIVE') then raise exception 'Invalid status'; end if;
    update public.profiles set status=requested_value::public.user_status where id=target_user and status<>'PENDING';
  elsif operation='DELETE' then
    if not actor_super or target_user=actor then raise exception 'Not allowed' using errcode='42501'; end if;
    delete from auth.users where id=target_user;
  else raise exception 'Invalid operation';
  end if;

  insert into public.audit_logs(user_id,action,target_type,target_id,description)
    values(actor,'USER_'||operation,'USER',target_user,coalesce(requested_value,operation));
end;
$$;
revoke all on function public.manage_user(uuid,text,text) from public;
grant execute on function public.manage_user(uuid,text,text) to authenticated;

create or replace function public.increment_post_view(post_id uuid)
returns void language sql security definer set search_path='' as $$
  update public.posts set view_count=view_count+1 where id=post_id and deleted_at is null;
$$;
revoke all on function public.increment_post_view(uuid) from public;
grant execute on function public.increment_post_view(uuid) to authenticated;
