-- E-RP 0.1.0. Run once on a NEW Supabase project as postgres (SQL Editor).
-- This migration deliberately grants no client-side tenant provisioning.
begin;

create table public.app_owners (
  user_id uuid primary key references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  company_id uuid generated always as (id) stored,
  owner_id uuid not null unique references public.app_owners(user_id) on delete restrict,
  name text not null check (length(trim(name)) between 1 and 200),
  email text not null default '' check (length(email) <= 5000),
  phone text not null default '' check (length(phone) <= 80),
  address text not null default '' check (length(address) <= 1000),
  tax_number text not null default '' check (length(tax_number) <= 40),
  tax_mode text not null default 'unknown' check (tax_mode in ('unknown','aam','vat')),
  billing_mode text not null default 'manual' check (billing_mode = 'manual'),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.partners (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  name text not null check (length(trim(name)) between 1 and 200),
  email text not null default '' check (length(email) <= 5000),
  phone text not null default '' check (length(phone) <= 80),
  billing_address text not null default '' check (length(billing_address) <= 1000),
  notes text not null default '' check (length(notes) <= 5000),
  archived boolean not null default false,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id,id)
);
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  customer_id uuid,
  title text not null check (length(trim(title)) between 1 and 200),
  site_address text not null default '' check (length(site_address) <= 1000),
  status text not null default 'inquiry' check (status in ('inquiry','survey','quoted','scheduled','in_progress','handover','completed')),
  notes text not null default '' check (length(notes) <= 5000),
  archived boolean not null default false,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id,id),
  foreign key (company_id,customer_id) references public.partners(company_id,id) on delete restrict
);
create table public.work_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  name text not null check (length(trim(name)) between 1 and 200),
  category text not null default '' check (length(category) <= 100),
  unit text not null default 'db' check (length(trim(unit)) between 1 and 30),
  price_minor bigint not null default 0 check (price_minor between 0 and 999999999999),
  description text not null default '' check (length(description) <= 5000),
  archived boolean not null default false,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id,id)
);
create index partners_company_idx on public.partners(company_id,archived);
create index projects_company_idx on public.projects(company_id,archived,status);
create index projects_customer_idx on public.projects(company_id,customer_id);
create index work_items_company_idx on public.work_items(company_id,archived);

-- Security invoker. The version cannot be supplied by the browser.
create function public.erp_stamp() returns trigger language plpgsql set search_path = '' as $$
begin
  if TG_OP = 'INSERT' then
    NEW.version := 1;
    NEW.created_at := clock_timestamp();
  else
    if NEW.id is distinct from OLD.id or NEW.company_id is distinct from OLD.company_id then
      raise exception 'Immutable record identity';
    end if;
    if TG_TABLE_NAME = 'companies' then
      if NEW.owner_id is distinct from OLD.owner_id then raise exception 'Immutable owner'; end if;
    end if;
    NEW.version := OLD.version + 1;
    NEW.created_at := OLD.created_at;
  end if;
  NEW.updated_at := clock_timestamp();
  return NEW;
end;
$$;
-- companies.company_id is generated and reads NULL in BEFORE triggers; handle separately.
create function public.erp_company_stamp() returns trigger language plpgsql set search_path = '' as $$
begin
  if NEW.id is distinct from OLD.id or NEW.owner_id is distinct from OLD.owner_id then raise exception 'Immutable company identity'; end if;
  NEW.version := OLD.version + 1;
  NEW.created_at := OLD.created_at;
  NEW.updated_at := clock_timestamp();
  return NEW;
end;
$$;
create trigger companies_stamp before update on public.companies for each row execute function public.erp_company_stamp();
create trigger partners_stamp before insert or update on public.partners for each row execute function public.erp_stamp();
create trigger projects_stamp before insert or update on public.projects for each row execute function public.erp_stamp();
create trigger work_items_stamp before insert or update on public.work_items for each row execute function public.erp_stamp();
revoke all on function public.erp_stamp() from public;
revoke all on function public.erp_company_stamp() from public;

alter table public.app_owners enable row level security;
alter table public.companies enable row level security;
alter table public.partners enable row level security;
alter table public.projects enable row level security;
alter table public.work_items enable row level security;
revoke all on public.app_owners,public.companies,public.partners,public.projects,public.work_items from anon,authenticated;
grant select on public.app_owners to authenticated;
grant select,update on public.companies to authenticated;
grant select,insert,update on public.partners,public.projects,public.work_items to authenticated;
create policy owner_self on public.app_owners for select to authenticated using (user_id = (select auth.uid()));
create policy owner_aal2 on public.app_owners as restrictive for all to authenticated using ((select auth.jwt()->>'aal') = 'aal2') with check ((select auth.jwt()->>'aal') = 'aal2');
create policy company_owner on public.companies for all to authenticated using (owner_id = (select auth.uid()) and exists(select 1 from public.app_owners o where o.user_id = (select auth.uid()))) with check (owner_id = (select auth.uid()) and exists(select 1 from public.app_owners o where o.user_id = (select auth.uid())));
create policy company_aal2 on public.companies as restrictive for all to authenticated using ((select auth.jwt()->>'aal') = 'aal2') with check ((select auth.jwt()->>'aal') = 'aal2');
create policy partner_owner on public.partners for all to authenticated using (company_id in (select id from public.companies)) with check (company_id in (select id from public.companies));
create policy partner_aal2 on public.partners as restrictive for all to authenticated using ((select auth.jwt()->>'aal') = 'aal2') with check ((select auth.jwt()->>'aal') = 'aal2');
create policy project_owner on public.projects for all to authenticated using (company_id in (select id from public.companies)) with check (company_id in (select id from public.companies));
create policy project_aal2 on public.projects as restrictive for all to authenticated using ((select auth.jwt()->>'aal') = 'aal2') with check ((select auth.jwt()->>'aal') = 'aal2');
create policy work_owner on public.work_items for all to authenticated using (company_id in (select id from public.companies)) with check (company_id in (select id from public.companies));
create policy work_aal2 on public.work_items as restrictive for all to authenticated using ((select auth.jwt()->>'aal') = 'aal2') with check ((select auth.jwt()->>'aal') = 'aal2');

-- Private file bucket, ready for the future document module. No upload UI yet.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('erp-files','erp-files',false,10485760,array['application/pdf','image/jpeg','image/png','image/webp']);
create policy erp_files_read on storage.objects for select to authenticated using (bucket_id='erp-files' and (select auth.jwt()->>'aal')='aal2' and exists(select 1 from public.companies c where c.id::text=(storage.foldername(storage.objects.name))[1]));
create policy erp_files_insert on storage.objects for insert to authenticated with check (bucket_id='erp-files' and (select auth.jwt()->>'aal')='aal2' and exists(select 1 from public.companies c where c.id::text=(storage.foldername(storage.objects.name))[1]));
-- Immutable originals: no client UPDATE or DELETE policy for this bucket.
commit;
