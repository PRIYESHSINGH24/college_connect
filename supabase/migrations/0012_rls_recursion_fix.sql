-- Breaks the RLS recursion cycle on the project family of tables.
-- The "projects readable" SELECT policy queried project_members directly,
-- whose own SELECT policy queries projects back; evaluating either side
-- re-entered RLS for the same relation, so Postgres aborted queries with
-- "infinite recursion detected in policy for relation \"projects\"".
-- Security-definer helpers evaluate project membership without applying RLS,
-- which removes the cycle without changing what a signed-in user can see.

create or replace function public.is_project_member(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.project_members pm
    where pm.project_id = p_project_id and pm.user_id = auth.uid()
  );
$$;

-- projects.select: replace the recursive subquery with the definer helper.
drop policy if exists "projects readable" on public.projects;
create policy "projects readable" on public.projects
  for select to authenticated
  using (
    not public.is_blocked_between(auth.uid(), owner_id)
    and (
      owner_id = auth.uid()
      or visibility = 'public'
      or (visibility = 'campus' and organization_id is not null and public.is_org_member(organization_id))
      or public.is_project_member(id)
    )
  );

-- project_tasks: recreate the three policies with the correct correlation.
-- The versions shipped in earlier migrations compared pm.project_id with
-- itself (always true), which wrongly granted task access on every project
-- for any owner/manager membership the user held anywhere.
drop policy if exists "project tasks members" on public.project_tasks;
create policy "project tasks members" on public.project_tasks
  for select to authenticated
  using (public.is_project_member(project_id));

drop policy if exists "project members create tasks" on public.project_tasks;
create policy "project members create tasks" on public.project_tasks
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.project_members pm
      where pm.project_id = project_tasks.project_id
        and pm.user_id = auth.uid()
        and pm.role in ('owner','manager')
    )
  );

drop policy if exists "project managers update tasks" on public.project_tasks;
create policy "project managers update tasks" on public.project_tasks
  for update to authenticated
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = project_tasks.project_id
        and pm.user_id = auth.uid()
        and pm.role in ('owner','manager')
    )
  )
  with check (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = project_tasks.project_id
        and pm.user_id = auth.uid()
        and pm.role in ('owner','manager')
    )
  );
