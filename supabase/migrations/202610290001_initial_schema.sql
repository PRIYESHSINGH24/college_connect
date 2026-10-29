create extension if not exists pgcrypto;

create type public.app_role as enum ('student','mentor','club_admin','moderator','college_admin','super_admin');
create type public.visibility as enum ('public','campus','private');
create type public.project_state as enum ('idea','building','active','complete','archived');
create type public.job_status as enum ('queued','processing','succeeded','failed');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.approved_email_domains (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  domain text not null,
  unique (organization_id, domain)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  username text not null unique check (username ~ '^[A-Za-z0-9_]{3,24}$'),
  full_name text not null check (char_length(full_name) between 2 and 100),
  headline text,
  bio text,
  department text,
  graduation_year int check (graduation_year between 2000 and 2100),
  avatar_url text,
  role public.app_role not null default 'student',
  profile_visibility public.visibility not null default 'campus',
  collaboration_available boolean not null default false,
  mentorship_available boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);
create table public.profile_skills (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  primary key (profile_id, skill_id)
);

create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  visibility public.visibility not null default 'campus',
  project_id uuid,
  edited_at timestamptz,
  created_at timestamptz not null default now()
);
create index posts_feed_idx on public.posts (created_at desc, id desc);
create index posts_author_idx on public.posts (author_id, created_at desc);

create table public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);
create table public.post_bookmarks (
  post_id uuid not null references public.posts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  slug text not null unique,
  summary text not null check (char_length(summary) between 10 and 1000),
  description text,
  repository_url text,
  demo_url text,
  state public.project_state not null default 'idea',
  visibility public.visibility not null default 'campus',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.posts add constraint posts_project_fk foreign key (project_id) references public.projects(id) on delete set null;
create index projects_org_idx on public.projects (organization_id, created_at desc);
create index projects_owner_idx on public.projects (owner_id, updated_at desc);

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (project_id, profile_id)
);
create table public.project_applications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(message) between 1 and 2000),
  status text not null default 'pending' check (status in ('pending','accepted','rejected','withdrawn')),
  created_at timestamptz not null default now(),
  unique (project_id, applicant_id)
);
create table public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  assignee_id uuid references public.profiles(id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  status text not null default 'todo' check (status in ('todo','in_progress','in_review','done')),
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);
create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz,
  primary key (conversation_id, profile_id)
);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  client_id text,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  unique (sender_id, client_id)
);
create index messages_conversation_idx on public.messages (conversation_id, created_at desc, id desc);

create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  template text not null check (template in ('minimal','technical','compact')),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index resumes_owner_idx on public.resumes (owner_id, updated_at desc);

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  publisher_id uuid references public.profiles(id) on delete set null,
  title text not null,
  organization_name text not null,
  kind text not null,
  description text not null,
  location text,
  source_url text not null,
  deadline_at timestamptz,
  created_at timestamptz not null default now()
);
create index opportunities_deadline_idx on public.opportunities (deadline_at);
create table public.saved_opportunities (
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (opportunity_id, profile_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  kind text not null,
  entity_id uuid,
  read_at timestamptz,
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);
create index notifications_recipient_idx on public.notifications (recipient_id, created_at desc);

create table public.background_jobs (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  dedupe_key text not null unique,
  status public.job_status not null default 'queued',
  attempts int not null default 0,
  available_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_member_of(org_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles where id = auth.uid() and organization_id = org_id); $$;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_skills enable row level security;
alter table public.follows enable row level security;
alter table public.blocks enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_bookmarks enable row level security;
alter table public.comments enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_applications enable row level security;
alter table public.project_tasks enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.resumes enable row level security;
alter table public.opportunities enable row level security;
alter table public.saved_opportunities enable row level security;
alter table public.notifications enable row level security;
alter table public.background_jobs enable row level security;

create policy "profiles are visible to signed-in campus members" on public.profiles for select to authenticated
using (profile_visibility = 'public' or (profile_visibility = 'campus' and public.is_member_of(organization_id)) or id = auth.uid());
create policy "users manage their profile" on public.profiles for all to authenticated
using (id = auth.uid()) with check (id = auth.uid());
create policy "users manage follows" on public.follows for all to authenticated
using (follower_id = auth.uid()) with check (follower_id = auth.uid() and follower_id <> following_id);
create policy "users manage blocks" on public.blocks for all to authenticated
using (blocker_id = auth.uid()) with check (blocker_id = auth.uid() and blocker_id <> blocked_id);
create policy "visible posts can be read" on public.posts for select to authenticated
using (visibility = 'public' or (visibility = 'campus' and public.is_member_of((select organization_id from public.profiles where id = author_id))) or author_id = auth.uid());
create policy "authors manage posts" on public.posts for all to authenticated
using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "project members can read projects" on public.projects for select to authenticated
using (visibility = 'public' or (visibility = 'campus' and public.is_member_of(organization_id)) or exists(select 1 from public.project_members m where m.project_id = id and m.profile_id = auth.uid()));
create policy "owners manage projects" on public.projects for all to authenticated
using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "participants read conversations" on public.conversations for select to authenticated
using (exists(select 1 from public.conversation_members m where m.conversation_id = id and m.profile_id = auth.uid()));
create policy "participants read messages" on public.messages for select to authenticated
using (exists(select 1 from public.conversation_members m where m.conversation_id = conversation_id and m.profile_id = auth.uid()));
create policy "participants send messages" on public.messages for insert to authenticated
with check (sender_id = auth.uid() and exists(select 1 from public.conversation_members m where m.conversation_id = conversation_id and m.profile_id = auth.uid()));
create policy "owners manage resumes" on public.resumes for all to authenticated
using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "users manage saved opportunities" on public.saved_opportunities for all to authenticated
using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "users read own notifications" on public.notifications for select to authenticated
using (recipient_id = auth.uid());
create policy "users mark own notifications" on public.notifications for update to authenticated
using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name)
  values (new.id, 'user_' || substr(replace(new.id::text, '-', ''), 1, 12), coalesce(new.raw_user_meta_data->>'full_name', 'CampusLoop user'));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
