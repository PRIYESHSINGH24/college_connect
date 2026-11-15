# CampusLoop — Database Systems Project Report

**Project:** CampusLoop — *Your campus. Your community. Your next big project.*

**Report type:** Database Systems (DBMS) project report

**Database:** PostgreSQL (Supabase schema, deployed on Neon cloud PostgreSQL)

> **Fill in before submission (information only the author has):**
> - Student name(s): `__________`
> - Enrollment number(s): `__________`
> - Group members (if group project): `__________`
> - Faculty / instructor: `__________`
> - Course and semester: `__________`
> - Submission date: `__________`

---

## 1. Project overview

CampusLoop is a college-exclusive social and developer platform. It combines a campus
social feed, professional student profiles, project collaboration, private messaging,
a resume builder with PDF export, and a campus noticeboard for opportunities, clubs
and events.

The product principle is **one connected identity, multiple useful outcomes**: a
student's verified college membership, skills, projects and repository imports feed
the same database that powers the feed, the project marketplace, messaging, and the
generated resume.

From a database-systems point of view, the project is interesting because it has to
answer four hard questions:

1. **Who may see what?** — Row Level Security on every table, scoped by institution,
   profile visibility, blocks, and conversation membership.
2. **How do concurrent users not corrupt state?** — guarded, row-locked transactions
   for limited project openings and limited event capacity; unique constraints for
   likes, follows, bookmarks and message retries.
3. **How do expensive operations stay off the request path?** — a durable `pg-boss`
   queue for GitHub import/synchronisation, PDF work and notification fan-out.
4. **How does the database stay fast as data grows?** — indexed filters, cursor/limit
   pagination, trigger-maintained counters instead of `COUNT(*)` on every feed read.

---

## 2. Technology and database

| Layer | Technology | Notes |
| --- | --- | --- |
| Frontend | Next.js 15 (App Router), React 19, TypeScript (strict), Tailwind CSS, Lucide icons | 31 pages, 99 `.ts`/`.tsx` source files |
| Backend | Next.js Server Components + **28 Route Handlers** (Node.js runtime), Zod validation | No separate Express server; server actions/handlers share a service layer |
| Database | **PostgreSQL 15+** — Supabase-managed schema; deployed on **Neon** PostgreSQL (cloud, `us-east-1`, SSL required) | 12 versioned SQL migrations, 1,220 lines of SQL |
| Authentication | Supabase Auth (email + password, cookie-based sessions via `@supabase/ssr`) | `auth.users` is the identity table; `public.profiles` extends it 1:1 |
| ORM | **None — deliberately.** Supabase JS client over PostgREST + hand-written SQL | `pg` driver used only by the background worker and scripts |
| Realtime | Supabase Realtime, conversation-scoped channels | Message durability is in PostgreSQL; realtime is only an accelerator |
| Background jobs | `pg-boss` v12 on the same PostgreSQL instance | Durable queue, retries, `singletonKey` deduplication |
| PDF | `@react-pdf/renderer`, A4 document, three templates | Generated in the browser from saved resume JSON |
| Testing | Vitest (unit), Playwright (E2E/responsive), k6 smoke script | See §12 for what was actually executed |

**Why no ORM.** The schema depends on database features an ORM would obscure:
Row Level Security policies, `SECURITY DEFINER` helper functions, PL/pgSQL guard
triggers, partial/GIN indexes and `SELECT … FOR UPDATE` transactions. Writing the
SQL directly keeps those features explicit and reviewable in `supabase/migrations/`.

**Local vs cloud.** The schema is currently deployed on a **cloud Neon PostgreSQL**
instance (`DATABASE_URL` in `.env.local`). During development the project used the
**local Supabase stack** (`supabase start`, Docker, `127.0.0.1:54321`) plus
`supabase db reset` to apply migrations and seed data.

> **Current runtime state (verified, not assumed):** `NEXT_PUBLIC_SUPABASE_URL` points
> at `127.0.0.1:54321`, and that local Supabase API is **not running** in this session.
> The Neon database is reachable and holds the full schema, but only 3 organisations,
> 3 approved domains and 1 auth user — no student, post, or project rows. So the
> database layer is real, but authenticated end-to-end flows cannot be demonstrated
> until Supabase is started (or a hosted Supabase project is configured).

---

## 3. Database size and object counts

All figures below were measured by querying the live database
(`information_schema`, `pg_catalog`) — not estimated.

| Object | Count |
| --- | --- |
| Tables in `public` schema | **30** |
| Primary key constraints | **30** (21 single-column, 9 composite) |
| Foreign key constraints | **55** |
| Unique constraints | **10** |
| CHECK constraints | **38** |
| Indexes (total) | **57** |
| Indexes excluding PK indexes | **27** |
| User-defined triggers | **21** |
| Functions in `public` | **65** (29 application functions + 36 from `pgcrypto`) |
| Tables with RLS enabled | **30 of 30 (100 %)** |
| Policies currently present | **18** (91 distinct policy names are declared across the migrations) |
| Views / materialised views | **0** |
| Migration files | **12** |
| SQL lines (all migrations) | **1,220** |

---

## 4. Table catalogue (30 tables)

### 4.1 Identity and institution

| Table | Purpose | Key columns |
| --- | --- | --- |
| `organizations` | A college / institution. Multi-tenant root. | `id` PK, `slug` UNIQUE, `name`, `is_active` |
| `organization_domains` | Approved e-mail domains for automatic college verification | `(organization_id, domain)` UNIQUE |
| `organization_memberships` | Which user belongs to which college, with role and verification status | `(organization_id, user_id)` UNIQUE, `role`, `status`, `verified_at` |
| `profiles` | Student profile — 1:1 with `auth.users` | `id` PK → `auth.users`, `username` UNIQUE, `organization_id`, `skills[]`, `profile_visibility` |
| `user_settings` (privacy columns on `profiles`) | Visibility, contact and notification preferences | `profile_visibility`, `portfolio_visibility`, `collaboration_available`, `mentorship_available` |

### 4.2 GitHub integration and projects

| Table | Purpose | Key columns |
| --- | --- | --- |
| `github_connections` | OAuth connection + encrypted token + sync state | `user_id` PK, `access_token_encrypted`, `sync_status`, `last_synced_at` |
| `github_repositories` | Cached repository metadata (importable list) | `(user_id, github_repo_id)` UNIQUE, `stars`, `forks`, `language`, `topics[]` |
| `background_job_events` | Durable job/event log for worker observability | `status` CHECK (`queued`/`processing`/`succeeded`/`failed`), `attempts` |
| `projects` | Project / portfolio entry, also the marketplace listing | `id` PK, `owner_id`, `organization_id`, `openings`, `accepted_count`, `visibility`, `github_repository_id` UNIQUE |
| `project_members` | Team membership with role | `(project_id, user_id)` PK, `role` (`owner`/`manager`/`member`) |
| `project_applications` | Applications to join a project | `(project_id, applicant_id)` UNIQUE, `status`, `message` |
| `project_tasks` | Task board items | `project_id`, `assignee_id`, `status` (`todo`/`in_progress`/`in_review`/`done`), `due_at` |

### 4.3 Social graph and content

| Table | Purpose | Key columns |
| --- | --- | --- |
| `posts` | Feed posts (text, optional project attachment, visibility) | `author_id`, `organization_id`, `visibility`, `like_count`, `comment_count` |
| `post_likes` | One like per user per post | `(post_id, user_id)` PK |
| `comments` | Threaded comments (`parent_id` self-reference) | `post_id`, `author_id`, `parent_id`, `body` (CHECK 1–2000 chars) |
| `bookmarks` | Private saved posts | `(user_id, post_id)` PK |
| `follows` | Directed follow graph | `(follower_id, following_id)` PK, CHECK no self-follow |
| `blocks` | Directed block list | `(blocker_id, blocked_id)` PK, CHECK no self-block |
| `notifications` | Durable notification records with dedupe key | `recipient_id`, `type`, `idempotency_key` UNIQUE |

### 4.4 Messaging

| Table | Purpose | Key columns |
| --- | --- | --- |
| `conversations` | Direct or group thread | `id` PK, `is_group`, `title`, `created_by` |
| `conversation_members` | Participants + read state | `(conversation_id, user_id)` PK, `last_read_at` |
| `messages` | Durable message history | `conversation_id`, `sender_id`, `body`, `client_nonce` UNIQUE with sender (retry dedupe) |

### 4.5 Career

| Table | Purpose | Key columns |
| --- | --- | --- |
| `resumes` | Versioned resume documents (JSONB content + template) | `user_id`, `title`, `template`, `content jsonb` |
| `opportunities` | Internships, jobs, hackathons, scholarships, research | `publisher_id`, `category`, `deadline`, `status` |
| `saved_opportunities` | Private saved opportunities | `(user_id, opportunity_id)` PK |

### 4.6 Campus community

| Table | Purpose | Key columns |
| --- | --- | --- |
| `clubs` | Club profile, scoped to one college | `organization_id`, `slug` UNIQUE, `created_by` |
| `club_memberships` | Club roles and status | `(club_id, user_id)` PK, `role` (`member`/`admin`/`lead`), `status` |
| `events` | Campus events with capacity | `organization_id`, `club_id`, `starts_at`, `capacity` CHECK `>= 1` |
| `event_registrations` | Unique registration per student per event | `(event_id, user_id)` PK |

### 4.7 Operations, safety and audit

| Table | Purpose | Key columns |
| --- | --- | --- |
| `moderation_reports` | User reports on posts/comments/messages/profiles | `reporter_id`, `target_type`, `reason`, `status` |
| `audit_logs` | Administrative action trail (read-restricted) | `actor_id`, `organization_id`, `action`, `target_type`, `target_id`, `metadata jsonb` |

---

## 5. Entity–relationship design

### 5.1 Relationship summary

```
organizations 1 ──< organization_domains
organizations 1 ──< organization_memberships >── 1 auth.users
organizations 1 ──< profiles            (the student's college)
organizations 1 ──< projects / posts / events / opportunities / clubs / audit_logs

auth.users 1 ──1 profiles                      (trigger-created on signup)
auth.users 1 ──< posts, comments, post_likes, bookmarks, follows, blocks
auth.users 1 ──< project_members, project_applications, project_tasks
auth.users 1 ──< conversation_members, messages
auth.users 1 ──< resumes, notifications, moderation_reports
auth.users 1 ──1 github_connections, 1 ──< github_repositories

projects 1 ──< project_members
projects 1 ──< project_applications
projects 1 ──< project_tasks
projects 0..1 ──1 github_repositories      (github_repository_id UNIQUE)

posts 1 ──< post_likes      (cascade delete)
posts 1 ──< comments        (cascade delete)
posts 1 ──< bookmarks       (cascade delete)
comments 1 ──< comments      (self-reference via parent_id)

conversations 1 ──< conversation_members
conversations 1 ──< messages

clubs 1 ──< club_memberships
clubs 1 ──< events
events 1 ──< event_registrations

opportunities 1 ──< saved_opportunities
```

### 5.2 Key relationships in words

1. **Institution scoping.** Every visibility-bearing row (`posts`, `projects`,
   `events`, `opportunities`, `clubs`) carries `organization_id`. This is what makes
   "one college now, many later" possible without a redesign: adding a second
   institution means inserting a row in `organizations`, not altering 30 tables.
2. **Identity extension, not duplication.** `auth.users` owns credentials;
   `public.profiles` owns everything social. The `handle_new_user()` trigger creates
   the profile row on signup, so there is never a user without a profile.
3. **Many-to-many with attributes.** Team, likes, bookmarks, follows, registrations
   and memberships are all junction tables with a **composite primary key**, which is
   what makes duplicate likes/follows/registrations structurally impossible rather
   than only prevented in application code.
4. **Self-reference for threads.** `comments.parent_id → comments.id` gives
   one-level threading without a separate table.
5. **Cascade behaviour is intentional.** Deleting a post cascades to its likes,
   comments and bookmarks; deleting a user cascades their content but `SET NULL`s
   audit records so the trail survives account deletion.

### 5.3 Referential integrity

- **55 foreign keys** are enforced by PostgreSQL, including 25 references into
  `auth.users` for ownership columns.
- Deletion policy per FK is explicit: `on delete cascade` for dependent content,
  `on delete set null` for audit and moderation references.
- 38 CHECK constraints encode domain rules inside the database, for example:
  - `follows`: `follower_id <> following_id`
  - `blocks`: `blocker_id <> blocked_id`
  - `comments`: `char_length(body) between 1 and 2000`
  - `events`: `capacity is null or capacity >= 1`
  - `background_job_events`: `status in ('queued','processing','succeeded','failed')`
  - `project_members`: `role in ('owner','manager','member')`

---

## 6. Keys and uniqueness

### 6.1 Composite primary keys (9 tables)

These are the structural guarantee against duplicates:

`post_likes (post_id, user_id)`, `bookmarks (user_id, post_id)`,
`follows (follower_id, following_id)`, `blocks (blocker_id, blocked_id)`,
`project_members (project_id, user_id)`, `conversation_members (conversation_id, user_id)`,
`event_registrations (event_id, user_id)`, `club_memberships (club_id, user_id)`,
`saved_opportunities (user_id, opportunity_id)`.

### 6.2 Unique constraints (10)

| Constraint | Purpose |
| --- | --- |
| `profiles.username` | Human-readable profile URLs (`/u/username`) |
| `organizations.slug`, `clubs.slug` | URL-safe public identifiers |
| `organization_domains (organization_id, domain)` | One approved domain per college |
| `organization_memberships (organization_id, user_id)` | One membership per student per college |
| `project_applications (project_id, applicant_id)` | Cannot apply twice |
| `github_repositories (user_id, github_repo_id)` | Import sync cannot duplicate a repo |
| `projects.github_repository_id` | Two projects cannot claim the same repo |
| `messages (sender_id, client_nonce)` | Client retry cannot insert the same message twice |
| `notifications.idempotency_key` | Retried triggers cannot duplicate notifications |

This is the single most important design decision in the project: **idempotency is a
database constraint, not a frontend `disabled` attribute.**

---

## 7. Normalisation

### 7.1 First Normal Form (1NF) — atomic values

Every column holds a single value of a single type. Repeating groups are moved into
child tables: a project's tasks live in `project_tasks`, its team in
`project_members`, its applications in `project_applications`.

The one deliberate exception is `skills text[]` and `topics text[]`. These are
single-valued *arrays*, used with a GIN index (`profiles_skills_gin_idx`) for
skill-filtered discovery. Normalising skills into `profile_skills(profile_id, skill)`
would be strictly more correct relationally but would add a join to every profile read
for a list that is always read as a whole. This is documented as a considered trade-off,
not an oversight.

### 7.2 Second Normal Form (2NF) — no partial dependency

All relations are in 2NF because every non-key attribute depends on the **whole**
primary key:

- `post_likes (post_id, user_id)` has only `created_at`, which depends on the
  combination (a like exists at a moment), not on either half.
- `project_members (project_id, user_id)` carries `role` and `joined_at`; `role`
  describes *this membership*, not the project alone or the user alone.
- `event_registrations (event_id, user_id)` carries only `registered_at`.

Attributes that describe an entity are stored with that entity's key: the project's
`title`, `openings` and `accepted_count` sit in `projects`, not repeated on every
application row.

### 7.3 Third Normal Form (3NF) — no transitive dependency

- A student's `department` and `graduation_year` live in `profiles`, not on every post
  they write; the post references `author_id`.
- An event's `capacity` and `starts_at` live in `events`; a registration row stores
  only `(event_id, user_id, registered_at)`.
- An organisation's name lives once in `organizations`; the 30 tables that need it
  store `organization_id`.

### 7.4 Deliberate denormalisation (and why it is safe)

Three counters are intentionally duplicated to avoid expensive `COUNT(*)` on every
feed read:

| Column | Source of truth | Synchronisation |
| --- | --- | --- |
| `posts.like_count` | `post_likes` | `maintain_post_like_count()` trigger on insert/delete |
| `posts.comment_count` | `comments` | `maintain_post_comment_count()` trigger on insert/delete |
| `projects.accepted_count` | `project_members` | `maintain_project_member_count()` trigger, recomputed from member rows |

Because the counters are refreshed **by triggers from the child table**, they cannot
drift: the same transaction that inserts a like performs the increment. A one-time
reconciliation statement in migration 0005/0010 recomputes every counter from the
child rows, which is also the repair procedure if a counter is ever suspected.

A fourth, different kind of denormalisation is `resumes.content jsonb`. A resume is a
free-form, user-ordered, user-named document (custom sections allowed), so modelling
every section type as its own table would make reordering and custom sections much
harder for no query benefit — resumes are always read and written whole, by owner only.

---

## 8. SQL and DBMS concepts demonstrated

### 8.1 SQL command classes

| Class | Where it is used | Examples from the project |
| --- | --- | --- |
| **DDL** | 12 migrations | `CREATE TABLE` ×30, `ALTER TABLE … ENABLE ROW LEVEL SECURITY` ×30, `CREATE INDEX` ×27 non-PK, `CREATE TRIGGER` ×21, `CREATE FUNCTION` ×29, `CREATE POLICY` |
| **DML** | Application + seed | `INSERT` (posts, likes, messages), `UPDATE` (profile, counters, application status), `DELETE` (unlike, unfollow, withdraw), `SELECT` (all reads) |
| **DCL** | Migration 0001, 0006, 0008, 0010, 0011 | `REVOKE ALL ON public.audit_logs FROM anon, authenticated`, `REVOKE UPDATE ON public.notifications FROM authenticated; GRANT UPDATE (is_read) …`, column-level grants on `profiles`, `posts`, `projects` |
| **TCL** | Migrations + PL/pgSQL blocks | Supabase applies each migration in a transaction; every `DO $$ … $$` block and every function body is atomic; the report demo file wraps multi-row operations in explicit `BEGIN … ROLLBACK` |

### 8.2 Joins

`docs/sql/demo-queries.sql` contains runnable examples of each join, verified to
execute against the live schema (29 statements, 0 errors):

- **INNER JOIN** — posts ⨝ profiles to show author name and department.
- **LEFT JOIN** — projects ⟕ project_members to count team size, including projects
  with no members.
- **RIGHT JOIN** — projects ⟖ profiles to list every student with their owned-project
  count, including students with zero projects.
- **Cross-table join with aggregate** — profiles ⨝ posts grouped by department.
- **Join in the schema itself** — the organisation-verification policy joins
  `organization_domains` to `auth.users` on the signed-in user's e-mail domain.

Note honestly: the application's read path uses PostgREST query builders plus batched
`IN (…)` lookups rather than SQL joins, because the client library cannot express
arbitrary joins. The join demonstrations in the report are direct SQL against the same
tables.

### 8.3 GROUP BY, HAVING, ORDER BY, aggregates

| Concept | Report query |
| --- | --- |
| `GROUP BY` + `COUNT`/`SUM`/`AVG`/`MAX` | posts and total likes per department |
| `HAVING` | departments with more than one post |
| `ORDER BY` | every listing (feed by `created_at DESC`, directory by `full_name`) |
| `COALESCE` | turning `NULL` sums into `0` for students with no posts |
| Window function | `RANK() OVER (PARTITION BY organization_id …)` ranking projects by team size |

The schema also uses aggregation inside the database: `register_for_event()` counts
registrations before admitting a student, and the counter triggers use
`COUNT(*)` scoped to a single parent row.

### 8.4 Subqueries

Subqueries are used heavily and are load-bearing, not decorative:

- **`EXISTS` in RLS policies** — "a post is readable if the reader follows the author",
  "a comment is readable if its post is readable".
- **`NOT EXISTS` in a policy** — following is blocked if a `blocks` row exists in
  either direction.
- **Scalar subquery** — feed query comparing a post's likes to the average.
- **Derived table** — average posts per student, computed from a grouped subquery.
- **`SELECT … INTO` inside PL/pgSQL** — `accept_project_application()` loads the
  application and project rows under lock before deciding.

### 8.5 Triggers (21)

| Trigger group | Tables | Behaviour |
| --- | --- | --- |
| Counter maintenance | `post_likes`, `comments`, `project_members` | Increment/decrement parent counters in the same transaction |
| Notification fan-out | `post_likes`, `comments`, `follows`, `project_applications`, `event_registrations`, `messages` | Insert durable notification rows with an idempotency key |
| Guard triggers | `project_applications`, `event_registrations`, `messages` | Reject writes that violate ownership, capacity or block rules **even if the policy is bypassed** |
| Timestamp maintenance | `profiles`, `posts`, `projects`, `project_tasks`, `project_applications`, `resumes`, `moderation_reports` | `set_updated_at()` before update |
| Identity provisioning | `auth.users` | `handle_new_user()` creates the profile row on signup |
| Membership sync | `organization_memberships` | Copies the verified college onto the profile |

The guard triggers matter for the report's "authorisation is not just a UI check"
claim: `guard_project_application()` re-reads the project `FOR UPDATE`, rejects if the
applicant is already a member, if the project is closed, or if the applicant is the
owner — regardless of what the browser sent.

### 8.6 Stored functions / procedures (29 application functions)

| Function | Type | Purpose |
| --- | --- | --- |
| `apply_to_project(uuid, text)` | `SECURITY INVOKER` | Validates message length and project state, inserts application |
| `accept_project_application(uuid)` | `SECURITY INVOKER` | Row-locks application and project, checks openings, inserts membership, updates counter — atomic |
| `reject_project_application(uuid)` | `SECURITY INVOKER` | Owner-only rejection with status transition |
| `withdraw_project_application(uuid)` | `SECURITY INVOKER` | Applicant-only withdrawal |
| `register_for_event(uuid)` | `SECURITY INVOKER` | Row-locks event, counts registrations, enforces capacity |
| `can_message_user(uuid)`, `conversation_allowed(...)` | `SECURITY DEFINER` | Encode messaging privacy and block rules |
| `is_org_member`, `has_org_role`, `is_project_member`, `is_club_manager`, `is_conversation_member`, `is_blocked_between` | `SECURITY DEFINER` | RLS helper predicates that must bypass RLS to avoid recursion |
| `maintain_*_count()` | `SECURITY DEFINER` | Counter triggers |
| `notify_*()` | `SECURITY DEFINER` | Notification triggers |
| `handle_new_user()` | `SECURITY DEFINER` | Signup provisioning |

### 8.7 Indexes (57 total, 27 non-PK)

Indexes were added for measured query patterns, not "just in case":

| Index | Serves |
| --- | --- |
| `posts_feed_idx (organization_id, created_at DESC, id DESC)` | The campus feed's keyset pagination |
| `posts_author_idx (author_id, created_at DESC)` | A profile's activity tab |
| `comments_post_idx (post_id, created_at)` | Loading a post's comments |
| `follows_following_idx (following_id)` | Follower lists, "who follows me" |
| `messages_conversation_idx (conversation_id, created_at DESC)` | Paged message history |
| `notifications_user_idx (recipient_id, is_read, created_at DESC)` | Notification list + unread badge |
| `opportunities_filter_idx` | Category/status/deadline filtering |
| `profiles_skills_gin_idx` (GIN on `skills`) | Skill-based student discovery |
| `memberships_user_status_idx` | Verification queue and membership checks |
| `project_apps_user_idx`, `project_apps_owner_idx` | "My applications" and the owner's review queue |
| `events_date_idx` | Upcoming-events listing |

### 8.8 Transactions and ACID

| Property | Demonstration |
| --- | --- |
| **Atomicity** | `accept_project_application()` updates the application, inserts the membership and increments the counter in one function call. A failure at any step rolls all three back — the applicant can never be half-accepted. |
| **Consistency** | 38 CHECK constraints + 10 UNIQUE constraints + 55 FKs reject invalid states at the storage layer, e.g. `accepted_count` can never exceed `openings` through the guarded path, and a duplicate like is rejected by the composite PK. |
| **Isolation** | `SELECT … FOR UPDATE` in `accept_project_application()` and `register_for_event()` serialises concurrent decisions on the same project/event. Two simultaneous acceptances cannot both pass the openings check. |
| **Durability** | Messages are written to PostgreSQL and committed before the client is told the send succeeded; realtime delivery is a second, non-authoritative step. A websocket failure loses no data. |

Explicit transaction demonstration is in `docs/sql/demo-queries.sql` §8–§9: a
multi-row owner transfer plus audit insert, and a like insert that fires counter and
notification triggers — both inspected and then `ROLLBACK`ed.

An honest limitation: the Next.js route handlers issue single PostgREST statements, so
multi-step workflows rely on PL/pgSQL functions for atomicity rather than `BEGIN/COMMIT`
in application code. Where a handler performs two independent writes (creating a
conversation, then its two memberships) it compensates manually by deleting the
conversation if the membership insert fails.

---

## 9. Security model

### 9.1 Roles

Application roles live in `organization_memberships.role`:
`student`, `mentor`, `club_admin`, `moderator`, `college_admin`, `super_admin`.
They are **never** accepted from the client. Profile updates cannot change them: the
`profiles` UPDATE policy is `id = auth.uid()`, and migration 0008 revokes table-level
UPDATE and re-grants only an explicit column list.

### 9.2 Row Level Security

- RLS is enabled on **all 30 tables** (verified: 30/30, zero exceptions).
- Read policies encode visibility: public, campus-only (`is_org_member`), followers-only,
  and team-only (`is_project_member`).
- Private tables have no public read path at all: `bookmarks` (owner only),
  `messages` (conversation members only), `resumes` (owner only),
  `moderation_reports` and `audit_logs` (revoked from `anon`/`authenticated`).
- The projects read policy originally caused **infinite recursion**
  (`projects → project_members → projects`). Migration 0012 fixes it with a
  `SECURITY DEFINER` helper `is_project_member(uuid)` that checks membership without
  re-entering RLS, and it also fixed a real authorisation bug where the task policies
  compared `pm.project_id = pm.project_id` (always true) instead of correlating to
  `project_tasks.project_id`.

### 9.3 Institution isolation

`posts`, `projects`, `events`, `opportunities` and `clubs` all carry
`organization_id`. Campus-visibility rows are readable only when
`is_org_member(organization_id)` returns true for the signed-in user. Submitting a
forged `organization_id` fails the policy's `WITH CHECK`.

### 9.4 Column-level privileges (DCL)

Migration 0008 revokes table-wide UPDATE and grants narrow column lists:

- `profiles`: only self-editable fields — not role, not verification status.
- `posts`: `body`, `visibility`, `project_id`, `edited_at` — not `author_id`,
  not `like_count`.
- `projects`: descriptive fields — not `owner_id`, not `accepted_count`.
- `organization_memberships`: `status`, `verified_at`, and only for college admins.
- `notifications`: `is_read` only.

Function execution is also granted explicitly:
`REVOKE ALL ON FUNCTION accept_project_application(uuid) FROM public, anon;
GRANT EXECUTE … TO authenticated`.

> **Verified gap in the current cloud deployment:** the Neon instance has 18 policies
> against the 91 distinct policy names declared in the migrations. Fourteen tables —
> including `notifications`, `bookmarks`, `project_applications`, `project_tasks`,
> `resumes`, `events`, `opportunities` and `moderation_reports` — currently have **no
> policy at all**. Under RLS that means deny-by-default, so those writes will fail for
> `authenticated` clients until the migrations are re-applied cleanly. This is a
> deployment-state issue, not a schema-design issue, and the fix is:
>
> ```bash
> # local: full reset applies all 12 migrations + seed
> npm run db:reset
>
> # any PostgreSQL: apply in order, stopping on first error
> for f in supabase/migrations/*.sql; do
>   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f" || break
> done
> ```

---

## 10. Concurrency and integrity

| Scenario | Mechanism | Where |
| --- | --- | --- |
| Two owners accept the last opening simultaneously | `SELECT … FOR UPDATE` on the project row + openings re-check inside the function | `accept_project_application()` |
| Student accepted twice | `project_members` composite PK + `ON CONFLICT DO NOTHING` | schema + function |
| Double like from a retried request | `post_likes` composite PK | schema |
| Double event registration / overbooking | Row lock on `events` + capacity count + `event_registrations` PK | `register_for_event()` |
| Duplicate message on client retry | `UNIQUE (sender_id, client_nonce)` | schema |
| Duplicate notification on trigger retry | `UNIQUE (idempotency_key)` + `ON CONFLICT DO NOTHING` | triggers |
| Duplicate repository import | `UNIQUE (user_id, github_repo_id)` and `UNIQUE (github_repository_id)` on projects | schema |
| Counter drift | Counters updated only by child-table triggers; reconciliation query recomputes from child rows | migrations 0005, 0010 |
| Feed returning unbounded rows | Every listing has `.limit()` (20–100) and index-backed ordering | route handlers |
| N+1 author lookups | Batch `IN (authorIds)` then map in memory | feed page |

---

## 11. Implemented features

### 11.1 Working, wired end to end (UI → handler → database)

| Area | Detail |
| --- | --- |
| Authentication | Email/password signup, login, logout, email verification screen, forgot/reset password screens, session refresh middleware, protected route group |
| Onboarding & identity | Course, department, graduation year, skills, interests, bio, headline, collaboration and mentorship preferences, portfolio visibility |
| Profiles & portfolio | `/u/[username]`, `/portfolio/[username]`, public/private visibility, project and activity tabs |
| Social feed | Create post, campus/public visibility, like/unlike, comment, bookmark, delete own post, following-filtered feed |
| Follow graph | Follow/unfollow, followers and following lists (`/my-network`), mutual-connection display |
| Projects | Directory, create project, detail page, apply, withdraw, owner accept/reject, team membership, openings counter, task board |
| Messaging | Conversation list, thread view, send message with `client_nonce` dedupe, read state, blocked-user enforcement, conversation-scoped realtime |
| Notifications | Durable rows created by triggers, list page, unread badge, mark-one-read, mark-all-read |
| Resume builder | Create, edit, save, three templates, live preview, A4 PDF download from saved data |
| Opportunities | Listing with category/deadline filters, detail page, save/unsave |
| Clubs & events | Club listing and join request, event listing, capacity-guarded registration |
| GitHub integration | OAuth connect/callback/disconnect, repository listing, background sync enqueue, import selected repo into a project, encrypted token storage |
| Admin | College-admin verification queue at `/admin/verification` (approve/reject memberships) |
| Health | `/api/health` reports database and queue status truthfully (`not_ready` when the DB is unreachable) |

### 11.2 Not implemented / partial (stated honestly)

- Student search with rich filters/ranking; connection requests (accept/reject).
- Project milestones UI, team-management controls, project chat/history.
- Message requests, attachments, typing indicators, full read receipts.
- Resume drag-reordering, duplication/renaming, server-side queued PDF export.
- Opportunity publisher CRUD, deadline reminder scheduler, ingestion integrations.
- Club admin/announcements/recruitment; event creation, cancellation, waitlists.
- Mentorship module (directory, requests, goals).
- Full moderation tools, suspensions, account deletion, data export, audit-log UI.
- Media uploads to Supabase Storage, image processing.
- Distributed rate limiting, error monitoring, alerting, backup/restore drill.
- The full 17-scenario k6 load suite (only a read smoke script exists).

The repository's own `IMPLEMENTATION_STATUS.md` documents the same gaps; this report
keeps that boundary rather than overstating coverage.

---

## 12. Verification record

Everything below was executed against the live database or the codebase, not assumed.

| Check | Command / method | Result |
| --- | --- | --- |
| Table count | `information_schema.tables` query | **30** tables |
| Constraints | `pg_constraint` grouped by `contype` | 30 PK, 55 FK, 10 UNIQUE, 38 CHECK |
| Indexes | `pg_indexes` | **57** total, 27 non-PK |
| Triggers | `pg_trigger` where `not tgisinternal` | **21** |
| Functions | `pg_proc` in `public` | **65** (29 application + 36 `pgcrypto`) |
| RLS coverage | `pg_class.relrowsecurity` | **30 of 30 enabled** |
| Policies | `pg_policies` | **18 present** (91 declared in migrations) — see §9.4 gap |
| Demo SQL validity | `node scripts/verify-demo-sql.mjs` | **29 statements, 0 errors** |
| Schema on cloud DB | `psql`/`pg` introspection against Neon | Full schema present |
| Application build | `npm run build` (earlier session) | Passed, all routes compiled |
| Type check | `npm run typecheck` | Passed |
| Unit tests | `npm test` (Vitest) | 3/3 validators passing |
| E2E tests | `npx playwright test` | 13/13 responsive + smoke passing (earlier session) |
| Local Supabase API | port `54321` probe | **Not running** — must be started for data-backed flows |

**What is genuinely verified:** the schema, constraints, indexes, triggers, functions,
RLS enablement and the demonstration SQL all exist and execute on real PostgreSQL.
**What is not verified in this session:** authenticated end-to-end flows against a
running backend, because the local Supabase API is down and the cloud Neon instance
holds no application data.

---

## 13. Known limitations

1. **Cloud deployment is policy-incomplete** (18 of 91 declared policies). Re-applying
   migrations with `ON_ERROR_STOP=1` is required before any demo that writes data.
2. **No seeded demo data on Neon** — only 3 organisations, 3 domains and 1 auth user.
   The seed file targets a Supabase stack (it inserts into `auth.users` / `auth.identities`
   and needs the GoTrue columns), so it cannot simply be run against plain Neon.
3. **Supabase Auth is not replaceable by Neon alone.** Neon provides PostgreSQL only;
   login, sessions, and the PostgREST API that the app calls come from Supabase.
4. **PDF export is client-side.** It is a real A4 PDF via `@react-pdf/renderer`, but it
   runs in the browser, so a server-side queued export does not exist yet.
5. **No views or materialised views.** Reporting queries are ad-hoc; see §8.
6. **Load testing is not done.** The specification's 1,000-VU / 100-RPS targets are
   acceptance goals, not measured results. Only the k6 read-smoke script exists.
7. **Backup/restore not tested.** Neon provides PITR on paid plans; no restore drill
   has been performed.

---

## 14. Screenshots and submission checklist

Screenshots that exist / still need to be captured:

| # | Screenshot | How to produce |
| --- | --- | --- |
| 1 | Table list | `\dt` in `psql`, or the query in §1 of `demo-queries.sql` |
| 2 | Table structure (`\d posts`) | `psql "$DATABASE_URL" -c '\d public.posts'` |
| 3 | Row data with real content | Requires seeded data (see §13.2) |
| 4 | INNER / LEFT / RIGHT JOIN output | Run §2–§4 of `demo-queries.sql` |
| 5 | GROUP BY + HAVING output | Run §5–§6 |
| 6 | Subquery output | Run §7 |
| 7 | Trigger firing (before/after like_count) | Run §9 (rolled back) |
| 8 | RLS policies list | Run §10.2 |
| 9 | Application screens | `/home`, `/projects`, `/messages`, `/resume` with a running Supabase |

Suggested report format: **PDF** (a rendered PDF of this document is provided at
`docs/CampusLoop-DBMS-Report.pdf`); an editable DOCX can be produced by pasting this
Markdown into Word, since no DOCX converter is installed in this environment.

---

## Appendix A — Answers to the submission form

| # | Question | Answer |
| --- | --- | --- |
| 1 | Final project name | **CampusLoop** |
| 2 | One-line description | A college-exclusive social and developer platform that connects verified student profiles, projects, collaboration, messaging and career opportunities in one identity. |
| 3 | Individual or group | *Author to confirm* |
| 4 | Group members / enrollment numbers | *Author to confirm* |
| 5 | Faculty / instructor | *Author to confirm* |
| 6 | Backend | **Next.js 15 (App Router) on Node.js** — Server Components + 28 Route Handlers; no Express |
| 7 | Database | **PostgreSQL** (Supabase-managed schema; deployed on **Neon** cloud PostgreSQL) |
| 8 | ORM | **None** — Supabase JS client over PostgREST + hand-written SQL migrations; `pg` only in the worker/scripts |
| 9 | Local or cloud | **Both have been used:** local Supabase stack (Docker) for development, **cloud Neon PostgreSQL** for the current deployment |
| 10 | Total tables | **30** |
| 11 | Table names | See §4 (all 30 listed by domain) |
| 12 | Main entities | `profiles`, `organizations`, `posts`, `comments`, `post_likes`, `follows`, `conversations`, `messages`, `projects`, `project_members`, `project_applications`, `notifications`, `resumes`, `opportunities`, `clubs`, `events` |
| 13 | Relationships | See §5 — 55 foreign keys; 1:1 `auth.users`↔`profiles`; 1:N organisation→content; M:N via 9 junction tables |
| 14 | PK/FK defined | **Yes** — 30 PK constraints (9 composite), 55 FK constraints, explicit cascade/set-null rules |
| 15 | Normalisation | **1NF, 2NF, 3NF** with documented exceptions (skill/topic arrays, trigger-maintained counters, JSONB resume content) — see §7 |
| 16 | Implemented features | See §11.1 — auth, onboarding, profiles/portfolio, feed, follows, projects/team, tasks, messaging, notifications, resume + PDF, opportunities, clubs, events, GitHub import, admin verification, health check |
| 17 | Auth/posts/likes/comments/messaging/profiles working | **Yes at the code + schema level**; previously verified end-to-end with local Supabase running. Not re-verified this session because the local Supabase API is down |
| 18 | Search/notifications/events/clubs/collaboration | Notifications, events, clubs and project collaboration: implemented. Search: basic listing/filter only, no ranked full-text search |
| 19 | Admin panel | **Partial** — college-admin verification queue at `/admin/verification`; no full user/content moderation console |
| 20 | Complete vs planned | Complete: §11.1. Planned/partial: §11.2 |
| 21 | SQL operations | **DDL, DML, DCL, TCL** all used — see §8.1 |
| 22 | INNER/LEFT/RIGHT JOIN | **All three** demonstrated in `docs/sql/demo-queries.sql` (verified to run); the application read path uses batched lookups instead of SQL joins |
| 23 | GROUP BY / HAVING / ORDER BY / aggregates | Demonstrated in §5–§6 of the demo SQL; aggregates also used inside functions and counter triggers |
| 24 | Subqueries | **Yes** — `EXISTS`/`NOT EXISTS` in RLS policies, scalar and derived-table subqueries in reporting queries |
| 25 | Triggers / procedures / views / indexes | **21 triggers, 29 stored functions, 0 views, 57 indexes** |
| 26 | Transactions & ACID | **Yes** — atomic PL/pgSQL flows, `SELECT … FOR UPDATE` isolation, constraint-based consistency, commit-before-ack durability; explicit `BEGIN … ROLLBACK` demo in §8–§9 of the demo SQL |
| 27 | Application screenshots | Not captured in this session; capture steps in §14 |
| 28 | SQL execution / table screenshots | Not captured; run `demo-queries.sql` and screenshot the outputs (§14) |
| 29 | Teacher's required sections / page limit | *Author to confirm* |
| 30 | Report format | **PDF** rendered (`docs/CampusLoop-DBMS-Report.pdf`); Markdown source is DOCX-pasteable |

---

## Appendix B — Files to submit alongside this report

| File | What it shows |
| --- | --- |
| `supabase/migrations/0001_campusloop.sql` … `0012_rls_recursion_fix.sql` | All DDL, constraints, indexes, triggers, functions, RLS policies |
| `supabase/seed.sql` | Demonstration data for the local Supabase stack |
| `docs/sql/demo-queries.sql` | Runnable joins, aggregates, subqueries, transaction and trigger demos |
| `scripts/db-report.mjs`, `scripts/db-report-2.mjs` | Read-only schema introspection used to produce §3–§6 |
| `scripts/verify-demo-sql.mjs` | Executes the demo SQL and reports statement-by-statement results |
