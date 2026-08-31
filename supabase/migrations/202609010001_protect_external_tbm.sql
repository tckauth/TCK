-- 외부업체/조회 전용 사용자는 직접 API 호출로도 TBM 값을 변경할 수 없다.
-- EXTERNAL은 본인 방문건의 일반 정보는 TBM 처리 이후에도 수정할 수 있다.
create or replace function public.protect_visit_tbm()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.tbm_yn is distinct from old.tbm_yn
     and not public.has_role(array['SUPER_ADMIN','ADMIN','TBM_MANAGER']) then
    raise exception 'TBM status can only be changed by an authorized TCK user'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_visit_tbm_before_update on public.visits;
create trigger protect_visit_tbm_before_update
before update of tbm_yn on public.visits
for each row execute function public.protect_visit_tbm();

drop policy if exists visits_external_update on public.visits;
create policy visits_external_update
on public.visits
for update
to authenticated
using (
  created_by = auth.uid()
  and deleted_at is null
  and public.has_role(array['EXTERNAL'])
)
with check (
  created_by = auth.uid()
  and deleted_at is null
  and public.has_role(array['EXTERNAL'])
);
