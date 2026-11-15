import { createClient } from "@/lib/supabase/server";
import { jsonError, postSchema } from "@/lib/validators";
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonError("Authentication required.", 401);
  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || "Invalid post.");
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).maybeSingle();
  const { data, error } = await supabase.from("posts").insert({ author_id: user.id, organization_id: profile?.organization_id || null, ...parsed.data }).select("id").single();
  if (error) return jsonError(error.message, 400);
  return Response.json({ id: data.id }, { status: 201 });
}
