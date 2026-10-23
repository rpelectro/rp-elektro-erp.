begin;
create table public.entries (
 id uuid primary key default gen_random_uuid(),company_id uuid not null references public.companies(id),
 project_id uuid,payload jsonb not null,source_system text not null default '',source_id text not null default '',
 version integer not null default 1,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(company_id,id),foreign key(company_id,project_id) references public.projects(company_id,id),
 check(jsonb_typeof(payload)='object'),
 check(payload->>'type' in ('survey','quote','decision','materials','material','recipe','handover','invoice','payment','event','document','preferences')),
 check(length(payload::text)<8000000),check(version>0)
);
create index entries_project on public.entries(company_id,project_id);
create index entries_type on public.entries(company_id,(payload->>'type'));
create unique index entries_original_file on public.entries(company_id,project_id,(payload->>'file_key'),(payload->>'entity_id'),(payload->>'category')) nulls not distinct where payload->>'type'='document';
create unique index entries_document_revision on public.entries(company_id,(payload->>'type'),(payload->>'series_id'),(payload->>'revision')) where payload->>'type' in ('quote','handover');
create unique index entries_source on public.entries(company_id,source_system,source_id) where source_system<>'' and source_id<>'';
create unique index entries_invoice_number on public.entries(company_id,(payload->>'direction'),(payload->'issuer'->>'tax_number'),(payload->>'number'),(payload->>'currency')) where payload->>'type'='invoice' and payload->>'draft'='false';
alter table public.entries enable row level security;
grant select,insert,update on public.entries to authenticated;
create policy entries_owner on public.entries for all to authenticated using(company_id in(select id from public.companies)) with check(company_id in(select id from public.companies));
create policy entries_aal2 on public.entries as restrictive for all to authenticated using((select auth.jwt()->>'aal')='aal2') with check((select auth.jwt()->>'aal')='aal2');
create function public.erp_entry_guard() returns trigger language plpgsql set search_path='' as $$
declare p jsonb:=NEW.payload; prior jsonb; rel record; ref_id text; immutable boolean; line jsonb; labor numeric:=0; deduction numeric:=0;
begin
 if TG_OP='UPDATE' then
   prior:=OLD.payload;
   if prior->>'type' is distinct from p->>'type' or (NEW.project_id is distinct from OLD.project_id and p->>'type'<>'event') then raise exception 'Immutable document identity';end if;
   immutable:= (prior->>'type' in ('quote','handover') and prior->>'sealed'='true') or (prior->>'type'='invoice' and prior->>'draft'='false') or prior->>'type' in ('payment','decision','document');
   if immutable then raise exception 'Immutable snapshot: create a new version or related correction';end if;
 end if;
 -- Serialize business validation within a tenant, including duplicate payments and references.
 perform pg_advisory_xact_lock(hashtextextended(NEW.company_id::text,0));
 if p->>'type' in ('survey','quote','handover','materials') and NEW.project_id is null then raise exception 'Project required';end if;
 if p->>'type' in ('quote','handover') and p->>'sealed'='true' then
   if coalesce(p->>'pdf_id','')='' then raise exception 'Original PDF required';end if;
   if not exists(select 1 from public.entries e where e.id=(p->>'pdf_id')::uuid and e.company_id=NEW.company_id and e.project_id=NEW.project_id and e.payload->>'type'='document' and e.payload->>'mime'='application/pdf' and e.payload->>'entity_id'=NEW.id::text) then raise exception 'PDF relationship missing';end if;
 end if;
 if p->>'type'='quote' then
   if jsonb_typeof(p->'lines') is distinct from 'array' or jsonb_array_length(p->'lines')=0 then raise exception 'Quote lines required';end if;
   for line in select jsonb_array_elements(p->'lines') loop
    if coalesce(line->>'name','')='' or coalesce(line->>'unit','')='' or (line->>'quantity_milli') is null or (line->>'price_minor') is null or (line->>'quantity_milli')::numeric<=0 or (line->>'price_minor')::numeric<0 or (line->>'quantity_milli')::numeric<>trunc((line->>'quantity_milli')::numeric) or (line->>'price_minor')::numeric<>trunc((line->>'price_minor')::numeric) then raise exception 'Invalid quote line';end if;
    labor:=labor+round((line->>'price_minor')::numeric*(line->>'quantity_milli')::numeric/1000);
   end loop;
   if p->>'materials_minor' is null or p->>'discount_minor' is null or labor+(p->>'materials_minor')::numeric-(p->>'discount_minor')::numeric<0 then raise exception 'Invalid quote total';end if;
   if (p->>'discount_minor')::numeric<0 or (p->>'materials_minor')::numeric<0 then raise exception 'Invalid money';end if;
   if p->>'sealed'='true' and (p->>'tax_mode'='unknown' or coalesce(p->'customer'->>'address','')='' or coalesce(p->'company'->>'address','')='') then raise exception 'Incomplete quote';end if;
 end if;
 if p->>'type'='handover' and p->>'sealed'='true' and (coalesce(p->'checks'->>'tidy','false')<>'true' or coalesce(p->'checks'->>'informed','false')<>'true' or coalesce(p->'checks'->>'documents','false')<>'true') then raise exception 'Three closure checks required';end if;
 if p->>'type'='invoice' then
   if p->>'direction'<>'outgoing' or p->>'source'<>'manual' or p->>'provider'<>'szamlazz.hu' then raise exception 'Only manual outgoing invoices enabled';end if;
   if p->>'draft'='false' then
    if coalesce(p->>'number','')='' or p->>'issued_on' is null or p->>'performed_on' is null or p->>'due_on' is null or p->>'net_minor' is null or p->>'tax_minor' is null or p->>'gross_minor' is null or coalesce(p->'issuer'->>'address','')='' or coalesce(p->'customer'->>'address','')='' or coalesce(p->>'method','')='' then raise exception 'Incomplete invoice';end if;
    if (p->>'net_minor')::numeric+(p->>'tax_minor')::numeric<>(p->>'gross_minor')::numeric then raise exception 'Invoice amounts mismatch';end if;
   end if;
   for ref_id in select jsonb_array_elements_text(p->'relation_ids') loop
     select payload into prior from public.entries where id=ref_id::uuid and company_id=NEW.company_id and project_id is not distinct from NEW.project_id and payload->>'type'='invoice';
     if prior is null or prior->>'currency'<>p->>'currency' then raise exception 'Invalid invoice relationship';end if;
     if prior->>'document_type'='advance' then deduction:=deduction+greatest((prior->>'gross_minor')::numeric,0);end if;
   end loop;
   if p->>'document_type' in ('credit','correction') and jsonb_array_length(p->'relation_ids')=0 then raise exception 'Invoice predecessor required';end if;
   if coalesce((p->>'advance_deduction_minor')::numeric,0)>0 and (p->>'document_type'<>'final' or (p->>'advance_deduction_minor')::numeric>deduction or (p->>'advance_deduction_minor')::numeric>coalesce((p->>'gross_minor')::numeric,0)) then raise exception 'Invalid advance deduction';end if;
 end if;
 if p->>'type'='event' and (p->>'starts_at' is null or p->>'ends_at' is null or (p->>'starts_at')::timestamptz>=(p->>'ends_at')::timestamptz) then raise exception 'Invalid event interval';end if;
 if p->>'type'='payment' then
   select payload into prior from public.entries where id=(p->>'invoice_id')::uuid and company_id=NEW.company_id and project_id is not distinct from NEW.project_id and payload->>'type'='invoice';
   if prior is null or prior->>'draft'<>'false' or prior->>'currency'<>p->>'currency' or (p->>'amount_minor')::numeric<=0 then raise exception 'Invalid payment';end if;
   if p->>'voids_id' is not null then
    select payload into prior from public.entries where id=(p->>'voids_id')::uuid and company_id=NEW.company_id and payload->>'type'='payment';
    if prior is null or prior->>'voids_id' is not null or prior->>'invoice_id'<>p->>'invoice_id' or prior->>'amount_minor'<>p->>'amount_minor' or exists(select 1 from public.entries e where e.company_id=NEW.company_id and e.payload->>'voids_id'=p->>'voids_id') then raise exception 'Invalid payment reversal';end if;
   end if;
 end if;
 if p->>'type' in ('decision','materials') then
   select payload into prior from public.entries where id=(p->>'quote_id')::uuid and company_id=NEW.company_id and project_id=NEW.project_id and payload->>'type'='quote';
   if prior is null or (p->>'type'='decision' and prior->>'sealed'<>'true') then raise exception 'Invalid quote relationship';end if;
 end if;
 if p->>'type'='document' then
  if split_part(p->>'file_key','/',1)<>NEW.company_id::text then raise exception 'Foreign file territory';end if;
  if p->>'entity_id' is not null and not exists(select 1 from public.entries e where e.id=(p->>'entity_id')::uuid and e.company_id=NEW.company_id and e.project_id is not distinct from NEW.project_id) then raise exception 'Invalid document relationship';end if;
 end if;
 return NEW;
end;$$;
create trigger entries_guard before insert or update on public.entries for each row execute function public.erp_entry_guard();
create trigger entries_stamp before insert or update on public.entries for each row execute function public.erp_stamp();
revoke all on function public.erp_entry_guard() from public;
create function public.erp_close_guard() returns trigger language plpgsql set search_path='' as $$begin
 if NEW.status='completed' and OLD.status<>'completed' and not exists(select 1 from public.entries e where e.company_id=NEW.company_id and e.project_id=NEW.id and e.payload->>'type'='handover' and e.payload->>'sealed'='true' and e.payload->'checks'->>'tidy'='true' and e.payload->'checks'->>'informed'='true' and e.payload->'checks'->>'documents'='true') then raise exception 'Final handover required before closure';end if;return NEW;end;$$;
create trigger projects_close before update on public.projects for each row execute function public.erp_close_guard();
revoke all on function public.erp_close_guard() from public;
-- One database statement = one consistent RLS-filtered snapshot. Immutable file keys can be downloaded afterwards.
create function public.erp_snapshot() returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('company',(select to_jsonb(c) from public.companies c limit 1),
 'partners',coalesce((select jsonb_agg(p) from public.partners p),'[]'::jsonb),
 'projects',coalesce((select jsonb_agg(p) from public.projects p),'[]'::jsonb),
 'work_items',coalesce((select jsonb_agg(w) from public.work_items w),'[]'::jsonb),
 'entries',coalesce((select jsonb_agg(e) from public.entries e),'[]'::jsonb));
$$;
revoke all on function public.erp_snapshot() from public;grant execute on function public.erp_snapshot() to authenticated;

create table public.erp_operations(id uuid primary key,company_id uuid not null references public.companies(id),result jsonb not null,created_at timestamptz not null default now());
alter table public.erp_operations enable row level security;
grant select,insert on public.erp_operations to authenticated;
create policy ops_owner on public.erp_operations for all to authenticated using(company_id in(select id from public.companies) and (select auth.jwt()->>'aal')='aal2') with check(company_id in(select id from public.companies) and (select auth.jwt()->>'aal')='aal2');
create function public.erp_apply(operation_id uuid,table_name text,record_id uuid,expected_version integer,data jsonb) returns jsonb language plpgsql set search_path='' as $$
declare tenant uuid;result jsonb;columns text;values_sql text;updates text;current_version integer;allowed text[];
begin
 select id into tenant from public.companies limit 1;if tenant is null or auth.jwt()->>'aal'<>'aal2' then raise exception 'Unauthorized';end if;
 if table_name not in ('companies','partners','projects','work_items','entries') then raise exception 'Invalid table';end if;
 perform pg_advisory_xact_lock(hashtextextended(tenant::text,0));
 select o.result into result from public.erp_operations o where o.id=operation_id and o.company_id=tenant;if found then return result;end if;
 allowed:=case table_name when 'companies' then array['name','email','phone','address','tax_number','tax_mode','billing_mode'] when 'partners' then array['name','email','phone','billing_address','notes','archived'] when 'projects' then array['title','customer_id','site_address','status','notes','archived'] when 'work_items' then array['name','category','unit','price_minor','description','archived'] else array['project_id','payload','source_system','source_id'] end;
 if exists(select 1 from jsonb_object_keys(data) k where not k=any(allowed)) then raise exception 'Unexpected data field';end if;
 execute format('select version from public.%I where id=$1 and %I=$2 for update',table_name,case when table_name='companies' then 'id' else 'company_id' end) into current_version using record_id,tenant;
 if expected_version=0 then
   if current_version is not null or table_name='companies' then raise exception 'Version conflict' using errcode='40001';end if;
 else
   if current_version is distinct from expected_version then raise exception 'Version conflict' using errcode='40001';end if;
 end if;
 select string_agg(format('%I',k),','),string_agg(format('r.%I',k),','),string_agg(format('%I=r.%I',k,k),',') into columns,values_sql,updates from jsonb_object_keys(data) k;
 if expected_version=0 then
 execute format('insert into public.%1$I(id,company_id,%2$s) select $1,$2,%3$s from jsonb_populate_record(null::public.%1$I,$3) r returning to_jsonb(%1$I.*)',table_name,columns,values_sql) into result using record_id,tenant,data;
 else
 execute format('update public.%1$I t set %2$s from jsonb_populate_record(null::public.%1$I,$3) r where t.id=$1 and t.%3$I=$2 returning to_jsonb(t.*)',table_name,updates,case when table_name='companies' then 'id' else 'company_id' end) into result using record_id,tenant,data;
 end if;
 insert into public.erp_operations(id,company_id,result) values(operation_id,tenant,result);return result;
end;$$;
revoke all on function public.erp_apply(uuid,text,uuid,integer,jsonb) from public;grant execute on function public.erp_apply(uuid,text,uuid,integer,jsonb) to authenticated;
commit;
