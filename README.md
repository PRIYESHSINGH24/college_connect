# CampusLoop

CampusLoop is a college-first, developer-focused student network built with Next.js App Router, TypeScript, Supabase Auth/PostgreSQL/RLS, and a background worker for GitHub repository synchronization.

This repository contains an implementation of the core CampusLoop workflows wired for Supabase Auth/PostgreSQL/RLS. It has **not** been installed, built, or run against a configured Supabase instance in this generation environment; treat runtime behavior as unverified until you complete the setup and checks below. It is **not** a claim that every item in the 1,455-line product specification is complete or production-certified. See [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) for the exact scope and verification boundaries.

## Included capabilities

- Email/password sign-up and sign-in with Supabase Auth, forgot/reset password screens, session-backed protected routes, and email callback handling.
- Student profile editing, visibility settings, skills/interests, campus affiliation request, public profile/portfolio route, and a followers/following network page.
- College verification request workflow and a college-admin review page (the first admin is provisioned manually).
- Campus feed, post creation, likes, comments, bookmarks, follows, and durable notifications for likes/comments/follows.
- Project marketplace, project creation, guarded apply/accept/reject/withdraw workflows, membership-count maintenance, and capacity-safe team membership.
- Direct conversations, persistent message history, retry-deduplicated sends, durable message notifications, a conversation-scoped Realtime subscription, and refresh/reload recovery from PostgreSQL.
- Resume versions, editing, multiple content sections, ATS/modern/compact selector, browser-generated A4 PDF export.
- Opportunity directory, save action, club directory/join, upcoming events, and capacity-safe event registration.
- GitHub OAuth using public repository scope, encrypted server-side token storage, queued sync through pg-boss, public-only repository import, and explicit conversion into a private project.
- Health/readiness endpoint, unit tests, Playwright smoke tests, and a k6 read-smoke script.

## Requirements

- Node.js 22.12 or newer (required by the selected pg-boss worker runtime).
- npm.
- Docker Desktop if you want to run Supabase locally.
- Supabase CLI (`npm install -g supabase`) for local database/auth/storage services.
- k6 CLI only when running the optional load smoke test.

## Quick start (local Supabase)

```bash
# 1. Install dependencies
npm install

# 2. Start the local Supabase stack (Docker must be running)
npx supabase start

# 3. Apply database migrations and seed the demo organization
npx supabase db reset

# 4. Copy environment template
cp .env.example .env.local
```

After `supabase start`, copy the displayed **API URL** and **anon key** into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key printed by supabase start>
SUPABASE_SERVICE_ROLE_KEY=<service_role key printed by supabase start>
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`SUPABASE_SERVICE_ROLE_KEY` must remain server-side. Never prefix it with `NEXT_PUBLIC_` and never expose it in client code. For hosted email confirmation and recovery links, configure Supabase Auth SMTP, site URL and allowed redirect URLs.

```bash
# 5. Run the app
npm run dev
```

Open <http://localhost:3000>. Local auth confirmation is disabled by the included `supabase/config.toml` for quicker development. Hosted projects should enable email confirmations and configure SMTP before public launch.

## First administrator setup

No account is automatically granted an administrative role. Register a normal user first, then promote that user manually in the local Supabase SQL editor / `psql` after choosing the organization ID and user UUID:

```sql
insert into public.organization_memberships
  (organization_id, user_id, role, status, verified_at)
values
  ('<organization-uuid>', '<auth-user-uuid>', 'college_admin', 'verified', now())
on conflict (organization_id, user_id)
do update set role='college_admin', status='verified', verified_at=now();
```

The membership trigger will associate the verified user profile with the college. For production, keep this bootstrap operation restricted to trusted operators and record it in your institutional onboarding process. The application intentionally has no public self-service role escalation.

The local seed creates `Demo University` with `example.edu` as a placeholder domain. Change that domain to the institution's approved domain(s) before onboarding real students:

```sql
update public.organization_domains set domain='your-college.edu' where domain='example.edu';
```

Students can submit pending membership requests from `/onboarding`; college admins review them at `/admin/verification`. The manual request path supports colleges that do not issue dedicated student email domains.

## GitHub OAuth and background worker

GitHub import is optional. Create a GitHub OAuth App and configure:

- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:3000/api/github/callback`

Add to `.env.local`:

```env
GITHUB_CLIENT_ID=<oauth-client-id>
GITHUB_CLIENT_SECRET=<oauth-client-secret>
GITHUB_REDIRECT_URI=http://localhost:3000/api/github/callback
# Generate with: openssl rand -hex 32
GITHUB_TOKEN_ENCRYPTION_KEY=<64 hex characters>
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

Then run the app and the worker in separate terminals:

```bash
npm run dev
npm run worker
```

The OAuth flow requests `read:user` and `public_repo` only. The app imports public repositories only, stores the access token encrypted with AES-256-GCM using a server-only key, and stores connection secrets in a table with RLS enabled and no user-facing table policies. The pg-boss queue is durable in PostgreSQL; its schema is created by pg-boss when the worker/producer starts. Do not use a transaction-pooled database URL unless your pg-boss/driver configuration explicitly supports it. For hosted Supabase, use an appropriate direct or session-pooled connection and restrict database credentials.

The worker currently fetches up to 500 public repositories per sync, with sequential pagination. Do not increase page/concurrency limits without testing GitHub quotas and queue behavior.

## Useful commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run e2e
```

Run k6 read-smoke (k6 is an external CLI, not an npm package):

```bash
BASE_URL=http://localhost:3000 VUS=5 DURATION=1m k6 run scripts/load-smoke.js
```

For authenticated routes, pass a session cookie copied from a **dedicated test account** (never a real student's session):

```bash
BASE_URL=http://localhost:3000 \
SESSION_COOKIE='sb-...=...' \
VUS=5 DURATION=1m k6 run scripts/load-smoke.js
```

This script is a smoke/read test, not the 1,000-user/100-RPS acceptance suite from the product brief. A single cookie reused by virtual users does not model 1,000 distinct authenticated students. Do not run load tests against production or real GitHub APIs.

## Security notes

- Every protected page and mutation validates the Supabase user server-side.
- RLS is enabled on application tables. Sensitive GitHub tokens are server-only and written/read with the service role after user authentication is checked.
- Organization membership role is not user-editable. Admin decisions require an existing verified college-admin/super-admin membership.
- Project application acceptance locks the project row and applies an atomic openings guard. Event registration locks the event row and applies a capacity guard. Unique constraints prevent duplicate likes/follows/bookmarks/registrations/memberships.
- Messages are persisted in PostgreSQL before the API reports success; Realtime is scoped to one conversation and is not the source of truth.
- Resume content is private under RLS. PDF is rendered from saved/edited content; the app does not invent work history or achievements.
- The current upload implementation does not yet include profile-image/media storage workflows. Keep storage private until signed upload/download policies are added.

## Environment variables

| Variable | Required | Purpose |
|---|---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Browser-safe Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | For GitHub worker/integration | Server-only elevated Supabase access |
| `DATABASE_URL` | For GitHub queue | pg-boss PostgreSQL connection |
| `GITHUB_CLIENT_ID` | Optional | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | Optional | GitHub OAuth client secret |
| `GITHUB_REDIRECT_URI` | Optional | Exact OAuth callback URL |
| `GITHUB_TOKEN_ENCRYPTION_KEY` | Optional | 32-byte AES-GCM key as 64 hex chars |
| `NEXT_PUBLIC_APP_URL` | Recommended | Public app base URL |

## Deployment outline

1. Create separate Supabase staging and production projects.
2. Configure Auth redirect URLs, production SMTP, approved college domains, storage policies, and backup retention.
3. Apply migrations in CI/CD before deploying the compatible application build.
4. Set server-only service-role/GitHub/queue secrets in the deployment platform secret manager.
5. Run the Next.js app as stateless replicas and run the pg-boss worker as a separate long-lived process.
6. Configure HTTPS, domain/email settings, logs, error monitoring, database connection limits, and alerting.
7. Execute RLS/authorization tests and a staged load test with isolated synthetic accounts before increasing traffic.

## Important limitations

See [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md). In particular, there are no measured results for 1,000 concurrent users or 100 RPS in this generated package. Do not advertise those capacities until the full workload, environment, and percentile metrics have been measured.

## Responsive design and brand system

The interface uses a custom CampusLoop courtyard mark rather than a stock icon: four open quadrants represent a campus quad, with a connecting path and lime endpoint representing a student finding their people. The SVG is maintained in `src/components/brand/campus-mark.tsx`; the favicon is `public/icon.svg`.

The authenticated shell is responsive: desktop uses a persistent workspace rail and top search; tablet/mobile collapse the rail, preserve a compact top bar, and use a safe-area-aware bottom navigation with a More drawer. Feed, project, profile, message, and form layouts use fluid widths and small-screen spacing. The E2E suite includes overflow checks at 360, 390, 768, and 1280 CSS pixels.

Run the responsive tests after starting the app:

```bash
npm run e2e
```

## Frontend architecture and design system

CampusLoop uses **React 19 with the Next.js App Router and TypeScript**. The frontend is not a static HTML mock: route-level Server Components fetch the authenticated user's data, while interactive client components handle actions such as posting, liking, bookmarking, following, applying to projects, messaging, and editing a resume. Mutations call authenticated Route Handlers and persist through Supabase.

The visual system is maintained in `src/app/globals.css` and `tailwind.config.ts`:

- Warm off-white canvas, ink typography, restrained indigo, and a lime waypoint accent.
- System-native modern sans-serif stack to avoid a network font dependency at build time.
- Shared surface, field, button, navigation, feed-card, and right-rail patterns.
- Responsive app shell with desktop workspace rail and safe-area-aware mobile bottom navigation.
- Reduced-motion support, keyboard focus states, and 16px mobile form controls to avoid iOS zoom-on-focus.

The original CampusLoop mark is a custom SVG in `src/components/brand/campus-mark.tsx`, mirrored by `public/icon.svg`.

### Frontend verification

Run the following after installing dependencies and configuring the local Supabase environment:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run e2e
```

The Playwright responsive suite checks landing and signup overflow at 320, 360, 390, 768, and 1280 CSS-pixel viewports. These tests are source-controlled but must be executed in the target environment; do not infer a passing browser run from the presence of the tests.
