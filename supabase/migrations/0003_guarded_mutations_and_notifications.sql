-- A user cannot directly add themselves to a project team; owner acceptance is the only path.
drop policy if exists "project owner adds members" on public.project_members;
create policy "project owner adds members" on public.project_members for insert to authenticated
with check (exists(select 1 from public.projects p where p.id=project_id and p.owner_id=auth.uid()));

-- Manual campus verification requests are supported even where no institution email domain exists.
create policy "manual membership request" on public.organization_memberships for insert to authenticated
with check (user_id=auth.uid() and role='student' and status='pending' and exists(select 1 from public.organizations o where o.id=organization_id and o.is_active=true));

-- Enforce application eligibility in the database regardless of whether a client calls the RPC or table API.
create or replace function public.guard_project_application()
returns trigger language plpgsql security invoker set search_path=public as $$
declare p public.projects%rowtype;
begin
  select * into p from public.projects where id=new.project_id for update;
  if not found or p.status <> 'active' or p.owner_id = new.applicant_id or p.openings <= p.accepted_count then
    raise exception 'project_not_accepting_applications';
  end if;
  if new.applicant_id <> auth.uid() then raise exception 'applicant_must_be_current_user'; end if;
  return new;
end; $$;
create trigger guard_project_application_before_insert before insert on public.project_applications
for each row execute procedure public.guard_project_application();

-- Event capacity is protected for direct table writes as well as RPC calls.
create or replace function public.guard_event_registration()
returns trigger language plpgsql security invoker set search_path=public as $$
declare ev public.events%rowtype; n int;
begin
  select * into ev from public.events where id=new.event_id for update;
  if not found or ev.status <> 'published' or ev.starts_at <= now() then raise exception 'event_unavailable'; end if;
  if new.user_id <> auth.uid() then raise exception 'registration_must_be_current_user'; end if;
  if ev.capacity is not null then
    select count(*) into n from public.event_registrations where event_id=new.event_id;
    if n >= ev.capacity then raise exception 'event_full'; end if;
  end if;
  return new;
end; $$;
create trigger guard_event_registration_before_insert before insert on public.event_registrations
for each row execute procedure public.guard_event_registration();

create or replace function public.notify_new_follow()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.notifications(recipient_id,actor_id,type,entity_type,entity_id,message,idempotency_key)
  values(new.following_id,new.follower_id,'new_follow','profile',new.follower_id,'started following you','follow:'||new.follower_id::text||':'||new.following_id::text)
  on conflict(idempotency_key) do nothing;
  return new;
end; $$;
create trigger new_follow_notification after insert on public.follows for each row execute procedure public.notify_new_follow();

create or replace function public.notify_new_comment()
returns trigger language plpgsql security definer set search_path=public as $$
declare owner_id uuid;
begin
  select author_id into owner_id from public.posts where id=new.post_id;
  if owner_id is not null and owner_id<>new.author_id then
    insert into public.notifications(recipient_id,actor_id,type,entity_type,entity_id,message,idempotency_key)
    values(owner_id,new.author_id,'post_comment','post',new.post_id,'commented on your post','comment:'||new.id::text)
    on conflict(idempotency_key) do nothing;
  end if;
  return new;
end; $$;
create trigger post_comment_notification after insert on public.comments for each row execute procedure public.notify_new_comment();
