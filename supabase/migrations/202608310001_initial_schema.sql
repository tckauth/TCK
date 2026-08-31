create extension if not exists pgcrypto;

create type public.user_status as enum ('ACTIVE', 'INACTIVE', 'SUSPENDED');
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text check (char_length(full_name) <= 80),
  email text not null unique check (char_length(email) <= 254),
  status public.user_status not null default 'ACTIVE',
  last_sign_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.roles (
  id uuid primary key default gen_random_uuid(), name text not null unique check (name in ('SUPER_ADMIN','ADMIN','MANAGER','USER')),
  description text not null default '', level smallint not null unique check (level between 1 and 100), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.user_roles (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete restrict, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id, role_id)
);
create table public.permissions (
  id uuid primary key default gen_random_uuid(), name text not null unique, description text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.role_permissions (
  id uuid primary key default gen_random_uuid(), role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(role_id, permission_id)
);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete set null, action text not null check (char_length(action) <= 60),
  target_type text check (char_length(target_type) <= 60), target_id text check (char_length(target_id) <= 120), description text check (char_length(description) <= 1000), created_at timestamptz not null default now()
);
create table public.system_settings (
  id uuid primary key default gen_random_uuid(), key text not null unique check (char_length(key) <= 100), value jsonb not null default 'null', is_public boolean not null default false,
  updated_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index profiles_status_idx on public.profiles(status);
create index profiles_created_at_idx on public.profiles(created_at desc);
create index user_roles_user_idx on public.user_roles(user_id);
create index audit_logs_user_idx on public.audit_logs(user_id);
create index audit_logs_action_created_idx on public.audit_logs(action, created_at desc);

create or replace function public.set_updated_at() returns trigger language plpgsql security invoker set search_path = '' as $$ begin new.updated_at = now(); return new; end; $$;
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger roles_updated before update on public.roles for each row execute function public.set_updated_at();
create trigger user_roles_updated before update on public.user_roles for each row execute function public.set_updated_at();
create trigger permissions_updated before update on public.permissions for each row execute function public.set_updated_at();
create trigger role_permissions_updated before update on public.role_permissions for each row execute function public.set_updated_at();
create trigger settings_updated before update on public.system_settings for each row execute function public.set_updated_at();

create or replace function public.has_role(required_roles text[]) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.user_roles ur join public.roles r on r.id=ur.role_id where ur.user_id=auth.uid() and r.name=any(required_roles));
$$;
revoke all on function public.has_role(text[]) from public; grant execute on function public.has_role(text[]) to authenticated;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
declare default_role uuid; begin
  insert into public.profiles(id, full_name, email) values(new.id, nullif(new.raw_user_meta_data->>'full_name',''), new.email);
  select id into default_role from public.roles where name='USER';
  if default_role is not null then insert into public.user_roles(user_id, role_id) values(new.id, default_role); end if;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.audit_logs enable row level security;
alter table public.system_settings enable row level security;

create policy profiles_self_select on public.profiles for select to authenticated using (id=auth.uid());
create policy profiles_admin_select on public.profiles for select to authenticated using (public.has_role(array['SUPER_ADMIN','ADMIN','MANAGER']));
create policy profiles_self_update on public.profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid());
create policy profiles_admin_update on public.profiles for update to authenticated using (public.has_role(array['SUPER_ADMIN','ADMIN'])) with check (public.has_role(array['SUPER_ADMIN','ADMIN']));
create policy roles_authenticated_select on public.roles for select to authenticated using (true);
create policy user_roles_self_select on public.user_roles for select to authenticated using (user_id=auth.uid());
create policy user_roles_admin_select on public.user_roles for select to authenticated using (public.has_role(array['SUPER_ADMIN','ADMIN','MANAGER']));
create policy user_roles_super_manage on public.user_roles for all to authenticated using (public.has_role(array['SUPER_ADMIN'])) with check (public.has_role(array['SUPER_ADMIN']));
create policy permissions_authenticated_select on public.permissions for select to authenticated using (true);
create policy role_permissions_authenticated_select on public.role_permissions for select to authenticated using (true);
create policy role_permissions_super_manage on public.role_permissions for all to authenticated using (public.has_role(array['SUPER_ADMIN'])) with check (public.has_role(array['SUPER_ADMIN']));
create policy audit_admin_select on public.audit_logs for select to authenticated using (public.has_role(array['SUPER_ADMIN','ADMIN']));
create policy audit_actor_insert on public.audit_logs for insert to authenticated with check (user_id=auth.uid());
create policy settings_public_select on public.system_settings for select using (is_public or public.has_role(array['SUPER_ADMIN','ADMIN']));
create policy settings_admin_manage on public.system_settings for all to authenticated using (public.has_role(array['SUPER_ADMIN','ADMIN'])) with check (public.has_role(array['SUPER_ADMIN','ADMIN']));

insert into public.roles(name,description,level) values
('SUPER_ADMIN','모든 시스템 권한',100),('ADMIN','사용자, 설정, 로그 관리',80),('MANAGER','일반 사용자 조회 및 업무 관리',50),('USER','일반 서비스 이용',10);
insert into public.permissions(name,description) values
('users.read','사용자 조회'),('users.write','사용자 생성 및 수정'),('users.delete','사용자 삭제'),('roles.manage','역할과 권한 관리'),('settings.manage','서비스 설정 관리'),('audit.read','감사 로그 조회');
insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r cross join public.permissions p where r.name='SUPER_ADMIN';
insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r join public.permissions p on p.name in ('users.read','users.write','roles.manage','settings.manage','audit.read') where r.name='ADMIN';
insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r join public.permissions p on p.name='users.read' where r.name='MANAGER';
insert into public.system_settings(key,value,is_public) values ('site_title','"Aegis Console"',true),('maintenance_mode','false',true);
