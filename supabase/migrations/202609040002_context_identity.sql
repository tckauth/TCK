create or replace function public.current_user_context()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'status', p.status::text,
    'full_name', p.full_name,
    'email', p.email,
    'roles', coalesce((
      select jsonb_agg(r.name order by r.level desc)
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = p.id
    ), '[]'::jsonb),
    'maintenance_mode', coalesce((select (s.value #>> '{}')::boolean from public.system_settings s where s.key='maintenance_mode'), false),
    'site_title', coalesce((select s.value #>> '{}' from public.system_settings s where s.key='site_title'), 'TCK Safety Hub'),
    'session_timeout_minutes', coalesce((select (s.value #>> '{}')::integer from public.system_settings s where s.key='session_timeout_minutes'), 10)
  )
  from public.profiles p
  where p.id = auth.uid();
$$;

revoke all on function public.current_user_context() from public;
grant execute on function public.current_user_context() to authenticated;
