alter table public.profiles
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references public.profiles(id) on delete set null;

alter table public.profiles alter column status set default 'PENDING';

create or replace function public.has_role(required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    join public.profiles p on p.id = ur.user_id
    where ur.user_id = auth.uid()
      and p.status = 'ACTIVE'
      and r.name = any(required_roles)
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  default_role uuid;
begin
  insert into public.profiles(id, full_name, email, status)
  values(
    new.id,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    'PENDING'
  );

  select id into default_role from public.roles where name = 'EXTERNAL';
  if default_role is not null then
    insert into public.user_roles(user_id, role_id)
    values(new.id, default_role);
  end if;
  return new;
end;
$$;

create index if not exists profiles_pending_created_idx
  on public.profiles(created_at desc)
  where status = 'PENDING';

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
     and not public.has_role(array['TBM_MANAGER']) then
    raise exception 'Only a TBM manager can approve a pending signup'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_approval_before_update
  on public.profiles;
create trigger protect_profile_approval_before_update
before update of status, approved_at, approved_by on public.profiles
for each row execute function public.protect_profile_approval();
