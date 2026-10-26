begin;
-- Only work catalog rows can be deleted. Existing quote/survey snapshots remain.
grant delete on public.work_items to authenticated;
create or replace function public.erp_delete_work_items(items jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
declare
  target record;
  current_version bigint;
begin
  if (select auth.jwt()->>'aal') is distinct from 'aal2' then
    raise exception 'Two-factor authentication required' using errcode = '42501';
  end if;
  if jsonb_typeof(items) is distinct from 'array' then
    raise exception 'Expected catalog item array';
  end if;
  if jsonb_array_length(items) <> (select count(distinct x.id) from jsonb_to_recordset(items) as x(id uuid, version bigint)) then
    raise exception 'Duplicate or invalid work item identity';
  end if;
  -- Lock and validate the entire selection before deleting any row. RLS applies.
  for target in select * from jsonb_to_recordset(items) as x(id uuid, version bigint) order by id loop
    select w.version into current_version from public.work_items w where w.id = target.id for update;
    if not found or current_version is distinct from target.version then
      raise exception 'Catalog changed; refresh before deleting' using errcode = '40001';
    end if;
  end loop;
  delete from public.work_items w using jsonb_to_recordset(items) as x(id uuid, version bigint)
    where w.id = x.id and w.version = x.version;
end;
$$;
revoke all on function public.erp_delete_work_items(jsonb) from public, anon;
grant execute on function public.erp_delete_work_items(jsonb) to authenticated;
commit;
