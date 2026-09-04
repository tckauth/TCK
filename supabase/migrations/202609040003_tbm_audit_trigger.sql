create or replace function public.audit_visit_tbm_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.tbm_yn is distinct from new.tbm_yn then
    insert into public.audit_logs(user_id, action, target_type, target_id, description)
    values (
      coalesce(auth.uid(), new.updated_by),
      'CHANGE_TBM',
      'VISIT',
      new.id,
      new.company_name || ' TBM: ' || coalesce(old.tbm_yn, '미입력') || ' → ' || coalesce(new.tbm_yn, '미입력')
    );
  end if;
  return new;
end;
$$;

drop trigger if exists visits_tbm_audit on public.visits;
create trigger visits_tbm_audit
after update of tbm_yn on public.visits
for each row execute function public.audit_visit_tbm_change();
