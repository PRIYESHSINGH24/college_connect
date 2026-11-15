import { createAdminClient } from "@/lib/supabase/admin";

/** Readiness check used by deployment health probes; never returns secrets or row data. */
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("organizations").select("id", { head: true, count: "exact" }).limit(1);
    if (error) return Response.json({ status: "not_ready", database: "error" }, { status: 503, headers: { "cache-control": "no-store" } });
    return Response.json({ status: "ok", database: "ok", timestamp: new Date().toISOString() }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ status: "not_ready", database: "unconfigured" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
