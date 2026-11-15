import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { jsonError, messageSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonError("Authentication required.", 401);
  const { data, error } = await supabase.from("messages")
    .select("id,sender_id,body,created_at").eq("conversation_id", id)
    .order("created_at", { ascending: false }).limit(50);
  if (error) return jsonError(error.message, 403);
  return Response.json({ messages: (data || []).reverse() });
}

export async function POST(request: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonError("Authentication required.", 401);
  const parsed = messageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || "Invalid message.");

  const clientNonce = parsed.data.client_nonce || randomUUID();
  const { data, error } = await supabase.from("messages").insert({
    conversation_id: id,
    sender_id: user.id,
    body: parsed.data.body,
    client_nonce: clientNonce,
  }).select("id,created_at").single();

  if (error?.code === "23505") {
    const { data: existing } = await supabase.from("messages").select("id,created_at")
      .eq("sender_id", user.id).eq("conversation_id", id).eq("client_nonce", clientNonce).maybeSingle();
    if (existing) return Response.json({ message: existing, deduplicated: true });
  }
  if (error) return jsonError(error.message, 400);
  return Response.json({ message: data }, { status: 201 });
}
