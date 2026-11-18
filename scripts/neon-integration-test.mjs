import { readFileSync } from "node:fs";
import pg from "pg";

function databaseUrl() {
  const environment = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const match = environment.match(/^DATABASE_URL\s*=\s*(.+)$/m);
  if (!match) throw new Error("DATABASE_URL is missing from .env.local");
  return match[1].trim().replace(/^['"]|['"]$/g, "").replace("-pooler.", ".");
}

const client = new pg.Client({
  connectionString: databaseUrl(),
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 60_000,
});

const id = () => crypto.randomUUID();
const testRun = `neon-e2e-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
const assert = (condition, message) => {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
};
const one = async (sql, values = []) => (await client.query(sql, values)).rows[0];

async function run() {
  await client.connect();
  await client.query("begin");
  try {
    const organizationId = id();
    const alice = id();
    const bob = id();
    const cara = id();

    await client.query(
      "insert into public.organizations (id,name,slug) values ($1,$2,$3)",
      [organizationId, `${testRun} College`, testRun],
    );
    for (const [userId, username, name] of [[alice, "e2e_alice", "E2E Alice"], [bob, "e2e_bob", "E2E Bob"], [cara, "e2e_cara", "E2E Cara"]]) {
      await client.query(
        "insert into auth.users (id,email,encrypted_password,email_confirmed_at,raw_user_meta_data) values ($1,$2,$3,now(),$4)",
        [userId, `${username}.${testRun}@example.test`, "test-only-not-a-real-password", JSON.stringify({ username, full_name: name })],
      );
      await client.query("select set_config('request.jwt.claim.sub',$1,true)", [userId]);
      // The Neon schema retains CampusLoop's user-created trigger, which creates
      // the matching profile from this metadata. Associate it with the test org.
      await client.query(
        "update public.profiles set organization_id=$1, profile_visibility='public' where id=$2",
        [organizationId, userId],
      );
    }

    await client.query("insert into public.follows (follower_id,following_id) values ($1,$2)", [bob, alice]);
    const postId = id();
    await client.query(
      "insert into public.posts (id,author_id,organization_id,body,visibility) values ($1,$2,$3,$4,'campus')",
      [postId, alice, organizationId, `${testRun}: Alice's test post`],
    );
    await client.query("insert into public.post_likes (post_id,user_id) values ($1,$2)", [postId, bob]);
    await client.query("insert into public.comments (post_id,author_id,body) values ($1,$2,$3)", [postId, cara, "E2E comment"]);
    await client.query("insert into public.bookmarks (user_id,post_id) values ($1,$2)", [bob, postId]);

    const projectId = id();
    await client.query(
      "insert into public.projects (id,owner_id,organization_id,title,description,tech_stack,status,visibility,openings) values ($1,$2,$3,$4,$5,$6,'active','campus',2)",
      [projectId, alice, organizationId, `${testRun} project`, "A test project created by the Neon integration test.", ["Next.js", "PostgreSQL"]],
    );
    await client.query("insert into public.project_members (project_id,user_id,role) values ($1,$2,'owner')", [projectId, alice]);
    await client.query("insert into public.project_applications (project_id,applicant_id,message) values ($1,$2,$3)", [projectId, bob, "I would like to help test this Neon-backed project workflow."]);

    const conversationId = id();
    await client.query("insert into public.conversations (id,created_by,is_group,title) values ($1,$2,false,$3)", [conversationId, alice, `${testRun} direct message`]);
    await client.query("insert into public.conversation_members (conversation_id,user_id) values ($1,$2),($1,$3)", [conversationId, alice, bob]);
    await client.query("insert into public.messages (conversation_id,sender_id,body,client_nonce) values ($1,$2,$3,$4)", [conversationId, alice, "Hello Bob — this is a Neon integration-test message.", testRun]);

    const resumeId = id();
    await client.query("insert into public.resumes (id,user_id,title) values ($1,$2,$3)", [resumeId, alice, `${testRun} resume`]);
    const opportunityId = id();
    await client.query("insert into public.opportunities (id,organization_id,publisher_id,title,category,description,status) values ($1,$2,$3,$4,'internship',$5,'published')", [opportunityId, organizationId, alice, `${testRun} internship`, "Test opportunity for Neon integration."]);
    await client.query("insert into public.saved_opportunities (user_id,opportunity_id) values ($1,$2)", [bob, opportunityId]);
    const clubId = id();
    await client.query("insert into public.clubs (id,organization_id,name,slug,description,created_by) values ($1,$2,$3,$4,$5,$6)", [clubId, organizationId, `${testRun} Club`, `${testRun}-club`, "Test club for Neon integration.", alice]);
    await client.query("insert into public.club_memberships (club_id,user_id) values ($1,$2)", [clubId, bob]);
    const eventId = id();
    await client.query("insert into public.events (id,organization_id,club_id,created_by,title,description,starts_at,capacity) values ($1,$2,$3,$4,$5,$6,now() + interval '1 day',10)", [eventId, organizationId, clubId, alice, `${testRun} Event`, "Test event for Neon integration."]);
    await client.query("insert into public.event_registrations (event_id,user_id) values ($1,$2)", [eventId, cara]);

    const checks = {
      profiles: await one("select count(*)::int as count from public.profiles where organization_id=$1", [organizationId]),
      social: await one("select count(*)::int as count from public.posts p join public.post_likes l on l.post_id=p.id join public.comments c on c.post_id=p.id where p.id=$1", [postId]),
      project: await one("select count(*)::int as count from public.project_applications where project_id=$1 and applicant_id=$2", [projectId, bob]),
      message: await one("select count(*)::int as count from public.messages where conversation_id=$1", [conversationId]),
      resume: await one("select count(*)::int as count from public.resumes where id=$1", [resumeId]),
      campus: await one("select (select count(*) from public.saved_opportunities where opportunity_id=$1) + (select count(*) from public.club_memberships where club_id=$2) + (select count(*) from public.event_registrations where event_id=$3) as count", [opportunityId, clubId, eventId]),
    };
    assert(checks.profiles.count === 3, "three dummy profiles exist");
    assert(checks.social.count === 1, "post, like, and comment link correctly");
    assert(checks.project.count === 1, "project application exists");
    assert(checks.message.count === 1, "direct message exists");
    assert(checks.resume.count === 1, "resume exists");
    assert(Number(checks.campus.count) === 3, "opportunity, club, and event workflows exist");

    await client.query("rollback");
    console.log(JSON.stringify({ status: "passed", testRun, checks, persisted: false }, null, 2));
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
