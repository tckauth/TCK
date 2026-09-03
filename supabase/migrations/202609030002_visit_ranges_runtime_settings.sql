alter table public.visits
  add column if not exists visit_end_date date;

update public.visits
set visit_end_date = visit_date
where visit_end_date is null;

alter table public.visits
  alter column visit_end_date set not null,
  alter column tbm_yn set default 'X';

alter table public.visits
  drop constraint if exists visits_date_range_check;
alter table public.visits
  add constraint visits_date_range_check check (visit_end_date >= visit_date);

update public.visits set tbm_yn = 'X' where tbm_yn is null;

drop policy if exists visits_visiter_insert on public.visits;
create policy visits_visiter_insert on public.visits for insert to authenticated
with check (
  created_by = auth.uid()
  and tbm_yn = 'X'
  and deleted_at is null
  and public.has_role(array['SUPER_ADMIN','TBM_ADMIN','VISITER'])
);

insert into public.system_settings(key, value, is_public)
values ('session_timeout_minutes', '10', true)
on conflict(key) do update set is_public = true;

create index if not exists visits_active_date_range_idx
  on public.visits(visit_date, visit_end_date)
  where deleted_at is null;
