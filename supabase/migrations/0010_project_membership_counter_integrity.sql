-- Project owners can register themselves during creation, but cannot directly add arbitrary
-- team members. Invited/applicant members are added only through the guarded acceptance RPC.
drop policy if exists "project owner adds members" on public.project_members;
create policy "project owner registers own membership" on public.project_members
  for insert to authenticated
  with check (
    user_id=auth.uid()
    and exists(select 1 from public.projects p where p.id=project_id and p.owner_id=auth.uid())
  );

-- Applications from existing members are invalid; this is enforced even for direct inserts.
create or replace function public.guard_project_application()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  p public.projects%rowtype;
begin
  if new.applicant_id <> auth.uid() then raise exception 'applicant_must_be_current_user'; end if;
  select * into p from public.projects where id=new.project_id for update;
  if not found or p.status<>'active' or p.owner_id=new.applicant_id or p.openings<=p.accepted_count then
    raise exception 'project_not_accepting_applications';
  end if;
  if exists(select 1 from public.project_members pm where pm.project_id=new.project_id and pm.user_id=new.applicant_id) then
    raise exception 'already_project_member';
  end if;
  return new;
end;
$$;

-- Derive accepted_count from actual member rows so inserts/deletes and RPC retries cannot
-- drift the counter. Owner membership is intentionally excluded from the opening count.
create or replace function public.maintain_project_member_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op='INSERT' and new.role='member' then
    update public.projects set accepted_count=accepted_count+1, updated_at=now() where id=new.project_id;
    return new;
  elsif tg_op='DELETE' and old.role='member' then
    if pg_trigger_depth()=1 then
      update public.projects set accepted_count=greatest(0,accepted_count-1), updated_at=now() where id=old.project_id;
    end if;
    return old;
  end if;
  return null;
end;
$$;
drop trigger if exists maintain_project_member_count_after_change on public.project_members;
create trigger maintain_project_member_count_after_change
  after insert or delete on public.project_members
  for each row execute procedure public.maintain_project_member_count();

-- One-time reconciliation before the counter is used as an admission guard.
update public.projects p
set accepted_count=(select count(*)::int from public.project_members pm where pm.project_id=p.id and pm.role='member');

do $$ begin
  if not exists (select 1 from pg_constraint where conname='projects_openings_not_below_accepted') then
    alter table public.projects add constraint projects_openings_not_below_accepted check (openings >= accepted_count);
  end if;
end $$;

-- The project row lock serializes competing acceptances. The member-count trigger increments
-- accepted_count in the same transaction as the membership insert.
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
  if not found or proj.owner_id<>auth.uid() then raise exception 'not_project_owner'; end if;
  if app.status<>'pending' then raise exception 'application_not_pending'; end if;
  if proj.status<>'active' or proj.accepted_count>=proj.openings then raise exception 'no_openings'; end if;
  if exists(select 1 from public.project_members pm where pm.project_id=app.project_id and pm.user_id=app.applicant_id) then
    raise exception 'already_project_member';
  end if;
  update public.project_applications set status='accepted', updated_at=now() where id=p_application_id;
  insert into public.project_members(project_id,user_id,role) values(app.project_id,app.applicant_id,'member');
end;
$$;
revoke all on function public.accept_project_application(uuid) from public, anon;
grant execute on function public.accept_project_application(uuid) to authenticated;
