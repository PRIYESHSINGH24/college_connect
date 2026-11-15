-- Restrict updates to user-editable columns. RLS protects rows; column grants protect fields.
revoke update on public.profiles from authenticated;
grant update (
  username, full_name, headline, bio, avatar_url, department, course,
  graduation_year, skills, interests, github_username, portfolio_visibility,
  profile_visibility, collaboration_available, mentorship_available
) on public.profiles to authenticated;

-- A student must never be able to move their own profile into another tenant by updating organization_id.
-- The profile's organization_id is maintained by the verified-membership trigger.
revoke update on public.organization_memberships from authenticated;
grant update (status, verified_at) on public.organization_memberships to authenticated;
drop policy if exists "college admins update memberships" on public.organization_memberships;
drop policy if exists "college admins review memberships" on public.organization_memberships;
create policy "college admins review memberships" on public.organization_memberships
  for update to authenticated
  using (public.has_org_role(organization_id, array['college_admin','super_admin']))
  with check (public.has_org_role(organization_id, array['college_admin','super_admin']));

-- Keep post author and organization ownership immutable through the browser API.
revoke update on public.posts from authenticated;
grant update (body, visibility, project_id, edited_at) on public.posts to authenticated;

-- Project owners can edit project details, but cannot forge ownership, tenant, or accepted-member counters.
revoke update on public.projects from authenticated;
grant update (
  title, slug, description, tech_stack, repository_url, demo_url, cover_url,
  status, visibility, openings
) on public.projects to authenticated;

-- Only application status is mutable; applicant/project identity is immutable.
revoke update on public.project_applications from authenticated;

-- Keep timestamps server-controlled for tables with updated_at columns.
do $$
declare
  v_table_name text;
begin
  foreach v_table_name in array array['profiles','posts','projects','project_applications','project_tasks','conversations','resumes','opportunities','clubs','events','moderation_reports'] loop
    if exists (select 1 from information_schema.columns c where c.table_schema='public' and c.table_name=v_table_name and c.column_name='updated_at') then
      execute format('drop trigger if exists set_updated_at on public.%I', v_table_name);
      execute format('create trigger set_updated_at before update on public.%I for each row execute procedure public.set_updated_at()', v_table_name);
    end if;
  end loop;
end $$;

-- Move acceptance to a narrowly scoped SECURITY DEFINER routine so the counter can be
-- updated without granting clients direct write access to accepted_count.
create or replace function public.accept_project_application(p_application_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  app public.project_applications%rowtype;
  proj public.projects%rowtype;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select * into app from public.project_applications where id=p_application_id for update;
  if not found then raise exception 'application_not_found'; end if;
  select * into proj from public.projects where id=app.project_id for update;
  if not found or proj.owner_id <> auth.uid() then raise exception 'not_project_owner'; end if;
  if app.status <> 'pending' then raise exception 'application_not_pending'; end if;
  if proj.status <> 'active' or proj.accepted_count >= proj.openings then raise exception 'no_openings'; end if;
  update public.project_applications set status='accepted', updated_at=now() where id=p_application_id;
  insert into public.project_members(project_id,user_id,role)
    values(app.project_id,app.applicant_id,'member') on conflict do nothing;
  update public.projects set accepted_count=accepted_count+1, updated_at=now() where id=app.project_id;
end;
$$;
revoke all on function public.accept_project_application(uuid) from public, anon;
grant execute on function public.accept_project_application(uuid) to authenticated;


-- Rejection is also an RPC so table clients cannot mark an application accepted/rejected
-- without executing the corresponding authorization and concurrency checks.
create or replace function public.reject_project_application(p_application_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  app public.project_applications%rowtype;
  proj public.projects%rowtype;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select * into app from public.project_applications where id=p_application_id for update;
  if not found then raise exception 'application_not_found'; end if;
  select * into proj from public.projects where id=app.project_id for update;
  if not found or proj.owner_id <> auth.uid() then raise exception 'not_project_owner'; end if;
  if app.status <> 'pending' then raise exception 'application_not_pending'; end if;
  update public.project_applications set status='rejected', updated_at=now() where id=p_application_id;
end;
$$;
revoke all on function public.reject_project_application(uuid) from public, anon;
grant execute on function public.reject_project_application(uuid) to authenticated;

create or replace function public.withdraw_project_application(p_application_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare app public.project_applications%rowtype;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select * into app from public.project_applications where id=p_application_id for update;
  if not found or app.applicant_id <> auth.uid() then raise exception 'application_not_found'; end if;
  if app.status <> 'pending' then raise exception 'application_not_pending'; end if;
  update public.project_applications set status='withdrawn', updated_at=now() where id=p_application_id;
end;
$$;
revoke all on function public.withdraw_project_application(uuid) from public, anon;
grant execute on function public.withdraw_project_application(uuid) to authenticated;
