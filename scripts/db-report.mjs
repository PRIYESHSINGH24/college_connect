import { readFileSync } from "node:fs";
import pg from "pg";

function loadEnv() {
  try {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    const out = {};
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
    return out;
  } catch {
    return {};
  }
}

const env = loadEnv();
const candidates = [];
if (env.DATABASE_URL) candidates.push({ label: ".env.local DATABASE_URL", url: env.DATABASE_URL });
candidates.push({ label: "local:54322", url: "postgresql://postgres:postgres@127.0.0.1:54322/postgres" });
candidates.push({ label: "local:55432", url: "postgresql://postgres:postgres@127.0.0.1:55432/postgres" });

for (const c of candidates) {
  const client = new pg.Client({ connectionString: c.url, connectionTimeoutMillis: 4000, query_timeout: 8000, ssl: c.url.includes("neon.tech") ? { rejectUnauthorized: false } : false });
  try {
    await client.connect();
    const q = async (sql) => (await client.query(sql)).rows;
    const tables = await q(`
      select table_name from information_schema.tables
      where table_schema='public' and table_type='BASE TABLE'
      order by table_name`);
    if (tables.length === 0) {
      console.log(`\n### ${c.label} — connected, but public schema has 0 tables`);
      await client.end();
      continue;
    }
    const counts = await q(`
      select
        (select count(*) from pg_indexes where schemaname='public') as indexes,
        (select count(*) from pg_trigger t join pg_class r on r.oid=t.tgrelid join pg_namespace n on n.oid=r.relnamespace where n.nspname='public' and not t.tgisinternal) as triggers,
        (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public') as functions,
        (select count(*) from pg_policies where schemaname='public') as policies,
        (select count(*) from pg_views where schemaname='public') as views,
        (select count(*) from pg_matviews where schemaname='public') as matviews,
        (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='S') as sequences`);
    console.log(`\n### ${c.label}`);
    console.log(`tables=${tables.length} indexes=${counts[0].indexes} triggers=${counts[0].triggers} functions=${counts[0].functions} policies=${counts[0].policies} views=${counts[0].views} matviews=${counts[0].matviews} sequences=${counts[0].sequences}`);
    console.log("\nTABLES:");
    for (const t of tables) {
      const rc = await q(`select count(*)::int as n from public."${t.table_name}"`);
      console.log(`  ${t.table_name} (${rc[0].n} rows)`);
    }
    const fks = await q(`
      select tc.table_name, kcu.column_name, ccu.table_name as ref_table, ccu.column_name as ref_column
      from information_schema.table_constraints tc
      join information_schema.key_column_usage kcu on kcu.constraint_name=tc.constraint_name and kcu.table_schema=tc.table_schema
      join information_schema.constraint_column_usage ccu on ccu.constraint_name=tc.constraint_name and ccu.table_schema=tc.table_schema
      where tc.constraint_type='FOREIGN KEY' and tc.table_schema='public'
      order by tc.table_name, kcu.column_name`);
    console.log(`\nFOREIGN KEYS: ${fks.length}`);
    for (const f of fks) console.log(`  ${f.table_name}.${f.column_name} -> ${f.ref_table}.${f.ref_column}`);
    const uniq = await q(`
      select tc.table_name, tc.constraint_type, string_agg(kcu.column_name, ',' order by kcu.ordinal_position) as cols
      from information_schema.table_constraints tc
      join information_schema.key_column_usage kcu on kcu.constraint_name=tc.constraint_name and kcu.table_schema=tc.table_schema
      where tc.table_schema='public' and tc.constraint_type in ('PRIMARY KEY','UNIQUE')
      group by tc.table_name, tc.constraint_type, tc.constraint_name
      order by tc.table_name, tc.constraint_type`);
    console.log(`\nPK/UNIQUE CONSTRAINTS: ${uniq.length}`);
    const trig = await q(`
      select r.relname as tbl, t.tgname
      from pg_trigger t join pg_class r on r.oid=t.tgrelid join pg_namespace n on n.oid=r.relnamespace
      where n.nspname='public' and not t.tgisinternal order by r.relname, t.tgname`);
    console.log(`\nTRIGGERS (${trig.length}):`);
    for (const t of trig) console.log(`  ${t.tbl}: ${t.tgname}`);
    const fns = await q(`
      select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' order by p.proname`);
    console.log(`\nFUNCTIONS (${fns.length}):`);
    console.log("  " + [...new Set(fns.map((f) => f.proname))].join(", "));
    const idx = await q(`select tablename, indexname from pg_indexes where schemaname='public' order by tablename, indexname`);
    console.log(`\nINDEXES (${idx.length}):`);
    for (const i of idx) console.log(`  ${i.tablename}.${i.indexname}`);
    await client.end();
    console.log("\nDONE\n");
    process.exit(0);
  } catch (e) {
    console.log(`\n### ${c.label} — FAILED: ${e.code || ""} ${e.message}`);
    try { await client.end(); } catch {}
  }
}
console.log("\nNo reachable database with the CampusLoop schema.\n");
process.exit(1);
