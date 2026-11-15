-- ============================================================================
-- CampusLoop — DBMS demonstration queries for the project report
-- Target: PostgreSQL 15+ (same schema as supabase/migrations/*.sql)
-- These queries are safe and read-only except section 8/9, which is wrapped
-- in an explicit transaction that is rolled back at the end.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. DDL — schema inspection (metadata queries)
-- ---------------------------------------------------------------------------
-- 1.1 All tables in the application schema
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 1.2 Primary keys per table
SELECT tc.table_name, kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON kcu.constraint_name = tc.constraint_name
 AND kcu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public' AND tc.constraint_type = 'PRIMARY KEY'
ORDER BY tc.table_name, kcu.ordinal_position;

-- 1.3 Foreign keys (referential integrity)
SELECT
  tc.table_name  AS child_table,
  kcu.column_name AS child_column,
  ccu.table_name  AS parent_table,
  ccu.column_name AS parent_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON kcu.constraint_name = tc.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 1.4 Indexes
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;


-- ---------------------------------------------------------------------------
-- 2. SELECT with INNER JOIN
--    "Show each post with the author's name and department."
-- ---------------------------------------------------------------------------
SELECT
  p.id            AS post_id,
  pr.full_name    AS author_name,
  pr.department,
  LEFT(p.body, 60) AS preview,
  p.like_count,
  p.comment_count,
  p.created_at
FROM public.posts p
INNER JOIN public.profiles pr ON pr.id = p.author_id
ORDER BY p.created_at DESC
LIMIT 20;


-- ---------------------------------------------------------------------------
-- 3. LEFT JOIN
--    "List every project with its team size, including projects with no team."
-- ---------------------------------------------------------------------------
SELECT
  pj.title,
  pj.status,
  COUNT(pm.user_id) AS team_members
FROM public.projects pj
LEFT JOIN public.project_members pm ON pm.project_id = pj.id
GROUP BY pj.id, pj.title, pj.status
ORDER BY team_members DESC, pj.title;


-- ---------------------------------------------------------------------------
-- 4. RIGHT JOIN
--    "List every student profile with the number of projects they own,
--     including students who own no project."
-- ---------------------------------------------------------------------------
SELECT
  pr.username,
  pr.full_name,
  COUNT(pj.id) AS owned_projects
FROM public.projects pj
RIGHT JOIN public.profiles pr ON pr.id = pj.owner_id
GROUP BY pr.id, pr.username, pr.full_name
ORDER BY owned_projects DESC, pr.username;


-- ---------------------------------------------------------------------------
-- 5. GROUP BY + aggregate functions
--    "How many posts and total likes per department?"
-- ---------------------------------------------------------------------------
SELECT
  pr.department,
  COUNT(p.id)                    AS posts,
  COALESCE(SUM(p.like_count), 0) AS total_likes,
  COALESCE(AVG(p.like_count), 0) AS avg_likes,
  MAX(p.created_at)              AS latest_post
FROM public.profiles pr
LEFT JOIN public.posts p ON p.author_id = pr.id
GROUP BY pr.department
ORDER BY posts DESC;


-- ---------------------------------------------------------------------------
-- 6. HAVING
--    "Departments that produced more than 1 post."
-- ---------------------------------------------------------------------------
SELECT
  pr.department,
  COUNT(p.id) AS posts
FROM public.profiles pr
JOIN public.posts p ON p.author_id = pr.id
GROUP BY pr.department
HAVING COUNT(p.id) > 1
ORDER BY posts DESC;


-- ---------------------------------------------------------------------------
-- 7. Subqueries
-- ---------------------------------------------------------------------------
-- 7.1 Scalar subquery: posts that have more likes than the average post.
SELECT id, LEFT(body, 50) AS preview, like_count
FROM public.posts
WHERE like_count > (SELECT COALESCE(AVG(like_count), 0) FROM public.posts)
ORDER BY like_count DESC;

-- 7.2 Correlated EXISTS: students who own at least one active project
SELECT pr.username, pr.full_name
FROM public.profiles pr
WHERE EXISTS (
  SELECT 1 FROM public.projects pj
  WHERE pj.owner_id = pr.id AND pj.status = 'active'
);

-- 7.3 NOT EXISTS: students who have never applied to a project
SELECT pr.username
FROM public.profiles pr
WHERE NOT EXISTS (
  SELECT 1 FROM public.project_applications pa
  WHERE pa.applicant_id = pr.id
);

-- 7.4 Derived table (subquery in FROM)
SELECT department, ROUND(AVG(posts_per_student), 2) AS avg_posts_per_student
FROM (
  SELECT pr.department, pr.id, COUNT(p.id) AS posts_per_student
  FROM public.profiles pr
  LEFT JOIN public.posts p ON p.author_id = pr.id
  GROUP BY pr.department, pr.id
) per_student
GROUP BY department;


-- ---------------------------------------------------------------------------
-- 8. Transactions and ACID (demonstration only — rolled back)
--    Transferring a project from one owner to another is a multi-row update.
--    Both statements must succeed or neither may persist.
-- ---------------------------------------------------------------------------
BEGIN;

UPDATE public.projects
SET owner_id = (SELECT id FROM public.profiles ORDER BY username LIMIT 1)
WHERE id = (SELECT id FROM public.projects ORDER BY created_at LIMIT 1);

INSERT INTO public.audit_logs (organization_id, actor_id, action, target_type, target_id, metadata)
SELECT organization_id, owner_id, 'project.owner_transfer_demo', 'project', id, '{"demo": true}'::jsonb
FROM public.projects
ORDER BY created_at
LIMIT 1;

-- Inspect the uncommitted state, then discard it:
SELECT id, title, owner_id FROM public.projects ORDER BY created_at LIMIT 1;

ROLLBACK;


-- ---------------------------------------------------------------------------
-- 9. Trigger behaviour demonstration (rolled back)
--    Inserting a like must automatically increment posts.like_count and
--    create a notification row for the post author.
-- ---------------------------------------------------------------------------
BEGIN;

-- before
SELECT id, like_count FROM public.posts ORDER BY created_at DESC LIMIT 1;

INSERT INTO public.post_likes (post_id, user_id)
SELECT p.id, pr.id
FROM public.posts p, public.profiles pr
WHERE pr.id <> p.author_id
ORDER BY p.created_at DESC
LIMIT 1;

-- after: like_count incremented by the trigger
SELECT id, like_count FROM public.posts ORDER BY created_at DESC LIMIT 1;

-- and a notification was written by the trigger
SELECT type, entity_type, message, idempotency_key
FROM public.notifications
ORDER BY created_at DESC
LIMIT 1;

ROLLBACK;


-- ---------------------------------------------------------------------------
-- 10. Row Level Security inspection
-- ---------------------------------------------------------------------------
-- 10.1 Which tables have RLS enabled?
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY c.relname;

-- 10.2 Policies defined per table
SELECT tablename, policyname, cmd, roles::text, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 10.3 Triggers
SELECT c.relname AS table_name, t.tgname AS trigger_name
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

-- 10.4 Stored functions
SELECT p.proname AS function_name,
       pg_get_function_arguments(p.oid) AS arguments,
       CASE p.prosecdef WHEN true THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END AS security
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
ORDER BY p.proname;


-- ---------------------------------------------------------------------------
-- 11. Window function (bonus — ranking)
--    Rank projects by team size within each organisation.
-- ---------------------------------------------------------------------------
SELECT
  pj.title,
  o.name AS organization,
  COUNT(pm.user_id) AS team_members,
  RANK() OVER (PARTITION BY pj.organization_id ORDER BY COUNT(pm.user_id) DESC) AS rank_in_org
FROM public.projects pj
JOIN public.organizations o ON o.id = pj.organization_id
LEFT JOIN public.project_members pm ON pm.project_id = pj.id
GROUP BY pj.id, pj.title, pj.organization_id, o.name
ORDER BY organization, rank_in_org;
