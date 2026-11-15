-- Permit public portfolio reads without exposing campus/private records.
create policy "anon reads public profiles" on public.profiles for select to anon using (profile_visibility='public');
create policy "anon reads public posts" on public.posts for select to anon using (visibility='public');
create policy "anon reads public projects" on public.projects for select to anon using (visibility='public');

-- Organization requests are verified using the JWT email claim; clients cannot self-assign a role or verified status.
drop policy if exists "membership self request verified domain" on public.organization_memberships;
create policy "membership self request verified domain" on public.organization_memberships for insert to authenticated with check (
  user_id=auth.uid() and role='student' and status='pending' and exists (
    select 1 from public.organization_domains d
    where d.organization_id=organization_id
      and lower(split_part(auth.jwt()->>'email','@',2))=lower(d.domain)
  )
);
create policy "college admins update memberships" on public.organization_memberships for update to authenticated
using (public.has_org_role(organization_id,array['college_admin','super_admin']))
with check (public.has_org_role(organization_id,array['college_admin','super_admin']));
create policy "project owners decide applications" on public.project_applications for update to authenticated
using (exists(select 1 from public.projects p where p.id=project_id and p.owner_id=auth.uid()))
with check (exists(select 1 from public.projects p where p.id=project_id and p.owner_id=auth.uid()));

-- A verified membership becomes the user's active campus affiliation.
create or replace function public.sync_verified_membership_to_profile()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status='verified' then
    update public.profiles set organization_id=new.organization_id, updated_at=now() where id=new.user_id;
  elsif tg_op='UPDATE' and old.status='verified' and new.status in ('rejected','suspended') then
    update public.profiles set organization_id=null, updated_at=now() where id=new.user_id and organization_id=new.organization_id;
  end if;
  return new;
end; $$;
create trigger sync_verified_membership after insert or update of status on public.organization_memberships
for each row execute procedure public.sync_verified_membership_to_profile();

-- Keep profile affiliation tied to a verified membership. A user cannot self-select a campus.
drop policy if exists "profile owner update" on public.profiles;
create policy "profile owner update" on public.profiles for update to authenticated
using (id=auth.uid())
with check (id=auth.uid() and (organization_id is null or public.is_org_member(organization_id)));

-- Enable private message inserts to be delivered through Supabase Realtime. Persisted history remains authoritative.
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;
