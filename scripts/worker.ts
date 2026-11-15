import "dotenv/config";
import { PgBoss } from "pg-boss";
import { createAdminClient } from "../src/lib/supabase/admin";
import { decryptToken } from "../src/lib/github/crypto";

type GithubRepo = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics?: string[];
  stargazers_count: number;
  forks_count: number;
  fork: boolean;
  private: boolean;
  default_branch: string;
  updated_at: string;
  license?: { spdx_id: string } | null;
};

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required for the worker.");

  const boss = new PgBoss({
    connectionString,
    schema: "pgboss",
    max: 4,
    application_name: "campusloop-worker",
  });
  boss.on("error", error => console.error("pg-boss error", error));
  await boss.start();
  await boss.createQueue("github-sync", {
    retryLimit: 4,
    retryDelay: 10,
    retryBackoff: true,
    expireInSeconds: 180,
  });

  const supabase = createAdminClient();
  await boss.work("github-sync", async jobs => {
    const job = jobs[0];
    const jobData = (job?.data ?? {}) as { userId?: string };
    const userId = jobData.userId;
    if (!userId) throw new Error("Missing userId in github-sync job");

    try {
      const { data: connection, error } = await supabase
        .from("github_connections").select("token_ciphertext").eq("user_id", userId).single();
      if (error || !connection) throw new Error("GitHub connection not found");

      await supabase.from("github_connections")
        .update({ sync_status: "processing", last_error: null }).eq("user_id", userId);
      const token = decryptToken(connection.token_ciphertext);
      let page = 1;
      let imported = 0;

      // Public repositories only; pagination is serial and capped to avoid runaway API usage.
      while (page <= 5) {
        const response = await fetch(
          `https://api.github.com/user/repos?visibility=public&affiliation=owner,collaborator,organization_member&per_page=100&page=${page}&sort=updated`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/vnd.github+json",
              "X-GitHub-Api-Version": "2022-11-28",
            },
            signal: AbortSignal.timeout(15_000),
          },
        );
        if (response.status === 401) {
          throw new Error("GitHub authorization expired. Disconnect and reconnect the account.");
        }
        if (response.status === 403) {
          const reset = response.headers.get("x-ratelimit-reset");
          if (reset && Number(reset) * 1000 > Date.now()) {
            throw new Error(`GitHub rate limit reached; reset at ${reset}`);
          }
          throw new Error("GitHub API denied repository access.");
        }
        if (!response.ok) throw new Error(`GitHub API failed: ${response.status}`);

        const repositories = await response.json() as GithubRepo[];
        if (!repositories.length) break;
        const rows = repositories.filter(repo => !repo.private).map(repo => ({
          user_id: userId,
          github_repo_id: repo.id,
          full_name: repo.full_name,
          name: repo.name,
          description: repo.description,
          html_url: repo.html_url,
          homepage: repo.homepage,
          language: repo.language,
          topics: repo.topics || [],
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          is_fork: repo.fork,
          default_branch: repo.default_branch,
          license_spdx: repo.license?.spdx_id || null,
          github_updated_at: repo.updated_at,
          visibility: "private",
          is_featured: false,
        }));

        if (rows.length) {
          const { error: upsertError } = await supabase.from("github_repositories")
            .upsert(rows, { onConflict: "user_id,github_repo_id" });
          if (upsertError) throw new Error(upsertError.message);
          imported += rows.length;
        }
        if (repositories.length < 100) break;
        page += 1;
      }

      const { error: successError } = await supabase.from("github_connections").update({
        sync_status: "succeeded",
        last_synced_at: new Date().toISOString(),
        last_error: null,
      }).eq("user_id", userId);
      if (successError) throw new Error(successError.message);
      console.log(JSON.stringify({ event: "github_sync_succeeded", userId, imported }));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Unknown GitHub sync failure";
      // Mark the latest attempt honestly; pg-boss will apply the configured bounded retry policy.
      await supabase.from("github_connections").update({
        sync_status: "failed",
        last_error: message.slice(0, 1000),
      }).eq("user_id", userId);
      throw cause;
    }
  });

  console.log("CampusLoop worker started. Waiting for github-sync jobs.");
  const shutdown = async () => {
    await boss.stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch(error => {
  console.error("CampusLoop worker failed to start", error);
  process.exit(1);
});
