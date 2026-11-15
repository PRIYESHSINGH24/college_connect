import { PgBoss } from "pg-boss";

/** A small, short-lived producer avoids leaving a polling pool open per web request. */
export async function enqueueGitHubSync(userId: string) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required to enqueue GitHub sync jobs.");

  const boss = new PgBoss({
    connectionString,
    schema: "pgboss",
    max: 1,
    application_name: "campusloop-web",
  });
  boss.on("error", error => console.error("pg-boss producer error", error));
  await boss.start();
  try {
    await boss.createQueue("github-sync", {
      retryLimit: 4,
      retryDelay: 10,
      retryBackoff: true,
      expireInSeconds: 180,
    });
    return await boss.send(
      "github-sync",
      { userId },
      { retryLimit: 4, retryDelay: 10, retryBackoff: true, expireInSeconds: 180, singletonKey: userId },
    );
  } finally {
    await boss.stop();
  }
}
