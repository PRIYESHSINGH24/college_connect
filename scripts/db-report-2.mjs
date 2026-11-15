import { readFileSync } from "node:fs";
import pg from "pg";

function env() {
  const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const out = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

const c = new pg.Client({ connectionString: env().DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
await c.connect();
const q = async (s) => (await c.query(s)).rows;

const summary = await q(`
select
  (select count(*) from pg_class r join pg_namespace n on n.oid=r.relnamespace where n.nspname='public' and r.relkind='r') as tables,
  (select count(*) from pg_constraint k join pg_namespace n on n.oid=k.connamespace where n.nspname='public' and k.contype='p') as pks,
  (select count(*) from pg_constraint k join pg_namespace n on n.oid=k.connamespace where n.nspname='public' and k.contype='f') as fks,
  (select count(*) from pg_constraint k join pg_namespace n on n.oid=k.connamespace where n.nspname='public' and k.contype='u') as uniques,
  (select count(*) from pg_constraint k join pg_namespace n on n.oid=k.connamespace where n.nspname='public' and k.contype='c') as checks,
  (select count(*) from pg_indexes where schemaname='public') as indexes,
  (select count(*) from pg_indexes where schemaname='public' and indexname not like '%_pkey') as secondary_indexes,
  (select count(*) from pg_trigger t join pg_class r on r.oid=t.tgrelid join pg_namespace n on n.oid=r.relnamespace where n.nspname='public' and not t.tgisinternal) as triggers,
  (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public') as functions,
  (select count(*) from pg_policies where schemaname='public') as policies,
  (select count(*) from pg_class r join pg_namespace n on n.oid=r.relnamespace where n.nspname='public' and r.relkind='r' and r.relrowsecurity) as rls_enabled,
  (select count(*) from pg_class r join pg_namespace n on n.oid=r.relnamespace where n.nspname='public' and r.relkind='v') as views
`);
console.log("SUMMARY", JSON.stringify(summary[0], null, 2));

console.log("\n-- TABLES WITHOUT RLS --");
for (const r of await q(`
  select r.relname from pg_class r join pg_namespace n on n.oid=r.relnamespace
  where n.nspname='public' and r.relkind='r' and not r.relrowsecurity order by 1`)) console.log("  " + r.relname);

console.log("\n-- POLICIES PER TABLE --");
for (const r of await q(`select tablename, count(*)::int n, string_agg(cmd, ',' order by cmd) cmds from pg_policies where schemaname='public' group by tablename order by tablename`)) console.log(`  ${r.tablename}: ${r.n} (${r.cmds})`);

console.log("\n-- ALL FOREIGN KEYS --");
for (const r of await q(`
  select con.conname,
         src.relname as from_table, srcn.nspname as from_schema,
         tgt.relname as to_table, tgtn.nspname as to_schema
  from pg_constraint con
  join pg_class src on src.oid = con.conrelid
  join pg_namespace srcn on srcn.oid = src.relnamespace
  join pg_class tgt on tgt.oid = con.confrelid
  join pg_namespace tgtn on tgtn.oid = tgt.relnamespace
  where con.contype='f' and srcn.nspname='public'
  order by src.relname`)) console.log(`  ${r.from_table} -> ${r.to_schema}.${r.to_table}`);

console.log("\n-- NON-PK INDEXES --");
for (const r of await q(`select tablename, indexname from pg_indexes where schemaname='public' and indexname not like '%_pkey' order by tablename`)) console.log(`  ${r.tablename}: ${r.indexname}`);

console.log("\n-- CHECK CONSTRAINTS --");
for (const r of await q(`
  select r.relname, k.conname, pg_get_constraintdef(k.oid) def
  from pg_constraint k join pg_class r on r.oid=k.conrelid join pg_namespace n on n.oid=r.relnamespace
  where n.nspname='public' and k.contype='c' order by r.relname`)) console.log(`  ${r.relname}: ${r.def.substring(0, 140)}`);

console.log("\n-- FUNCTIONS (public, custom) --");
for (const r of await q(`select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname not in ('armor','crypt','dearmor','decrypt','decrypt_iv','digest','encrypt','encrypt_iv','gen_random_bytes','gen_random_uuid','gen_salt','hmac','pgp_armor_headers','pgp_key_id','pgp_pub_decrypt','pgp_pub_decrypt_bytea','pgp_pub_encrypt','pgp_pub_encrypt_bytea','pgp_sym_decrypt','pgp_sym_decrypt_bytea','pgp_sym_encrypt','pgp_sym_encrypt_bytea') order by 1`)) console.log("  " + r.proname);

await c.end();
