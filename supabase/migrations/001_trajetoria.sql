-- Apply once using the Supabase SQL editor or Supabase CLI. Never expose service_role.
create extension if not exists pgcrypto;
create table public.orders (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 request_key text not null, document_key text not null, capability text not null,
 offer_version text not null, offer_title text not null, price_cents bigint not null check(price_cents>0), currency text not null check(currency='BRL'),
 duration_days integer check(duration_days>0), resume_limit integer check(resume_limit>0), capabilities text[] not null,
 mode text not null check(mode in ('test','production')), collector_id text not null,
 status text not null default 'created' check(status in ('created','pending','approved','not_completed','revoked')),
 preference_id text, checkout_url text, checkout_started_at timestamptz, created_at timestamptz not null default now(), paid_at timestamptz,
 unique(user_id,request_key)
);
create table public.payment_records (
 payment_id text primary key, order_id uuid not null references public.orders(id), provider_status text not null,
 status text not null, updated_at timestamptz not null, recorded_at timestamptz not null default now()
);
create table public.entitlements (
 id uuid primary key default gen_random_uuid(), order_id uuid unique not null references public.orders(id),
 user_id uuid not null references auth.users(id) on delete cascade, capabilities text[] not null,
 document_limit integer, starts_at timestamptz not null, expires_at timestamptz, revoked_at timestamptz,
 mode text not null check(mode in ('test','production'))
);
create table public.entitlement_documents (
 entitlement_id uuid not null references public.entitlements(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade, document_key text not null,
 primary key(entitlement_id,document_key)
);
create table public.resumes (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 client_id text not null check(length(client_id) between 1 and 128), name text not null,
 data jsonb not null check(jsonb_typeof(data)='object' and octet_length(data::text)<2000000),
 revision integer not null default 1, created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(user_id,client_id)
);
create index resumes_user on public.resumes(user_id);
create index entitlements_user on public.entitlements(user_id);
create index orders_user on public.orders(user_id);
create index payment_order on public.payment_records(order_id);

-- Definer helper uses the authenticated identity, never a caller-supplied user ID.
create function public.has_resume_access(p_key text,p_capability text) returns boolean
language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from public.entitlements e join public.entitlement_documents d on d.entitlement_id=e.id
 where e.user_id=auth.uid() and d.user_id=auth.uid() and d.document_key=p_key and p_capability=any(e.capabilities)
 and e.revoked_at is null and e.starts_at<=now() and (e.expires_at is null or e.expires_at>now())
 and e.mode=coalesce(nullif(current_setting('app.payment_mode',true),''),'production'));
$$;
-- SECURITY: client sessions have no mutation grants. Only the API's service role may allocate or write.
alter table public.orders enable row level security;
alter table public.payment_records enable row level security;
alter table public.entitlements enable row level security;
alter table public.entitlement_documents enable row level security;
alter table public.resumes enable row level security;
create policy orders_owner on public.orders for select to authenticated using(user_id=auth.uid());
create policy entitlements_owner on public.entitlements for select to authenticated using(user_id=auth.uid());
create policy allocation_owner on public.entitlement_documents for select to authenticated using(user_id=auth.uid());
create policy resumes_owner_paid on public.resumes for select to authenticated using(user_id=auth.uid() and public.has_resume_access(client_id,'save'));
revoke all on public.orders,public.payment_records,public.entitlements,public.entitlement_documents,public.resumes from anon,authenticated;
grant select on public.orders,public.entitlements,public.entitlement_documents,public.resumes to authenticated;
grant all on public.orders,public.payment_records,public.entitlements,public.entitlement_documents,public.resumes to service_role;
revoke all on function public.has_resume_access(text,text) from public;
grant execute on function public.has_resume_access(text,text) to authenticated,service_role;

-- Serializes allocation per user, so concurrent requests cannot exceed a purchase's slot quota.
create function public.require_document_access(p_user uuid,p_key text,p_capability text,p_allocate boolean default false,p_mode text default 'production') returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare chosen public.entitlements; result uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 select e.id into result from public.entitlements e join public.entitlement_documents d on d.entitlement_id=e.id
 where e.user_id=p_user and d.user_id=p_user and d.document_key=p_key and p_capability=any(e.capabilities)
 and e.mode=p_mode and e.revoked_at is null and e.starts_at<=now() and (e.expires_at is null or e.expires_at>now()) limit 1;
 if result is not null then return result; end if;
 if not p_allocate then raise exception 'ACCESS_DENIED'; end if;
 for chosen in select * from public.entitlements where user_id=p_user and mode=p_mode and p_capability=any(capabilities)
 and revoked_at is null and starts_at<=now() and (expires_at is null or expires_at>now()) order by expires_at nulls last,id for update loop
 if chosen.document_limit is null or (select count(*) from public.entitlement_documents where entitlement_id=chosen.id)<chosen.document_limit then
 insert into public.entitlement_documents(entitlement_id,user_id,document_key) values(chosen.id,p_user,p_key) on conflict do nothing;
 return chosen.id;
 end if;
 end loop;
 raise exception 'ACCESS_DENIED_OR_QUOTA_EXCEEDED';
end;$$;
revoke all on function public.require_document_access(uuid,text,text,boolean,text) from public,anon,authenticated;
grant execute on function public.require_document_access(uuid,text,text,boolean,text) to service_role;

-- Called only after signature + authenticated API verification. Monotonic snapshots and sticky revocation.
create function public.apply_verified_payment(p_order uuid,p_payment text,p_status text,p_updated_at timestamptz,p_approved_at timestamptz,p_provider_status text) returns text
language plpgsql security definer set search_path=public,pg_temp as $$
declare o public.orders; previous public.payment_records; approved_time timestamptz;
begin
 select * into o from public.orders where id=p_order for update;
 if not found then raise exception 'ORDER_NOT_FOUND'; end if;
 if p_status not in ('approved','pending','not_completed','revoked') then raise exception 'INVALID_STATUS'; end if;
 select * into previous from public.payment_records where payment_id=p_payment;
 if found and previous.order_id<>p_order then raise exception 'PAYMENT_ORDER_MISMATCH'; end if;
 if found and (previous.updated_at>p_updated_at or previous.status='revoked') then return o.status; end if;
 insert into public.payment_records(payment_id,order_id,provider_status,status,updated_at)
 values(p_payment,p_order,p_provider_status,p_status,p_updated_at)
 on conflict(payment_id) do update set provider_status=excluded.provider_status,status=excluded.status,updated_at=excluded.updated_at,recorded_at=now();
 if o.status='revoked' or p_status='revoked' then
 update public.orders set status='revoked' where id=p_order;
 update public.entitlements set revoked_at=coalesce(revoked_at,now()) where order_id=p_order;
 return 'revoked';
 end if;
 if p_status='approved' then
 approved_time:=coalesce(o.paid_at,p_approved_at,now());
 update public.orders set status='approved',paid_at=approved_time where id=p_order;
 insert into public.entitlements(order_id,user_id,capabilities,document_limit,starts_at,expires_at,mode)
 values(o.id,o.user_id,o.capabilities,o.resume_limit,approved_time,case when o.duration_days is null then null else approved_time+make_interval(days=>o.duration_days) end,o.mode)
 on conflict(order_id) do nothing;
 return 'approved';
 end if;
 if o.status<>'approved' then update public.orders set status=p_status where id=p_order; return p_status;end if;
 return o.status;
end;$$;
revoke all on function public.apply_verified_payment(uuid,text,text,timestamptz,timestamptz,text) from public,anon,authenticated;
grant execute on function public.apply_verified_payment(uuid,text,text,timestamptz,timestamptz,text) to service_role;

-- Optimistic edits: callers must supply the last revision. Creation/import never overwrites an existing document.
create function public.save_resume(p_user uuid,p_client text,p_name text,p_data jsonb,p_revision integer default null,p_import boolean default false,p_mode text default 'production') returns public.resumes
language plpgsql security definer set search_path=public,pg_temp as $$
declare current_doc public.resumes;
begin
 perform public.require_document_access(p_user,p_client,'save',true,p_mode);
 select * into current_doc from public.resumes where user_id=p_user and client_id=p_client for update;
 if found then
 if p_import then return current_doc; end if;
 if p_revision is null or current_doc.revision<>p_revision then raise exception 'REVISION_CONFLICT';end if;
 update public.resumes set name=p_name,data=p_data,revision=revision+1,updated_at=now() where id=current_doc.id returning * into current_doc;
 else
 insert into public.resumes(user_id,client_id,name,data) values(p_user,p_client,p_name,p_data) returning * into current_doc;
 end if;
 return current_doc;
end;$$;
revoke all on function public.save_resume(uuid,text,text,jsonb,integer,boolean,text) from public,anon,authenticated;
grant execute on function public.save_resume(uuid,text,text,jsonb,integer,boolean,text) to service_role;

create table public.request_limits(user_id uuid not null references auth.users(id) on delete cascade,kind text not null,bucket bigint not null,count integer not null default 0,primary key(user_id,kind,bucket));
alter table public.request_limits enable row level security;
revoke all on public.request_limits from public,anon,authenticated;
grant all on public.request_limits to service_role;
create function public.check_rate_limit(p_user uuid,p_kind text,p_limit integer,p_window integer) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare current_count integer;current_bucket bigint:=floor(extract(epoch from now())/p_window);
begin
 insert into public.request_limits(user_id,kind,bucket,count) values(p_user,p_kind,current_bucket,1)
 on conflict(user_id,kind,bucket) do update set count=request_limits.count+1 returning count into current_count;
 if current_count>p_limit then raise exception 'RATE_LIMIT';end if;
 delete from public.request_limits where user_id=p_user and kind=p_kind and bucket<current_bucket-2;
end;$$;
revoke all on function public.check_rate_limit(uuid,text,integer,integer) from public,anon,authenticated;
grant execute on function public.check_rate_limit(uuid,text,integer,integer) to service_role;

-- One caller may create a preference. An uncertain network result requires reconciliation, never a blind retry.
create function public.claim_checkout(p_order uuid) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare claimed uuid;
begin
 update public.orders set checkout_started_at=now() where id=p_order and checkout_started_at is null and checkout_url is null returning id into claimed;
 return claimed is not null;
end;$$;
revoke all on function public.claim_checkout(uuid) from public,anon,authenticated;
grant execute on function public.claim_checkout(uuid) to service_role;
