alter table public.projects add column if not exists github_repository_id bigint unique;

create table public.github_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  github_user_id bigint not null,
  github_username text not null,
  token_ciphertext text not null,
  scopes text[] not null default '{}',
  sync_status text not null default 'idle' check (sync_status in ('idle','queued','processing','succeeded','failed','needs_worker')),
  last_synced_at timestamptz,
  last_error text,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.github_repositories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  github_repo_id bigint not null,
  full_name text not null,
  name text not null,
  description text,
  html_url text not null,
  homepage text,
  language text,
  topics text[] not null default '{}',
  stars int not null default 0,
  forks int not null default 0,
  is_fork boolean not null default false,
  default_branch text,
  license_spdx text,
  github_updated_at timestamptz,
  visibility text not null default 'private' check (visibility in ('public','campus','private')),
  is_featured boolean not null default false,
  imported_at timestamptz not null default now(),
  unique(user_id,github_repo_id)
);
create index github_repos_user_idx on public.github_repositories(user_id,github_updated_at desc);
alter table public.github_connections enable row level security;
alter table public.github_repositories enable row level security;
-- OAuth tokens and connection metadata are written/read only by server-side service-role handlers.
create policy "owner reads own imported repositories" on public.github_repositories for select to authenticated using (user_id=auth.uid());
create policy "owner updates repository visibility" on public.github_repositories for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "public featured repositories" on public.github_repositories for select to anon using (visibility='public' and is_featured=true);
create policy "authenticated public featured repositories" on public.github_repositories for select to authenticated using (visibility='public' and is_featured=true);

create table public.background_job_events (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  status text not null check (status in ('queued','processing','succeeded','failed')),
  owner_id uuid references auth.users(id) on delete cascade,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.background_job_events enable row level security;
create policy "job events visible to owner" on public.background_job_events for select to authenticated using (owner_id=auth.uid());
