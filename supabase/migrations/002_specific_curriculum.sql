-- Run after 001. Bind each purchase immutably to its order's document_key.
-- The term and price are snapshotted by 001; the new offer is R$14.90 / 30 days / one CV.
begin;
-- Remove legacy allocations to other drafts and bind the original purchased curriculum.
delete from public.entitlement_documents d using public.entitlements e,public.orders o
where d.entitlement_id=e.id and e.order_id=o.id and (d.document_key<>o.document_key or d.user_id<>o.user_id);
insert into public.entitlement_documents(entitlement_id,user_id,document_key)
select e.id,e.user_id,o.document_key from public.entitlements e join public.orders o on o.id=e.order_id and o.user_id=e.user_id
on conflict do nothing;

create or replace function public.require_document_access(p_user uuid,p_key text,p_capability text,p_allocate boolean default false,p_mode text default 'production') returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare result uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 select e.id into result from public.entitlements e join public.orders o on o.id=e.order_id
 where e.user_id=p_user and o.user_id=p_user and o.document_key=p_key
 and o.status='approved' and e.mode=p_mode and o.mode=p_mode and p_capability=any(e.capabilities)
 and e.revoked_at is null and e.starts_at<=now() and (e.expires_at is null or e.expires_at>now())
 order by e.expires_at desc nulls last limit 1;
 if result is null then raise exception 'ACCESS_DENIED';end if;
 insert into public.entitlement_documents(entitlement_id,user_id,document_key) values(result,p_user,p_key) on conflict do nothing;
 return result;
end;$$;
revoke all on function public.require_document_access(uuid,text,text,boolean,text) from public,anon,authenticated;
grant execute on function public.require_document_access(uuid,text,text,boolean,text) to service_role;

create or replace function public.has_resume_access(p_key text,p_capability text) returns boolean
language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from public.entitlements e join public.orders o on o.id=e.order_id
 where e.user_id=auth.uid() and o.user_id=auth.uid() and o.document_key=p_key and o.status='approved'
 and p_capability=any(e.capabilities) and e.revoked_at is null and e.starts_at<=now()
 and (e.expires_at is null or e.expires_at>now()) and e.mode='production' and o.mode='production');
$$;
revoke all on function public.has_resume_access(text,text) from public;
grant execute on function public.has_resume_access(text,text) to authenticated,service_role;

-- Bind the CV as soon as a verified approved payment grants access, never whichever draft is used first.
create function public.bind_purchased_curriculum() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 insert into public.entitlement_documents(entitlement_id,user_id,document_key)
 select new.id,new.user_id,o.document_key from public.orders o where o.id=new.order_id and o.user_id=new.user_id
 on conflict do nothing;
 return new;
end;$$;
revoke all on function public.bind_purchased_curriculum() from public,anon,authenticated;
create trigger bind_entitlement_document after insert on public.entitlements for each row execute function public.bind_purchased_curriculum();
-- A new server entry point makes the application fail closed if migration 002 was not applied.
create function public.require_specific_document_access(p_user uuid,p_key text,p_capability text,p_allocate boolean default false,p_mode text default 'production') returns uuid
language sql security definer set search_path=public,pg_temp as $$
 select public.require_document_access(p_user,p_key,p_capability,p_allocate,p_mode);
$$;
revoke all on function public.require_specific_document_access(uuid,text,text,boolean,text) from public,anon,authenticated;
grant execute on function public.require_specific_document_access(uuid,text,text,boolean,text) to service_role;
commit;
