create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  website text,
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.organization_domains (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  domain text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, domain)
);
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  username text not null unique check (username ~ '^[a-zA-Z0-9_]{3,24}$'),
  full_name text not null default 'Student',
  headline text,
  bio text,
  avatar_url text,
  department text,
  course text,
  graduation_year int check (graduation_year between 2000 and 2100),
  skills text[] not null default '{}',
  interests text[] not null default '{}',
  github_username text,
  portfolio_visibility text not null default 'public' check (portfolio_visibility in ('public','campus','private')),
  profile_visibility text not null default 'campus' check (profile_visibility in ('public','campus','private')),
  collaboration_available boolean not null default false,
  mentorship_available boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'student' check (role in ('student','mentor','club_admin','moderator','college_admin','super_admin')),
  status text not null default 'pending' check (status in ('pending','verified','rejected','suspended')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create table public.blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  visibility text not null default 'campus' check (visibility in ('public','campus','followers')),
  project_id uuid,
  edited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create table public.bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  slug text,
  description text not null check (char_length(description) between 10 and 8000),
  tech_stack text[] not null default '{}',
  repository_url text,
  demo_url text,
  cover_url text,
  status text not null default 'active' check (status in ('draft','active','completed','archived')),
  visibility text not null default 'campus' check (visibility in ('public','campus','private')),
  openings int not null default 0 check (openings >= 0),
  accepted_count int not null default 0 check (accepted_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','manager','member')),
  joined_at timestamptz not null default now(),
  primary key (project_id, user_id)
);
create table public.project_applications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  applicant_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (char_length(message) between 10 and 2000),
  status text not null default 'pending' check (status in ('pending','accepted','rejected','withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, applicant_id)
);
create table public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 160),
  description text,
  assignee_id uuid references auth.users(id) on delete set null,
  status text not null default 'todo' check (status in ('todo','in_progress','in_review','done')),
  due_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  is_group boolean not null default false,
  title text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_read_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 10000),
  client_nonce text,
  created_at timestamptz not null default now(),
  unique (sender_id, client_nonce)
);

create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled resume',
  template text not null default 'ats' check (template in ('ats','modern','compact')),
  content jsonb not null default '{"summary":"","education":[],"experience":[],"projects":[],"skills":[],"certifications":[],"achievements":[]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  publisher_id uuid references auth.users(id) on delete set null,
  title text not null,
  category text not null check (category in ('internship','job','hackathon','competition','workshop','research','conference','scholarship','campus_recruitment')),
  description text not null,
  source_url text,
  eligibility text,
  location text,
  deadline timestamptz,
  status text not null default 'published' check (status in ('draft','published','expired','archived')),
  created_at timestamptz not null default now()
);
create table public.saved_opportunities (
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, opportunity_id)
);
create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create table public.club_memberships (
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('member','admin','lead')),
  status text not null default 'active' check (status in ('pending','active','rejected')),
  created_at timestamptz not null default now(),
  primary key (club_id, user_id)
);
create table public.events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete set null,
  created_by uuid not null references auth.users(id),
  title text not null,
  description text not null,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  capacity int check (capacity is null or capacity >= 1),
  status text not null default 'published' check (status in ('draft','published','cancelled')),
  created_at timestamptz not null default now()
);
create table public.event_registrations (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  type text not null,
  entity_type text,
  entity_id uuid,
  message text not null,
  is_read boolean not null default false,
  idempotency_key text unique,
  created_at timestamptz not null default now()
);
create table public.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('post','profile','project','message','club','event')),
  target_id uuid not null,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  assigned_to uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index profiles_org_idx on public.profiles(organization_id, full_name);
create index profiles_skills_gin_idx on public.profiles using gin(skills);
create index posts_feed_idx on public.posts(organization_id, created_at desc, id desc);
create index posts_author_idx on public.posts(author_id, created_at desc);
create index comments_post_idx on public.comments(post_id, created_at asc);
create index projects_org_status_idx on public.projects(organization_id, status, created_at desc);
create index project_apps_owner_idx on public.project_applications(project_id, status, created_at desc);
create index project_apps_user_idx on public.project_applications(applicant_id, created_at desc);
create index messages_conversation_idx on public.messages(conversation_id, created_at desc, id desc);
create index notifications_user_idx on public.notifications(recipient_id, is_read, created_at desc);
create index opportunities_filter_idx on public.opportunities(status, category, deadline);
create index events_date_idx on public.events(organization_id, starts_at);

create or replace function public.is_org_member(org_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.organization_memberships m where m.organization_id = org_id and m.user_id = auth.uid() and m.status = 'verified');
$$;
create or replace function public.has_org_role(org_id uuid, roles text[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.organization_memberships m where m.organization_id = org_id and m.user_id = auth.uid() and m.status = 'verified' and m.role = any(roles));
$$;
create or replace function public.is_conversation_member(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.conversation_members cm where cm.conversation_id = cid and cm.user_id = auth.uid());
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare uname text;
begin
  uname := coalesce(nullif(new.raw_user_meta_data->>'username',''), 'student_' || substr(replace(new.id::text,'-',''),1,10));
  insert into public.profiles(id, username, full_name)
  values(new.id, uname, coalesce(nullif(new.raw_user_meta_data->>'full_name',''), 'Student'))
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.apply_to_project(p_project_id uuid, p_message text)
returns uuid language plpgsql security invoker set search_path = public as $$
declare result_id uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if char_length(trim(p_message)) < 10 or char_length(p_message) > 2000 then raise exception 'invalid_message'; end if;
  if not exists(select 1 from public.projects p where p.id=p_project_id and p.status='active' and p.openings > p.accepted_count and p.owner_id <> auth.uid()) then
    raise exception 'project_not_accepting_applications';
  end if;
  insert into public.project_applications(project_id, applicant_id, message)
  values(p_project_id, auth.uid(), trim(p_message)) returning id into result_id;
  return result_id;
end; $$;

create or replace function public.accept_project_application(p_application_id uuid)
returns void language plpgsql security invoker set search_path = public as $$
declare app public.project_applications%rowtype; proj public.projects%rowtype;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select * into app from public.project_applications where id=p_application_id for update;
  if not found then raise exception 'application_not_found'; end if;
  select * into proj from public.projects where id=app.project_id for update;
  if proj.owner_id <> auth.uid() then raise exception 'not_project_owner'; end if;
  if app.status <> 'pending' then raise exception 'application_not_pending'; end if;
  if proj.accepted_count >= proj.openings then raise exception 'no_openings'; end if;
  update public.project_applications set status='accepted', updated_at=now() where id=p_application_id;
  insert into public.project_members(project_id,user_id,role) values(app.project_id,app.applicant_id,'member') on conflict do nothing;
  update public.projects set accepted_count=accepted_count+1, updated_at=now() where id=app.project_id;
end; $$;

create or replace function public.register_for_event(p_event_id uuid)
returns void language plpgsql security invoker set search_path = public as $$
declare ev public.events%rowtype; current_count int;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select * into ev from public.events where id=p_event_id for update;
  if not found or ev.status <> 'published' or ev.starts_at <= now() then raise exception 'event_unavailable'; end if;
  select count(*) into current_count from public.event_registrations where event_id=p_event_id;
  if ev.capacity is not null and current_count >= ev.capacity then raise exception 'event_full'; end if;
  insert into public.event_registrations(event_id,user_id) values(p_event_id,auth.uid());
end; $$;

-- Simple durable event fan-out: notification rows are persisted in the same transaction as social activity.
create or replace function public.notify_post_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner_id uuid;
begin
  select author_id into owner_id from public.posts where id=new.post_id;
  if owner_id is not null and owner_id <> new.user_id then
    insert into public.notifications(recipient_id, actor_id, type, entity_type, entity_id, message, idempotency_key)
    values(owner_id,new.user_id,'post_like','post',new.post_id,'liked your post','like:'||new.post_id::text||':'||new.user_id::text)
    on conflict (idempotency_key) do nothing;
  end if;
  return new;
end; $$;
create trigger post_like_notification after insert on public.post_likes for each row execute procedure public.notify_post_like();

-- Enable RLS on all exposed tables.
do $$ declare t text; begin
  foreach t in array array['organizations','organization_domains','profiles','organization_memberships','follows','blocks','posts','post_likes','comments','bookmarks','projects','project_members','project_applications','project_tasks','conversations','conversation_members','messages','resumes','opportunities','saved_opportunities','clubs','club_memberships','events','event_registrations','notifications','moderation_reports','audit_logs'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

create policy "organizations readable" on public.organizations for select to authenticated using (is_active);
create policy "domains readable by authenticated" on public.organization_domains for select to authenticated using (true);
create policy "profiles visible by policy" on public.profiles for select to authenticated using (
  id = auth.uid() or profile_visibility='public' or (profile_visibility='campus' and organization_id is not null and public.is_org_member(organization_id))
);
create policy "profile owner update" on public.profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid());
create policy "profile owner insert" on public.profiles for insert to authenticated with check (id=auth.uid());
create policy "membership read self or admins" on public.organization_memberships for select to authenticated using (user_id=auth.uid() or public.has_org_role(organization_id,array['college_admin','super_admin','moderator']));
create policy "membership self request verified domain" on public.organization_memberships for insert to authenticated with check (
  user_id=auth.uid() and role='student' and status='pending' and exists (
    select 1 from public.organization_domains d join auth.users u on u.id=auth.uid()
    where d.organization_id=organization_id and lower(split_part(u.email,'@',2))=lower(d.domain)
  )
);
create policy "follows visible to auth users" on public.follows for select to authenticated using (true);
create policy "follow as self" on public.follows for insert to authenticated with check (follower_id=auth.uid() and not exists(select 1 from public.blocks b where b.blocker_id=following_id and b.blocked_id=auth.uid()));
create policy "unfollow as self" on public.follows for delete to authenticated using (follower_id=auth.uid());
create policy "block list private" on public.blocks for select to authenticated using (blocker_id=auth.uid());
create policy "block as self" on public.blocks for insert to authenticated with check (blocker_id=auth.uid());
create policy "unblock as self" on public.blocks for delete to authenticated using (blocker_id=auth.uid());

create policy "posts readable by visibility" on public.posts for select to authenticated using (
  author_id=auth.uid() or visibility='public' or (visibility='campus' and organization_id is not null and public.is_org_member(organization_id)) or
  (visibility='followers' and exists(select 1 from public.follows f where f.follower_id=auth.uid() and f.following_id=author_id))
);
create policy "create own posts" on public.posts for insert to authenticated with check (author_id=auth.uid() and (organization_id is null or public.is_org_member(organization_id)));
create policy "edit own posts" on public.posts for update to authenticated using (author_id=auth.uid()) with check (author_id=auth.uid());
create policy "delete own posts" on public.posts for delete to authenticated using (author_id=auth.uid());
create policy "likes readable" on public.post_likes for select to authenticated using (true);
create policy "like as self" on public.post_likes for insert to authenticated with check (user_id=auth.uid());
create policy "unlike as self" on public.post_likes for delete to authenticated using (user_id=auth.uid());
create policy "comments readable when post readable" on public.comments for select to authenticated using (exists(select 1 from public.posts p where p.id=post_id));
create policy "comment as self" on public.comments for insert to authenticated with check (author_id=auth.uid() and exists(select 1 from public.posts p where p.id=post_id));
create policy "edit own comment" on public.comments for update to authenticated using (author_id=auth.uid()) with check (author_id=auth.uid());
create policy "delete own comment" on public.comments for delete to authenticated using (author_id=auth.uid());
create policy "bookmarks private" on public.bookmarks for select to authenticated using (user_id=auth.uid());
create policy "bookmark self" on public.bookmarks for insert to authenticated with check (user_id=auth.uid());
create policy "unbookmark self" on public.bookmarks for delete to authenticated using (user_id=auth.uid());

create policy "projects readable" on public.projects for select to authenticated using (owner_id=auth.uid() or visibility='public' or (visibility='campus' and organization_id is not null and public.is_org_member(organization_id)) or exists(select 1 from public.project_members pm where pm.project_id=id and pm.user_id=auth.uid()));
create policy "project owner create" on public.projects for insert to authenticated with check (owner_id=auth.uid() and (organization_id is null or public.is_org_member(organization_id)));
create policy "project owner update" on public.projects for update to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
create policy "project owner delete" on public.projects for delete to authenticated using (owner_id=auth.uid());
create policy "project members readable" on public.project_members for select to authenticated using (exists(select 1 from public.projects p where p.id=project_id));
create policy "project owner adds members" on public.project_members for insert to authenticated with check (exists(select 1 from public.projects p where p.id=project_id and p.owner_id=auth.uid()) or user_id=auth.uid());
create policy "project owner removes members" on public.project_members for delete to authenticated using (exists(select 1 from public.projects p where p.id=project_id and p.owner_id=auth.uid()) or user_id=auth.uid());
create policy "applications visible to involved" on public.project_applications for select to authenticated using (applicant_id=auth.uid() or exists(select 1 from public.projects p where p.id=project_id and p.owner_id=auth.uid()));
create policy "apply only through rpc" on public.project_applications for insert to authenticated with check (applicant_id=auth.uid());
create policy "applicant withdraw" on public.project_applications for update to authenticated using (applicant_id=auth.uid() and status='pending') with check (applicant_id=auth.uid() and status='withdrawn');
create policy "project tasks members" on public.project_tasks for select to authenticated using (exists(select 1 from public.project_members pm where pm.project_id=project_id and pm.user_id=auth.uid()));
create policy "project members create tasks" on public.project_tasks for insert to authenticated with check (created_by=auth.uid() and exists(select 1 from public.project_members pm where pm.project_id=project_id and pm.user_id=auth.uid() and pm.role in ('owner','manager')));
create policy "project managers update tasks" on public.project_tasks for update to authenticated using (exists(select 1 from public.project_members pm where pm.project_id=project_id and pm.user_id=auth.uid() and pm.role in ('owner','manager'))) with check (exists(select 1 from public.project_members pm where pm.project_id=project_id and pm.user_id=auth.uid() and pm.role in ('owner','manager')));

create policy "conversation members see conversation" on public.conversations for select to authenticated using (public.is_conversation_member(id));
create policy "create conversation" on public.conversations for insert to authenticated with check (created_by=auth.uid());
create policy "members see memberships" on public.conversation_members for select to authenticated using (public.is_conversation_member(conversation_id));
create policy "conversation creator adds participants" on public.conversation_members for insert to authenticated with check (user_id=auth.uid() or exists(select 1 from public.conversations c where c.id=conversation_id and c.created_by=auth.uid()));
create policy "conversation messages readable" on public.messages for select to authenticated using (public.is_conversation_member(conversation_id));
create policy "conversation member sends" on public.messages for insert to authenticated with check (sender_id=auth.uid() and public.is_conversation_member(conversation_id));

create policy "resumes private to owner" on public.resumes for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "opportunities published readable" on public.opportunities for select to authenticated using (status='published' or publisher_id=auth.uid());
create policy "save opportunities self" on public.saved_opportunities for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "clubs visible" on public.clubs for select to authenticated using (true);
create policy "club creator manages" on public.clubs for all to authenticated using (created_by=auth.uid()) with check (created_by=auth.uid());
create policy "club membership visible to self or managers" on public.club_memberships for select to authenticated using (user_id=auth.uid() or exists(select 1 from public.club_memberships m where m.club_id=club_id and m.user_id=auth.uid() and m.role in ('lead','admin')));
create policy "join club as self" on public.club_memberships for insert to authenticated with check (user_id=auth.uid() and role='member');
create policy "leave club" on public.club_memberships for delete to authenticated using (user_id=auth.uid());
create policy "events published readable" on public.events for select to authenticated using (status='published' or created_by=auth.uid());
create policy "event creator manages" on public.events for all to authenticated using (created_by=auth.uid()) with check (created_by=auth.uid());
create policy "event registrations visible to self or creator" on public.event_registrations for select to authenticated using (user_id=auth.uid() or exists(select 1 from public.events e where e.id=event_id and e.created_by=auth.uid()));
create policy "register self" on public.event_registrations for insert to authenticated with check (user_id=auth.uid());
create policy "cancel own registration" on public.event_registrations for delete to authenticated using (user_id=auth.uid());
create policy "notifications private" on public.notifications for select to authenticated using (recipient_id=auth.uid());
create policy "mark notification read" on public.notifications for update to authenticated using (recipient_id=auth.uid()) with check (recipient_id=auth.uid());
create policy "reports private to reporter and moderators" on public.moderation_reports for select to authenticated using (reporter_id=auth.uid() or exists(select 1 from public.organization_memberships m where m.user_id=auth.uid() and m.role in ('moderator','college_admin','super_admin') and m.status='verified'));
create policy "report as self" on public.moderation_reports for insert to authenticated with check (reporter_id=auth.uid());
create policy "audit restricted" on public.audit_logs for select to authenticated using (organization_id is not null and public.has_org_role(organization_id,array['college_admin','super_admin']));

-- Lock down sensitive writes: only the trusted application/server or explicit owner policies can mutate.
revoke all on public.audit_logs from anon, authenticated;
revoke all on public.moderation_reports from anon;
