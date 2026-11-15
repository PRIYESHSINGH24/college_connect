import { createClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/validators";
type Ctx = { params: Promise<{ id: string }> };
export async function POST(_request: Request, { params }: Ctx) {
  const { id } = await params; const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser(); if (!user) return jsonError("Authentication required.", 401);
  const { error } = await supabase.from("post_likes").upsert({ post_id: id, user_id: user.id }, { onConflict: "post_id,user_id", ignoreDuplicates: true });
  if (error) return jsonError(error.message, 400); return Response.json({ ok: true });
}
export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params; const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser(); if (!user) return jsonError("Authentication required.", 401);
  const { error } = await supabase.from("post_likes").delete().eq("post_id", id).eq("user_id", user.id);
  if (error) return jsonError(error.message, 400); return Response.json({ ok: true });
}
