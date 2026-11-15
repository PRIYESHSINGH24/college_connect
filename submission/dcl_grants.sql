-- =====================================================================
-- CampusLoop — DCL (Data Control Language) demonstration
-- =====================================================================
-- Every statement below is copied VERBATIM from the project's own
-- migrations under supabase/migrations/. Nothing here is invented.
--
-- Source of each block is named so the reader can cross-check it.
--
-- Run this ONLY after the schema exists (i.e. after 0001..0012 have been
-- applied). GRANT/REVOKE on a table that does not exist raises an error.
--
-- Why these exist: Row Level Security decides WHICH ROWS a user may touch.
-- Column privileges decide WHICH COLUMNS. The project uses both together so
-- a student cannot, for example, promote themselves to college_admin or
-- rewrite a project's accepted-member counter.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Protect the audit trail and moderator inbox
--    Source: 0001_campusloop.sql (end of the RLS section)
-- ---------------------------------------------------------------------
-- Audit logs are written by SECURITY DEFINER routines only. Neither the
-- anonymous role nor a logged-in student may read or write them.
revoke all on public.audit_logs from anon, authenticated;

-- Reports may be READ by the reporter and by moderators (RLS policy), but
-- anonymous visitors must not even reach the table.
revoke all on public.moderation_reports from anon;


-- ---------------------------------------------------------------------
-- 2. Notifications: read-only apart from the read flag
--    Source: 0006_tenant_scope_and_mutation_hardening.sql
-- ---------------------------------------------------------------------
-- Without this, a student could rewrite a notification's recipient_id,
-- link or body. Revoking table-level UPDATE first, then granting UPDATE on
-- the single column that legitimate code needs, narrows the write surface.
revoke update on public.notifications from authenticated;
grant update (is_read) on public.notifications to authenticated;


-- ---------------------------------------------------------------------
-- 3. Column-level privileges on user-editable tables
--    Source: 0008_column_privileges_and_admin_verification.sql
--    Pattern: revoke table-wide UPDATE, then grant UPDATE on an explicit
--    column list. The REVOKE is what makes the GRANT meaningful.
-- ---------------------------------------------------------------------

-- 3a. Profiles. Note what is ABSENT from the grant list:
--     organization_id (tenant is set by the verified-membership trigger),
--     featured_project_id, is_suspended, created_at, updated_at.
revoke update on public.profiles from authenticated;
grant update (
  username, full_name, headline, bio, avatar_url, department, course,
  graduation_year, skills, interests, github_username, portfolio_visibility,
  profile_visibility, collaboration_available, mentorship_available
) on public.profiles to authenticated;

-- 3b. Organization memberships. A student may only flip status/verified_at;
--     they cannot change their own role, so self-promotion to college_admin
--     is blocked at the privilege layer as well as in RLS.
revoke update on public.organization_memberships from authenticated;
grant update (status, verified_at) on public.organization_memberships to authenticated;

-- 3c. Posts. author_id and organization_id stay immutable through the API.
revoke update on public.posts from authenticated;
grant update (body, visibility, project_id, edited_at) on public.posts to authenticated;

-- 3d. Projects. owner_id, organization_id and accepted_count are excluded,
--     so an owner cannot forge ownership or inflate/deflate the member count.
revoke update on public.projects from authenticated;
grant update (
  title, slug, description, tech_stack, repository_url, demo_url, cover_url,
  status, visibility, openings
) on public.projects to authenticated;

-- 3e. Project applications. Intentionally NO grant follows the revoke:
--     every status change must go through the SECURITY DEFINER RPCs in
--     section 4, which re-check authorization and lock the row.
revoke update on public.project_applications from authenticated;


-- ---------------------------------------------------------------------
-- 4. EXECUTE privileges on SECURITY DEFINER routines
--    Source: 0008_column_privileges_and_admin_verification.sql,
--            0010_project_membership_counter_integrity.sql,
--            0011_auth_trigger_and_messaging_policy.sql
--    Pattern: revoke the default PUBLIC grant, then grant to authenticated
--    only. This is how "logged-in users may call it, anonymous may not" is
--    expressed in PostgreSQL.
-- ---------------------------------------------------------------------

-- Accepting an application: locks the application and the project row,
-- checks openings, inserts membership idempotently (ON CONFLICT DO NOTHING),
-- then increments accepted_count. Re-granted in 0010 after the body was
-- replaced by CREATE OR REPLACE.
revoke all on function public.accept_project_application(uuid) from public, anon;
grant execute on function public.accept_project_application(uuid) to authenticated;

revoke all on function public.reject_project_application(uuid) from public, anon;
grant execute on function public.reject_project_application(uuid) to authenticated;

revoke all on function public.withdraw_project_application(uuid) from public, anon;
grant execute on function public.withdraw_project_application(uuid) to authenticated;

-- Messaging helpers. is_blocked_between() is used inside RLS predicates and
-- inside SECURITY DEFINER routines; can_message_user() answers the
-- "may these two talk" question. Both are hidden from PUBLIC and anon.
revoke all on function public.can_message_user(uuid) from public, anon;
grant execute on function public.can_message_user(uuid) to authenticated;

revoke all on function public.is_blocked_between(uuid, uuid) from public, anon;
grant execute on function public.is_blocked_between(uuid, uuid) to authenticated;


-- ---------------------------------------------------------------------
-- 5. How to prove the privileges actually differ (read-only inspection)
-- ---------------------------------------------------------------------

-- Which columns may 'authenticated' update per table:
select table_name, column_name, privilege_type
from information_schema.column_privileges
where grantee = 'authenticated'
  and privilege_type = 'UPDATE'
  and table_schema = 'public'
order by table_name, column_name;

-- Which routines a logged-in user may execute:
select p.proname,
       pg_get_userbyid(p.proowner) as owner,
       p.prosecdef                 as security_definer,
       coalesce(array_to_string(p.proacl, ' | '), '(default: owner only)') as acl
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef
order by p.proname;

-- Table-level privileges as they stand now:
select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type) as privs
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
group by table_name, grantee
order by table_name, grantee;


-- =====================================================================
-- Notes for the viva / report
-- =====================================================================
-- * DDL creates the objects (0001..0012). DML/Queries exercise them
--   (docs/sql/demo-queries.sql). DCL — this file — decides who may do what.
--   TCL (BEGIN/COMMIT/ROLLBACK) is demonstrated in demo-queries.sql.
-- * Supabase's anon and authenticated roles are PostgreSQL roles, so ordinary
--   GRANT/REVOKE is the correct mechanism; service_role bypasses RLS and is
--   therefore never granted to client code.
-- * Order matters: REVOKE table-level UPDATE BEFORE GRANTing column-level
--   UPDATE, otherwise the table-level grant still permits every column.
-- * These statements were extracted verbatim from the migrations and were not
--   re-executed against the live database while building this file.
-- =====================================================================
