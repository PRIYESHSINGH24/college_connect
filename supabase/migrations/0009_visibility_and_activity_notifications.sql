-- Permit organization administrators to see only pending students in their own organization.
create policy "admins read pending member profiles" on public.profiles
  for select to authenticated
  using (
    exists (
      select 1 from public.organization_memberships m
      where m.user_id=profiles.id
        and m.status='pending'
        and public.has_org_role(m.organization_id, array['college_admin','super_admin'])
    )
  );

-- A like/bookmark can only reference a post the actor is allowed to read (RLS is applied
-- to the nested posts query, including privacy and block rules).
drop policy if exists "likes readable" on public.post_likes;
create policy "likes readable only on visible posts" on public.post_likes
  for select to authenticated
  using (exists(select 1 from public.posts p where p.id=post_id));
drop policy if exists "like as self" on public.post_likes;
create policy "like visible post as self" on public.post_likes
  for insert to authenticated
  with check (user_id=auth.uid() and exists(select 1 from public.posts p where p.id=post_id));
drop policy if exists "bookmark self" on public.bookmarks;
create policy "bookmark visible post as self" on public.bookmarks
  for insert to authenticated
  with check (user_id=auth.uid() and exists(select 1 from public.posts p where p.id=post_id));

-- Durable message notifications; the notification row is committed with the message.
create or replace function public.notify_message_recipients()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications(recipient_id, actor_id, type, entity_type, entity_id, message, idempotency_key)
  select cm.user_id, new.sender_id, 'message', 'conversation', new.conversation_id,
         'sent you a message', 'message:' || new.id::text || ':' || cm.user_id::text
  from public.conversation_members cm
  where cm.conversation_id=new.conversation_id and cm.user_id<>new.sender_id
  on conflict (idempotency_key) do nothing;
  return new;
end;
$$;
create trigger message_notification after insert on public.messages
  for each row execute procedure public.notify_message_recipients();

-- Notify a project owner about a new application.
create or replace function public.notify_project_application()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare owner_id uuid;
begin
  select p.owner_id into owner_id from public.projects p where p.id=new.project_id;
  if owner_id is not null and owner_id<>new.applicant_id then
    insert into public.notifications(recipient_id, actor_id, type, entity_type, entity_id, message, idempotency_key)
    values(owner_id, new.applicant_id, 'project_application', 'project', new.project_id,
           'applied to your project', 'project-application:' || new.id::text)
    on conflict (idempotency_key) do nothing;
  end if;
  return new;
end;
$$;
create trigger project_application_notification after insert on public.project_applications
  for each row execute procedure public.notify_project_application();

-- Notify the applicant of the owner's decision.
create or replace function public.notify_project_application_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status='pending' and new.status in ('accepted','rejected') then
    insert into public.notifications(recipient_id, actor_id, type, entity_type, entity_id, message, idempotency_key)
    select new.applicant_id, p.owner_id, 'project_' || new.status, 'project', new.project_id,
           case when new.status='accepted' then 'accepted your project application' else 'declined your project application' end,
           'project-decision:' || new.id::text || ':' || new.status
    from public.projects p where p.id=new.project_id
    on conflict (idempotency_key) do nothing;
  end if;
  return new;
end;
$$;
create trigger project_application_decision_notification after update of status on public.project_applications
  for each row execute procedure public.notify_project_application_decision();

-- Notify an event organizer when a student registers.
create or replace function public.notify_event_registration()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare organizer_id uuid;
begin
  select created_by into organizer_id from public.events where id=new.event_id;
  if organizer_id is not null and organizer_id<>new.user_id then
    insert into public.notifications(recipient_id, actor_id, type, entity_type, entity_id, message, idempotency_key)
    values(organizer_id, new.user_id, 'event_registration', 'event', new.event_id,
           'registered for your event', 'event-registration:' || new.event_id::text || ':' || new.user_id::text)
    on conflict (idempotency_key) do nothing;
  end if;
  return new;
end;
$$;
create trigger event_registration_notification after insert on public.event_registrations
  for each row execute procedure public.notify_event_registration();
