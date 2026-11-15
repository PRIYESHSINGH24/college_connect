import { createClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/validators";
import { z } from "zod";
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonError("Authentication required.", 401);

  const parsed = z.object({ status: z.enum(["verified", "rejected", "suspended"]) })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid verification status.", 400);

  const { data: profile, error: profileError } = await supabase
    .from("profiles").select("organization_id").eq("id", user.id).maybeSingle();
  if (profileError || !profile?.organization_id) return jsonError("No organization is linked to this admin account.", 403);

  const { data: membership, error: membershipError } = await supabase
    .from("organization_memberships").select("role,status")
    .eq("organization_id", profile.organization_id).eq("user_id", user.id).maybeSingle();
  if (membershipError || !membership || membership.status !== "verified" || !["college_admin", "super_admin"].includes(membership.role)) {
    return jsonError("You are not authorized to review campus verification requests.", 403);
  }

  const { data, error } = await supabase.from("organization_memberships")
    .update({ status: parsed.data.status, verified_at: parsed.data.status === "verified" ? new Date().toISOString() : null })
    .eq("id", id).eq("organization_id", profile.organization_id).select("id").maybeSingle();
  if (error) return jsonError(error.message, 400);
  if (!data) return jsonError("Verification request not found in your organization.", 404);
  return Response.json({ id: data.id, status: parsed.data.status });
}
