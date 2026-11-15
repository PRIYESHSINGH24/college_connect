import { readFileSync } from "node:fs";
import pg from "pg";

const envRaw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const url = envRaw.match(/^\s*DATABASE_URL\s*=\s*(.+)$/m)[1].trim().replace(/^["']|["']$/g, "");
const sql = readFileSync(new URL("../docs/sql/demo-queries.sql", import.meta.url), "utf8");

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

// Split on blank-line separated statements is unreliable; instead run the whole
// file with simplequery (multi-statement support) and report success/failure.
try {
  const res = await client.query(sql);
  const results = Array.isArray(res) ? res : [res];
  console.log(`OK — ${results.length} statements executed, 0 errors.`);
  results.forEach((r, i) => {
    if (r?.command) console.log(`  #${i + 1} ${r.command} rows=${r.rowCount ?? "-"}`);
  });
} catch (e) {
  console.error("FAILED:", e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
