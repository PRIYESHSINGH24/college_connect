# CampusLoop

CampusLoop is a developer-first college community platform built as a modular Next.js monolith with Supabase Auth, PostgreSQL, Row Level Security, and Storage as the persistence boundary.

## Current implementation

This initial build includes:

- Responsive CampusLoop visual system and authenticated application shell.
- Landing, login, signup, feed, project marketplace, resume workspace, opportunities, messaging, network, discovery, clubs, notifications, profile, and settings routes.
- Strict TypeScript configuration and production build.
- A versioned Supabase migration covering organizations, profiles, skills, follows, blocks, posts, interactions, projects, collaboration, messaging, resumes, opportunities, notifications, and background jobs.
- Server-side Supabase client scaffolding with an explicit unconfigured state; the UI never claims an account or integration succeeded without credentials.

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` before enabling authentication. Apply the migration with the Supabase CLI:

```bash
npx supabase db push
```

`SUPABASE_SERVICE_ROLE_KEY` is reserved for server-only workers and must never be exposed to browser code.

## Verification

The current repository passes:

```bash
npm run typecheck
npm run build
```

Authentication callbacks, GitHub OAuth, background workers, PDF rendering, and production deployment credentials are intentionally not represented as working integrations until their corresponding provider configuration is supplied.
