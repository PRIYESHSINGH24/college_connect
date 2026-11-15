import { createClient } from "@/lib/supabase/server";
import { jsonError, projectSchema } from "@/lib/validators";
export async function GET() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return jsonError("Authentication required.", 401);
  const { data, error } = await supabase.from("projects").select("id,title,description,tech_stack,status,openings,accepted_count,created_at,owner_id").eq("status", "active").order("created_at", { ascending: false }).limit(50);
  if (error) return jsonError(error.message, 400); return Response.json({ projects: data });
}
export async function POST(request: Request) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return jsonError("Authentication required.", 401);
  const parsed = projectSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || "Invalid project.");
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).maybeSingle();
  const { data: project, error } = await supabase.from("projects").insert({ ...parsed.data, owner_id: user.id, organization_id: profile?.organization_id || null, repository_url: parsed.data.repository_url || null, demo_url: parsed.data.demo_url || null }).select("id").single();
  if (error) return jsonError(error.message, 400);
  const { error: memberError } = await supabase.from("project_members").upsert({ project_id: project.id, user_id: user.id, role: "owner" }, { onConflict: "project_id,user_id" });
  if (memberError) return jsonError(`Project created, but owner membership failed: ${memberError.message}`, 500);
  return Response.json({ id: project.id }, { status: 201 });
}
